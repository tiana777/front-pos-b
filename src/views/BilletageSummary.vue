<template>
  <div class="billetage-summary-view">
    <Profile />

    <section class="page-section">
      <header class="page-header">
        <div>
          <h1>Résumé de la session</h1>
          <p v-if="sessionLabel" class="subtitle">{{ sessionLabel }}</p>
        </div>
        <div class="header-actions">
          <button type="button" class="btn" @click="goBack">
            Retour au billetage
          </button>
          <button
            type="button"
            class="btn primary"
            @click="printSummary"
            :disabled="loading || Boolean(errorMessage)"
          >
            Imprimer
          </button>
        </div>
      </header>

      <section v-if="loading" class="card status-card">
        <p>Chargement du récapitulatif…</p>
      </section>

      <section v-else-if="errorMessage" class="card feedback error">
        {{ errorMessage }}
      </section>

      <section v-else class="summary-content" ref="summaryRef">
        <article class="card info-card">
          <h2 class="card-title">Informations session</h2>
          <ul class="info-list">
            <li>
              <span>Caisse</span>
              <strong>{{ sessionInfo?.cash_register?.name ?? '—' }}</strong>
            </li>
            <li>
              <span>Ouverte par</span>
              <strong>{{ sessionInfo?.user?.name ?? '—' }}</strong>
            </li>
            <li>
              <span>Ouverte le</span>
              <strong>{{ sessionOpenedAt }}</strong>
            </li>
            <li>
              <span>Montant attendu</span>
              <strong>{{ formatCurrency(expectedAmount) }}</strong>
            </li>
            <li>
              <span>Montant compté</span>
              <strong>{{ formatCurrency(actualAmount) }}</strong>
            </li>
            <li>
              <span>Écart</span>
              <strong :class="{ negative: difference < 0, positive: difference >= 0 }">
                {{ formatCurrency(difference) }}
              </strong>
            </li>
            <li>
              <span>Statut</span>
              <strong>{{ sessionStatus }}</strong>
            </li>
          </ul>
        </article>

        <article class="card recap-card">
          <h2 class="card-title">Ventes par catégorie</h2>
          <table v-if="categorySummary.length" class="data-table">
            <thead>
              <tr>
                <th>Catégorie</th>
                <th>Quantité</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in categorySummary" :key="item.category_id ?? item.category_name">
                <td>{{ item.category_name }}</td>
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.amount) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="list-empty">Aucune vente enregistrée.</p>
        </article>

        <article class="card recap-card">
          <h2 class="card-title">Ventes par mode de paiement</h2>
          <table v-if="paymentSummary.length" class="data-table">
            <thead>
              <tr>
                <th>Moyen</th>
                <th>Transactions</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in paymentSummary" :key="item.payment_id ?? item.payment_name">
                <td>{{ item.payment_name }}</td>
                <td>{{ item.transactions }}</td>
                <td>{{ formatCurrency(item.total) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="list-empty">Aucun paiement enregistré.</p>
        </article>

        <article class="card totals-card">
          <h2 class="card-title">Totaux</h2>
          <ul class="totals-list">
            <li>
              <span>Total remises</span>
              <strong>{{ formatCurrency(totalDiscount) }}</strong>
            </li>
            <li>
              <span>Total ventes (net)</span>
              <strong>{{ formatCurrency(finalSalesTotal) }}</strong>
            </li>
            <li>
              <span>Total transactions</span>
              <strong>{{ formatCurrency(totalTransactions) }}</strong>
            </li>
            <li>
              <span>Total écarts signalés</span>
              <strong>{{ formatCurrency(totalDiscrepancies) }}</strong>
            </li>
          </ul>
        </article>
      </section>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import Profile from './Profile.vue'

const route = useRoute()
const router = useRouter()

const summaryRef = ref(null)
const loading = ref(false)
const errorMessage = ref('')
const summaryData = ref(null)
const categorySummary = ref([])
const paymentSummary = ref([])
const totalDiscount = ref(0)
const finalSalesTotal = ref(0)
const totalTransactions = ref(0)
const totalDiscrepancies = ref(0)

const sessionId = computed(() => {
  const raw = route.params.sessionId ?? route.query.sessionId
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
})

const sessionInfo = computed(() => summaryData.value?.session ?? null)

const expectedAmount = computed(() => Number(sessionInfo.value?.expected_cash_amount ?? 0))
const actualAmount = computed(() => {
  const value = sessionInfo.value?.actual_cash_amount
  return value === undefined || value === null ? 0 : Number(value)
})
const difference = computed(() => Number((actualAmount.value - expectedAmount.value).toFixed(2)))

const sessionLabel = computed(() => {
  if (!sessionInfo.value) return ''
  const id = sessionInfo.value.id ? `#${sessionInfo.value.id}` : ''
  const register = sessionInfo.value.cash_register?.name ? ` — ${sessionInfo.value.cash_register.name}` : ''
  return `Session ${id}${register}`.trim()
})

const sessionOpenedAt = computed(() => formatDate(sessionInfo.value?.opened_at ?? sessionInfo.value?.created_at))

const sessionStatus = computed(() => {
  if (!sessionInfo.value) return '—'
  return sessionInfo.value.is_closed ? 'Clôturée' : 'Ouverte'
})

const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error("Token d'authentification manquant")
  return { Authorization: `Bearer ${token}` }
}

const formatCurrency = (amount) => {
  const number = Number(amount)
  if (!Number.isFinite(number)) return '0,00 €'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(number)
}

const formatDate = (value) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('fr-FR')
}

const fetchSummary = async () => {
  if (!sessionId.value) {
    errorMessage.value = 'Session introuvable.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const { data } = await axios.get(`http://127.0.0.1:8000/api/cash-register-sessions/${sessionId.value}/summary`, {
      headers: authHeaders()
    })

    summaryData.value = data || null
    categorySummary.value = Array.isArray(data?.categories) ? data.categories : []
    paymentSummary.value = Array.isArray(data?.payments) ? data.payments : []
    totalDiscount.value = Number(data?.total_discount || 0)
    finalSalesTotal.value = Number(data?.final_total || 0)
    totalTransactions.value = Number(data?.total_transactions || 0)
    totalDiscrepancies.value = Number(data?.total_discrepancies || 0)
  } catch (error) {
    console.error('Erreur chargement résumé billetage:', error.response?.data || error.message)
    errorMessage.value = error.response?.data?.message || 'Impossible de charger le récapitulatif.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'billetage' })
}

const printSummary = () => {
  if (!summaryRef.value) return
  const content = summaryRef.value.innerHTML
  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) return

  printWindow.document.write(`<!DOCTYPE html><html><head><title>Résumé de session</title><style>
    body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #0f172a; }
    h1, h2, h3 { margin: 0 0 12px; }
    h2 { font-size: 18px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    th, td { padding: 8px 10px; border: 1px solid #cbd5f5; text-align: left; }
    th { background: #e2e8f0; text-transform: uppercase; font-size: 12px; }
    ul { list-style: none; padding: 0; margin: 0 0 16px; }
    li { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
    li:last-child { border-bottom: none; }
    strong { font-weight: 600; }
  </style></head><body>${content}</body></html>`)
  printWindow.document.close()
  printWindow.focus()
  printWindow.print()
  printWindow.close()
}

onMounted(fetchSummary)
</script>

<style scoped>
.billetage-summary-view {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
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

.subtitle {
  margin-top: 0.35rem;
  color: #64748b;
  font-size: 0.95rem;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
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

.summary-content {
  display: grid;
  gap: 1.4rem;
}

.info-list,
.totals-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.info-list li,
.totals-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-list strong,
.totals-list strong {
  font-weight: 600;
}

.negative {
  color: #dc2626;
}

.positive {
  color: #16a34a;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  border: 1px solid #cbd5f5;
  padding: 0.6rem 0.75rem;
  text-align: left;
}

.data-table th {
  background: #f1f5f9;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: #475569;
}

.list-empty {
  color: #94a3b8;
  font-size: 0.9rem;
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

.btn.primary {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
}

.btn.primary:hover {
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
}

.feedback {
  font-size: 0.95rem;
  text-align: center;
}

.feedback.error {
  color: #dc2626;
}

.status-card {
  text-align: center;
}

@media (max-width: 768px) {
  .summary-content {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 769px) {
  .summary-content {
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  }
}
</style>
