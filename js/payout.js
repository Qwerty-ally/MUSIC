import { doc, setDoc, onSnapshot, increment } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'

const SONG_RATE = 1
const VIDEO_RATE = 5

const payoutRef = doc(db, 'stats', 'payout')

export function recordSongPlay() {
  setDoc(payoutRef, { songPlays: increment(1) }, { merge: true }).catch(() => {})
}

export function recordVideoPlay() {
  setDoc(payoutRef, { videoPlays: increment(1) }, { merge: true }).catch(() => {})
}

export function onPayoutChange(callback) {
  return onSnapshot(payoutRef, (snap) => {
    const data = snap.exists() ? snap.data() : {}
    const songPlays = data.songPlays || 0
    const videoPlays = data.videoPlays || 0
    callback({
      songPlays,
      videoPlays,
      songTotal: songPlays * SONG_RATE,
      videoTotal: videoPlays * VIDEO_RATE,
      grandTotal: songPlays * SONG_RATE + videoPlays * VIDEO_RATE,
    })
  })
}

export { SONG_RATE, VIDEO_RATE }
