<template>
  <Profile />
  <div class="sales-view">
    <section class="sales-content">
      <header class="sales-header">
        <div>
          <h1>Ventes de la session</h1>
          <p>Consultez les tickets enregistrés pendant la session de caisse en cours.</p>
  <template v-if="!embedded">
    <Profile />
  </template>
  <div class="sales-list-container">
    <h1 class="title has-text-black">Ventes</h1>
    <div class="search-container">
      <input type="text" v-model="searchQuery" placeholder="Rechercher par ticket, produit, date..."
        class="search-input" />
    </div>

    <div class="filters-container">
      <label for="periodFilter">Période:</label>
      <select id="periodFilter" v-model="periodFilter" @change="applyPeriodFilter" class="filter-select">
        <option value="">Toutes</option>
        <option value="today">Aujourd'hui</option>
        <option value="thisWeek">Cette semaine</option>
        <option value="thisMonth">Ce mois</option>
      </select>

      <label for="startDate">Date début:</label>
      <input type="date" id="startDate" v-model="startDate" class="filter-date" />

      <label for="endDate">Date fin:</label>
      <input type="date" id="endDate" v-model="endDate" class="filter-date" />
    </div>
    <div v-if="loading" class="loading">Chargement des ventes...</div>
    <div v-else>
      <div v-if="filteredSales.length === 0">Aucune vente trouvée.</div>
      <template v-for="sale in filteredSales" :key="sale?.id">
        <div v-if="sale" class="sale-card">
          <div class="sale-header flex-header" @click="toggleSale(sale.id)">
            <h2 class="sale-title">Ticket: {{ sale?.ticket_number || 'N/A' }} - Total: {{ formatPrice(sale?.total_amount
              || 0) }} - Date: {{ formatDate(sale?.created_at) }}</h2>
            <button class="toggle-button">{{ expandedSales.has(sale.id) ? '▲' : '▼' }}</button>
            <button class="edit-button" @click.stop="editSale(sale.id)">Éditer</button>
            <button class="delete-button" @click.stop="deleteSale(sale.id)">Supprimer</button>
          </div>

          <div class="sale-actions">

          </div>
          <table v-if="expandedSales.has(sale.id)" class="order-lines-table">
            <thead>
              <tr>
                <th class="has-text-black">Produit</th>
                <th class="has-text-black">Quantité</th>
                <th class="has-text-black">Prix unitaire</th>
                <th class="has-text-black">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="line in sale.order_lines" :key="line.id">
                <td class="has-text-black">{{ line.product?.name || 'N/A' }}</td>
                <td class="has-text-black">{{ line.quantity }}</td>
                <td class="has-text-black">{{ formatPrice(line.price) }}</td>
                <td class="has-text-black">{{ formatPrice(line.total) }}</td>
              </tr>
              <tr class="order-lines-total-row">
                <td colspan="3" style="text-align: right; font-weight: bold;">Total</td>
                <td style="font-weight: bold;">{{formatPrice(sale.order_lines.reduce((sum, line) => sum + line.total,
                  0))}}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="meta" v-if="sessionId">
          <span>Session #{{ sessionId }}</span>
          <span v-if="filteredSales.length">{{ filteredSales.length }} vente<span v-if="filteredSales.length > 1">s</span></span>
        </div>
      </header>

      <div class="utilities">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Rechercher par ticket, produit, date…"
          class="search-input"
        />

        <div class="filters">
          <label>
            Début
            <input type="date" v-model="startDate" />
          </label>
          <label>
            Fin
            <input type="date" v-model="endDate" />
          </label>
        </div>
      </div>

      <div v-if="loading" class="state loading">Chargement des ventes…</div>

      <div v-else class="sales-list">
        <div v-if="loadError" class="state error">{{ loadError }}</div>
        <div v-else-if="filteredSales.length === 0" class="state empty">Aucune vente trouvée.</div>

        <transition-group name="fade" tag="div">
          <article v-for="sale in filteredSales" :key="sale?.id" class="sale-card">
            <header class="sale-card__header" @click="toggleSale(sale.id)">
              <div class="info">
                <h2>Ticket #{{ sale?.ticket_number || 'N/A' }}</h2>
                <p>
                  Créé le {{ formatDate(sale?.created_at) }} · Total {{ formatPrice(sale?.total_amount || 0) }}
                </p>
              </div>
              <div class="status-badge" :class="statusClass(sale.status)">
                <FontAwesomeIcon :icon="statusIcon(sale.status)" />
                <span>{{ formatStatus(sale.status) }}</span>
              </div>
              <div class="actions">
                <button class="ghost" @click.stop="editSale(sale.id)">
                  <FontAwesomeIcon icon="fa-solid fa-pen-to-square" />
                </button>
                <button class="ghost danger" @click.stop="deleteSale(sale.id)">
                  <FontAwesomeIcon icon="fa-solid fa-trash" />
                </button>
                <button class="toggle" @click.stop="toggleSale(sale.id)">
                  <FontAwesomeIcon :icon="expandedSales.has(sale.id) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
                </button>
              </div>
            </header>

            <transition name="expand">
              <div v-if="expandedSales.has(sale.id)" class="sale-card__details">
                <table>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Quantité</th>
                      <th>Prix unitaire</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="line in sale.order_lines" :key="line.id">
                      <td>{{ line.product?.name || 'N/A' }}</td>
                      <td>{{ line.quantity }}</td>
                      <td>{{ formatPrice(line.price) }}</td>
                      <td>{{ formatPrice(line.total) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3">Total ticket</td>
                      <td>{{ formatPrice(sale.order_lines.reduce((sum, line) => sum + line.total, 0)) }}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </transition>
          </article>
        </transition-group>
      </div>

      <EditSaleModal v-if="isEditModalOpen" :sale="saleToEdit" @save="saveSale" @close="closeEditModal" />
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import EditSaleModal from './EditSaleModal.vue'
import Profile from './Profile.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faPenToSquare,
  faTrash,
  faChevronDown,
  faChevronUp,
  faCircleCheck,
  faCircleXmark,
  faClock
} from '@fortawesome/free-solid-svg-icons'

library.add(faPenToSquare, faTrash, faChevronDown, faChevronUp, faCircleCheck, faCircleXmark, faClock)

// When embedded in Dashboard, header/menu are hidden
const props = defineProps({
  embedded: { type: Boolean, default: false }
})
const sales = ref([])
const loading = ref(true)
const searchQuery = ref('')
const expandedSales = ref(new Set())

const startDate = ref('')
const endDate = ref('')

const isEditModalOpen = ref(false)
const saleToEdit = ref(null)
const sessionId = ref(null)
const loadError = ref('')

const openEditModal = (sale) => {
  saleToEdit.value = sale
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  saleToEdit.value = null
}

const saveSale = async (updatedSale) => {
  // Update the sale in the sales list
  const index = sales.value.findIndex(s => s.id === updatedSale.id)
  if (index !== -1) {
    sales.value[index] = updatedSale
  }
  // Optionally, call API to persist changes
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://127.0.0.1:8000/api/sales/${updatedSale.id}`, updatedSale, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error.response?.data || error.message)
  }
  closeEditModal()
}

const editSale = (saleId) => {
  const sale = sales.value.find(s => s.id === saleId)
  if (sale) {
    openEditModal(sale)
  }
}

const filteredSales = computed(() => {
  let filtered = sales.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(sale => {
      if (!sale) return false
      const ticketMatch = sale.ticket_number !== undefined && sale.ticket_number !== null
        ? sale.ticket_number.toString().toLowerCase().includes(query)
        : false
      const dateMatch = formatDate(sale.created_at).toLowerCase().includes(query)
      const productMatch = sale.order_lines?.some(line =>
        line.product?.name.toLowerCase().includes(query)
      )
      return ticketMatch || dateMatch || productMatch
    })
  }

  if (startDate.value) {
    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.created_at)
      const start = new Date(startDate.value)
      start.setHours(0, 0, 0, 0)
      return saleDate >= start
    })
  }
  if (endDate.value) {
    filtered = filtered.filter(sale => {
      const saleDate = new Date(sale.created_at)
      const end = new Date(endDate.value)
      end.setHours(23, 59, 59, 999)
      return saleDate <= end
    })
  }

  return filtered
})

const formatPrice = (price) => {
  const amount = Math.round(Number(price) || 0)
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} Ar`
}

const statusIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'fa-solid fa-circle-check'
    case 'cancelled':
    case 'refund':
      return 'fa-solid fa-circle-xmark'
    default:
      return 'fa-solid fa-clock'
  }
}

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return 'status--success'
    case 'cancelled':
    case 'refund':
      return 'status--danger'
    default:
      return 'status--pending'
  }
}

const formatStatus = (status) => {
  if (!status) return 'En attente'
  const map = {
    completed: 'Terminée',
    paid: 'Payée',
    pending: 'En attente',
    cancelled: 'Annulée',
    refund: 'Remboursée'
  }
  return map[status.toLowerCase()] || status
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

const toggleSale = (saleId) => {
  if (expandedSales.value.has(saleId)) {
    expandedSales.value.delete(saleId)
  } else {
    expandedSales.value.add(saleId)
  }
  // Trigger reactivity
  expandedSales.value = new Set(expandedSales.value)
}

const deleteSale = async (saleId) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
    return
  }
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`http://127.0.0.1:8000/api/sales/${saleId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    sales.value = sales.value.filter(s => s.id !== saleId)
  } catch (error) {
    console.error('Erreur lors de la suppression de la vente:', error.response?.data || error.message)
  }
}

const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant')
  return { Authorization: `Bearer ${token}` }
}

const fetchActiveSession = async () => {
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-register-session/my-active-session', {
      headers: authHeaders()
    })
    const session = data?.data || data || null
    if (!session) {
      loadError.value = 'Aucune session de caisse active.'
      return null
    }
    return session
  } catch (error) {
    console.error('Erreur session active:', error.response?.data || error.message)
    loadError.value = error.response?.data?.message || 'Impossible de récupérer la session active.'
    return null
  }
}

const fetchSales = async (session, user) => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/sales', {
      params: {
        cash_register_session_id: session.id,
        user_id: user?.id
      },
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }
    })
    sales.value = response.data?.data || response.data || []
  } catch (error) {
    console.error('Erreur chargement ventes:', error.response?.data || error.message)
    loadError.value = error.response?.data?.message || 'Impossible de charger les ventes de la session.'
  }
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  const user = JSON.parse(localStorage.getItem('user'))

  try {
    const session = await fetchActiveSession()
    if (!session) return
    sessionId.value = session.id
    await fetchSales(session, user)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sales-view {
  min-height: 100vh;
  padding: 5.5rem 1.5rem 2.5rem;
  background: linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%);
}

.sales-content {
  max-width: 1100px;
  margin: 0 auto;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
  padding: 2rem 2.5rem;
  display: grid;
  gap: 1.5rem;
}

.sales-header {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: flex-start;
}

.sales-header h1 {
  font-size: 1.9rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.sales-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
}

.sales-header .meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: #475569;
  font-weight: 600;
}

.utilities {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.utilities .search-input {
  width: 100%;
  padding: 0.65rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid #cbd5f5;
  background: #f8fafc;
  color: #0f172a;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.utilities .search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.18);
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.filters label {
  display: grid;
  gap: 0.45rem;
  color: #475569;
  font-weight: 600;
  font-size: 0.9rem;
}

.filters select,
.filters input {
  padding: 0.55rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5f5;
  background: #f8fafc;
  color: #0f172a;
}

.sales-list {
  display: grid;
  gap: 1.1rem;
}

.state {
  padding: 0.85rem 1.1rem;
  border-radius: 0.85rem;
  font-weight: 600;
  text-align: center;
}

.state.loading {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.state.error {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.state.empty {
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.sale-card {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.9), #fff);
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 1rem;
  padding: 1.1rem 1.3rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  display: grid;
  gap: 0.9rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.sale-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.12);
}

.sale-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
}

.sale-card__header .info {
  flex: 1;
}

.sale-card__header h2 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: #0f172a;
}

.sale-card__header p {
  margin: 0.3rem 0 0;
  color: #64748b;
  font-size: 0.9rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.status--success {
  background: rgba(22, 163, 74, 0.12);
  color: #166534;
}

.status--danger {
  background: rgba(220, 38, 38, 0.12);
  color: #991b1b;
}

.status--pending {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.sale-card__header .actions {
  display: flex;
  gap: 0.45rem;
  align-items: center;
}

.sale-card__header .actions button {
  border: none;
  background: none;
  cursor: pointer;
  font-weight: 600;
  padding: 0.4rem 0.7rem;
  border-radius: 0.65rem;
  transition: background 0.2s ease, color 0.2s ease;
  display: inline-flex;
  align-items: center;
}

.sale-card__header .actions .ghost {
  color: #2563eb;
}

.sale-card__header .actions .ghost:hover {
  background: rgba(37, 99, 235, 0.12);
}

.sale-card__header .actions .danger {
  color: #dc2626;
}

.sale-card__header .actions .danger:hover {
  background: rgba(220, 38, 38, 0.12);
}

.sale-card__header .actions .toggle {
  background: rgba(148, 163, 184, 0.18);
  color: #334155;
}

.sale-card__header .actions .toggle:hover {
  background: rgba(148, 163, 184, 0.3);
}

.sale-card__header .actions .toggle svg {
  pointer-events: none;
}

.sale-card__details table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 0.9rem;
  overflow: hidden;
}

.sale-card__details thead {
  background: #f1f5f9;
  color: #475569;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}

.sale-card__details th,
.sale-card__details td {
  padding: 0.65rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.sale-card__details tbody tr:hover {
  background: rgba(226, 232, 240, 0.35);
}

.sale-card__details tfoot td {
  font-weight: 700;
  color: #0f172a;
  border-top: 1px solid #cbd5f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.expand-enter-active,
.expand-leave-active {
  transition: height 0.25s ease, opacity 0.25s ease;
}

.expand-enter-from,
.expand-leave-to {
  height: 0;
  opacity: 0;
}

@media (max-width: 768px) {
  .sales-content {
    padding: 1.5rem;
  }

  .sales-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .sale-card__header {
    flex-direction: column;
  }

  .sale-card__header .actions {
    align-self: flex-end;
  }
}
</style>
