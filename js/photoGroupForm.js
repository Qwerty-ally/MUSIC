import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js'
import { db } from './firebase.js'
import { uploadMedia } from './cloudinary.js'
import { getState } from './auth.js'
import { showToast } from './toast.js'

let els = null
let targetCollection = 'magazines'
let targetLabel = 'Magazine'

export function setPhotoGroupTarget(collectionName, label) {
  targetCollection = collectionName
  targetLabel = label
  if (els) els.submitBtn.textContent = `Upload ${label}`
}

export function resetPhotoGroupForm() {
  if (!els) return
  els.form.reset()
  els.progressWrap.classList.add('hidden')
  els.submitBtn.textContent = `Upload ${targetLabel}`
}

export function initPhotoGroupForm() {
  els = {
    form: document.getElementById('photo-group-form'),
    titleInput: document.getElementById('photo-group-title'),
    coverInput: document.getElementById('photo-group-cover'),
    filesInput: document.getElementById('photo-group-files'),
    submitBtn: document.getElementById('photo-group-submit'),
    progressWrap: document.getElementById('photo-group-progress-wrap'),
    progressBar: document.getElementById('photo-group-progress-bar'),
  }

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const { user } = getState()
    const files = Array.from(els.filesInput.files)
    if (!files.length) {
      showToast('Please choose at least one photo.', 'error')
      return
    }

    els.submitBtn.disabled = true
    els.progressWrap.classList.remove('hidden')
    els.progressBar.style.width = '0%'

    try {
      const images = []
      for (let i = 0; i < files.length; i++) {
        els.submitBtn.textContent = `Uploading photo ${i + 1} of ${files.length}…`
        const url = await uploadMedia(files[i], (pct) => {
          const overall = ((i + pct / 100) / files.length) * 100
          els.progressBar.style.width = `${overall}%`
        })
        images.push(url)
      }

      let coverURL = images[0]
      const coverFile = els.coverInput.files[0]
      if (coverFile) {
        coverURL = await uploadMedia(coverFile, () => {})
      }

      await addDoc(collection(db, targetCollection), {
        title: els.titleInput.value,
        coverURL,
        images,
        uploadedBy: user.uid,
        createdAt: serverTimestamp(),
      })

      showToast(`${targetLabel} uploaded!`, 'success')
      resetPhotoGroupForm()
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
      resetPhotoGroupForm()
    }

    els.submitBtn.disabled = false
  })

  resetPhotoGroupForm()
}
