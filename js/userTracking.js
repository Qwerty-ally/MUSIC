import { doc, setDoc, increment } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getState } from './auth.js'

const FLUSH_EVERY_SECONDS = 15

// Accumulates real playback time on a <audio> or <video> element and
// periodically adds it to the signed-in user's own secondsListened field.
// Ignores jumps (seeking/track changes) so scrubbing doesn't inflate stats.
export function trackPlaybackTime(mediaEl) {
  let lastTime = mediaEl.currentTime
  let pending = 0

  function flush() {
    if (pending <= 0) return
    const { user } = getState()
    if (user) {
      setDoc(doc(db, 'users', user.uid), { secondsListened: increment(Math.round(pending)) }, { merge: true }).catch(() => {})
    }
    pending = 0
  }

  mediaEl.addEventListener('timeupdate', () => {
    const now = mediaEl.currentTime
    const delta = now - lastTime
    if (delta > 0 && delta < 2) pending += delta
    lastTime = now
    if (pending >= FLUSH_EVERY_SECONDS) flush()
  })

  mediaEl.addEventListener('seeking', () => { lastTime = mediaEl.currentTime })
  mediaEl.addEventListener('pause', flush)
  mediaEl.addEventListener('ended', flush)
  window.addEventListener('beforeunload', flush)
}
