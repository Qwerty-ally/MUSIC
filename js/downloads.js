// "Download" here works like Spotify's offline mode, not a real file
// download: the audio is cached in the browser (Cache Storage) purely for
// in-app offline playback. Nothing is ever saved to the OS Downloads
// folder, and there's no UI that hands the user a raw file to keep.
const CACHE_NAME = 'anchor-song-downloads-v1'

export async function isDownloaded(url) {
  if (!url || !('caches' in window)) return false
  const cache = await caches.open(CACHE_NAME)
  const match = await cache.match(url)
  return !!match
}

export async function downloadTrack(url) {
  if (!url) throw new Error('Nothing to download.')
  const cache = await caches.open(CACHE_NAME)
  const res = await fetch(url, { mode: 'cors' })
  if (!res.ok) throw new Error('Could not download this song.')
  await cache.put(url, res)
}

export async function removeDownload(url) {
  if (!url || !('caches' in window)) return
  const cache = await caches.open(CACHE_NAME)
  await cache.delete(url)
}

// Returns a locally-cached blob: URL if this track was downloaded,
// otherwise falls back to the normal network URL.
export async function getPlaybackSrc(url) {
  if (!url || !('caches' in window)) return url
  const cache = await caches.open(CACHE_NAME)
  const match = await cache.match(url)
  if (!match) return url
  const blob = await match.blob()
  return URL.createObjectURL(blob)
}
