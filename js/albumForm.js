import { addDoc, doc, updateDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { uploadMedia } from './cloudinary.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'

let els = null
let editingId = null
let existingCoverURL = ''

function addTrackRow(title = '', audioURL = '') {
  const row = document.createElement('div')
  row.className = 'album-track-row-input'
  row.dataset.existingAudio = audioURL || ''
  row.innerHTML = `
    <input type="text" class="album-track-name" placeholder="Track name" value="${title.replace(/"/g, '&quot;')}" />
    <label class="album-track-file-label">
      <input type="file" class="album-track-file" accept="audio/*" hidden />
      <span class="album-track-file-status">${audioURL ? '&#9989; Audio attached' : 'Add audio'}</span>
    </label>
    <button type="button" class="album-track-remove">&times;</button>
  `
  row.querySelector('.album-track-file').addEventListener('change', (e) => {
    const status = row.querySelector('.album-track-file-status')
    const file = e.target.files[0]
    status.textContent = file ? `\u{1F3B5} ${file.name}` : (row.dataset.existingAudio ? '✅ Audio attached' : 'Add audio')
  })
  row.querySelector('.album-track-remove').addEventListener('click', () => row.remove())
  els.tracksList.appendChild(row)
}

async function collectTracks(onProgress) {
  const rows = Array.from(els.tracksList.querySelectorAll('.album-track-row-input'))
  const tracks = []
  let uploaded = 0
  const filesToUpload = rows.filter((row) => row.querySelector('.album-track-file').files[0]).length

  for (const row of rows) {
    const title = row.querySelector('.album-track-name').value.trim()
    const file = row.querySelector('.album-track-file').files[0]
    if (!title && !file) continue

    let audioURL = row.dataset.existingAudio || ''
    if (file) {
      uploaded += 1
      onProgress(uploaded, filesToUpload)
      audioURL = await uploadMedia(file, () => {})
    }
    tracks.push({ title, audioURL })
  }
  return tracks
}

export function resetAlbumForm() {
  editingId = null
  existingCoverURL = ''
  els.form.reset()
  els.tracksList.innerHTML = ''
  addTrackRow()
  els.submitBtn.textContent = 'Create Album'
  els.progressWrap.classList.add('hidden')
}

export function populateAlbumFormForEdit(album) {
  editingId = album.id
  existingCoverURL = album.coverURL || ''
  els.typeInput.value = album.type || 'album'
  els.titleInput.value = album.title || ''
  const releaseDate = album.releaseDate
    ? (typeof album.releaseDate.toDate === 'function' ? album.releaseDate.toDate() : new Date(album.releaseDate))
    : null
  els.releaseDateInput.value = releaseDate ? releaseDate.toISOString().slice(0, 10) : ''
  els.tracksList.innerHTML = ''
  const tracks = album.tracks && album.tracks.length ? album.tracks : [{ title: '', audioURL: '' }]
  tracks.forEach((t) => addTrackRow(t.title, t.audioURL))
  els.submitBtn.textContent = 'Save Changes'
  els.progressWrap.classList.add('hidden')
}

export function initAlbumForm() {
  els = {
    form: document.getElementById('album-form'),
    typeInput: document.getElementById('album-type'),
    titleInput: document.getElementById('album-title'),
    releaseDateInput: document.getElementById('album-release-date'),
    coverInput: document.getElementById('album-cover'),
    tracksList: document.getElementById('album-tracks-list'),
    addTrackBtn: document.getElementById('album-add-track'),
    submitBtn: document.getElementById('album-submit'),
    progressWrap: document.getElementById('album-progress-wrap'),
    progressBar: document.getElementById('album-progress-bar'),
  }

  els.addTrackBtn.addEventListener('click', () => addTrackRow())

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { user } = getState()

    els.submitBtn.disabled = true
    const originalLabel = editingId ? 'Save Changes' : 'Create Album'
    try {
      let coverURL = existingCoverURL
      const coverFile = els.coverInput.files[0]
      if (coverFile) {
        els.progressWrap.classList.remove('hidden')
        coverURL = await uploadMedia(coverFile, (pct) => {
          els.progressBar.style.width = `${pct}%`
        })
      }

      const tracks = await collectTracks((done, total) => {
        els.progressWrap.classList.remove('hidden')
        els.progressBar.style.width = `${Math.round((done / total) * 100)}%`
        els.submitBtn.textContent = `Uploading track ${done} of ${total}…`
      })

      const releaseDateValue = els.releaseDateInput.value ? new Date(els.releaseDateInput.value) : null

      const data = {
        title: els.titleInput.value,
        type: els.typeInput.value,
        coverURL,
        releaseDate: releaseDateValue,
        tracks,
      }

      if (editingId) {
        await updateDoc(doc(db, 'albums', editingId), data)
        showToast('Album updated!', 'success')
      } else {
        await addDoc(collection(db, 'albums'), {
          ...data,
          uploadedBy: user.uid,
          createdAt: serverTimestamp(),
        })
        showToast('Album created!', 'success')
      }

      resetAlbumForm()
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
      els.submitBtn.textContent = originalLabel
    }
    els.submitBtn.disabled = false
  })

  resetAlbumForm()
}
