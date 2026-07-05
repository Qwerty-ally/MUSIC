let queue = []
let index = 0
let audio = null
let els = null

function formatTime(t) {
  if (!Number.isFinite(t)) return '0:00'
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function currentTrack() {
  return queue[index] || null
}

function render() {
  const track = currentTrack()
  if (!track) {
    els.bar.classList.add('hidden')
    return
  }
  els.bar.classList.remove('hidden')
  els.cover.src = track.coverURL || `https://api.dicebear.com/9.x/shapes/svg?seed=${encodeURIComponent(track.title)}`
  els.title.textContent = track.title
  els.artist.textContent = track.artist || ''
  els.playIcon.classList.toggle('hidden', audio.paused === false)
  els.pauseIcon.classList.toggle('hidden', audio.paused === true)
}

function loadTrack() {
  const track = currentTrack()
  if (!track) return
  audio.src = track.audioURL
  audio.play().catch(() => {})
  render()
}

export function initPlayer() {
  audio = document.getElementById('audio-el')
  els = {
    bar: document.getElementById('player-bar'),
    cover: document.getElementById('player-cover'),
    title: document.getElementById('player-title'),
    artist: document.getElementById('player-artist'),
    playBtn: document.getElementById('player-playpause'),
    playIcon: document.getElementById('player-play-icon'),
    pauseIcon: document.getElementById('player-pause-icon'),
    prevBtn: document.getElementById('player-prev'),
    nextBtn: document.getElementById('player-next'),
    progress: document.getElementById('player-progress'),
    currentTime: document.getElementById('player-current-time'),
    duration: document.getElementById('player-duration'),
    volume: document.getElementById('player-volume'),
  }

  audio.volume = Number(els.volume.value)

  els.playBtn.addEventListener('click', togglePlay)
  els.prevBtn.addEventListener('click', prev)
  els.nextBtn.addEventListener('click', next)
  els.volume.addEventListener('input', (e) => { audio.volume = Number(e.target.value) })
  els.progress.addEventListener('input', (e) => { audio.currentTime = Number(e.target.value) })

  audio.addEventListener('play', render)
  audio.addEventListener('pause', render)
  audio.addEventListener('ended', next)
  audio.addEventListener('timeupdate', () => {
    els.progress.value = audio.currentTime
    els.currentTime.textContent = formatTime(audio.currentTime)
  })
  audio.addEventListener('loadedmetadata', () => {
    els.progress.max = audio.duration || 0
    els.duration.textContent = formatTime(audio.duration)
  })

  render()
}

export function playSong(song, list) {
  queue = list && list.length ? list : [song]
  index = queue.findIndex((s) => s.id === song.id)
  if (index < 0) index = 0
  loadTrack()
}

export function togglePlay() {
  if (!currentTrack()) return
  if (audio.paused) audio.play()
  else audio.pause()
}

export function next() {
  if (!queue.length) return
  index = (index + 1) % queue.length
  loadTrack()
}

export function prev() {
  if (!queue.length) return
  index = (index - 1 + queue.length) % queue.length
  loadTrack()
}
