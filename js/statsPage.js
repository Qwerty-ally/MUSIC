import { collection, onSnapshot, orderBy, query } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { escapeHtml } from './mediaCard.js'
import { openUserDetailModal } from './userDetailModal.js'
import { getState } from './auth.js'

export function initStatsPage() {
  const container = document.getElementById('stats-list')
  const loadingEl = document.getElementById('stats-loading')

  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
  onSnapshot(q, (snap) => {
    loadingEl.classList.add('hidden')
    const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    if (!users.length) {
      container.innerHTML = `<p class="loading-text">No one has signed up yet.</p>`
      return
    }

    const { user: currentUser } = getState()

    container.innerHTML = users.map((u) => {
      const minutes = Math.round((u.secondsListened || 0) / 60)
      const isYou = u.uid === currentUser?.uid
      return `
        <button class="user-row${u.banned ? ' user-row-banned' : ''}" data-uid="${u.id}">
          <div class="user-row-info">
            <p class="user-row-name">${escapeHtml(u.displayName || u.email || 'Unknown')}${isYou ? ' <span class="user-row-you">(you)</span>' : ''}</p>
            <p class="user-row-email">${escapeHtml(u.email || '')}</p>
          </div>
          <span class="user-row-badge ${u.role === 'owner' ? 'user-row-badge-owner' : ''}">${u.role === 'owner' ? 'Owner' : 'Normal'}</span>
          <span class="user-row-minutes">${minutes.toLocaleString()} min</span>
          ${u.banned ? '<span class="user-row-banned-tag">Kicked</span>' : ''}
        </button>
      `
    }).join('')

    container.querySelectorAll('.user-row').forEach((row) => {
      const u = users.find((x) => x.id === row.dataset.uid)
      row.addEventListener('click', () => openUserDetailModal(u))
    })
  }, () => loadingEl.classList.add('hidden'))
}
