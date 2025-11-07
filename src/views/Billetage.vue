<template>
  <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm py-10">
    <div class="relative mx-4 w-full max-w-4xl">
      <div class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">Billetage</p>
            <h1 class="mt-2 text-2xl font-semibold text-slate-900">Comptage des espèces</h1>
            <p class="mt-1 text-sm text-slate-500">
              Comptez uniquement les billets et pièces présents dans la caisse avant de clôturer la session.
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="resetForm"
              :disabled="isSubmitting || isLoading"
            >
              <i class="fas fa-rotate-left text-xs"></i>
              Réinitialiser
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              @click="goToSummary"
              :disabled="isSubmitting || isLoading || !sessionId || !hasRecordedBilletage"
            >
              <i class="fas fa-receipt text-xs"></i>
              RAZ — Afficher le récapitulatif
            </button>
            <button
              type="button"
              class="inline-flex size-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
              @click="closeModal"
              aria-label="Fermer"
            >
              <i class="fas fa-xmark"></i>
            </button>
          </div>
        </header>

        <form ref="formRef" class="space-y-6 px-6 py-6" @submit.prevent="submit">
          <section class="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-semibold text-slate-900">Comptage des billets</h2>
              <span
                v-if="sessionClosed"
                class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600"
              >
                Session clôturée
              </span>
              <span
                v-else-if="hasRecordedBilletage"
                class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600"
              >
                Billetage enregistré
              </span>
            </div>

            <div class="space-y-3">
              <div
                v-for="denomination in denominations"
                :key="denomination.value"
                class="grid items-center gap-3 sm:grid-cols-[120px_minmax(0,1fr)_130px]"
              >
                <label :for="`denom-${denomination.value}`" class="text-sm font-semibold text-slate-700">
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
                  class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <span class="text-right text-sm font-semibold text-slate-600">
                  {{ formatCurrency(denominationTotal(denomination.value)) }}
                </span>
              </div>
            </div>

            <p class="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              Montant compté :
              <strong class="font-semibold text-slate-900">{{ formatCurrency(actualTotal) }}</strong>
            </p>
          </section>

          <div class="flex flex-wrap justify-end gap-3">
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || hasRecordedBilletage"
            >
              <i v-if="isSubmitting" class="fas fa-circle-notch animate-spin text-xs"></i>
              <span v-if="isSubmitting">Enregistrement…</span>
              <span v-else>Enregistrer le billetage</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-5 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              @click="closeSession"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || !hasRecordedBilletage"
            >
              Clôturer la session
            </button>
          </div>

          <div class="space-y-2">
            <p
              v-if="hasRecordedBilletage"
              class="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-600"
            >
              Le billetage est enregistré pour cette session.
            </p>
            <p
              v-if="errorMessage"
              class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"
            >
              {{ errorMessage }}
            </p>
            <p
              v-if="successMessage"
              class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600"
            >
              {{ successMessage }}
            </p>
          </div>
        </form>
      </div>
    </div>

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
import Keyboard from '../components/tools/Keyboard.vue'

const denominations = [
  { value: 20000, label: '20 000' },
  { value: 10000, label: '10 000' },
  { value: 5000, label: '5 000' },
  { value: 2000, label: '2 000' },
  { value: 1000, label: '1 000' },
  { value: 500, label: '500' },
  { value: 200, label: '200' },
  { value: 100, label: '100' }
]

const router = useRouter()

const counts = reactive(Object.fromEntries(denominations.map(d => [d.value, 0])))
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

const closeModal = () => {
  router.push({ name: 'cash-printer' })
}

const hasUserInput = computed(() => {
  return denominations.some(denomination => Number(counts[denomination.value]) > 0)
})

const actualTotal = computed(() => {
  const billsTotal = denominations.reduce((sum, d) => sum + d.value * (Number(counts[d.value]) || 0), 0)
  return Number(billsTotal.toFixed(2))
})

const denominationTotal = (value) => {
  return Number((value * (Number(counts[value]) || 0)).toFixed(2))
}

const formatCurrency = (amount) => {
  const number = Number(amount)
  if (!Number.isFinite(number)) return '0 Ar'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(number).replace('MGA', 'Ar').trim()
}

const resetForm = () => {
  denominations.forEach(d => { counts[d.value] = 0 })
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
