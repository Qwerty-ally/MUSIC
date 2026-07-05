import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid } from './mediaCard.js'
import { openAlbumModal } from './albumModal.js'
import { isUpcoming } from './albumUtils.js'

const albumIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 13a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>'

let albumsCache = []

export function initAlbumsPage() {
  const container = document.getElementById('albums-grid')
  const loadingEl = document.getElementById('albums-loading')

  const q = query(collection(db, 'albums'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    albumsCache = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    renderGrid(container, albumsCache, {
      getImage: (a) => a.coverURL,
      getTitle: (a) => a.title,
      getSubtitle: (a) => (a.type === 'ep' ? 'EP' : 'Album'),
      getBadge: (a) => (isUpcoming(a) ? 'Upcoming Release' : ''),
      onClick: (album) => openAlbumModal(album),
      showPlayIcon: false,
      emptyIcon: albumIcon,
      emptyText: 'No albums or EPs uploaded yet.',
    })
  }, () => loadingEl.classList.add('hidden'))
}
