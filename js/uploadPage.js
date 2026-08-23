import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { uploadMedia } from './cloudinary.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'
import { initAlbumForm, resetAlbumForm, populateAlbumFormForEdit } from './albumForm.js'
import { onAlbumEditRequested } from './albumModal.js'
import { initPhotoGroupForm, setPhotoGroupTarget } from './photoGroupForm.js'

const TABS = {
  song: { label: 'Song', collection: 'songs', accept: 'audio/*', fileField: 'audioURL', fileLabel: 'Audio file', useArtist: true, useReleaseDate: true },
  musicVideo: { label: 'Music Video', collection: 'musicVideos', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useArtist: true },
  livePerformance: { label: 'Live Performance', collection: 'livePerformances', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useArtist: true },
  interview: { label: 'Interview', collection: 'interviews', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
  behindTheScenes: { label: 'Behind the Scenes', collection: 'behindTheScenes', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
  other: { label: 'Other Video', collection: 'otherVideos', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
}

const PHOTO_GROUP_TABS = {
  magazine: { label: 'Magazine', collection: 'magazines' },
  photoShoot: { label: 'Photo Shoot', collection: 'photoShoots' },
}

let currentTab = 'song'
let els = null
let editingId = null
let editingCollection = null
let existingFileURL = ''
let existingCoverURL = ''

function updateFormForTab() {
  const isAlbum = currentTab === 'album'
  const isPhotoGroup = !!PHOTO_GROUP_TABS[currentTab]

  document.querySelectorAll('.upload-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab)
  })

  els.genericForm.classList.toggle('hidden', isAlbum || isPhotoGroup)
  els.albumForm.classList.toggle('hidden', !isAlbum)
  els.photoGroupForm.classList.toggle('hidden', !isPhotoGroup)

  if (isAlbum) {
    resetAlbumForm()
    return
  }
  if (isPhotoGroup) {
    const { collection: col, label } = PHOTO_GROUP_TABS[currentTab]
    setPhotoGroupTarget(col, label)
    return
  }

  editingId = null
  editingCollection = null
  existingFileURL = ''
  existingCoverURL = ''

  const tab = TABS[currentTab]
  els.artistField.classList.toggle('hidden', !tab.useArtist)
  // A required field that's hidden blocks native form submission entirely
  // (silently — no error reaches our submit handler), so required must
  // track visibility here.
  els.artistInput.required = !!tab.useArtist
  els.descField.classList.toggle('hidden', !tab.useDesc)
  els.descField.querySelector('label').textContent = tab.descLabel || 'Description (optional)'
  els.coverField.classList.toggle('hidden', !!tab.noCover)
  els.releaseDateField.classList.toggle('hidden', !tab.useReleaseDate)
  els.fileLabel.textContent = tab.fileLabel
  els.fileInput.accept = tab.accept
  els.fileHint.classList.toggle('hidden', !tab.useReleaseDate)
  els.fileStatus.classList.add('hidden')
  els.coverLabel.textContent = currentTab === 'song' ? 'Cover image (optional)' : 'Thumbnail (optional)'
  els.submitBtn.textContent = `Upload ${tab.label}`
  els.form.reset()
  els.progressWrap.classList.add('hidden')
}

// Wired up by musicPage.js so this module doesn't need to import it
// directly (avoids a circular import, same as onAlbumEditRequested).
export function populateSongFormForEdit(song) {
  location.hash = '/upload'
  selectUploadTab('song')

  editingId = song.id
  editingCollection = 'songs'
  existingFileURL = song.audioURL || ''
  existingCoverURL = song.coverURL || ''

  els.titleInput.value = song.title || ''
  els.artistInput.value = song.artist || ''
  const releaseDate = song.releaseDate
    ? (typeof song.releaseDate.toDate === 'function' ? song.releaseDate.toDate() : new Date(song.releaseDate))
    : null
  els.releaseDateInput.value = releaseDate ? releaseDate.toISOString().slice(0, 10) : ''

  els.fileStatus.textContent = existingFileURL ? '✅ Audio attached' : 'No audio yet — add it below'
  els.fileStatus.classList.remove('hidden')
  els.submitBtn.textContent = 'Save Changes'
}

export function selectUploadTab(tabKey) {
  currentTab = tabKey
  updateFormForTab()
}

export function initUploadPage() {
  els = {
    tabs: document.querySelectorAll('.upload-tab'),
    genericForm: document.getElementById('upload-form'),
    albumForm: document.getElementById('album-form'),
    photoGroupForm: document.getElementById('photo-group-form'),
    form: document.getElementById('upload-form'),
    titleInput: document.getElementById('upload-title'),
    artistField: document.getElementById('upload-artist-field'),
    artistInput: document.getElementById('upload-artist'),
    descField: document.getElementById('upload-desc-field'),
    descInput: document.getElementById('upload-desc'),
    coverField: document.getElementById('upload-cover-field'),
    fileLabel: document.getElementById('upload-file-label'),
    fileInput: document.getElementById('upload-file'),
    fileHint: document.getElementById('upload-file-hint'),
    fileStatus: document.getElementById('upload-file-status'),
    coverLabel: document.getElementById('upload-cover-label'),
    coverInput: document.getElementById('upload-cover'),
    releaseDateField: document.getElementById('upload-release-date-field'),
    releaseDateInput: document.getElementById('upload-release-date'),
    submitBtn: document.getElementById('upload-submit'),
    progressWrap: document.getElementById('upload-progress-wrap'),
    progressBar: document.getElementById('upload-progress-bar'),
  }

  initAlbumForm()
  initPhotoGroupForm()

  els.tabs.forEach((btn) => {
    btn.addEventListener('click', () => selectUploadTab(btn.dataset.tab))
  })

  onAlbumEditRequested((album) => {
    location.hash = '/upload'
    selectUploadTab('album')
    populateAlbumFormForEdit(album)
  })

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { user } = getState()
    const tab = TABS[currentTab]
    const file = els.fileInput.files[0]
    const releaseDateValue = tab.useReleaseDate && els.releaseDateInput.value ? new Date(els.releaseDateInput.value) : null
    const isFutureRelease = !!releaseDateValue && releaseDateValue.getTime() > Date.now()

    if (!file && !existingFileURL && !isFutureRelease) {
      showToast('Please choose a file to upload.', 'error')
      return
    }

    els.submitBtn.disabled = true
    els.progressWrap.classList.remove('hidden')
    els.progressBar.style.width = '0%'

    try {
      let fileURL = existingFileURL
      if (file) {
        fileURL = await uploadMedia(file, (pct) => {
          els.progressBar.style.width = `${pct}%`
          els.submitBtn.textContent = `Uploading… ${pct}%`
        })
      }

      let coverURL = existingCoverURL
      const coverFile = els.coverInput.files[0]
      if (coverFile && !tab.noCover) {
        coverURL = await uploadMedia(coverFile, () => {})
      }

      const data = {
        title: els.titleInput.value,
        [tab.fileField]: fileURL,
      }
      if (tab.useArtist) data.artist = els.artistInput.value
      if (tab.useDesc) data[tab.descFieldName || 'description'] = els.descInput.value
      if (tab.useReleaseDate) data.releaseDate = releaseDateValue
      if (currentTab === 'song') data.coverURL = coverURL
      else if (!tab.noCover) data.thumbnailURL = coverURL

      if (editingId) {
        await updateDoc(doc(db, editingCollection, editingId), data)
        showToast(`${tab.label} updated!`, 'success')
      } else {
        await addDoc(collection(db, tab.collection), { ...data, uploadedBy: user.uid, createdAt: serverTimestamp() })
        showToast(`${tab.label} uploaded!`, 'success')
      }
      updateFormForTab()
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
      els.submitBtn.textContent = editingId ? 'Save Changes' : `Upload ${tab.label}`
    }

    els.submitBtn.disabled = false
  })

  updateFormForTab()
}
