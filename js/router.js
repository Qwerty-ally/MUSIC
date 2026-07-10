import { onAuthChange, signOut } from './auth.js'

const VIEWS = ['music', 'music-videos', 'live-performances', 'interviews', 'behind-the-scenes', 'photos', 'albums', 'other', 'upload', 'payout', 'stats']
const OWNER_ONLY_ROUTES = ['upload', 'payout', 'stats']

function currentRoute() {
  const hash = location.hash.replace('#/', '')
  return VIEWS.includes(hash) ? hash : 'music'
}

function showRoute(route, isOwner) {
  if (OWNER_ONLY_ROUTES.includes(route) && !isOwner) route = 'music'

  VIEWS.forEach((v) => {
    document.getElementById(`view-${v}`).classList.toggle('hidden', v !== route)
  })
  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.classList.toggle('active', link.dataset.route === route)
  })
}

export function initRouter() {
  const authView = document.getElementById('auth-view')
  const appView = document.getElementById('app-view')
  const uploadLink = document.getElementById('sidebar-upload-link')
  const payoutLink = document.getElementById('sidebar-payout-link')
  const statsLink = document.getElementById('sidebar-stats-link')
  const userName = document.getElementById('sidebar-username')
  const ownerBadge = document.getElementById('sidebar-owner-badge')
  const logoutBtn = document.getElementById('sidebar-logout')

  let isOwnerCache = false

  onAuthChange(({ user, profile, isOwner }) => {
    isOwnerCache = isOwner
    if (!user) {
      authView.classList.remove('hidden')
      appView.classList.add('hidden')
      location.hash = ''
      return
    }

    authView.classList.add('hidden')
    appView.classList.remove('hidden')
    uploadLink.classList.toggle('hidden', !isOwner)
    payoutLink.classList.toggle('hidden', !isOwner)
    statsLink.classList.toggle('hidden', !isOwner)
    userName.textContent = profile?.displayName || 'Loading…'
    ownerBadge.classList.toggle('hidden', !isOwner)

    showRoute(currentRoute(), isOwner)
  })

  window.addEventListener('hashchange', () => showRoute(currentRoute(), isOwnerCache))

  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', () => { location.hash = `/${link.dataset.route}` })
  })

  logoutBtn.addEventListener('click', () => signOut())
}
