import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid } from './mediaCard.js'
import { openVideoModal } from './videoModal.js'

// Shared page logic for any "grid of video cards that open a video modal"
// collection: Music Videos, Live Performances, Interviews, Behind the Scenes.
export function initVideoCollectionPage({ collectionName, gridId, loadingId, subtitleField, emptyIcon, emptyText }) {
  const container = document.getElementById(gridId)
  const loadingEl = document.getElementById(loadingId)

  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const videos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    renderGrid(container, videos, {
      getImage: (v) => v.thumbnailURL,
      getTitle: (v) => v.title,
      getSubtitle: (v) => v[subtitleField],
      onClick: (video) => openVideoModal(video),
      emptyIcon,
      emptyText,
    })
  }, () => loadingEl.classList.add('hidden'))
}
