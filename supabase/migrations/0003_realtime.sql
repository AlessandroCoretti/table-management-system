-- Abilita il realtime sulla tabella reservations (schema custom "tms",
-- non incluso di default nella pubblicazione realtime di Supabase).
alter publication supabase_realtime add table tms.reservations;
