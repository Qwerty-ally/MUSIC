import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid } from './mediaCard.js'
import { openPhotoGroupModal } from './photoGroupModal.js'

// Shared page logic for any "grid of grouped-photo cards" collection —
// Magazines and Photo Shoots. Each doc is { title, coverURL, images: [...] }.
export function initPhotoGroupPage({ collectionName, gridId, loadingId, emptyIcon, emptyText }) {
  const container = document.getElementById(gridId)
  const loadingEl = document.getElementById(loadingId)

  const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const groups = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    renderGrid(container, groups, {
      getImage: (g) => g.coverURL || (g.images && g.images[0]),
      getTitle: (g) => g.title,
      getSubtitle: (g) => `${(g.images || []).length} photo${(g.images || []).length === 1 ? '' : 's'}`,
      onClick: (group) => openPhotoGroupModal(group),
      showPlayIcon: false,
      emptyIcon,
      emptyText,
    })
  }, () => loadingEl.classList.add('hidden'))
}
