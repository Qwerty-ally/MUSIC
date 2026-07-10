import { escapeHtml } from './mediaCard.js'
import { openImageModal } from './imageModal.js'

let modal, titleEl, countEl, gridEl

export function initPhotoGroupModal() {
  modal = document.getElementById('photo-group-modal')
  titleEl = document.getElementById('photo-group-modal-title')
  countEl = document.getElementById('photo-group-modal-count')
  gridEl = document.getElementById('photo-group-modal-grid')

  document.getElementById('photo-group-modal-close').addEventListener('click', closePhotoGroupModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closePhotoGroupModal() })
}

export function openPhotoGroupModal(group) {
  const images = group.images || []
  titleEl.textContent = group.title
  countEl.textContent = `${images.length} photo${images.length === 1 ? '' : 's'}`

  gridEl.innerHTML = images.map((url, i) => `
    <button class="photo-group-thumb" data-index="${i}">
      <img src="${url}" alt="${escapeHtml(group.title)} photo ${i + 1}" loading="lazy" />
    </button>
  `).join('')

  gridEl.querySelectorAll('.photo-group-thumb').forEach((btn) => {
    const i = Number(btn.dataset.index)
    btn.addEventListener('click', () => openImageModal({ title: `${group.title} — Photo ${i + 1}`, imageURL: images[i] }))
  })

  modal.classList.remove('hidden')
}

export function closePhotoGroupModal() {
  modal.classList.add('hidden')
}
