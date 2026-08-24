// Shared by anything with an optional releaseDate field — albums/EPs and
// singles (songs) both use this to know if they're an "upcoming release".
export function getReleaseDate(item) {
  const rd = item.releaseDate
  if (!rd) return null
  return typeof rd.toDate === 'function' ? rd.toDate() : new Date(rd)
}

export function isUpcoming(item) {
  const date = getReleaseDate(item)
  return !!date && date.getTime() > Date.now()
}

// <input type="datetime-local"> gives a "YYYY-MM-DDTHH:mm" string with no
// timezone designator, which `new Date(str)` correctly parses as *local*
// time per spec (unlike a bare "YYYY-MM-DD" date, which parses as UTC
// midnight and can land on the previous local day — the bug this replaced).
export function dateInputToDate(value) {
  if (!value) return null
  return new Date(value)
}

export function dateToInputValue(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d}T${hh}:${mm}`
}
