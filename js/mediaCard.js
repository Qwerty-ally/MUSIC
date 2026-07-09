import { songKey } from './songIdentity.js'

export function renderGrid(container, items, { getImage, getTitle, getSubtitle, getBadge, isDisabled, onClick, onDisabledClick, showPlayIcon = true, emptyIcon, emptyText }) {
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
    card.innerHTML = `
      <div class="media-card-art">
        <img src="${image}" alt="" loading="lazy" />
        ${showPlayIcon && !disabled ? `
        <div class="media-card-play">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>` : ''}
      </div>
      <p class="media-card-title">${escapeHtml(getTitle(item))}</p>
      ${subtitle ? `<p class="media-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      ${badge ? `<p class="media-card-badge">${escapeHtml(badge)}</p>` : ''}
    `
    card.addEventListener('click', () => (disabled ? onDisabledClick && onDisabledClick(item) : onClick(item)))
    grid.appendChild(card)
  })

  container.appendChild(grid)
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
