<template>
  <Profile />
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
      </template>
      <div class="pos-section">

        <EditSaleModal v-if="isEditModalOpen" :sale="saleToEdit" @save="saveSale" @close="closeEditModal" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import EditSaleModal from './EditSaleModal.vue'
import Profile from './Profile.vue'

const sales = ref([])
const loading = ref(true)
const searchQuery = ref('')
const expandedSales = ref(new Set())

const periodFilter = ref('')
const startDate = ref('')
const endDate = ref('')

const isEditModalOpen = ref(false)
const saleToEdit = ref(null)

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

const applyPeriodFilter = () => {
  const now = new Date()
  if (periodFilter.value === 'today') {
    startDate.value = now.toISOString().slice(0, 10)
    endDate.value = now.toISOString().slice(0, 10)
  } else if (periodFilter.value === 'thisWeek') {
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startDate.value = firstDayOfWeek.toISOString().slice(0, 10)
    endDate.value = new Date().toISOString().slice(0, 10)
  } else if (periodFilter.value === 'thisMonth') {
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = firstDayOfMonth.toISOString().slice(0, 10)
    endDate.value = new Date().toISOString().slice(0, 10)
  } else {
    startDate.value = ''
    endDate.value = ''
  }
}

const filteredSales = computed(() => {
  let filtered = sales.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(sale => {
      if (!sale) return false
      const ticketMatch = sale.ticket_number?.toLowerCase().includes(query)
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
  return `${parseFloat(price).toFixed(2)} Ar`
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

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'))
  const session = JSON.parse(localStorage.getItem('cashRegisterSession'))
  const token = localStorage.getItem('token')

  console.log('User from localStorage:', user)
  console.log('Session from localStorage:', session)
  console.log('Token from localStorage:', token)

  if (!user?.point_of_sale_id || !token || !session) {
    console.error('Utilisateur non authentifié, point de vente ou session non défini')
    loading.value = false
    return
  }

  try {
    // Fetch sales for the connected user and session, including order lines and product details
    const response = await axios.get('http://127.0.0.1:8000/api/sales', {
      params: {
        user_id: user.id,
        cash_register_session_id: session.id
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    console.log('API response:', response.data)

    // Assuming the API returns sales with nested order_lines and product info
    sales.value = response.data.data || response.data
    console.log('Sales data assigned:', sales.value)
  } catch (error) {
    console.error('Erreur lors du chargement des ventes:', error.response?.data || error.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sales-list-container {
  padding: 1rem;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #000000;
  text-align: center;
  text-transform: uppercase;
}

.title {
  color: #000000;
  text-align: center;
  text-transform: uppercase;
}

.search-container {
  margin-bottom: 1rem;
  text-align: left;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: border-color 0.3s ease;
  color: #000000;
}

.search-input:focus {
  outline: none;
  border-color: #d32f2f;
  box-shadow: 0 0 8px rgba(211, 47, 47, 0.5);
}

.sale-card {
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #000000;
  text-transform: none;
  text-align: left;
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.sale-title {
  margin: 0;
  color: #000000;
  text-transform: none;
}

.sale-date {
  color: #000000;
  margin-bottom: 0.5rem;
}

.sale-actions {
  margin-bottom: 0.5rem;
}

.edit-button,
.delete-button {
  background-color: #d32f2f;
  border: none;
  color: white;
  padding: 0.3rem 0.6rem;
  margin-right: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s ease;
}

.edit-button:hover {
  background-color: #b71c1c;
}

.delete-button:hover {
  background-color: #b71c1c;
}

.order-lines-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  margin-top: 0.5rem;
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #000000;
}

.order-lines-table th,
.order-lines-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  color: #000000;
}

.order-lines-table tr:last-child td {
  border-bottom: none;
}

.taxes-section {
  margin-top: 1rem;
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  color: #000000;
  font-weight: 600;
}

.loading {
  font-weight: bold;
  font-size: 1.2rem;
  color: #000000;
}

.pos-section {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #000000;
  text-align: left;
}

.pos-title {
  margin-bottom: 1rem;
  color: #000000;
  font-weight: 700;
  font-size: 1.25rem;
}

.flex-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.flex-header .sale-title {
  flex-grow: 1;
  margin: 0;
}

.filters-container {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: flex-start;
}

.filter-select,
.filter-date {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 0.9rem;
  color: #000000;
}

.filter-select:focus,
.filter-date:focus {
  outline: none;
  border-color: #d32f2f;
  box-shadow: 0 0 6px rgba(211, 47, 47, 0.5);
}
</style>
