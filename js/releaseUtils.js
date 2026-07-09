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
