import { signUp, signIn } from './auth.js'
import { showToast } from './toast.js'

let mode = 'login'
let role = 'normal'
let els = null

function updateAuthUI() {
  document.querySelectorAll('.auth-mode-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode)
  })
  els.roleSection.classList.toggle('hidden', mode !== 'signup')
  els.displayNameField.classList.toggle('hidden', mode !== 'signup')
  els.ownerCodeField.classList.toggle('hidden', !(mode === 'signup' && role === 'owner'))
  document.querySelectorAll('.role-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.role === role)
  })
  els.submitBtn.textContent = mode === 'login' ? 'Sign In' : role === 'owner' ? 'Create Owner Account' : 'Sign Up'
}

export function initAuthPage() {
  els = {
    modeTabs: document.querySelectorAll('.auth-mode-tab'),
    roleCards: document.querySelectorAll('.role-card'),
    roleSection: document.getElementById('auth-role-section'),
    displayNameField: document.getElementById('auth-displayname-field'),
    ownerCodeField: document.getElementById('auth-ownercode-field'),
    form: document.getElementById('auth-form'),
    displayNameInput: document.getElementById('auth-displayname'),
    emailInput: document.getElementById('auth-email'),
    passwordInput: document.getElementById('auth-password'),
    ownerCodeInput: document.getElementById('auth-ownercode'),
    submitBtn: document.getElementById('auth-submit'),
    togglePassBtn: document.getElementById('auth-toggle-password'),
  }

  els.modeTabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode
      role = 'normal'
      updateAuthUI()
    })
  })

  els.roleCards.forEach((card) => {
    card.addEventListener('click', () => {
      role = card.dataset.role
      updateAuthUI()
    })
  })

  els.togglePassBtn.addEventListener('click', () => {
    const isPassword = els.passwordInput.type === 'password'
    els.passwordInput.type = isPassword ? 'text' : 'password'
  })

  els.form.addEventListener('submit', async (e) => {
    e.preventDefault()
    els.submitBtn.disabled = true
    try {
      if (mode === 'signup') {
        await signUp({
          email: els.emailInput.value,
          password: els.passwordInput.value,
          displayName: els.displayNameInput.value,
          role,
          ownerCode: els.ownerCodeInput.value,
        })
        showToast(role === 'owner' ? 'Welcome, Owner!' : 'Welcome to ANCHOR!', 'success')
      } else {
        await signIn({ email: els.emailInput.value, password: els.passwordInput.value })
        showToast('Signed in!', 'success')
      }
    } catch (err) {
      showToast(err.message.replace('Firebase: ', ''), 'error')
    }
    els.submitBtn.disabled = false
  })

  updateAuthUI()
}
