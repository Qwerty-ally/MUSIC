import { doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getState } from './auth.js'
import { getReleaseDate, isUpcoming } from './releaseUtils.js'
import { escapeHtml, highlightNowPlaying } from './mediaCard.js'
import { playSong, onTrackChange, getCurrentTrack } from './player.js'
import { showToast } from './toast.js'

let modal, coverEl, titleEl, typeEl, countdownWrap, tracksEl, ownerActions, editBtn, deleteBtn
let countdownInterval = null
let onEditRequested = null
let currentAlbum = null

export function initAlbumModal() {
  modal = document.getElementById('album-modal')
  coverEl = document.getElementById('album-modal-cover')
  titleEl = document.getElementById('album-modal-title')
  typeEl = document.getElementById('album-modal-type')
  countdownWrap = document.getElementById('album-modal-countdown')
  tracksEl = document.getElementById('album-modal-tracks')
  ownerActions = document.getElementById('album-modal-owner-actions')
  editBtn = document.getElementById('album-modal-edit')
  deleteBtn = document.getElementById('album-modal-delete')

  document.getElementById('album-modal-close').addEventListener('click', closeAlbumModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAlbumModal() })

  editBtn.addEventListener('click', () => {
    const album = currentAlbum
    closeAlbumModal()
    if (onEditRequested && album) onEditRequested(album)
  })

  deleteBtn.addEventListener('click', async () => {
    const album = currentAlbum
    if (!album) return
    if (!confirm(`Delete "${album.title}"? This can't be undone.`)) return
    try {
      await deleteDoc(doc(db, 'albums', album.id))
      showToast('Album deleted.', 'success')
      closeAlbumModal()
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    }
  })

  onTrackChange(({ track }) => {
    if (!modal.classList.contains('hidden')) highlightNowPlaying(tracksEl, track)
  })
}

// uploadPage.js registers itself here so this module doesn't need to import
// it directly (avoids a circular import between albumModal <-> uploadPage).
export function onAlbumEditRequested(callback) {
  onEditRequested = callback
}

function renderCountdown(date) {
  function tick() {
    const diff = date.getTime() - Date.now()
    if (diff <= 0) {
      clearInterval(countdownInterval)
      countdownWrap.classList.add('hidden')
      tracksEl.classList.remove('album-tracklist-locked')
      return
    }
    const days = Math.floor(diff / 86400000)
    const hours = Math.floor((diff % 86400000) / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    const secs = Math.floor((diff % 60000) / 1000)
    document.getElementById('album-cd-days').textContent = days
    document.getElementById('album-cd-hours').textContent = hours
    document.getElementById('album-cd-mins').textContent = mins
    document.getElementById('album-cd-secs').textContent = secs
  }
  tick()
  countdownInterval = setInterval(tick, 1000)
}

export function openAlbumModal(album) {
  currentAlbum = album
  const upcoming = isUpcoming(album)

  titleEl.textContent = album.title
  typeEl.textContent = album.type === 'ep' ? 'EP' : 'Album'
  coverEl.src = album.coverURL || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(album.title)}`

  const { isOwner } = getState()
  ownerActions.classList.toggle('hidden', !isOwner)

  if (countdownInterval) clearInterval(countdownInterval)
  countdownWrap.classList.toggle('hidden', !upcoming)
  if (upcoming) renderCountdown(getReleaseDate(album))

  const tracks = album.tracks || []
  const playableTracks = tracks
    .map((t, i) => ({ id: `${album.id}-${i}`, title: t.title, artist: album.title, audioURL: t.audioURL, coverURL: album.coverURL }))
    .filter((t) => t.audioURL)

  tracksEl.classList.toggle('album-tracklist-locked', upcoming)
  tracksEl.innerHTML = tracks.length
    ? tracks.map((t, i) => {
        const playable = !upcoming && !!t.audioURL
        return `
          <div class="album-track-row${playable ? ' album-track-row-playable' : ''}" data-index="${i}">
            <span class="album-track-num">${i + 1}</span>
            <span class="album-track-title">${escapeHtml(t.title)}</span>
          </div>
        `
      }).join('')
    : `<p class="loading-text">No tracks listed yet.</p>`

  if (!upcoming) {
    tracksEl.querySelectorAll('.album-track-row-playable').forEach((row) => {
      const i = Number(row.dataset.index)
      const track = playableTracks.find((t) => t.id === `${album.id}-${i}`)
      if (!track) return
      row.addEventListener('click', () => playSong(track, playableTracks))
    })
  }

  // Tag rows with a song key (title+audioURL) so the shared now-playing
  // highlight logic can match them against the Music grid too.
  tracks.forEach((t, i) => {
    if (!t.audioURL) return
    const row = tracksEl.querySelector(`.album-track-row[data-index="${i}"]`)
    if (row) row.dataset.songKey = `${(t.title || '').trim().toLowerCase()}::${t.audioURL}`
  })

  highlightNowPlaying(tracksEl, getCurrentTrack())
  modal.classList.remove('hidden')
}

export function closeAlbumModal() {
  if (countdownInterval) clearInterval(countdownInterval)
  modal.classList.add('hidden')
  currentAlbum = null
}
