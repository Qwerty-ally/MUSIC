import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { renderGrid, highlightNowPlaying } from './mediaCard.js'
import { playSong, onTrackChange, getCurrentTrack } from './player.js'
import { isUpcoming, getReleaseDate } from './releaseUtils.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'
import { populateSongFormForEdit } from './uploadPage.js'

const musicIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>'

function formatReleaseDate(date) {
  return date.toLocaleString(undefined, { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

async function deleteSong(song) {
  if (!confirm(`Delete "${song.title}"? This can't be undone.`)) return
  try {
    await deleteDoc(doc(db, 'songs', song.id))
    showToast('Song deleted.', 'success')
  } catch (err) {
    showToast(err.message.replace('Firebase: ', ''), 'error')
  }
}

export function initMusicPage() {
  const container = document.getElementById('music-grid')
  const loadingEl = document.getElementById('music-loading')

  const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const songs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    // A song whose release date has passed but has no audio yet is still
    // not actually out — don't let it "release" as an unplayable dead card.
    const isReleased = (s) => !isUpcoming(s) && !!s.audioURL
    const releasedSongs = songs.filter(isReleased)
    const { isOwner } = getState()

    renderGrid(container, songs, {
      getImage: (s) => s.coverURL,
      getTitle: (s) => s.title,
      getSubtitle: (s) => s.artist,
      getBadge: (s) => (isUpcoming(s) ? 'Upcoming Release' : (!s.audioURL ? 'Audio Pending' : '')),
      isDisabled: (s) => !isReleased(s),
      onClick: (song) => playSong(song, releasedSongs),
      onDisabledClick: (song) => showToast(
        isUpcoming(song)
          ? `"${song.title}" releases ${formatReleaseDate(getReleaseDate(song))}`
          : `"${song.title}" doesn't have audio uploaded yet.`,
        isUpcoming(song) ? 'success' : 'error'
      ),
      showDownload: true,
      getDownloadUrl: (s) => s.audioURL,
      showEdit: isOwner,
      onEdit: populateSongFormForEdit,
      showDelete: isOwner,
      onDelete: deleteSong,
      emptyIcon: musicIcon,
      emptyText: 'No songs uploaded yet.',
    })
    highlightNowPlaying(container, getCurrentTrack())
  }, () => loadingEl.classList.add('hidden'))

  onTrackChange(({ track }) => highlightNowPlaying(container, track))
}
