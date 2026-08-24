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

// <input type="date"> gives a plain "YYYY-MM-DD" string. `new Date(str)`
// parses that as UTC midnight, which lands on the *previous* day once
// converted to a negative-UTC-offset timezone (e.g. picking Oct 9 stores
// Oct 8 8pm EDT). Building the Date from local components instead keeps
// the picked calendar day intact everywhere it's displayed.
export function dateInputToDate(value) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dateToInputValue(date) {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
