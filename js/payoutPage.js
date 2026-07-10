import { onPayoutChange, onPayoutHistoryChange, claimPayout, SONG_RATE, VIDEO_RATE } from './payout.js'
import { showToast } from './toast.js'

function formatMoney(n) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(ts) {
  if (!ts) return '—'
  const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts)
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function initPayoutPage() {
  const totalEl = document.getElementById('payout-total')
  const songCountEl = document.getElementById('payout-song-count')
  const songTotalEl = document.getElementById('payout-song-total')
  const videoCountEl = document.getElementById('payout-video-count')
  const videoTotalEl = document.getElementById('payout-video-total')
  const cashOutBtn = document.getElementById('payout-cashout')
  const historyEl = document.getElementById('payout-history')

  let latest = { songPlays: 0, videoPlays: 0, grandTotal: 0 }

  onPayoutChange((data) => {
    latest = data
    totalEl.textContent = formatMoney(data.grandTotal)
    songCountEl.textContent = `${data.songPlays.toLocaleString()} play${data.songPlays === 1 ? '' : 's'} × $${SONG_RATE}`
    songTotalEl.textContent = formatMoney(data.songTotal)
    videoCountEl.textContent = `${data.videoPlays.toLocaleString()} play${data.videoPlays === 1 ? '' : 's'} × $${VIDEO_RATE}`
    videoTotalEl.textContent = formatMoney(data.videoTotal)
    cashOutBtn.disabled = data.grandTotal <= 0
    cashOutBtn.textContent = data.grandTotal > 0 ? `Cash Out ${formatMoney(data.grandTotal)}` : 'Nothing to cash out yet'
  })

  onPayoutHistoryChange((entries) => {
    historyEl.innerHTML = entries.length
      ? entries.map((e) => `
          <div class="payout-history-row">
            <div>
              <p class="payout-history-amount">${formatMoney(e.amount)}</p>
              <p class="payout-row-sub">${e.songPlays || 0} songs · ${e.videoPlays || 0} videos · ${e.claimedByName || ''}</p>
            </div>
            <span class="payout-row-sub">${formatDate(e.claimedAt)}</span>
          </div>
        `).join('')
      : `<p class="loading-text">No payouts claimed yet.</p>`
  })

  cashOutBtn.addEventListener('click', async () => {
    if (latest.grandTotal <= 0) return
    if (!confirm(`Cash out ${formatMoney(latest.grandTotal)}? This resets the running total back to $0.`)) return
    cashOutBtn.disabled = true
    try {
      await claimPayout(latest)
      showToast(`Cashed out ${formatMoney(latest.grandTotal)}!`, 'success')
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    }
  })
}
