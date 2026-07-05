const CLOUD_NAME = 'dtt5ie1ax'
const UPLOAD_PRESET = 'hiiiiiiiii'

// Uploads a file straight from the browser to Cloudinary (unsigned upload
// preset, no backend needed) and reports progress via XHR so the upload
// page can show a progress bar.
export function uploadMedia(file, onProgress) {
  return new Promise((resolve, reject) => {
    const isVideo = file.type.startsWith('video/')
    const isAudio = file.type.startsWith('audio/')
    // Cloudinary files audio under its "video" resource type.
    const endpoint = isVideo || isAudio ? 'video' : 'image'

    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', UPLOAD_PRESET)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}/upload`)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    })

    xhr.onload = () => {
      let data
      try { data = JSON.parse(xhr.responseText) } catch { data = {} }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data.secure_url)
      } else {
        reject(new Error(data.error?.message || 'Upload failed'))
      }
    }
    xhr.onerror = () => reject(new Error('Upload failed'))

    xhr.send(form)
  })
}
