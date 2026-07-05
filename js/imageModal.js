let modal, imgEl, titleEl, captionEl, closeBtn

export function initImageModal() {
  modal = document.getElementById('image-modal')
  imgEl = document.getElementById('image-modal-img')
  titleEl = document.getElementById('image-modal-title')
  captionEl = document.getElementById('image-modal-caption')
  closeBtn = document.getElementById('image-modal-close')

  closeBtn.addEventListener('click', closeImageModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeImageModal() })
}

export function openImageModal(photo) {
  titleEl.textContent = photo.title
  captionEl.textContent = photo.caption || ''
  captionEl.classList.toggle('hidden', !photo.caption)
  imgEl.src = photo.imageURL
  modal.classList.remove('hidden')
}

export function closeImageModal() {
  imgEl.src = ''
  modal.classList.add('hidden')
}
