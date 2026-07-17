import { create } from 'zustand'
import { supabase } from '../../lib/supabase'
import { resolveLayoutId } from '../../lib/layoutResolver'

let realtimeChannel = null

export const useBookingStore = create((set, get) => ({
  restaurant: null,
  floorPlans: [],
  activeFloorPlanId: null,
  objects: [],
  occupiedTableIds: [],
  loading: false,
  error: null,

  partySize: 2,
  arrivalDate: new Date().toISOString().slice(0, 10),
  arrivalTime: '20:00',

  selectedTableId: null,
  submitting: false,
  submitError: null,
  confirmedReservation: null,

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
      get().subscribeRealtime()
      await get().refreshAvailability()
      set({ loading: false })
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  async selectFloorPlan(floorPlanId) {
    set({ activeFloorPlanId: floorPlanId, selectedTableId: null })
    await get().loadObjectsForActiveSelection()
  },

  // Carica i tavoli della disposizione corretta per la sala e la data
  // scelte: quella assegnata a quella data specifica, se esiste, altrimenti
  // la disposizione predefinita della sala.
  async loadObjectsForActiveSelection() {
    const { activeFloorPlanId, arrivalDate } = get()
    if (!activeFloorPlanId) return
    const layoutId = await resolveLayoutId(activeFloorPlanId, arrivalDate)
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

  setPartySize(value) {
    set({ partySize: value, selectedTableId: null })
    get().refreshAvailability()
  },
  setArrivalDate(value) {
    set({ arrivalDate: value, selectedTableId: null })
    get().loadObjectsForActiveSelection()
    get().refreshAvailability()
  },
  setArrivalTime(value) {
    set({ arrivalTime: value, selectedTableId: null })
    get().refreshAvailability()
  },

  getArrivalTimestamp() {
    const { arrivalDate, arrivalTime } = get()
    return new Date(`${arrivalDate}T${arrivalTime}:00`)
  },

  async refreshAvailability() {
    const { restaurant } = get()
    if (!restaurant) return
    const arrival = get().getArrivalTimestamp()
    const durationMinutes = restaurant.default_reservation_duration_minutes
    const departure = new Date(arrival.getTime() + durationMinutes * 60000)

    const { data, error } = await supabase.rpc('get_reservation_slots', {
      p_restaurant_id: restaurant.id,
      p_from: arrival.toISOString(),
      p_to: departure.toISOString(),
    })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ occupiedTableIds: (data ?? []).map((row) => row.table_id) })
  },

  subscribeRealtime() {
    const { restaurant } = get()
    if (!restaurant || realtimeChannel) return
    realtimeChannel = supabase
      .channel('reservations-availability')
      .on(
        'postgres_changes',
        { event: '*', schema: 'tms', table: 'reservations', filter: `restaurant_id=eq.${restaurant.id}` },
        () => get().refreshAvailability()
      )
      .subscribe()
  },

  selectTable(tableId) {
    set({ selectedTableId: tableId, submitError: null })
  },

  clearSelection() {
    set({ selectedTableId: null })
  },

  async submitReservation({ name, phone, email, notes }) {
    const { restaurant, selectedTableId, partySize } = get()
    if (!restaurant || !selectedTableId) return
    set({ submitting: true, submitError: null })

    const arrival = get().getArrivalTimestamp()

    // Nota: niente .select() dopo l'insert, restituire la riga richiederebbe
    // il permesso SELECT su reservations, che è volutamente negato al ruolo
    // anon per non esporre le prenotazioni altrui. La conferma si costruisce
    // con i dati che il cliente ha appena inserito nel form.
    const { error } = await supabase.from('reservations').insert({
      restaurant_id: restaurant.id,
      table_id: selectedTableId,
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      party_size: partySize,
      arrival_time: arrival.toISOString(),
      duration_minutes: restaurant.default_reservation_duration_minutes,
      notes: notes || null,
    })

    if (error) {
      const message =
        error.code === '23P01'
          ? 'Questo tavolo è appena stato prenotato da qualcun altro per questo orario. Scegline un altro.'
          : error.message
      set({ submitting: false, submitError: message })
      await get().refreshAvailability()
      return
    }

    set({
      submitting: false,
      confirmedReservation: {
        arrival_time: arrival.toISOString(),
        party_size: partySize,
        customer_email: email,
      },
      selectedTableId: null,
    })
    await get().refreshAvailability()
  },

  resetConfirmation() {
    set({ confirmedReservation: null })
  },
}))
