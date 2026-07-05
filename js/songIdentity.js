// Two tracks count as "the same song" if they share a title and the exact
// same audio file — e.g. a single uploaded separately from an album that
// happens to reuse the same audio file for one of its tracks. Used to keep
// "now playing" highlighting in sync across the Music grid and any album
// tracklist that happens to contain the same song.
export function songKey(song) {
  if (!song || !song.audioURL) return null
  const title = (song.title || '').trim().toLowerCase()
  return `${title}::${song.audioURL}`
}

export function isSameSong(a, b) {
  const keyA = songKey(a)
  const keyB = songKey(b)
  return !!keyA && keyA === keyB
}
