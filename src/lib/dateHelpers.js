// Helper per data/ora locali: evitare Date.prototype.toISOString(), che
// restituisce l'ora UTC e può far scattare la data al giorno sbagliato per
// chi si trova in un fuso avanti rispetto a UTC (es. Italia dopo mezzanotte).
const pad = (n) => String(n).padStart(2, '0')

export function localDateString(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function localTimeString(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
