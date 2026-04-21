<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100 px-4 py-6 md:px-6">
    <Profile />

    <section class="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
      <header class="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6 shadow-lg">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.35em] text-rose-500">Sécurité caisse</p>
            <h1 class="mt-2 text-3xl font-bold text-slate-900">Clôture de session</h1>
            <p class="mt-2 max-w-3xl text-sm text-slate-500">
              Comptez les espèces présentes dans la caisse. L’écart sera calculé automatiquement.
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
              @click="resetForm"
              :disabled="isSubmitting || isLoading"
            >
              <i class="fas fa-rotate-left text-xs"></i> Réinitialiser
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
              @click="showCashCount = true"
            >
              <i class="fas fa-coins text-xs"></i> Billetage
            </button>
          </div>
        </div>
      </header>

      <!-- Sélecteur de session (admin/manager) -->
      <div v-if="canSelectSession" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label class="block text-sm font-semibold text-slate-700">Session à traiter</label>
        <select v-model="selectedSessionId" @change="onSessionChange" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm">
          <option v-for="sess in openSessions" :key="sess.id" :value="sess.id">
            {{ sess.cash_register?.name }} - ouverte le {{ formatDate(sess.opened_at) }} ({{ sess.user?.name }})
          </option>
        </select>
        <p v-if="openSessions.length === 0" class="mt-2 text-sm text-amber-600">Aucune session ouverte pour ce point de vente.</p>
      </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <!-- Récapitulatif des ventes -->
        <section class="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-md">
          <div class="mb-3 border-b border-slate-100 pb-3">
            <h2 class="text-lg font-semibold text-slate-900">Produits vendus</h2>
            <p class="text-sm text-slate-500">Liste des articles écoulés pendant la session (hors montants).</p>
          </div>
          <div class="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-xs font-semibold uppercase text-slate-400">Total tickets</p>
              <p class="mt-2 text-2xl font-bold text-slate-800">{{ sessionSales.length }}</p>
            </div>
            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p class="text-xs font-semibold uppercase text-slate-400">Articles vendus</p>
              <p class="mt-2 text-2xl font-bold text-slate-800">{{ sessionProductsCount }}</p>
            </div>
            <div class="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
              <p class="text-xs font-semibold uppercase text-indigo-500">Produits distincts</p>
              <p class="mt-2 text-2xl font-bold text-slate-800">{{ totalProductTypes }}</p>
            </div>
          </div>
          <div v-if="categoryGroups.length" class="space-y-3">
            <article v-for="category in categoryGroups" :key="category.label" class="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 class="text-base font-semibold text-slate-900">{{ category.label }}</h3>
                  <p class="mt-1 text-xs text-slate-500">
                    {{ category.productTypes }} produit(s) distinct(s) • {{ category.products }} article(s)
                  </p>
                </div>
              </div>
              <div class="mt-4">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Détail des ventes</p>
                <ul class="space-y-2">
                  <li v-for="item in category.items" :key="item.name" class="flex items-center justify-between rounded-xl border border-white bg-white px-3 py-2 text-sm text-slate-700">
                    <span class="font-medium text-slate-900">{{ item.name }}</span>
                    <span class="text-xs font-semibold text-slate-500">x{{ item.quantity }}</span>
                  </li>
                </ul>
              </div>
            </article>
          </div>
          <div v-else class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
            <i class="fas fa-receipt mb-2 text-2xl text-slate-300"></i>
            <p>Aucune vente enregistrée pour cette session.</p>
          </div>
        </section>

        <!-- Billetage -->
        <form ref="formRef" class="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-md" @submit.prevent="submit">
          <div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold text-slate-900">Comptage des espèces</h2>
                <p class="text-sm text-slate-500">Saisissez le nombre de billets et pièces réellement présents dans la caisse.</p>
              </div>
              <span v-if="sessionClosed" class="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">Session clôturée</span>
              <span v-else-if="hasRecordedBilletage" class="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">Billetage validé</span>
            </div>

            <div v-if="!sessionId" class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <i class="fas fa-info-circle mr-2"></i> Aucune session active. Veuillez ouvrir une session depuis la page d’accueil.
            </div>

            <div v-if="showCashCount && sessionId && !sessionClosed" class="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div v-for="denomination in denominations" :key="denomination.value" class="grid items-center gap-3 sm:grid-cols-[120px_minmax(0,1fr)_110px]">
                <label :for="`denom-${denomination.value}`" class="text-sm font-semibold text-slate-700">{{ denomination.label }} Ar</label>
                <input
                  :id="`denom-${denomination.value}`"
                  v-model="counts[denomination.value]"
                  type="number"
                  inputmode="numeric"
                  min="0"
                  step="1"
                  :disabled="isSubmitting || isLoading || sessionClosed || hasRecordedBilletage"
                  @focus="showKeyboard({ type: 'denomination', value: denomination.value })"
                  class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                />
                <span class="text-right text-sm font-semibold text-slate-600">{{ formatCurrency(denominationTotal(denomination.value)) }}</span>
              </div>
            </div>
            <div v-else-if="!showCashCount" class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              <i class="fas fa-calculator mb-2 text-2xl text-slate-300"></i>
              <p>Cliquez sur <strong>« Billetage »</strong> pour commencer le comptage.</p>
            </div>

            <!-- Résultat du contrôle -->
            <div v-if="hasRecordedBilletage" class="space-y-3 rounded-2xl border px-4 py-4" :class="canViewSensitiveInfo ? varianceCardClass : 'border-emerald-200 bg-emerald-50'">
              <div class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-semibold">Résultat du contrôle</h3>
                <span v-if="canViewSensitiveInfo" class="rounded-full px-3 py-1 text-xs font-semibold" :class="varianceBadgeClass">{{ varianceStatusLabel }}</span>
                <span v-else class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Billetage enregistré</span>
              </div>
              <div class="grid gap-2 text-sm">
                <p class="flex items-center justify-between"><span>Montant compté</span><strong>{{ formatCurrency(actualTotal) }}</strong></p>
                <p class="flex items-center justify-between"><span>Fond de caisse</span><strong>{{ formatCurrency(startingAmount) }}</strong></p>
                <template v-if="canViewSensitiveInfo">
                  <p class="flex items-center justify-between"><span>Ventes espèces</span><strong>{{ formatCurrency(cashSalesAmount) }}</strong></p>
                  <p class="flex items-center justify-between"><span>Montant attendu</span><strong>{{ formatCurrency(expectedCashAmount) }}</strong></p>
                  <p class="flex items-center justify-between"><span>Écart</span><strong :class="varianceAmount === 0 ? 'text-emerald-600' : (varianceAmount > 0 ? 'text-amber-600' : 'text-rose-600')">{{ formatCurrency(varianceAmount) }}</strong></p>
                </template>
                <p v-else class="flex items-center justify-between text-slate-500 text-xs"><span>Contrôle effectué</span><span>✅</span></p>
              </div>
              <p class="text-xs text-slate-500 italic">
                <span v-if="canViewSensitiveInfo">Détail complet réservé à l’administration.</span>
                <span v-else>Le responsable vérifiera la conformité en interne.</span>
              </p>
            </div>

            <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{{ errorMessage }}</p>
            <p v-if="successMessage" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-600">{{ successMessage }}</p>
          </div>

          <div class="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="submit"
              class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-60"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || hasRecordedBilletage || !showCashCount"
            >
              <i v-if="isSubmitting" class="fas fa-circle-notch animate-spin"></i>
              {{ isSubmitting ? 'Enregistrement...' : 'Valider le billetage' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-xl bg-rose-100 px-5 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-200 disabled:opacity-60"
              @click="closeSession"
              :disabled="isSubmitting || isLoading || !sessionId || sessionClosed || !hasRecordedBilletage"
            >
              Clôturer la session
            </button>
          </div>
        </form>
      </div>
    </section>

    <Keyboard v-if="keyboardVisible" :initial-position="keyboardPosition" @key-pressed="handleKeyPress" @close="hideKeyboard" />
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Keyboard from '../components/tools/Keyboard.vue'
import { API_BASE_URL } from '@/utils/api'
import Profile from './Profile.vue'
import { useAuth } from '@/composables/useAuth'

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
const { isAdmin, currentUser, loadUserData } = useAuth()

// Droit de sélectionner une session (admin ou manager)
const canSelectSession = computed(() => {
  const userRoles = currentUser.value?.roles?.map(r => r.name) || []
  return isAdmin.value || userRoles.includes('gerant')
})

// Droit de voir les infos sensibles (idem)
const canViewSensitiveInfo = computed(() => {
  const userRoles = currentUser.value?.roles?.map(r => r.name) || []
  return isAdmin.value || userRoles.includes('gerant')
})

// ========== ÉTATS ==========
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
const showCashCount = ref(false)
const sessionSales = ref([])
const sessionData = ref(null)
const cashTransactions = ref([])

// Sessions ouvertes (pour le sélecteur)
const openSessions = ref([])
const selectedSessionId = ref(null)

// ========== COMPUTED ==========
const actualTotal = computed(() => {
  const total = denominations.reduce((sum, d) => sum + d.value * (Number(counts[d.value]) || 0), 0)
  return Number(total.toFixed(2))
})

const startingAmount = computed(() => Number(sessionData.value?.starting_amount ?? 0))

const cashSalesAmount = computed(() => {
  return cashTransactions.value.filter(t => t.type === 'sale').reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
})

const expectedCashAmount = computed(() => startingAmount.value + cashSalesAmount.value)
const varianceAmount = computed(() => actualTotal.value - expectedCashAmount.value)

const varianceStatus = computed(() => {
  if (Math.abs(varianceAmount.value) < 0.01) return 'conforme'
  return varianceAmount.value > 0 ? 'positif' : 'negatif'
})

const varianceStatusLabel = computed(() => {
  if (varianceStatus.value === 'conforme') return 'Caisse conforme'
  if (varianceStatus.value === 'positif') return 'Excédent (alerte)'
  return 'Manquant (alerte)'
})

const varianceCardClass = computed(() => {
  if (varianceStatus.value === 'conforme') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
})

const varianceBadgeClass = computed(() => {
  if (varianceStatus.value === 'conforme') return 'bg-emerald-100 text-emerald-700'
  return 'bg-amber-100 text-amber-700'
})

// ========== PRODUITS VENDUS ==========
const resolveCategoryLabel = (line) => {
  return line?.product?.category?.name ?? line?.category?.name ?? line?.category_name ?? 'Sans catégorie'
}

const getSaleLines = (sale) => {
  const rawLines = sale?.order_lines ?? []
  return rawLines.map((line, idx) => ({
    key: line?.id ?? `${sale.id}-${idx}`,
    name: line?.product?.name ?? line?.name ?? 'Produit supprimé',
    quantity: Number(line?.quantity ?? 0),
    categoryLabel: resolveCategoryLabel(line)
  }))
}

const categoryGroups = computed(() => {
  const groups = new Map()
  for (const sale of sessionSales.value) {
    for (const line of getSaleLines(sale)) {
      const label = line.categoryLabel
      if (!groups.has(label)) {
        groups.set(label, { label, products: 0, productTypes: 0, itemsMap: new Map() })
      }
      const group = groups.get(label)
      group.products += line.quantity
      if (!group.itemsMap.has(line.name)) {
        group.itemsMap.set(line.name, { name: line.name, quantity: 0 })
        group.productTypes++
      }
      group.itemsMap.get(line.name).quantity += line.quantity
    }
  }
  return Array.from(groups.values()).map(g => ({
    label: g.label,
    products: g.products,
    productTypes: g.productTypes,
    items: Array.from(g.itemsMap.values()).sort((a, b) => b.quantity - a.quantity)
  })).sort((a, b) => b.products - a.products)
})

const sessionProductsCount = computed(() => {
  return sessionSales.value.reduce((sum, sale) => sum + getSaleLines(sale).reduce((s, l) => s + l.quantity, 0), 0)
})

const totalProductTypes = computed(() => categoryGroups.value.reduce((s, c) => s + c.productTypes, 0))

// ========== FONCTIONS AUTH ==========
const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error("Token manquant")
  return { Authorization: `Bearer ${token}` }
}

const formatCurrency = (amount) => {
  const number = Number(amount)
  if (!Number.isFinite(number)) return '0 Ar'
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(number) + ' Ar'
}

const denominationTotal = (value) => value * (Number(counts[value]) || 0)
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleString('fr-FR') : ''

const resetForm = () => {
  for (const d of denominations) counts[d.value] = 0
  errorMessage.value = ''
  successMessage.value = ''
}

// ========== RÉCUPÉRATION DES TRANSACTIONS ESPÈCES ==========
const fetchCashTransactions = async (sessionId) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/cash-transactions/session/${sessionId}`, { headers: authHeaders() })
    cashTransactions.value = [...(data.in || []), ...(data.out || [])]
  } catch (error) {
    console.error('Erreur chargement transactions :', error)
    cashTransactions.value = []
  }
}

// ========== RÉCUPÉRATION DES VENTES ==========
const extractSalesArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getSaleSessionId = (sale) => sale.cash_register_session_id ?? sale.cashRegisterSessionId ?? sale.session_id ?? sale.sessionId ?? null

const fetchSessionSales = async (activeSessionId) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/sales`, {
      params: { cash_register_session_id: activeSessionId },
      headers: authHeaders()
    })
    let sales = extractSalesArray(data).filter(s => s && typeof s === 'object')
    sales = sales.filter(s => String(getSaleSessionId(s) ?? '') === String(activeSessionId))

    const enriched = await Promise.all(sales.map(async (sale) => {
      if (sale.order_lines && sale.order_lines.length) return sale
      try {
        const { data: detail } = await axios.get(`${API_BASE_URL}/sales/${sale.id}`, { headers: authHeaders() })
        return { ...sale, order_lines: detail?.data?.order_lines ?? detail?.order_lines ?? [] }
      } catch { return { ...sale, order_lines: [] } }
    }))
    sessionSales.value = enriched
  } catch (error) {
    console.error('Erreur chargement des ventes :', error)
    sessionSales.value = []
  }
}

// ========== CHARGEMENT DES SESSIONS OUVERTES (point de vente) ==========
const fetchOpenSessions = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/cash-register-sessions/open`, { headers: authHeaders() })
    openSessions.value = Array.isArray(data) ? data : data?.data || []
    if (openSessions.value.length) {
      // Sélectionner la première session par défaut
      selectedSessionId.value = openSessions.value[0].id
      await fetchSessionData(selectedSessionId.value)
    } else {
      errorMessage.value = 'Aucune session ouverte pour ce point de vente.'
    }
  } catch (error) {
    console.error('Erreur chargement sessions ouvertes :', error)
    errorMessage.value = 'Impossible de charger les sessions ouvertes.'
  }
}

// ========== CHARGEMENT D'UNE SESSION SPÉCIFIQUE ==========
const fetchSessionData = async (id) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    console.log(`🔍 Tentative de chargement de la session ${id}`)
    const { data } = await axios.get(`${API_BASE_URL}/cash-register-sessions/${id}`, { headers: authHeaders() })
    console.log('📦 Réponse brute de /cash-register-sessions/' + id, data)

    // Extraction flexible selon la structure de la réponse
    let session = null
    if (data?.data && typeof data.data === 'object') {
      session = data.data
    } else if (data && typeof data === 'object') {
      session = data
    }

    if (!session || !session.id) {
      console.error('❌ Session non trouvée ou mal formatée', data)
      throw new Error('Session introuvable ou format de réponse invalide')
    }

    console.log('✅ Session chargée :', session)
    sessionData.value = session
    sessionId.value = session.id
    sessionClosed.value = Boolean(session.is_closed)
    hasRecordedBilletage.value = session.actual_cash_amount !== null && session.actual_cash_amount !== undefined

    await Promise.all([fetchSessionSales(session.id), fetchCashTransactions(session.id)])

    if (hasRecordedBilletage.value) {
      let remaining = Math.max(0, Math.round(Number(session.actual_cash_amount) || 0))
      for (const d of denominations) {
        const qty = Math.floor(remaining / d.value)
        counts[d.value] = qty
        remaining -= qty * d.value
      }
    } else {
      resetForm()
    }
  } catch (error) {
    console.error('❌ Erreur dans fetchSessionData :', error)
    if (error.response) {
      console.error('Status:', error.response.status)
      console.error('Données erreur:', error.response.data)
      errorMessage.value = error.response.data?.message || `Erreur ${error.response.status} : session introuvable`
    } else {
      errorMessage.value = error.message || 'Erreur de chargement de la session.'
    }
  } finally {
    isLoading.value = false
  }
}

const onSessionChange = () => {
  if (selectedSessionId.value) {
    fetchSessionData(selectedSessionId.value)
  }
}

// ========== BILLETAGE ==========
const submit = async () => {
  if (!sessionId.value) { errorMessage.value = 'Session introuvable.'; return }
  if (sessionClosed.value) { errorMessage.value = 'Session déjà clôturée.'; return }
  if (hasRecordedBilletage.value) { errorMessage.value = 'Billetage déjà enregistré.'; return }
  const totalCounted = actualTotal.value
  if (totalCounted === 0) { errorMessage.value = 'Saisissez au moins un billet ou une pièce.'; return }
  if (!confirm(`Valider le billetage à ${formatCurrency(totalCounted)} ?`)) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await axios.put(`${API_BASE_URL}/cash-register-sessions/${sessionId.value}`, {
      actual_cash_amount: totalCounted
    }, { headers: authHeaders() })
    successMessage.value = 'Billetage enregistré avec succès.'
    hasRecordedBilletage.value = true
    if (sessionData.value) sessionData.value.actual_cash_amount = totalCounted
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Erreur d’enregistrement.'
  } finally {
    isSubmitting.value = false
  }
}

// ========== CLÔTURE SESSION ==========
const closeSession = async () => {
  if (!sessionId.value) { errorMessage.value = 'Session introuvable.'; return }
  if (sessionClosed.value) { successMessage.value = 'Session déjà clôturée.'; return }
  if (!hasRecordedBilletage.value) { errorMessage.value = 'Veuillez d’abord enregistrer le billetage.'; return }
  if (!confirm('Clôturer définitivement cette session ?')) return

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await axios.put(`${API_BASE_URL}/cash-register-sessions/${sessionId.value}`, {
      actual_cash_amount: actualTotal.value,
      is_closed: true,
      closed_at: new Date().toISOString()
    }, { headers: authHeaders() })
    successMessage.value = 'Session clôturée avec succès.'
    sessionClosed.value = true
    sessionId.value = null
    sessionData.value = null
    sessionSales.value = []
    cashTransactions.value = []
    // Rafraîchir la liste des sessions ouvertes (la session clôturée disparaît)
    await fetchOpenSessions()
  } catch (error) {
    errorMessage.value = error.response?.data?.message || 'Erreur lors de la clôture.'
  } finally {
    isSubmitting.value = false
  }
}

// ========== CLAVIER VIRTUEL ==========
const KEYBOARD_WIDTH = 600, KEYBOARD_HEIGHT = 400, KEYBOARD_MARGIN = 16
const updateKeyboardPosition = () => {
  const formEl = formRef.value
  if (!formEl) return
  const rect = formEl.getBoundingClientRect()
  const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight
  let left = rect.right + KEYBOARD_MARGIN
  if (left + KEYBOARD_WIDTH > viewportWidth - KEYBOARD_MARGIN) left = viewportWidth - KEYBOARD_WIDTH - KEYBOARD_MARGIN
  left = Math.max(KEYBOARD_MARGIN, left)
  let top = rect.top
  if (top + KEYBOARD_HEIGHT > viewportHeight - KEYBOARD_MARGIN) top = viewportHeight - KEYBOARD_HEIGHT - KEYBOARD_MARGIN
  top = Math.max(KEYBOARD_MARGIN, top)
  keyboardPosition.value = { top, left }
}
const handleViewportChange = () => updateKeyboardPosition()
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
  if (!activeField.value || activeField.value.type !== 'denomination') return
  const denom = activeField.value.value
  const current = counts[denom]
  const str = current === 0 || current === '' ? '' : String(current)
  if (key === 'BACKSPACE') {
    const newStr = str.slice(0, -1)
    counts[denom] = newStr === '' ? '' : Number(newStr)
    return
  }
  if (!/^[0-9]$/.test(key)) return
  counts[denom] = Number(str + key)
}
const hideKeyboard = () => {
  keyboardVisible.value = false
  activeField.value = null
}

// ========== CYCLE DE VIE ==========
onMounted(async () => {
  await loadUserData()
  const userRoles = currentUser.value?.roles?.map(r => r.name) || []
  const hasAccess = isAdmin.value || userRoles.includes('gerant')
  if (!hasAccess) {
    router.push({ name: 'dashboard-overview' })
    return
  }
  await fetchOpenSessions()
})

watch(keyboardVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      updateKeyboardPosition()
      window.addEventListener('resize', handleViewportChange)
      window.addEventListener('scroll', handleViewportChange, true)
    })
  } else {
    detachKeyboardListeners()
  }
})

onBeforeUnmount(detachKeyboardListeners)
</script>