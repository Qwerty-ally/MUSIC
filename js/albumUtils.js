export function getReleaseDate(album) {
  const rd = album.releaseDate
  if (!rd) return null
  return typeof rd.toDate === 'function' ? rd.toDate() : new Date(rd)
}

export function isUpcoming(album) {
  const date = getReleaseDate(album)
  return !!date && date.getTime() > Date.now()
}
