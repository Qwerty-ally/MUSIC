let modal, videoEl, titleEl, subtitleEl, descEl, closeBtn

export function initVideoModal() {
  modal = document.getElementById('video-modal')
  videoEl = document.getElementById('video-modal-player')
  titleEl = document.getElementById('video-modal-title')
  subtitleEl = document.getElementById('video-modal-subtitle')
  descEl = document.getElementById('video-modal-desc')
  closeBtn = document.getElementById('video-modal-close')

  closeBtn.addEventListener('click', closeVideoModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeVideoModal() })
}

export function openVideoModal(video) {
  titleEl.textContent = video.title
  subtitleEl.textContent = video.artist || ''
  subtitleEl.classList.toggle('hidden', !video.artist)
  descEl.textContent = video.description || ''
  descEl.classList.toggle('hidden', !video.description)
  videoEl.src = video.videoURL
  modal.classList.remove('hidden')
  videoEl.play().catch(() => {})
}

export function closeVideoModal() {
  videoEl.pause()
  videoEl.src = ''
  modal.classList.add('hidden')
}
