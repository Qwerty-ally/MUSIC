import { doc, onSnapshot, setDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'

let modal, nameEl, emailEl, roleEl, joinedEl, minutesEl, kickBtn, bannedNotice
let unsub = null
let currentUserDoc = null

function formatDate(ts) {
  if (!ts) return '—'
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function initUserDetailModal() {
  modal = document.getElementById('user-modal')
  nameEl = document.getElementById('user-modal-name')
  emailEl = document.getElementById('user-modal-email')
  roleEl = document.getElementById('user-modal-role')
  joinedEl = document.getElementById('user-modal-joined')
  minutesEl = document.getElementById('user-modal-minutes')
  kickBtn = document.getElementById('user-modal-kick')
  bannedNotice = document.getElementById('user-modal-banned-notice')

  document.getElementById('user-modal-close').addEventListener('click', closeUserDetailModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeUserDetailModal() })

  kickBtn.addEventListener('click', async () => {
    if (!currentUserDoc) return
    const nowBanned = !currentUserDoc.banned
    if (nowBanned && !confirm(`Kick ${currentUserDoc.displayName || currentUserDoc.email}? They'll be signed out immediately and won't be able to log back in until unkicked.`)) return
    try {
      await setDoc(doc(db, 'users', currentUserDoc.id), { banned: nowBanned }, { merge: true })
      showToast(nowBanned ? 'User kicked.' : 'User unkicked.', 'success')
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    }
  })
}

export function openUserDetailModal(user) {
  currentUserDoc = user
  if (unsub) unsub()

  const { user: me } = getState()
  const isSelf = user.uid === me?.uid
  kickBtn.classList.toggle('hidden', isSelf)

  unsub = onSnapshot(doc(db, 'users', user.id), (snap) => {
    if (!snap.exists()) return
    const u = { id: snap.id, ...snap.data() }
    currentUserDoc = u

    nameEl.textContent = u.displayName || u.email || 'Unknown'
    emailEl.textContent = u.email || ''
    roleEl.textContent = u.role === 'owner' ? 'Owner' : 'Normal'
    roleEl.classList.toggle('user-row-badge-owner', u.role === 'owner')
    joinedEl.textContent = formatDate(u.createdAt)
    minutesEl.textContent = `${Math.round((u.secondsListened || 0) / 60).toLocaleString()} min`
    bannedNotice.classList.toggle('hidden', !u.banned)
    kickBtn.textContent = u.banned ? 'Unkick' : 'Kick'
    kickBtn.classList.toggle('btn-danger', !u.banned)
    kickBtn.classList.toggle('btn-secondary', !!u.banned)
  })

  modal.classList.remove('hidden')
}

export function closeUserDetailModal() {
  if (unsub) { unsub(); unsub = null }
  modal.classList.add('hidden')
  currentUserDoc = null
}
