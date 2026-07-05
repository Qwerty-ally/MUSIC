import { addDoc, doc, updateDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { uploadMedia } from './cloudinary.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'

let els = null
let editingId = null
let existingCoverURL = ''

function addTrackRow(name = '') {
  const row = document.createElement('div')
  row.className = 'album-track-row-input'
  row.innerHTML = `
    <input type="text" class="album-track-name" placeholder="Track name" value="${name.replace(/"/g, '&quot;')}" />
    <button type="button" class="album-track-remove">&times;</button>
  `
  row.querySelector('.album-track-remove').addEventListener('click', () => row.remove())
  els.tracksList.appendChild(row)
}

function getTrackNames() {
  return Array.from(els.tracksList.querySelectorAll('.album-track-name'))
    .map((input) => input.value.trim())
    .filter(Boolean)
    .map((title) => ({ title }))
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
  const tracks = album.tracks && album.tracks.length ? album.tracks : [{ title: '' }]
  tracks.forEach((t) => addTrackRow(t.title))
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
    try {
      let coverURL = existingCoverURL
      const coverFile = els.coverInput.files[0]
      if (coverFile) {
        els.progressWrap.classList.remove('hidden')
        coverURL = await uploadMedia(coverFile, (pct) => {
          els.progressBar.style.width = `${pct}%`
        })
      }

      const releaseDateValue = els.releaseDateInput.value ? new Date(els.releaseDateInput.value) : null

      const data = {
        title: els.titleInput.value,
        type: els.typeInput.value,
        coverURL,
        releaseDate: releaseDateValue,
        tracks: getTrackNames(),
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
    }
    els.submitBtn.disabled = false
  })

  resetAlbumForm()
}
