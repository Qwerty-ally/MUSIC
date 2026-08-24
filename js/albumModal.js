import { doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getState } from './auth.js'
import { getReleaseDate, isUpcoming } from './releaseUtils.js'
import { escapeHtml, highlightNowPlaying } from './mediaCard.js'
import { playSong, onTrackChange, getCurrentTrack } from './player.js'
import { showToast } from './toast.js'

let modal, coverEl, titleEl, typeEl, countdownWrap, tracksEl, ownerActions, editBtn, deleteBtn, copyLinkBtn
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
  copyLinkBtn = document.getElementById('album-modal-copy-link')

  document.getElementById('album-modal-close').addEventListener('click', closeAlbumModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAlbumModal() })

  copyLinkBtn.addEventListener('click', async () => {
    if (!currentAlbum) return
    const url = `${location.origin}${location.pathname}#/release/${currentAlbum.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Release link copied!', 'success')
    } catch {
      window.prompt('Copy this link:', url)
    }
  })

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
  // A track releases early if it has its own releaseDate; otherwise it
  // follows the album's releaseDate, so an album can be "out" while some
  // tracks are still locked, or "upcoming" while some tracks are already out.
  const trackIsUpcoming = (t) => (t.releaseDate ? isUpcoming(t) : upcoming)
  const playableTracks = tracks
    .map((t, i) => ({ id: `${album.id}-${i}`, title: t.title, artist: album.title, audioURL: t.audioURL, coverURL: album.coverURL }))
    .filter((t, i) => t.audioURL && !trackIsUpcoming(tracks[i]))

  tracksEl.classList.remove('album-tracklist-locked')
  tracksEl.innerHTML = tracks.length
    ? tracks.map((t, i) => {
        const dateLocked = trackIsUpcoming(t)
        // Its date arrived but nobody uploaded audio yet — don't let it
        // silently "release" as a dead row; keep it visibly pending.
        const missingAudio = !dateLocked && !t.audioURL
        const locked = dateLocked || missingAudio
        const playable = !locked && !!t.audioURL
        let icon = ''
        let iconTitle = ''
        if (dateLocked) {
          icon = '&#128274;'
          iconTitle = `Releases ${getReleaseDate(t.releaseDate ? t : album).toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}`
        } else if (missingAudio) {
          icon = '&#8987;'
          iconTitle = 'Audio not uploaded yet'
        }
        return `
          <div class="album-track-row${playable ? ' album-track-row-playable' : ''}${locked ? ' album-track-row-locked' : ''}" data-index="${i}">
            <span class="album-track-num">${i + 1}</span>
            <span class="album-track-title">${escapeHtml(t.title)}</span>
            ${icon ? `<span class="album-track-lock" title="${iconTitle}">${icon}</span>` : ''}
          </div>
        `
      }).join('')
    : `<p class="loading-text">No tracks listed yet.</p>`

  tracksEl.querySelectorAll('.album-track-row-playable').forEach((row) => {
    const i = Number(row.dataset.index)
    const track = playableTracks.find((t) => t.id === `${album.id}-${i}`)
    if (!track) return
    row.addEventListener('click', () => playSong(track, playableTracks))
  })

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
