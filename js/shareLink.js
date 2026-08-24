import { showToast } from './toast.js'

export function releaseLinkURL(type, id) {
  return `${location.origin}${location.pathname}#/release/${type}/${id}`
}

export async function copyReleaseLink(type, id) {
  const url = releaseLinkURL(type, id)
  try {
    await navigator.clipboard.writeText(url)
    showToast('Release link copied!', 'success')
  } catch {
    window.prompt('Copy this link:', url)
  }
}
