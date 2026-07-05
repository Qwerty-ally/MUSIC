export function renderGrid(container, items, { getImage, getTitle, getSubtitle, getBadge, onClick, showPlayIcon = true, emptyIcon, emptyText }) {
  container.innerHTML = ''

  if (!items.length) {
    container.innerHTML = `<div class="empty-state">${emptyIcon || ''}<p>${emptyText || 'Nothing here yet.'}</p></div>`
    return
  }

  const grid = document.createElement('div')
  grid.className = 'media-grid'

  items.forEach((item) => {
    const card = document.createElement('button')
    card.className = 'media-card'
    const seed = encodeURIComponent(item.id || getTitle(item))
    const image = getImage(item) || `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}`
    const subtitle = getSubtitle ? getSubtitle(item) : ''
    const badge = getBadge ? getBadge(item) : ''
    card.innerHTML = `
      <div class="media-card-art">
        <img src="${image}" alt="" loading="lazy" />
        ${showPlayIcon ? `
        <div class="media-card-play">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>` : ''}
      </div>
      <p class="media-card-title">${escapeHtml(getTitle(item))}</p>
      ${subtitle ? `<p class="media-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      ${badge ? `<p class="media-card-badge">${escapeHtml(badge)}</p>` : ''}
    `
    card.addEventListener('click', () => onClick(item))
    grid.appendChild(card)
  })

  container.appendChild(grid)
}

export function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
