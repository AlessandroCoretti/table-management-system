-- Bucket per le immagini di sfondo (foto/planimetria del locale) usate
-- nell'editor piantina per "ricalcare" la disposizione reale dei tavoli.

insert into storage.buckets (id, name, public)
values ('floor-plan-backgrounds', 'floor-plan-backgrounds', true)
on conflict (id) do nothing;

create policy "floor plan backgrounds public read"
  on storage.objects for select
  using (bucket_id = 'floor-plan-backgrounds');

create policy "floor plan backgrounds staff insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'floor-plan-backgrounds');

create policy "floor plan backgrounds staff update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'floor-plan-backgrounds');

create policy "floor plan backgrounds staff delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'floor-plan-backgrounds');
