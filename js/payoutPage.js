import { onPayoutChange, SONG_RATE, VIDEO_RATE } from './payout.js'

function formatMoney(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function initPayoutPage() {
  const totalEl = document.getElementById('payout-total')
  const songCountEl = document.getElementById('payout-song-count')
  const songTotalEl = document.getElementById('payout-song-total')
  const videoCountEl = document.getElementById('payout-video-count')
  const videoTotalEl = document.getElementById('payout-video-total')

  onPayoutChange(({ songPlays, videoPlays, songTotal, videoTotal, grandTotal }) => {
    totalEl.textContent = formatMoney(grandTotal)
    songCountEl.textContent = `${songPlays.toLocaleString()} play${songPlays === 1 ? '' : 's'} × $${SONG_RATE}`
    songTotalEl.textContent = formatMoney(songTotal)
    videoCountEl.textContent = `${videoPlays.toLocaleString()} play${videoPlays === 1 ? '' : 's'} × $${VIDEO_RATE}`
    videoTotalEl.textContent = formatMoney(videoTotal)
  })
}
