import { CHANGELOG } from './constants.js'

export function initUpdateModal() {
  const modal = document.getElementById('update-modal')
  const badge = document.getElementById('version-badge')
  const versionEl = document.getElementById('update-modal-version')
  const notesEl = document.getElementById('update-modal-notes')
  const closeBtn = document.getElementById('update-modal-close')

  badge.textContent = `v${CHANGELOG[0].version}`

  badge.addEventListener('click', () => {
    const latest = CHANGELOG[0]
    versionEl.textContent = `v${latest.version}${latest.date ? ` — ${latest.date}` : ''}`
    notesEl.textContent = latest.notes
    modal.classList.remove('hidden')
  })

  closeBtn.addEventListener('click', () => modal.classList.add('hidden'))
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden') })
}
