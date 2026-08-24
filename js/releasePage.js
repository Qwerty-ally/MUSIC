import { doc, onSnapshot } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getReleaseDate, isUpcoming } from './releaseUtils.js'
import { escapeHtml } from './mediaCard.js'

// Public, no-login page at #/release/album/<id> or #/release/song/<id> —
// Firestore rules allow an unauthenticated "get" of a single album/song
// document by ID for exactly this, while still requiring sign-in to
// browse/query either collection at large.

const COLLECTIONS = { album: 'albums', song: 'songs' }

let els = null
let unsub = null
let countdownInterval = null

function ensureEls() {
  if (els) return els
  els = {
    page: document.getElementById('release-page'),
    loading: document.getElementById('release-page-loading'),
    content: document.getElementById('release-page-content'),
    notFound: document.getElementById('release-page-notfound'),
    cover: document.getElementById('release-page-cover'),
    type: document.getElementById('release-page-type'),
    title: document.getElementById('release-page-title'),
    countdownWrap: document.getElementById('release-page-countdown'),
    out: document.getElementById('release-page-out'),
    tracksWrap: document.getElementById('release-page-tracks-wrap'),
    tracks: document.getElementById('release-page-tracks'),
  }
  return els
}

function renderCountdown(date) {
  function tick() {
    const diff = date.getTime() - Date.now()
    if (diff <= 0) {
      clearInterval(countdownInterval)
      els.countdownWrap.classList.add('hidden')
      els.out.classList.remove('hidden')
      return
    }
    document.getElementById('release-page-cd-days').textContent = Math.floor(diff / 86400000)
    document.getElementById('release-page-cd-hours').textContent = Math.floor((diff % 86400000) / 3600000)
    document.getElementById('release-page-cd-mins').textContent = Math.floor((diff % 3600000) / 60000)
    document.getElementById('release-page-cd-secs').textContent = Math.floor((diff % 60000) / 1000)
  }
  tick()
  countdownInterval = setInterval(tick, 1000)
}

function renderAlbum(album) {
  els.type.textContent = album.type === 'ep' ? 'EP' : 'Album'
  els.title.textContent = album.title

  const upcoming = isUpcoming(album)
  const tracks = album.tracks || []
  // Same per-track lock rules as the in-app album modal (own releaseDate,
  // or falls back to the album's) — this page never plays audio, so a
  // locked track just shows its lock/pending state, no click handling.
  const trackIsUpcoming = (t) => (t.releaseDate ? isUpcoming(t) : upcoming)
  els.tracksWrap.classList.remove('hidden')
  els.tracks.innerHTML = tracks.length
    ? tracks.map((t, i) => {
        const dateLocked = trackIsUpcoming(t)
        const missingAudio = !dateLocked && !t.audioURL
        const locked = dateLocked || missingAudio
        return `
          <div class="album-track-row${locked ? ' album-track-row-locked' : ''}">
            <span class="album-track-num">${i + 1}</span>
            <span class="album-track-title">${escapeHtml(t.title)}</span>
            ${locked ? `<span class="album-track-lock">${dateLocked ? '&#128274;' : '&#8987;'}</span>` : ''}
          </div>
        `
      }).join('')
    : `<p class="loading-text">No tracks listed yet.</p>`

  return { upcoming, releaseDate: getReleaseDate(album) }
}

function renderSong(song) {
  els.type.textContent = song.artist || 'Song'
  els.title.textContent = song.title
  els.tracksWrap.classList.add('hidden')
  els.tracks.innerHTML = ''

  return { upcoming: isUpcoming(song), releaseDate: getReleaseDate(song) }
}

function render(type, item) {
  els.loading.classList.add('hidden')
  els.notFound.classList.add('hidden')
  els.content.classList.remove('hidden')

  els.cover.src = item.coverURL || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(item.title)}`

  const { upcoming, releaseDate } = type === 'song' ? renderSong(item) : renderAlbum(item)

  if (countdownInterval) clearInterval(countdownInterval)
  els.countdownWrap.classList.toggle('hidden', !upcoming)
  els.out.classList.toggle('hidden', upcoming)
  if (upcoming) renderCountdown(releaseDate)
}

export function showReleasePage(type, id) {
  ensureEls()
  els.page.classList.remove('hidden')
  els.loading.classList.remove('hidden')
  els.content.classList.add('hidden')
  els.notFound.classList.add('hidden')

  const collection = COLLECTIONS[type]
  if (unsub) unsub()
  if (!collection) {
    els.loading.classList.add('hidden')
    els.notFound.classList.remove('hidden')
    return
  }

  unsub = onSnapshot(
    doc(db, collection, id),
    (snap) => {
      if (!snap.exists()) {
        els.loading.classList.add('hidden')
        els.notFound.classList.remove('hidden')
        return
      }
      render(type, { id: snap.id, ...snap.data() })
    },
    () => {
      els.loading.classList.add('hidden')
      els.notFound.classList.remove('hidden')
    }
  )
}

export function hideReleasePage() {
  if (!els) return
  els.page.classList.add('hidden')
  if (unsub) { unsub(); unsub = null }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
}
