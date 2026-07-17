// Il websocket di Supabase Realtime può addormentarsi silenziosamente dopo
// ore di inattività della scheda del browser (specialmente se va in
// background) e non sempre si riconnette in tempo utile da solo. Per questo
// affianchiamo al realtime un doppio meccanismo automatico:
// - un polling periodico di sicurezza
// - un refresh immediato quando la scheda torna visibile/attiva
// così i dati restano aggiornati senza che l'utente debba mai ricaricare
// manualmente la pagina.
export function startLiveSync(refreshFn, { intervalMs = 20000 } = {}) {
  const intervalId = setInterval(refreshFn, intervalMs)

  const handleWake = () => {
    if (document.visibilityState === 'visible') refreshFn()
  }
  document.addEventListener('visibilitychange', handleWake)
  window.addEventListener('focus', handleWake)

  return () => {
    clearInterval(intervalId)
    document.removeEventListener('visibilitychange', handleWake)
    window.removeEventListener('focus', handleWake)
  }
}
