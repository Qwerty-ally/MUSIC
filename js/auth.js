import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { auth, db } from './firebase.js'
import { OWNER_CODE } from './constants.js'

let currentUser = null
let currentProfile = null
let profileUnsub = null
const listeners = new Set()

function notify() {
  const state = { user: currentUser, profile: currentProfile, isOwner: currentProfile?.role === 'owner' }
  listeners.forEach((cb) => cb(state))
}

export function onAuthChange(callback) {
  listeners.add(callback)
  callback({ user: currentUser, profile: currentProfile, isOwner: currentProfile?.role === 'owner' })
  return () => listeners.delete(callback)
}

export function getState() {
  return { user: currentUser, profile: currentProfile, isOwner: currentProfile?.role === 'owner' }
}

onAuthStateChanged(auth, (firebaseUser) => {
  if (profileUnsub) { profileUnsub(); profileUnsub = null }
  currentUser = firebaseUser
  currentProfile = null

  if (firebaseUser) {
    const ref = doc(db, 'users', firebaseUser.uid)
    profileUnsub = onSnapshot(ref, (snap) => {
      const data = snap.exists() ? snap.data() : null
      if (data?.banned) {
        firebaseSignOut(auth)
        return
      }
      currentProfile = data ? { id: snap.id, ...data } : null
      notify()
    }, () => notify())
  } else {
    notify()
  }
})

export async function signUp({ email, password, displayName, role, ownerCode }) {
  if (role === 'owner' && ownerCode !== OWNER_CODE) {
    throw new Error('Invalid owner code.')
  }
  const name = displayName || email.split('@')[0]
  const { user } = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(user, { displayName: name })
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName: name,
    email,
    role,
    createdAt: serverTimestamp(),
  })
}

export function signIn({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function signOut() {
  return firebaseSignOut(auth)
}
