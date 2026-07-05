import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid, highlightNowPlaying } from './mediaCard.js'
import { playSong, onTrackChange, getCurrentTrack } from './player.js'

const musicIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>'

export function initMusicPage() {
  const container = document.getElementById('music-grid')
  const loadingEl = document.getElementById('music-loading')

  const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    renderGrid(container, songs, {
      getImage: (s) => s.coverURL,
      getTitle: (s) => s.title,
      getSubtitle: (s) => s.artist,
      onClick: (song) => playSong(song, songs),
      emptyIcon: musicIcon,
      emptyText: 'No songs uploaded yet.',
    })
    highlightNowPlaying(container, getCurrentTrack())
  }, () => loadingEl.classList.add('hidden'))

  onTrackChange(({ track }) => highlightNowPlaying(container, track))
}
