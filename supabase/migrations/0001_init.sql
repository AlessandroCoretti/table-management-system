-- Table Management System — schema iniziale
-- Tutto isolato nello schema "tms" per non interferire con altri progetti/tabelle
-- presenti nello stesso progetto Supabase.
--
-- Come applicare:
-- 1. SQL Editor del progetto Supabase -> incolla ed esegui questo file.
-- 2. Project Settings -> API -> Data API settings -> "Exposed schemas":
--    aggiungi "tms" alla lista (di default espone solo "public").

create schema if not exists tms;

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Ristoranti (predisposto per multi-tenant futuro; per ora ne esiste una sola riga)
-- ---------------------------------------------------------------------------
create table tms.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  timezone text not null default 'Europe/Rome',
  default_reservation_duration_minutes int not null default 120 check (default_reservation_duration_minutes > 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sale/aree del locale (es. "Sala interna", "Dehors"), ciascuna con una piantina
-- ---------------------------------------------------------------------------
create table tms.floor_plans (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references tms.restaurants(id) on delete cascade,
  name text not null,
  width int not null default 1000,
  height int not null default 700,
  background_image_url text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Oggetti sulla piantina: tavoli, pareti, porte, bancone, decorazioni
-- ---------------------------------------------------------------------------
create table tms.map_objects (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references tms.floor_plans(id) on delete cascade,
  type text not null check (type in ('table', 'wall', 'door', 'bar', 'decor')),
  shape text not null default 'rect' check (shape in ('rect', 'circle')),
  x numeric not null default 0,
  y numeric not null default 0,
  width numeric not null default 80,
  height numeric not null default 80,
  rotation numeric not null default 0,
  seats int check (seats is null or seats > 0),
  label text,
  z_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Staff collegato a un ristorante (via Supabase Auth)
-- ---------------------------------------------------------------------------
create table tms.restaurant_staff (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references tms.restaurants(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- ---------------------------------------------------------------------------
-- Helper IMMUTABLE per l'exclusion constraint sotto: "timestamptz + interval"
-- è STABLE in Postgres (non ammesso in un'espressione di indice). Qui è
-- sicuro dichiararlo IMMUTABLE perché la durata è sempre espressa in minuti,
-- senza ambiguità di calendario (mesi/giorni) legate al fuso orario.
-- ---------------------------------------------------------------------------
create function tms.reservation_range(p_arrival timestamptz, p_duration_minutes int)
returns tstzrange
language sql
immutable
as $$
  select tstzrange(p_arrival, p_arrival + (p_duration_minutes * interval '1 minute'));
$$;

-- ---------------------------------------------------------------------------
-- Prenotazioni
-- ---------------------------------------------------------------------------
create table tms.reservations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references tms.restaurants(id) on delete cascade,
  table_id uuid not null references tms.map_objects(id) on delete cascade,
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  party_size int not null check (party_size > 0),
  arrival_time timestamptz not null,
  duration_minutes int not null default 120 check (duration_minutes > 0),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),

  -- Impedisce due prenotazioni sovrapposte sullo stesso tavolo a livello di database
  -- (rete di sicurezza contro race condition, oltre al controllo lato client)
  exclude using gist (
    table_id with =,
    tms.reservation_range(arrival_time, duration_minutes) with &&
  ) where (status not in ('cancelled', 'completed', 'no_show'))
);

create index reservations_restaurant_arrival_idx on tms.reservations (restaurant_id, arrival_time);

-- ---------------------------------------------------------------------------
-- Helper: l'utente autenticato è staff di questo ristorante?
-- ---------------------------------------------------------------------------
create function tms.is_restaurant_staff(p_restaurant_id uuid)
returns boolean
language sql
security definer
stable
set search_path = tms, auth
as $$
  select exists (
    select 1 from tms.restaurant_staff
    where restaurant_id = p_restaurant_id
      and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RPC pubblica: disponibilità tavoli in una finestra temporale, senza esporre
-- i dati personali dei clienti (nome/telefono/email restano privati allo staff)
-- ---------------------------------------------------------------------------
create function tms.get_reservation_slots(
  p_restaurant_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  table_id uuid,
  arrival_time timestamptz,
  duration_minutes int,
  status text
)
language sql
security definer
stable
set search_path = tms
as $$
  select table_id, arrival_time, duration_minutes, status
  from tms.reservations
  where restaurant_id = p_restaurant_id
    and status not in ('cancelled', 'no_show')
    and arrival_time < p_to
    and arrival_time + (duration_minutes || ' minutes')::interval > p_from;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table tms.restaurants enable row level security;
alter table tms.floor_plans enable row level security;
alter table tms.map_objects enable row level security;
alter table tms.restaurant_staff enable row level security;
alter table tms.reservations enable row level security;

-- restaurants: lettura pubblica (serve per mostrare nome/indirizzo in fase di booking)
create policy restaurants_public_read on tms.restaurants
  for select using (true);
create policy restaurants_staff_write on tms.restaurants
  for update using (tms.is_restaurant_staff(id));

-- floor_plans: lettura pubblica, scrittura solo staff
create policy floor_plans_public_read on tms.floor_plans
  for select using (true);
create policy floor_plans_staff_write on tms.floor_plans
  for all using (tms.is_restaurant_staff(restaurant_id))
  with check (tms.is_restaurant_staff(restaurant_id));

-- map_objects: lettura pubblica (serve al cliente per vedere la piantina), scrittura solo staff
create policy map_objects_public_read on tms.map_objects
  for select using (true);
create policy map_objects_staff_write on tms.map_objects
  for all using (
    tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id))
  )
  with check (
    tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id))
  );

-- restaurant_staff: solo lo staff stesso del locale può vedersi
create policy restaurant_staff_self_read on tms.restaurant_staff
  for select using (tms.is_restaurant_staff(restaurant_id));

-- reservations: chiunque può creare una prenotazione (booking guest),
-- ma solo lo staff del locale può leggerle/modificarle (contengono dati personali)
create policy reservations_public_insert on tms.reservations
  for insert with check (true);
create policy reservations_staff_read on tms.reservations
  for select using (tms.is_restaurant_staff(restaurant_id));
create policy reservations_staff_write on tms.reservations
  for update using (tms.is_restaurant_staff(restaurant_id));
create policy reservations_staff_delete on tms.reservations
  for delete using (tms.is_restaurant_staff(restaurant_id));

-- ---------------------------------------------------------------------------
-- Grant di accesso alle API (PostgREST) per i ruoli anon/authenticated.
-- RLS sopra restringe comunque le righe visibili/modificabili per riga.
-- ---------------------------------------------------------------------------
grant usage on schema tms to anon, authenticated;

grant select on tms.restaurants to anon, authenticated;
grant update on tms.restaurants to authenticated;

grant select on tms.floor_plans to anon, authenticated;
grant insert, update, delete on tms.floor_plans to authenticated;

grant select on tms.map_objects to anon, authenticated;
grant insert, update, delete on tms.map_objects to authenticated;

grant select on tms.restaurant_staff to authenticated;

grant insert on tms.reservations to anon, authenticated;
grant select, update, delete on tms.reservations to authenticated;

grant execute on function tms.get_reservation_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
grant execute on function tms.is_restaurant_staff(uuid) to authenticated;
