import { create } from 'zustand'
import { supabase } from '../../lib/supabase'

const OBJECT_DEFAULTS = {
  table_round_2: { type: 'table', shape: 'circle', width: 60, height: 60, seats: 2, label: 'T' },
  table_round_4: { type: 'table', shape: 'circle', width: 80, height: 80, seats: 4, label: 'T' },
  table_rect_4: { type: 'table', shape: 'rect', width: 100, height: 70, seats: 4, label: 'T' },
  table_rect_6: { type: 'table', shape: 'rect', width: 140, height: 70, seats: 6, label: 'T' },
  bar: { type: 'bar', shape: 'rect', width: 200, height: 50, seats: null, label: 'Bancone' },
  wall: { type: 'wall', shape: 'rect', width: 150, height: 12, seats: null, label: null },
  door: { type: 'door', shape: 'rect', width: 60, height: 12, seats: null, label: null },
}

export const OBJECT_PRESETS = Object.keys(OBJECT_DEFAULTS)

export const useFloorPlanStore = create((set, get) => ({
  restaurantId: null,
  floorPlans: [],
  activeFloorPlanId: null,
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
      const { data, error } = await supabase
        .from('map_objects')
        .select('*')
        .eq('floor_plan_id', floorPlanId)
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
    set((s) => ({ floorPlans: [...s.floorPlans, data] }))
    await get().selectFloorPlan(data.id)
  },

  // Conta le prenotazioni collegate ai tavoli di questa sala, per avvisare
  // prima di un'eliminazione che le cancellerebbe a cascata.
  async countReservationsForFloorPlan(floorPlanId) {
    const { data: objects, error: objectsErr } = await supabase
      .from('map_objects')
      .select('id')
      .eq('floor_plan_id', floorPlanId)
    if (objectsErr || !objects?.length) return 0

    const { count, error: countErr } = await supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .in(
        'table_id',
        objects.map((o) => o.id)
      )
    if (countErr) return 0
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
          ? { activeFloorPlanId: null, objects: [], selectedId: null }
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

  async addObject(presetKey, position) {
    const { activeFloorPlanId, objects } = get()
    if (!activeFloorPlanId) return
    const preset = OBJECT_DEFAULTS[presetKey]
    const newObject = {
      floor_plan_id: activeFloorPlanId,
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
}))
