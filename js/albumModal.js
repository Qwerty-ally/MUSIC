import { getState } from './auth.js'
import { getReleaseDate, isUpcoming } from './albumUtils.js'
import { escapeHtml } from './mediaCard.js'

let modal, coverEl, titleEl, typeEl, countdownWrap, tracksEl, editBtn
let countdownInterval = null
let onEditRequested = null

export function initAlbumModal() {
  modal = document.getElementById('album-modal')
  coverEl = document.getElementById('album-modal-cover')
  titleEl = document.getElementById('album-modal-title')
  typeEl = document.getElementById('album-modal-type')
  countdownWrap = document.getElementById('album-modal-countdown')
  tracksEl = document.getElementById('album-modal-tracks')
  editBtn = document.getElementById('album-modal-edit')

  document.getElementById('album-modal-close').addEventListener('click', closeAlbumModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeAlbumModal() })
  editBtn.addEventListener('click', () => {
    const album = modal._album
    closeAlbumModal()
    if (onEditRequested && album) onEditRequested(album)
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
  modal._album = album
  const upcoming = isUpcoming(album)

  titleEl.textContent = album.title
  typeEl.textContent = album.type === 'ep' ? 'EP' : 'Album'
  coverEl.src = album.coverURL || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(album.title)}`

  const { isOwner } = getState()
  editBtn.classList.toggle('hidden', !isOwner)

  if (countdownInterval) clearInterval(countdownInterval)
  countdownWrap.classList.toggle('hidden', !upcoming)
  if (upcoming) renderCountdown(getReleaseDate(album))

  const tracks = album.tracks || []
  tracksEl.classList.toggle('album-tracklist-locked', upcoming)
  tracksEl.innerHTML = tracks.length
    ? tracks.map((t, i) => `
        <div class="album-track-row">
          <span class="album-track-num">${i + 1}</span>
          <span class="album-track-title">${escapeHtml(t.title)}</span>
        </div>
      `).join('')
    : `<p class="loading-text">No tracks listed yet.</p>`

  modal.classList.remove('hidden')
}

export function closeAlbumModal() {
  if (countdownInterval) clearInterval(countdownInterval)
  modal.classList.add('hidden')
}
