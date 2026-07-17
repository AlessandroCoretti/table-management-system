import { create } from 'zustand'
import { supabase } from '../../lib/supabase'
import { resolveLayoutId } from '../../lib/layoutResolver'

let realtimeChannel = null

const STATUS_LABELS = {
  confirmed: 'Confermata',
  seated: 'Seduti',
  completed: 'Completata',
  cancelled: 'Cancellata',
  no_show: 'No-show',
}

export const RESERVATION_STATUS_LABELS = STATUS_LABELS

export const useDashboardStore = create((set, get) => ({
  restaurant: null,
  floorPlans: [],
  activeFloorPlanId: null,
  objects: [],
  reservationsForDay: [],

  selectedDate: new Date().toISOString().slice(0, 10),
  viewTime: new Date().toTimeString().slice(0, 5) < '18:00' ? '18:00' : new Date().toTimeString().slice(0, 5),

  selectedReservationId: null,
  creatingForTableId: null,

  loading: false,
  refreshing: false,
  error: null,

  async init() {
    set({ loading: true, error: null })
    try {
      const { data: restaurants, error: restaurantErr } = await supabase
        .from('restaurants')
        .select('*')
        .limit(1)
      if (restaurantErr) throw restaurantErr
      if (!restaurants?.length) {
        set({ loading: false, error: 'Nessun ristorante configurato.' })
        return
      }
      const restaurant = restaurants[0]

      const { data: floorPlans, error: floorPlansErr } = await supabase
        .from('floor_plans')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: true })
      if (floorPlansErr) throw floorPlansErr

      set({ restaurant, floorPlans: floorPlans ?? [] })

      if (floorPlans?.length) {
        await get().selectFloorPlan(floorPlans[0].id)
      }

      await get().loadReservationsForDay()
      get().subscribeRealtime()
      set({ loading: false })
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  async selectFloorPlan(floorPlanId) {
    set({ activeFloorPlanId: floorPlanId })
    await get().loadObjectsForActiveSelection()
  },

  // Carica i tavoli della disposizione corretta per la sala e il giorno
  // selezionati: quella assegnata a quella data specifica, se esiste,
  // altrimenti la disposizione predefinita della sala.
  async loadObjectsForActiveSelection() {
    const { activeFloorPlanId, selectedDate } = get()
    if (!activeFloorPlanId) return
    const layoutId = await resolveLayoutId(activeFloorPlanId, selectedDate)
    if (!layoutId) {
      set({ objects: [] })
      return
    }
    const { data, error } = await supabase
      .from('map_objects')
      .select('*')
      .eq('layout_id', layoutId)
      .order('z_index', { ascending: true })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ objects: data ?? [] })
  },

  setSelectedDate(date) {
    set({ selectedDate: date, selectedReservationId: null, creatingForTableId: null })
    get().loadObjectsForActiveSelection()
    get().loadReservationsForDay()
  },

  setViewTime(time) {
    set({ viewTime: time })
  },

  async loadReservationsForDay() {
    const { restaurant, selectedDate } = get()
    if (!restaurant) return
    const dayStart = new Date(`${selectedDate}T00:00:00`)
    const dayEnd = new Date(`${selectedDate}T23:59:59`)

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .gte('arrival_time', dayStart.toISOString())
      .lte('arrival_time', dayEnd.toISOString())
      .order('arrival_time', { ascending: true })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ reservationsForDay: data ?? [] })
  },

  // Aggiornamento manuale (pulsante "Aggiorna"): utile finché il realtime
  // non è confermato attivo, o semplicemente per un refresh immediato.
  async refresh() {
    set({ refreshing: true })
    await Promise.all([get().loadReservationsForDay(), get().loadObjectsForActiveSelection()])
    set({ refreshing: false })
  },

  subscribeRealtime() {
    const { restaurant } = get()
    if (!restaurant || realtimeChannel) return
    realtimeChannel = supabase
      .channel('admin-reservations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'tms', table: 'reservations', filter: `restaurant_id=eq.${restaurant.id}` },
        () => get().loadReservationsForDay()
      )
      .subscribe()
  },

  getViewTimestamp() {
    const { selectedDate, viewTime } = get()
    return new Date(`${selectedDate}T${viewTime}:00`)
  },

  // Un tavolo con una prenotazione più tardi in giornata è già "occupato"
  // fin dall'inizio del servizio (non solo nella finestra esatta
  // arrivo -> arrivo+durata): lo staff deve vederlo tenuto da subito.
  findOccupyingReservation(tableId) {
    const viewTs = get().getViewTimestamp().getTime()
    return get().reservationsForDay.find((r) => {
      if (r.table_id !== tableId) return false
      if (r.status === 'cancelled' || r.status === 'no_show' || r.status === 'completed') return false
      const start = new Date(r.arrival_time).getTime()
      const end = start + r.duration_minutes * 60000
      return viewTs < end
    })
  },

  selectTableOnMap(tableId) {
    const reservation = get().findOccupyingReservation(tableId)
    if (reservation) {
      set({ selectedReservationId: reservation.id, creatingForTableId: null })
    } else {
      set({ creatingForTableId: tableId, selectedReservationId: null })
    }
  },

  selectReservation(id) {
    const reservation = get().reservationsForDay.find((r) => r.id === id)
    if (reservation) {
      const arrival = new Date(reservation.arrival_time)
      const pad = (n) => String(n).padStart(2, '0')
      set({
        selectedReservationId: id,
        creatingForTableId: null,
        viewTime: `${pad(arrival.getHours())}:${pad(arrival.getMinutes())}`,
      })
    } else {
      set({ selectedReservationId: id, creatingForTableId: null })
    }
  },

  clearSelection() {
    set({ selectedReservationId: null, creatingForTableId: null })
  },

  async createWalkIn({ name, phone, email, partySize, notes, status }) {
    const { restaurant, creatingForTableId } = get()
    if (!restaurant || !creatingForTableId) return { error: null }
    const arrival = get().getViewTimestamp()

    const { error } = await supabase.from('reservations').insert({
      restaurant_id: restaurant.id,
      table_id: creatingForTableId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email || '',
      party_size: partySize,
      arrival_time: arrival.toISOString(),
      duration_minutes: restaurant.default_reservation_duration_minutes,
      notes: notes || null,
      status: status || 'seated',
    })
    if (error) return { error: error.message }
    set({ creatingForTableId: null })
    await get().loadReservationsForDay()
    return { error: null }
  },

  async updateReservationStatus(id, status) {
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      reservationsForDay: s.reservationsForDay.map((r) => (r.id === id ? { ...r, status } : r)),
    }))
  },

  async deleteReservation(id) {
    const { error } = await supabase.from('reservations').delete().eq('id', id)
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({
      reservationsForDay: s.reservationsForDay.filter((r) => r.id !== id),
      selectedReservationId: s.selectedReservationId === id ? null : s.selectedReservationId,
    }))
  },
}))
