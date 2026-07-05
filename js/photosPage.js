import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid } from './mediaCard.js'
import { openImageModal } from './imageModal.js'

const photoIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>'

export function initPhotosPage() {
  const container = document.getElementById('photos-grid')
  const loadingEl = document.getElementById('photos-loading')

  const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const photos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    renderGrid(container, photos, {
      getImage: (p) => p.imageURL,
      getTitle: (p) => p.title,
      getSubtitle: (p) => p.caption,
      onClick: (photo) => openImageModal(photo),
      showPlayIcon: false,
      emptyIcon: photoIcon,
      emptyText: 'No photos uploaded yet.',
    })
  }, () => loadingEl.classList.add('hidden'))
}
