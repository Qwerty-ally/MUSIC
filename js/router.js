import { onAuthChange, signOut } from './auth.js'
import { showReleasePage, hideReleasePage } from './releasePage.js'

const VIEWS = ['music', 'music-videos', 'live-performances', 'interviews', 'behind-the-scenes', 'albums', 'magazines', 'photo-shoots', 'other', 'upload', 'stats']
const OWNER_ONLY_ROUTES = ['upload', 'stats']

function currentRoute() {
  const hash = location.hash.replace('#/', '')
  return VIEWS.includes(hash) ? hash : 'music'
}

// A public release link works with no account — handled entirely outside
// the normal auth-gated routing below. New links are #/release/<type>/<id>
// (type is "album" or "song"); older links shared before songs got their
// own release page were #/release/<albumId> with no type segment, so those
// still resolve as albums.
function releaseInfoFromHash() {
  const typed = location.hash.match(/^#\/release\/(album|song)\/(.+)$/)
  if (typed) return { type: typed[1], id: decodeURIComponent(typed[2]) }
  const legacy = location.hash.match(/^#\/release\/(.+)$/)
  return legacy ? { type: 'album', id: decodeURIComponent(legacy[1]) } : null
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
  const statsLink = document.getElementById('sidebar-stats-link')
  const userName = document.getElementById('sidebar-username')
  const ownerBadge = document.getElementById('sidebar-owner-badge')
  const logoutBtn = document.getElementById('sidebar-logout')

  let isOwnerCache = false
  let hasUserCache = false

  onAuthChange(({ user, profile, isOwner }) => {
    isOwnerCache = isOwner
    hasUserCache = !!user

    const releaseInfo = releaseInfoFromHash()
    if (releaseInfo) {
      authView.classList.add('hidden')
      appView.classList.add('hidden')
      showReleasePage(releaseInfo.type, releaseInfo.id)
      return
    }
    hideReleasePage()

    if (!user) {
      authView.classList.remove('hidden')
      appView.classList.add('hidden')
      location.hash = ''
      return
    }

    authView.classList.add('hidden')
    appView.classList.remove('hidden')
    uploadLink.classList.toggle('hidden', !isOwner)
    statsLink.classList.toggle('hidden', !isOwner)
    userName.textContent = profile?.displayName || 'Loading…'
    ownerBadge.classList.toggle('hidden', !isOwner)

    showRoute(currentRoute(), isOwner)
  })

  window.addEventListener('hashchange', () => {
    const releaseInfo = releaseInfoFromHash()
    if (releaseInfo) {
      authView.classList.add('hidden')
      appView.classList.add('hidden')
      showReleasePage(releaseInfo.type, releaseInfo.id)
      return
    }
    hideReleasePage()

    // Leaving the release page needs to restore the right top-level view
    // too (not just the section inside it) since a signed-out visitor
    // never triggered the auth-view/app-view toggle in the first place.
    if (!hasUserCache) {
      authView.classList.remove('hidden')
      appView.classList.add('hidden')
      return
    }
    authView.classList.add('hidden')
    appView.classList.remove('hidden')
    showRoute(currentRoute(), isOwnerCache)
  })

  document.querySelectorAll('.sidebar-link').forEach((link) => {
    link.addEventListener('click', () => { location.hash = `/${link.dataset.route}` })
  })

  logoutBtn.addEventListener('click', () => signOut())
}
