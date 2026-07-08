import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { uploadMedia } from './cloudinary.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'
import { initAlbumForm, resetAlbumForm, populateAlbumFormForEdit } from './albumForm.js'
import { onAlbumEditRequested } from './albumModal.js'

const TABS = {
  song: { label: 'Song', collection: 'songs', accept: 'audio/*', fileField: 'audioURL', fileLabel: 'Audio file', useArtist: true },
  musicVideo: { label: 'Music Video', collection: 'musicVideos', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useArtist: true },
  livePerformance: { label: 'Live Performance', collection: 'livePerformances', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useArtist: true },
  interview: { label: 'Interview', collection: 'interviews', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
  behindTheScenes: { label: 'Behind the Scenes', collection: 'behindTheScenes', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
  photo: { label: 'Photo', collection: 'photos', accept: 'image/*', fileField: 'imageURL', fileLabel: 'Photo', useDesc: true, descLabel: 'Caption (optional)', descFieldName: 'caption', noCover: true },
  other: { label: 'Other Video', collection: 'otherVideos', accept: 'video/*', fileField: 'videoURL', fileLabel: 'Video file', useDesc: true },
}

let currentTab = 'song'
let els = null

function updateFormForTab() {
  const isAlbum = currentTab === 'album'

  document.querySelectorAll('.upload-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab)
  })

  els.genericForm.classList.toggle('hidden', isAlbum)
  els.albumForm.classList.toggle('hidden', !isAlbum)
  if (isAlbum) {
    resetAlbumForm()
    return
  }

  const tab = TABS[currentTab]
  els.artistField.classList.toggle('hidden', !tab.useArtist)
  els.descField.classList.toggle('hidden', !tab.useDesc)
  els.descField.querySelector('label').textContent = tab.descLabel || 'Description (optional)'
  els.coverField.classList.toggle('hidden', !!tab.noCover)
  els.fileLabel.textContent = tab.fileLabel
  els.fileInput.accept = tab.accept
  els.coverLabel.textContent = currentTab === 'song' ? 'Cover image (optional)' : 'Thumbnail (optional)'
  els.submitBtn.textContent = `Upload ${tab.label}`
  els.form.reset()
  els.progressWrap.classList.add('hidden')
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
    form: document.getElementById('upload-form'),
    titleInput: document.getElementById('upload-title'),
    artistField: document.getElementById('upload-artist-field'),
    artistInput: document.getElementById('upload-artist'),
    descField: document.getElementById('upload-desc-field'),
    descInput: document.getElementById('upload-desc'),
    coverField: document.getElementById('upload-cover-field'),
    fileLabel: document.getElementById('upload-file-label'),
    fileInput: document.getElementById('upload-file'),
    coverLabel: document.getElementById('upload-cover-label'),
    coverInput: document.getElementById('upload-cover'),
    submitBtn: document.getElementById('upload-submit'),
    progressWrap: document.getElementById('upload-progress-wrap'),
    progressBar: document.getElementById('upload-progress-bar'),
  }

  initAlbumForm()

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
    if (!file) {
      showToast('Please choose a file to upload.', 'error')
      return
    }

    els.submitBtn.disabled = true
    els.progressWrap.classList.remove('hidden')
    els.progressBar.style.width = '0%'

    try {
      const fileURL = await uploadMedia(file, (pct) => {
        els.progressBar.style.width = `${pct}%`
        els.submitBtn.textContent = `Uploading… ${pct}%`
      })

      let coverURL = ''
      const coverFile = els.coverInput.files[0]
      if (coverFile && !tab.noCover) {
        coverURL = await uploadMedia(coverFile, () => {})
      }

      const data = {
        title: els.titleInput.value,
        [tab.fileField]: fileURL,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      }
      if (tab.useArtist) data.artist = els.artistInput.value
      if (tab.useDesc) data[tab.descFieldName || 'description'] = els.descInput.value
      if (currentTab === 'song') data.coverURL = coverURL
      else if (!tab.noCover) data.thumbnailURL = coverURL

      await addDoc(collection(db, tab.collection), data)
      showToast(`${tab.label} uploaded!`, 'success')
      updateFormForTab()
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    }

    els.submitBtn.disabled = false
    updateFormForTab()
  })

  updateFormForTab()
}
