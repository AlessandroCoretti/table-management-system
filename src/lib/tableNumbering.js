// Assegna un numero progressivo ai tavoli (TAV.1, TAV.2, ...) in base
// all'ordine con cui compaiono nella disposizione, così è coerente tra
// editor, dashboard admin e pagina di prenotazione (tutte caricano gli
// oggetti con lo stesso ordinamento).
export function buildTableNumbers(objects) {
  const map = new Map()
  let n = 0
  for (const o of objects) {
    if (o.type === 'table') {
      n += 1
      map.set(o.id, n)
    }
  }
  return map
}
