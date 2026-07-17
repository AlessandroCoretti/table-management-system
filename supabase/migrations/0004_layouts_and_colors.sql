-- Disposizioni (layout) dei tavoli: ogni sala può avere più disposizioni
-- salvate con un nome, una impostata come "predefinita" (usata tutti i
-- giorni) e altre assegnabili a giorni specifici (es. evento privato che
-- richiede di spostare i tavoli solo per quella data).

create table tms.layouts (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references tms.floor_plans(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un solo layout predefinito per sala
create unique index layouts_one_default_per_floor_plan
  on tms.layouts (floor_plan_id)
  where is_default;

-- Crea un layout "Predefinita" per ogni sala esistente e vi sposta gli
-- oggetti già presenti (nessun dato viene perso).
insert into tms.layouts (floor_plan_id, name, is_default)
select id, 'Predefinita', true from tms.floor_plans;

alter table tms.map_objects add column layout_id uuid references tms.layouts(id) on delete cascade;
alter table tms.map_objects add column fill_color text;
alter table tms.map_objects add column stroke_color text;

update tms.map_objects mo
set layout_id = l.id
from tms.layouts l
where l.floor_plan_id = mo.floor_plan_id and l.is_default;

alter table tms.map_objects alter column layout_id set not null;

-- La vecchia policy dipende dalla colonna floor_plan_id: va rimossa prima di
-- poter eliminare la colonna (verrà ricreata più sotto basata su layout_id).
drop policy map_objects_staff_write on tms.map_objects;
alter table tms.map_objects drop column floor_plan_id;

create index map_objects_layout_idx on tms.map_objects (layout_id);

-- Disposizioni assegnate a giorni specifici (sovrascrivono quella predefinita
-- solo per quella data)
create table tms.layout_date_overrides (
  id uuid primary key default gen_random_uuid(),
  floor_plan_id uuid not null references tms.floor_plans(id) on delete cascade,
  date date not null,
  layout_id uuid not null references tms.layouts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (floor_plan_id, date)
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table tms.layouts enable row level security;
alter table tms.layout_date_overrides enable row level security;

create policy layouts_public_read on tms.layouts for select using (true);
create policy layouts_staff_write on tms.layouts
  for all using (tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id)))
  with check (tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id)));

create policy layout_overrides_public_read on tms.layout_date_overrides for select using (true);
create policy layout_overrides_staff_write on tms.layout_date_overrides
  for all using (tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id)))
  with check (tms.is_restaurant_staff((select restaurant_id from tms.floor_plans where id = floor_plan_id)));

-- map_objects era vincolato allo staff via floor_plan_id, ora passa da layout_id
create policy map_objects_staff_write on tms.map_objects
  for all using (
    tms.is_restaurant_staff((
      select restaurant_id from tms.floor_plans
      where id = (select floor_plan_id from tms.layouts where id = layout_id)
    ))
  )
  with check (
    tms.is_restaurant_staff((
      select restaurant_id from tms.floor_plans
      where id = (select floor_plan_id from tms.layouts where id = layout_id)
    ))
  );

grant select on tms.layouts to anon, authenticated;
grant insert, update, delete on tms.layouts to authenticated;
grant select on tms.layout_date_overrides to anon, authenticated;
grant insert, update, delete on tms.layout_date_overrides to authenticated;
