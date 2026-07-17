import { create } from 'zustand'
import { supabase } from '../../lib/supabase'

const OBJECT_DEFAULTS = {
  bar: { type: 'bar', shape: 'rect', width: 200, height: 50, seats: null, label: 'Bancone' },
  wall: { type: 'wall', shape: 'rect', width: 150, height: 12, seats: null, label: null },
  door: { type: 'door', shape: 'rect', width: 60, height: 12, seats: null, label: null },
}

export const OBJECT_PRESETS = Object.keys(OBJECT_DEFAULTS)

export const useFloorPlanStore = create((set, get) => ({
  restaurantId: null,
  floorPlans: [],
  activeFloorPlanId: null,

  layouts: [],
  activeLayoutId: null,
  dateOverrides: [],

  objects: [],
  selectedId: null,
  loading: false,
  error: null,
  backgroundOpacity: 0.5,

  async init() {
    set({ loading: true, error: null })
    try {
      const { data: restaurants, error: restaurantErr } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
      if (restaurantErr) throw restaurantErr
      if (!restaurants?.length) {
        set({
          loading: false,
          error:
            'Nessun ristorante trovato. Crea prima una riga in tms.restaurants dal SQL editor di Supabase.',
        })
        return
      }
      const restaurantId = restaurants[0].id

      const { data: floorPlans, error: floorPlansErr } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: true })
      if (floorPlansErr) throw floorPlansErr

      set({ restaurantId, floorPlans: floorPlans ?? [] })

      if (floorPlans?.length) {
        await get().selectFloorPlan(floorPlans[0].id)
      } else {
        set({ loading: false })
      }
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  async selectFloorPlan(floorPlanId) {
    set({ loading: true, error: null, activeFloorPlanId: floorPlanId, selectedId: null })
    try {
      const { data: layouts, error: layoutsErr } = await supabase
        .from('layouts')
        .select('*')
        .eq('floor_plan_id', floorPlanId)
        .order('created_at', { ascending: true })
      if (layoutsErr) throw layoutsErr

      set({ layouts: layouts ?? [] })
      await get().loadDateOverrides(floorPlanId)

      const defaultLayout = layouts?.find((l) => l.is_default) ?? layouts?.[0]
      if (defaultLayout) {
        await get().selectLayout(defaultLayout.id)
      } else {
        set({ activeLayoutId: null, objects: [], loading: false })
      }
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  async selectLayout(layoutId) {
    set({ loading: true, error: null, activeLayoutId: layoutId, selectedId: null })
    try {
      const { data, error } = await supabase
        .from('map_objects')
        .select('*')
        .eq('layout_id', layoutId)
        .order('z_index', { ascending: true })
      if (error) throw error
      set({ objects: data ?? [], loading: false })
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  async createFloorPlan(name) {
    const { restaurantId } = get()
    const { data, error } = await supabase
      .from('floor_plans')
      .insert({ restaurant_id: restaurantId, name })
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    // Ogni sala nuova nasce con una disposizione predefinita vuota
    const { error: layoutErr } = await supabase
      .from('layouts')
      .insert({ floor_plan_id: data.id, name: 'Predefinita', is_default: true })
    if (layoutErr) {
      set({ error: layoutErr.message })
      return
    }
    set((s) => ({ floorPlans: [...s.floorPlans, data] }))
    await get().selectFloorPlan(data.id)
  },

  // Conta le prenotazioni collegate ai tavoli di questa sala (su tutte le sue
  // disposizioni), per avvisare prima di un'eliminazione che le cancellerebbe
  // a cascata.
  async countReservationsForFloorPlan(floorPlanId) {
    const { data: layouts } = await supabase
      .from('layouts')
      .select('id')
      .eq('floor_plan_id', floorPlanId)
    if (!layouts?.length) return 0

    const { data: objects } = await supabase
      .from('map_objects')
      .select('id')
      .in(
        'layout_id',
        layouts.map((l) => l.id)
      )
    if (!objects?.length) return 0

    const { count } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .in(
        'table_id',
        objects.map((o) => o.id)
      )
    return count ?? 0
  },

  async deleteFloorPlan(floorPlanId) {
    const { error } = await supabase.from('floor_plans').delete().eq('id', floorPlanId)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => {
      const remaining = s.floorPlans.filter((fp) => fp.id !== floorPlanId)
      const wasActive = s.activeFloorPlanId === floorPlanId
      return {
        floorPlans: remaining,
        ...(wasActive
          ? {
              activeFloorPlanId: null,
              layouts: [],
              activeLayoutId: null,
              objects: [],
              selectedId: null,
              dateOverrides: [],
            }
          : {}),
      }
    })
    const remaining = get().floorPlans
    if (get().activeFloorPlanId === null && remaining.length) {
      await get().selectFloorPlan(remaining[0].id)
    }
  },

  async uploadBackground(file) {
    const { activeFloorPlanId } = get()
    if (!activeFloorPlanId) return
    const path = `${activeFloorPlanId}/${Date.now()}-${file.name}`
    const { error: uploadErr } = await supabase.storage
      .from('floor-plan-backgrounds')
      .upload(path, file, { upsert: true })
    if (uploadErr) {
      set({ error: uploadErr.message })
      return
    }
    const { data: publicUrlData } = supabase.storage
      .from('floor-plan-backgrounds')
      .getPublicUrl(path)
    const backgroundUrl = publicUrlData.publicUrl

    const { error: updateErr } = await supabase
      .from('floor_plans')
      .update({ background_image_url: backgroundUrl })
      .eq('id', activeFloorPlanId)
    if (updateErr) {
      set({ error: updateErr.message })
      return
    }
    set((s) => ({
      floorPlans: s.floorPlans.map((fp) =>
        fp.id === activeFloorPlanId ? { ...fp, background_image_url: backgroundUrl } : fp
      ),
    }))
  },

  async removeBackground() {
    const { activeFloorPlanId } = get()
    if (!activeFloorPlanId) return
    const { error } = await supabase
      .from('floor_plans')
      .update({ background_image_url: null })
      .eq('id', activeFloorPlanId)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      floorPlans: s.floorPlans.map((fp) =>
        fp.id === activeFloorPlanId ? { ...fp, background_image_url: null } : fp
      ),
    }))
  },

  setBackgroundOpacity(value) {
    set({ backgroundOpacity: value })
  },

  select(id) {
    set({ selectedId: id })
  },

  async addTable({ shape, seats }, position) {
    const { activeLayoutId, objects } = get()
    if (!activeLayoutId) return
    const size = Math.min(160, Math.max(50, 50 + seats * 10))
    const newObject = {
      layout_id: activeLayoutId,
      type: 'table',
      shape,
      x: position?.x ?? 120,
      y: position?.y ?? 120,
      width: size,
      height: size,
      rotation: 0,
      seats,
      label: 'T',
      z_index: objects.length,
    }
    const { data, error } = await supabase
      .from('map_objects')
      .insert(newObject)
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({ objects: [...s.objects, data], selectedId: data.id }))
  },

  async addObject(presetKey, position) {
    const { activeLayoutId, objects } = get()
    if (!activeLayoutId) return
    const preset = OBJECT_DEFAULTS[presetKey]
    const newObject = {
      layout_id: activeLayoutId,
      type: preset.type,
      shape: preset.shape,
      x: position?.x ?? 120,
      y: position?.y ?? 120,
      width: preset.width,
      height: preset.height,
      rotation: 0,
      seats: preset.seats,
      label: preset.label,
      z_index: objects.length,
    }
    const { data, error } = await supabase
      .from('map_objects')
      .insert(newObject)
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({ objects: [...s.objects, data], selectedId: data.id }))
  },

  updateObjectLocal(id, changes) {
    set((s) => ({
      objects: s.objects.map((o) => (o.id === id ? { ...o, ...changes } : o)),
    }))
  },

  async persistObject(id, changes) {
    const { error } = await supabase.from('map_objects').update(changes).eq('id', id)
    if (error) set({ error: error.message })
  },

  async deleteSelected() {
    const { selectedId } = get()
    if (!selectedId) return
    const { error } = await supabase.from('map_objects').delete().eq('id', selectedId)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== selectedId),
      selectedId: null,
    }))
  },

  // --- Gestione disposizioni (layout) --------------------------------------

  async createLayout(name, { duplicateFromLayoutId } = {}) {
    const { activeFloorPlanId } = get()
    if (!activeFloorPlanId) return
    const { data: newLayout, error } = await supabase
      .from('layouts')
      .insert({ floor_plan_id: activeFloorPlanId, name, is_default: false })
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }

    if (duplicateFromLayoutId) {
      const { data: sourceObjects } = await supabase
        .from('map_objects')
        .select('*')
        .eq('layout_id', duplicateFromLayoutId)
      if (sourceObjects?.length) {
        const copies = sourceObjects.map(({ id, created_at, updated_at, ...rest }) => ({
          ...rest,
          layout_id: newLayout.id,
        }))
        await supabase.from('map_objects').insert(copies)
      }
    }

    set((s) => ({ layouts: [...s.layouts, newLayout] }))
    await get().selectLayout(newLayout.id)
  },

  async renameLayout(layoutId, name) {
    const { error } = await supabase.from('layouts').update({ name }).eq('id', layoutId)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      layouts: s.layouts.map((l) => (l.id === layoutId ? { ...l, name } : l)),
    }))
  },

  async setDefaultLayout(layoutId) {
    const { layouts } = get()
    const currentDefault = layouts.find((l) => l.is_default)
    if (currentDefault && currentDefault.id !== layoutId) {
      await supabase.from('layouts').update({ is_default: false }).eq('id', currentDefault.id)
    }
    const { error } = await supabase
      .from('layouts')
      .update({ is_default: true })
      .eq('id', layoutId)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      layouts: s.layouts.map((l) => ({ ...l, is_default: l.id === layoutId })),
    }))
  },

  // Non si può eliminare una disposizione impostata come predefinita, né una
  // usata da un override di data attivo (va prima rimosso l'override).
  async deleteLayout(layoutId) {
    const { layouts, activeLayoutId, dateOverrides } = get()
    const layout = layouts.find((l) => l.id === layoutId)
    if (!layout || layout.is_default) return
    if (dateOverrides.some((o) => o.layout_id === layoutId)) return

    const { error } = await supabase.from('layouts').delete().eq('id', layoutId)
    if (error) {
      set({ error: error.message })
      return
    }
    const remaining = layouts.filter((l) => l.id !== layoutId)
    set({ layouts: remaining })
    if (activeLayoutId === layoutId) {
      const fallback = remaining.find((l) => l.is_default) ?? remaining[0]
      if (fallback) await get().selectLayout(fallback.id)
    }
  },

  // --- Override di data (disposizioni per giorni specifici) ---------------

  async loadDateOverrides(floorPlanId) {
    const { data, error } = await supabase
      .from('layout_date_overrides')
      .select('*')
      .eq('floor_plan_id', floorPlanId)
      .order('date', { ascending: true })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ dateOverrides: data ?? [] })
  },

  async setDateOverride(date, layoutId) {
    const { activeFloorPlanId } = get()
    if (!activeFloorPlanId) return
    const { data, error } = await supabase
      .from('layout_date_overrides')
      .upsert(
        { floor_plan_id: activeFloorPlanId, date, layout_id: layoutId },
        { onConflict: 'floor_plan_id,date' }
      )
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      dateOverrides: [...s.dateOverrides.filter((o) => o.date !== date), data].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }))
  },

  async removeDateOverride(id) {
    const { error } = await supabase.from('layout_date_overrides').delete().eq('id', id)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({ dateOverrides: s.dateOverrides.filter((o) => o.id !== id) }))
  },
}))
