import './firebase.js'
import { onAuthChange } from './auth.js'
import { initToast } from './toast.js'
import { initAuthPage } from './authPage.js'
import { initRouter } from './router.js'
import { initPlayer } from './player.js'
import { initVideoModal } from './videoModal.js'
import { initImageModal } from './imageModal.js'
import { initAlbumModal } from './albumModal.js'
import { initMusicPage } from './musicPage.js'
import { initVideoCollectionPage } from './videoCollectionPage.js'
import { initPhotosPage } from './photosPage.js'
import { initAlbumsPage } from './albumsPage.js'
import { initUploadPage } from './uploadPage.js'

const clapperIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M2 10v10h20V10H2zm18-6h-3.2l2 3h-2.4l-2-3h-2l2 3h-2.4l-2-3h-2l2 3H7.6l-2-3H2v4h20V4z"/></svg>'
const micIcon = '<svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>'

initToast()
initAuthPage()
initRouter()
initPlayer()
initVideoModal()
initImageModal()
initAlbumModal()

// Firestore rules require auth to read songs/videos, so only attach these
// listeners once a user is actually signed in (otherwise the first
// permission-denied error would kill the listener before sign-in completes).
let dataInitialized = false
onAuthChange(({ user }) => {
  if (user && !dataInitialized) {
    dataInitialized = true
    initMusicPage()
    initVideoCollectionPage({
      collectionName: 'musicVideos', gridId: 'music-videos-grid', loadingId: 'music-videos-loading',
      subtitleField: 'artist', emptyIcon: clapperIcon, emptyText: 'No music videos uploaded yet.',
    })
    initVideoCollectionPage({
      collectionName: 'livePerformances', gridId: 'live-performances-grid', loadingId: 'live-performances-loading',
      subtitleField: 'artist', emptyIcon: clapperIcon, emptyText: 'No live performances uploaded yet.',
    })
    initVideoCollectionPage({
      collectionName: 'interviews', gridId: 'interviews-grid', loadingId: 'interviews-loading',
      subtitleField: 'description', emptyIcon: micIcon, emptyText: 'No interviews uploaded yet.',
    })
    initVideoCollectionPage({
      collectionName: 'behindTheScenes', gridId: 'behind-the-scenes-grid', loadingId: 'behind-the-scenes-loading',
      subtitleField: 'description', emptyIcon: clapperIcon, emptyText: 'No behind-the-scenes videos uploaded yet.',
    })
    initVideoCollectionPage({
      collectionName: 'otherVideos', gridId: 'other-grid', loadingId: 'other-loading',
      subtitleField: 'description', emptyIcon: clapperIcon, emptyText: 'No videos uploaded yet.',
    })
    initPhotosPage()
    initAlbumsPage()
    initUploadPage()
  }
})
