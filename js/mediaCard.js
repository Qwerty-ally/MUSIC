import { songKey } from './songIdentity.js'
import { isDownloaded, downloadTrack, removeDownload } from './downloads.js'

const downloadIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 15l-5-5h3V4h4v6h3l-5 5zM5 18h14v2H5z"/></svg>'
const downloadedIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
const spinnerIcon = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" class="spin"><circle cx="12" cy="12" r="9" stroke-opacity="0.25"/><path d="M21 12a9 9 0 0 0-9-9"/></svg>'

export function renderGrid(container, items, { getImage, getTitle, getSubtitle, getBadge, isDisabled, onClick, onDisabledClick, showPlayIcon = true, showDownload = false, getDownloadUrl, emptyIcon, emptyText }) {
  container.innerHTML = ''

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${emptyIcon || ''}<p>${emptyText || 'Nothing here yet.'}</p></div>`
    return
  }

  const grid = document.createElement('div')
  grid.className = 'media-grid'

  items.forEach((item) => {
    const disabled = isDisabled ? isDisabled(item) : false
    const card = document.createElement('button')
    card.className = `media-card${disabled ? ' media-card-disabled' : ''}`
    const key = songKey(item)
    if (key) card.dataset.songKey = key
    const seed = encodeURIComponent(item.id || getTitle(item))
    const image = getImage(item) || `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`
    const subtitle = getSubtitle ? getSubtitle(item) : ''
    const badge = getBadge ? getBadge(item) : ''
    const downloadUrl = showDownload && !disabled ? (getDownloadUrl ? getDownloadUrl(item) : item.audioURL) : null
    card.innerHTML = `
      <div class="media-card-art">
        <img src="${image}" alt="" loading="lazy" />
        ${showPlayIcon && !disabled ? `
        <div class="media-card-play">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>` : ''}
        ${downloadUrl ? `<button type="button" class="media-card-download" data-url="${encodeURIComponent(downloadUrl)}" title="Download for offline listening">${downloadIcon}</button>` : ''}
      </div>
      <p class="media-card-title">${escapeHtml(getTitle(item))}</p>
      ${subtitle ? `<p class="media-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      ${badge ? `<p class="media-card-badge">${escapeHtml(badge)}</p>` : ''}
    `
    card.addEventListener('click', () => (disabled ? onDisabledClick && onDisabledClick(item) : onClick(item)))
    grid.appendChild(card)
  })

  container.appendChild(grid)

  if (showDownload) wireDownloadButtons(grid)
}

// Checks real download status for every download button in a container and
// wires up click-to-toggle. Async because Cache Storage is async — buttons
// start in a neutral "not downloaded" state and flip once the check lands.
function wireDownloadButtons(container) {
  container.querySelectorAll('.media-card-download').forEach(async (btn) => {
    const url = decodeURIComponent(btn.dataset.url)
    const downloaded = await isDownloaded(url)
    setDownloadButtonState(btn, downloaded ? 'downloaded' : 'idle')

    btn.addEventListener('click', async (e) => {
      e.stopPropagation()
      const isNowDownloaded = btn.dataset.state === 'downloaded'
      if (isNowDownloaded) {
        setDownloadButtonState(btn, 'idle')
        await removeDownload(url)
        return
      }
      setDownloadButtonState(btn, 'loading')
      try {
        await downloadTrack(url)
        setDownloadButtonState(btn, 'downloaded')
      } catch {
        setDownloadButtonState(btn, 'idle')
      }
    })
  })
}

function setDownloadButtonState(btn, state) {
  btn.dataset.state = state
  btn.classList.toggle('media-card-download-active', state === 'downloaded')
  btn.innerHTML = state === 'downloaded' ? downloadedIcon : state === 'loading' ? spinnerIcon : downloadIcon
  btn.title = state === 'downloaded' ? 'Downloaded — click to remove' : 'Download for offline listening'
}

// Toggles a "now playing" look on any rendered card/row whose data-song-key
// matches the currently playing track — shared by the Music grid and album
// tracklists so the same song is highlighted everywhere it appears.
export function highlightNowPlaying(container, currentTrack) {
  const currentKey = songKey(currentTrack)
  container.querySelectorAll('[data-song-key]').forEach((el) => {
    el.classList.toggle('now-playing', !!currentKey && el.dataset.songKey === currentKey)
  })
}

export function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
