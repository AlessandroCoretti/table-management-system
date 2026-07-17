import { supabase } from './supabase'

// Risolve quale layout (disposizione tavoli) usare per una sala in una data:
// 1. se esiste un override per quella data specifica, usa quello
// 2. altrimenti usa il layout predefinito della sala
export async function resolveLayoutId(floorPlanId, dateStr) {
  const { data: override } = await supabase
    .from('layout_date_overrides')
    .select('layout_id')
    .eq('floor_plan_id', floorPlanId)
    .eq('date', dateStr)
    .maybeSingle()

  if (override) return override.layout_id

  const { data: defaultLayout } = await supabase
    .from('layouts')
    .select('id')
    .eq('floor_plan_id', floorPlanId)
    .eq('is_default', true)
    .maybeSingle()

  return defaultLayout?.id ?? null
}
