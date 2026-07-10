import { doc, setDoc, addDoc, collection, onSnapshot, query, orderBy, limit, increment, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getState } from './auth.js'

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

// Claims the current running total: logs it to payoutHistory, then zeroes
// the live counters so the next total starts fresh from $0.
// Takes the same shape onPayoutChange hands back ({ grandTotal, songPlays, videoPlays, ... }).
export async function claimPayout({ grandTotal, songPlays, videoPlays }) {
  const { user, profile } = getState()
  await addDoc(collection(db, 'payoutHistory'), {
    amount: grandTotal,
    songPlays,
    videoPlays,
    claimedBy: user.uid,
    claimedByName: profile?.displayName || user.email || 'Owner',
    claimedAt: serverTimestamp(),
  })
  await setDoc(payoutRef, { songPlays: 0, videoPlays: 0 }, { merge: true })
}

export function onPayoutHistoryChange(callback) {
  const q = query(collection(db, 'payoutHistory'), orderBy('claimedAt', 'desc'), limit(20))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export { SONG_RATE, VIDEO_RATE }
