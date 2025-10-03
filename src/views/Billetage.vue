<template>
  <div class="billetage-view">
    <Profile />

    <section class="page-section">
      <header class="page-header">
        <div>
          <h1>Billetage</h1>
          <p class="subtitle">
            Comptez uniquement les billets et pièces présents dans la caisse.
          </p>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn"
            @click="resetForm"
            :disabled="isSubmitting || isLoading"
          >
            Réinitialiser
          </button>
          <button
            type="button"
            class="btn"
            @click="goToSummary"
            :disabled="isSubmitting || isLoading || !sessionId || !hasRecordedBilletage"
          >
            RAZ – Afficher le récapitulatif
          </button>
        </div>
      </header>

      <form
        ref="formRef"
        class="card billetage-card"
        @submit.prevent="submit"
      >
          <h2 class="card-title">Comptage des billets</h2>

          <div class="denominations">
            <div
              v-for="denomination in denominations"
              :key="denomination.value"
              class="denomination-item"
            >
              <label :for="`denom-${denomination.value}`">
                {{ denomination.label }}
              </label>
              <input
                :id="`denom-${denomination.value}`"
                v-model="counts[denomination.value]"
                type="number"
                inputmode="numeric"
                min="0"
                step="1"
                :disabled="isSubmitting || isLoading || sessionClosed"
                @focus="showKeyboard({ type: 'denomination', value: denomination.value })"
              />
              <span class="denomination-total">{{ formatCurrency(denominationTotal(denomination.value)) }}</span>
            </div>
          </div>

          <label class="field" for="coins">
            <span>Pièces / autres montants</span>
            <input
              id="coins"
              v-model="coinsValue"
              type="number"
              inputmode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              :disabled="isSubmitting || isLoading || sessionClosed"
              @focus="showKeyboard({ type: 'coins' })"
            />
          </label>

          <p class="hint">Montant compté : <strong>{{ formatCurrency(actualTotal) }}</strong></p>

          <div class="form-actions">
            <button
              type="submit"
              class="btn primary"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || hasRecordedBilletage"
            >
              <span v-if="isSubmitting" class="loading">Enregistrement…</span>
              <span v-else>Enregistrer le billetage</span>
            </button>
            <button
              type="button"
              class="btn danger"
              @click="closeSession"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || !hasRecordedBilletage"
            >
              Clôturer la session
            </button>
          </div>

          <p v-if="hasRecordedBilletage" class="feedback info">Le billetage a déjà été enregistré pour cette session.</p>
          <p v-if="errorMessage" class="feedback error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="feedback success">{{ successMessage }}</p>
      </form>
    </section>
    <Keyboard
      v-if="keyboardVisible"
      :initial-position="keyboardPosition"
      @key-pressed="handleKeyPress"
      @close="hideKeyboard"
    />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Profile from './Profile.vue'
import Keyboard from '../components/tools/Keyboard.vue'

const denominations = [
  { value: 20000, label: '20 000' },
  { value: 10000, label: '10 000' },
  { value: 5000, label: '5 000' },
  { value: 2000, label: '2 000' },
  { value: 1000, label: '1 000' },
  { value: 500, label: '500' },
  { value: 200, label: '200' },
  { value: 100, label: '100' },
  { value: 50, label: '50' }
]

const router = useRouter()

const counts = reactive(Object.fromEntries(denominations.map(d => [d.value, 0])))
const coinsValue = ref(0)
const keyboardVisible = ref(false)
const activeField = ref(null)
const keyboardPosition = ref({ top: 0, left: 0 })
const formRef = ref(null)

const sessionId = ref(null)
const sessionClosed = ref(false)
const hasRecordedBilletage = ref(false)
const isLoading = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error("Token d'authentification manquant")
  return { Authorization: `Bearer ${token}` }
}

const hasUserInput = computed(() => {
  const anyBills = denominations.some(denomination => Number(counts[denomination.value]) > 0)
  const coins = Number(coinsValue.value) > 0
  return anyBills || coins
})

const actualTotal = computed(() => {
  const billsTotal = denominations.reduce((sum, d) => sum + d.value * (Number(counts[d.value]) || 0), 0)
  const coins = Number(coinsValue.value) || 0
  return Number((billsTotal + coins).toFixed(2))
})

const denominationTotal = (value) => {
  return Number((value * (Number(counts[value]) || 0)).toFixed(2))
}

const formatCurrency = (amount) => {
  const number = Number(amount)
  if (!Number.isFinite(number)) return '0,00 Ar'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(number)
}

const resetForm = () => {
  denominations.forEach(d => { counts[d.value] = 0 })
  coinsValue.value = 0
  errorMessage.value = ''
  successMessage.value = ''
  activeField.value = null
  keyboardVisible.value = false
}

const goToSummary = () => {
  if (!sessionId.value) {
    errorMessage.value = 'Aucune session active pour afficher le récapitulatif.'
    return
  }
  if (!hasRecordedBilletage.value) {
    errorMessage.value = 'Enregistrez le billetage avant de consulter le récapitulatif.'
    return
  }
  router.push({ name: 'billetage-summary', params: { sessionId: sessionId.value } })
}

const fetchActiveSession = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-register-session/my-active-session', {
      headers: authHeaders()
    })
    const session = data?.data || data || null
    if (!session) {
      errorMessage.value = 'Aucune session de caisse active.'
      sessionId.value = null
      sessionClosed.value = false
      hasRecordedBilletage.value = false
      return
    }
    sessionId.value = session.id
    sessionClosed.value = Boolean(session.is_closed)
    hasRecordedBilletage.value = session.actual_cash_amount !== null && session.actual_cash_amount !== undefined
  } catch (error) {
    console.error('Erreur récupération session:', error.response?.data || error.message)
    errorMessage.value = error.response?.data?.message || 'Impossible de récupérer la session de caisse active.'
    sessionId.value = null
    sessionClosed.value = false
    hasRecordedBilletage.value = false
  } finally {
    isLoading.value = false
  }
}

const submit = async () => {
  if (!sessionId.value) {
    errorMessage.value = 'Aucune session active pour enregistrer le billetage.'
    return
  }
  if (sessionClosed.value) {
    errorMessage.value = 'La session est clôturée, impossible de modifier le billetage.'
    return
  }
  if (hasRecordedBilletage.value) {
    errorMessage.value = 'Le billetage a déjà été enregistré pour cette session.'
    return
  }

  if (!hasUserInput.value) {
    window.alert('Aucun montant n\'a été saisi pour le billetage.')
    errorMessage.value = 'Aucun montant saisi pour le billetage.'
    return
  }

  const confirmed = window.confirm('Confirmez-vous l\'enregistrement du billetage ?')
  if (!confirmed) {
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await axios.put(`http://127.0.0.1:8000/api/cash-register-sessions/${sessionId.value}`, {
      actual_cash_amount: actualTotal.value
    }, {
      headers: authHeaders()
    })
    successMessage.value = 'Billetage enregistré avec succès.'
    hasRecordedBilletage.value = true
  } catch (error) {
    console.error('Erreur enregistrement billetage:', error.response?.data || error.message)
    errorMessage.value = error.response?.data?.message || "Impossible d'enregistrer le billetage."
  } finally {
    isSubmitting.value = false
  }
}

const closeSession = async () => {
  if (!sessionId.value) {
    errorMessage.value = 'Aucune session active à clôturer.'
    return
  }
  if (sessionClosed.value) {
    successMessage.value = 'La session est déjà clôturée.'
    return
  }
  if (!hasRecordedBilletage.value) {
    errorMessage.value = 'Enregistrez le billetage avant de clôturer la session.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await axios.put(`http://127.0.0.1:8000/api/cash-register-sessions/${sessionId.value}`, {
      actual_cash_amount: actualTotal.value,
      is_closed: true,
      closed_at: new Date().toISOString()
    }, {
      headers: authHeaders()
    })
    successMessage.value = 'Session clôturée avec succès.'
    sessionClosed.value = true
    await fetchActiveSession()
    router.push({ name: 'cash-printer' })
  } catch (error) {
    console.error('Erreur clôture session:', error.response?.data || error.message)
    errorMessage.value = error.response?.data?.message || "Impossible de clôturer la session."
  } finally {
    isSubmitting.value = false
  }
}

const KEYBOARD_WIDTH = 600
const KEYBOARD_HEIGHT = 400
const KEYBOARD_MARGIN = 16

const updateKeyboardPosition = () => {
  const formEl = formRef.value
  if (!formEl) return

  const rect = formEl.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let left = rect.right + KEYBOARD_MARGIN
  if (left + KEYBOARD_WIDTH > viewportWidth - KEYBOARD_MARGIN) {
    left = viewportWidth - KEYBOARD_WIDTH - KEYBOARD_MARGIN
  }
  left = Math.max(KEYBOARD_MARGIN, left)

  let top = rect.top
  if (top + KEYBOARD_HEIGHT > viewportHeight - KEYBOARD_MARGIN) {
    top = viewportHeight - KEYBOARD_HEIGHT - KEYBOARD_MARGIN
  }
  top = Math.max(KEYBOARD_MARGIN, top)

  keyboardPosition.value = { top, left }
}

const handleViewportChange = () => {
  updateKeyboardPosition()
}

const detachKeyboardListeners = () => {
  window.removeEventListener('resize', handleViewportChange)
  window.removeEventListener('scroll', handleViewportChange, true)
}

const showKeyboard = async (field) => {
  activeField.value = field
  keyboardVisible.value = true
  await nextTick()
  updateKeyboardPosition()
}

const handleKeyPress = (key) => {
  if (!activeField.value) return

  if (activeField.value.type === 'denomination') {
    const denominationValue = activeField.value.value
    const current = counts[denominationValue]
    const baseString = current === 0 || current === '' ? '' : String(current)

    if (key === 'BACKSPACE') {
      const updated = baseString.slice(0, -1)
      counts[denominationValue] = updated === '' ? '' : Number(updated)
      return
    }

    if (!/^[0-9]$/.test(key)) return
    const updated = `${baseString}${key}`
    counts[denominationValue] = Number(updated)
    return
  }

  if (activeField.value.type === 'coins') {
    const current = coinsValue.value
    const baseString = current === 0 || current === '' ? '' : String(current)

    if (key === 'BACKSPACE') {
      const updated = baseString.slice(0, -1)
      coinsValue.value = updated
      return
    }

    if (key === '.') {
      if (baseString.includes('.')) return
      coinsValue.value = baseString === '' ? '0.' : `${baseString}.`
      return
    }

    if (!/^[0-9]$/.test(key)) return
    const updated = `${baseString}${key}`
    coinsValue.value = updated
  }
}

const hideKeyboard = () => {
  keyboardVisible.value = false
  activeField.value = null
}

onMounted(fetchActiveSession)

watch(keyboardVisible, (isVisible) => {
  if (isVisible) {
    nextTick(() => {
      updateKeyboardPosition()
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('scroll', handleViewportChange, true)
    })
  } else {
    detachKeyboardListeners()
  }
})

onBeforeUnmount(() => {
  detachKeyboardListeners()
})
</script>

<style scoped>
.billetage-view {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  padding-top: 5.5rem;
}

@media (max-width: 640px) {
  .billetage-view {
    padding-top: 4.75rem;
  }
}

.page-section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1.5rem 3rem;
  display: grid;
  gap: 1.5rem;
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.page-header h1 {
  font-size: 1.9rem;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.subtitle {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.95rem;
}

.billetage-card {
  max-width: 560px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 15px 40px rgba(15, 23, 42, 0.08);
  padding: 1.5rem;
  display: grid;
  gap: 1.2rem;
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e293b;
}

.denominations {
  display: grid;
  gap: 0.8rem;
}

.denomination-item {
  display: grid;
  grid-template-columns: 120px 1fr 120px;
  align-items: center;
  gap: 0.8rem;
}

.denomination-item label {
  font-weight: 600;
}

.denomination-item input {
  width: 100%;
  padding: 0.45rem 0.6rem;
  border-radius: 0.65rem;
  border: 1px solid #cbd5f5;
  background: #f1f5f9;
}

.denomination-total {
  text-align: right;
  font-weight: 600;
  color: #1e293b;
}

.field {
  display: grid;
  gap: 0.35rem;
}

.field input,
.field textarea {
  padding: 0.55rem 0.7rem;
  border-radius: 0.65rem;
  border: 1px solid #cbd5f5;
  background: #f8fafc;
}

.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.form-hint {
  font-size: 0.85rem;
  color: #64748b;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  border: none;
  padding: 0.6rem 1.1rem;
  border-radius: 0.75rem;
  background: rgba(148, 163, 184, 0.2);
  color: #1e293b;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn:hover {
  background: rgba(148, 163, 184, 0.3);
}

.btn:disabled,
.btn.disabled {
  background: rgba(148, 163, 184, 0.25);
  color: #94a3b8;
  cursor: not-allowed;
  opacity: 0.65;
}

.btn.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.btn.primary:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
}

.btn.primary:disabled,
.btn.primary.disabled {
  background: linear-gradient(135deg, #94a3b8, #cbd5f5);
  color: #e2e8f0;
}

.btn.danger {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
}

.btn.danger:hover {
  background: linear-gradient(135deg, #b91c1c, #7f1d1d);
}

.btn.danger:disabled,
.btn.danger.disabled {
  background: linear-gradient(135deg, #fca5a5, #f87171);
  color: #fee2e2;
}

.feedback {
  font-size: 0.9rem;
}

.feedback.error {
  color: #dc2626;
}

.feedback.success {
  color: #16a34a;
}

.feedback.info {
  color: #0ea5e9;
}

@media (max-width: 640px) {
  .denomination-item {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      'label total'
      'input input';
  }

  .denomination-item label { grid-area: label; }
  .denomination-item input { grid-area: input; }
  .denomination-total { grid-area: total; text-align: right; }
}
</style>
