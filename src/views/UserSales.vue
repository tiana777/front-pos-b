<template>
  <div :class="embedded ? 'user-sales-embedded' : 'user-sales-view'">
    <Profile v-if="!embedded" />

    <div class="user-sales-layout grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-slate-100 pb-2">
          <h1 class="text-base font-semibold text-slate-800">Mes ventes</h1>
          <span class="text-xs font-semibold text-slate-400">{{ sales.length }} total</span>
        </div>

        <div class="mt-2.5 flex-1 overflow-hidden">
          <div
            v-if="loading"
            class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500"
          >
            <span
              class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"
            ></span>
            <p class="mt-4 font-medium">Chargement des ventes...</p>
          </div>

          <template v-else>
            <div
              v-if="!sales.length"
              class="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-sm text-slate-500"
            >
              Aucune vente trouvée pour cette session
            </div>

            <div v-else class="flex h-full flex-col overflow-hidden">
              <div class="flex-1 overflow-y-auto">
                <table class="min-w-full divide-y divide-slate-100 text-sm">
                  <thead
                    class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    <tr>
                      <th class="px-4 py-3 text-left">Date</th>
                      <th class="px-4 py-3 text-left">Ticket</th>
                      <th class="px-4 py-3 text-left">Montant</th>
                      <th class="px-4 py-3 text-left">Statut</th>
                      <th class="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr
                      v-for="sale in sales"
                      :key="sale.id"
                      @click="selectSale(sale)"
                      :class="[
                        'cursor-pointer transition hover:bg-indigo-50/40',
                        selectedSale?.id === sale.id ? 'bg-indigo-50/60' : 'bg-white',
                      ]"
                    >
                      <td class="px-4 py-3 text-slate-600">{{ formatDate(sale.created_at) }}</td>
                      <td class="px-4 py-3 text-slate-600">{{ sale.ticket_number }}</td>
                      <td class="px-4 py-3 font-semibold text-slate-800">
                        {{ formatPrice(sale.total_amount) }}
                      </td>
                      <td class="px-4 py-3">
                        <span
                          :class="[
                            'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize',
                            statusClass(sale.status),
                          ]"
                        >
                          <i :class="getStatusIcon(sale.status)"></i>
                          {{ formatStatus(sale.status) }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button
                          type="button"
                          class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                          @click.stop="openEditModal(sale)"
                          aria-label="Modifier"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-pen" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
        </div>
      </section>

      <aside
        class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
      >
        <div class="border-b border-slate-100 pb-2">
          <h2 class="text-base font-semibold text-slate-800">Détails</h2>
          <p class="text-xs text-slate-400">
            {{ selectedSale ? 'Ticket ' + selectedSale.ticket_number : 'Sélectionnez une vente' }}
          </p>
        </div>

        <div class="mt-2.5 flex-1 overflow-hidden">
          <!-- Aucune vente sélectionnée -->
          <div
            v-if="!selectedSale"
            class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500"
          >
            <FontAwesomeIcon icon="fa-solid fa-receipt" class="mb-3 text-xl" />
            Choisissez une vente pour voir les détails.
          </div>

          <!-- Vente sélectionnée -->
          <div v-else class="flex h-full flex-col overflow-hidden">
            <!-- Infos générales -->
            <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
              <p class="flex items-center justify-between">
                <span class="font-semibold text-slate-800">Montant total</span>
                <span class="text-indigo-600">{{ formatPrice(selectedSale.total_amount) }}</span>
              </p>
              <p class="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Statut</span>
                <span class="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">
                  {{ formatStatus(selectedSale.status) }}
                </span>
              </p>
              <p class="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Créé le</span>
                <span>{{ formatDate(selectedSale.created_at) }}</span>
              </p>
            </div>

            <!-- Liste des articles -->
            <div class="mt-3 flex-1 overflow-hidden">
              <div class="flex h-full flex-col overflow-hidden">
                <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 class="text-sm font-semibold text-slate-700">Articles</h3>
                  <span class="text-xs text-slate-400">
                    {{ selectedSale.order_lines?.length || 0 }} ligne(s)
                  </span>
                </div>

                <!-- Cas : avec des lignes -->
                <div v-if="selectedSale.order_lines?.length" class="flex-1 overflow-y-auto">
                  <div class="divide-y divide-slate-100">
                    <!-- En-tête -->
                    <div class="grid grid-cols-4 gap-2 px-1 py-2 text-xs font-semibold text-slate-400">
                      <div>Produit</div>
                      <div>Qté</div>
                      <div>Prix unit.</div>
                      <div class="text-right">Total</div>
                    </div>
                    <!-- Lignes -->
                    <div
                      v-for="line in selectedSale.order_lines"
                      :key="line.id"
                      class="grid grid-cols-4 gap-2 px-1 py-2 text-sm"
                    >
                      <div class="truncate font-semibold text-slate-800">
                        {{ line.product?.name || 'Produit supprimé' }}
                      </div>
                      <div class="text-slate-500">{{ line.quantity }}</div>
                      <div class="text-slate-500">{{ formatPrice(line.price) }}</div>
                      <div class="text-right font-semibold text-indigo-600">
                        {{ formatPrice(line.total) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Cas : aucune ligne -->
                <div v-else class="flex flex-1 items-center justify-center text-xs text-slate-400">
                  Aucun article pour cette vente
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <EditSaleModal
      v-if="showEditModal"
      :sale="selectedSale"
      @save="saveSale"
      @close="closeEditModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import EditSaleModal from './EditSaleModal.vue'
import Profile from './Profile.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPen, faReceipt } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/composables/useAuth'

library.add(faPen, faReceipt)

// Props
const props = defineProps({
  embedded: { type: Boolean, default: false },
})
const embedded = computed(() => props.embedded)

// Authentification
const { isAdmin, currentUser, loadUserData } = useAuth()

// État
const sales = ref([])
const loading = ref(true)
const selectedSale = ref(null)
const showEditModal = ref(false)
const sessionId = ref(null)
const loadError = ref('')

// Headers API
const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant. Veuillez vous reconnecter.')
  return { Authorization: `Bearer ${token}` }
}

// Extractions d'IDs
const getSaleUserId = (sale) => sale?.user_id ?? sale?.userId ?? sale?.user?.id ?? null
const getSaleSessionId = (sale) =>
  sale?.cash_register_session_id ??
  sale?.cashRegisterSessionId ??
  sale?.session_id ??
  sale?.sessionId ??
  null

const extractSalesArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

// Récupération des ventes (sans lignes)
const fetchSalesForSession = async (sessionId, userId) => {
  const { data } = await axios.get(`${API_BASE_URL}/sales`, {
    params: { cash_register_session_id: sessionId },
    headers: authHeaders(),
  })
  const fetchedSales = extractSalesArray(data).filter((sale) => sale && typeof sale === 'object')
  const sessionSales = fetchedSales.filter(
    (sale) => String(getSaleSessionId(sale) ?? '') === String(sessionId),
  )
  const userSales = sessionSales.filter(
    (sale) => String(getSaleUserId(sale) ?? '') === String(userId),
  )
  return userSales.length ? userSales : sessionSales.length ? sessionSales : fetchedSales
}

// Récupération des détails complets d'une vente (avec order_lines)
const fetchSaleDetails = async (saleId) => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/sales/${saleId}`, {
      headers: authHeaders(),
    })
    return data?.data || data
  } catch (error) {
    console.error('Erreur chargement détails vente:', error)
    return null
  }
}

const fetchCurrentSession = async () => {
  try {
    const { data } = await axios.get(`${API_BASE_URL}/my-active-session`, {
      headers: authHeaders(),
    })
    return data?.data || data || null
  } catch (error) {
    console.error(
      'Impossible de récupérer la session de caisse:',
      error.response?.data || error.message,
    )
    return null
  }
}

// Sélection : on charge les détails (order_lines) au clic
const selectSale = async (sale) => {
  selectedSale.value = sale
  const details = await fetchSaleDetails(sale.id)
  if (details) {
    selectedSale.value = { ...sale, order_lines: details.order_lines || [] }
  } else {
    selectedSale.value = { ...sale, order_lines: [] }
  }
}

// Modal
const openEditModal = (sale) => {
  selectedSale.value = sale
  showEditModal.value = true
}
const closeEditModal = () => {
  showEditModal.value = false
  selectedSale.value = null
}

// Sauvegarde après édition
const saveSale = async (updatedSale) => {
  if (!updatedSale?.id) {
    closeEditModal()
    return
  }
  try {
    const sanitizedSale = {
      ...updatedSale,
      total_amount: Math.round(Number(updatedSale.total_amount) || 0),
      order_lines: (updatedSale.order_lines || []).map((line) => ({
        ...line,
        price: Math.round(Number(line.price) || 0),
        total: Math.round(Number(line.total) || 0),
      })),
    }
    await axios.put(`${API_BASE_URL}/sales/${updatedSale.id}`, sanitizedSale, {
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
    })
    const index = sales.value.findIndex((sale) => sale.id === updatedSale.id)
    if (index !== -1) sales.value[index] = { ...updatedSale }
    if (selectedSale.value?.id === updatedSale.id) selectedSale.value = { ...updatedSale }
  } catch (error) {
    console.error('Erreur mise à jour vente:', error.response?.data || error.message)
  }
  closeEditModal()
}

// Formattage
const formatPrice = (price) => {
  const value = Number.parseFloat(price)
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar`
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

const getStatusIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'fas fa-circle-check'
    case 'cancelled':
    case 'refund':
      return 'fas fa-circle-xmark'
    default:
      return 'fas fa-clock'
  }
}

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'bg-emerald-50 text-emerald-600'
    case 'cancelled':
    case 'refund':
      return 'bg-rose-50 text-rose-600'
    default:
      return 'bg-slate-100 text-slate-500'
  }
}

const formatStatus = (status) => {
  if (!status) return 'En attente'
  const labels = {
    completed: 'Terminée',
    paid: 'Payée',
    pending: 'En attente',
    cancelled: 'Annulée',
    refund: 'Remboursée',
  }
  return labels[status.toLowerCase()] || status
}

// Chargement initial
onMounted(async () => {
  loading.value = true
  await loadUserData()

  const rawUser = localStorage.getItem('user')
  let user = null
  try {
    user = rawUser ? JSON.parse(rawUser) : null
  } catch (e) {}

  if (!user?.id) {
    loading.value = false
    return
  }

  try {
    const session = await fetchCurrentSession()
    if (!session?.id) return
    sessionId.value = session.id
    sales.value = await fetchSalesForSession(session.id, user.id)
    if (sales.value.length) {
      // Précharger les détails de la première vente
      const firstSale = sales.value[0]
      const details = await fetchSaleDetails(firstSale.id)
      selectedSale.value = details
        ? { ...firstSale, order_lines: details.order_lines || [] }
        : { ...firstSale, order_lines: [] }
    }
  } catch (error) {
    loadError.value = error.message || 'Une erreur est survenue lors du chargement des ventes.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-sales-view {
  min-height: 100vh;
  padding: 3rem 1.5rem;
  background: linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.user-sales-embedded {
  min-height: 0;
}
.user-sales-layout {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
}
.user-sales-embedded .user-sales-layout {
  max-width: none;
}
@media (max-width: 1024px) {
  .user-sales-layout {
    display: flex;
    flex-direction: column;
  }
}
@media (max-width: 768px) {
  .user-sales-view {
    padding: 2rem 1rem;
  }
}
</style>