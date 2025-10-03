<template>
  <div class="full-screen-sales">
    <Profile />

    <!-- Full screen container -->
    <div class="sales-container">
      <div class="sales-header">
        <h1 class="sales-title">Mes Ventes</h1>
      </div>

      <div v-if="loading" class="loading">
        Chargement des ventes...
      </div>
      <div v-else class="sales-content">
        <!-- Left side - Sales table -->
        <div class="sales-left">
          <div v-if="sales.length" class="sales-table-container">
            <table class="sales-table">
              <thead>
                <tr>
                  <th class="has-text-black">Date</th>
                  <th class="has-text-black">Numéro de ticket</th>
                  <th class="has-text-black">Montant total</th>
                  <th class="has-text-black">Statut</th>
                  <th class="has-text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="sale in sales" :key="sale.id" :class="{ selected: selectedSale && selectedSale.id === sale.id }"
                  style="cursor: pointer;">
                  <td @click="selectSale(sale)">
                    <i class="fas fa-calendar mr-2"></i>
                    {{ formatDate(sale.created_at) }}
                  </td>
                  <td @click="selectSale(sale)">
                    <i class="fas fa-hashtag mr-2"></i>
                    {{ sale.ticket_number }}
                  </td>
                  <td @click="selectSale(sale)">
                    <i class="fas fa-money-bill mr-2"></i>
                    {{ formatPrice(sale.total_amount) }}
                  </td>
                  <td @click="selectSale(sale)">
                    <i :class="getStatusIcon(sale.status)" :style="{ color: getStatusColor(sale.status) }" class="mr-2"></i>
                    {{ getStatusText(sale.status) }}
                  </td>
                  <td class="has-text-black">
                    <button @click="openEditModal(sale)" class="edit-button">
                      <i class="fas fa-edit mr-1"></i>
                      Modifier
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-sales">Aucune vente trouvée pour cette session.</div>
        </div>
  <template v-if="!embedded">
    <Profile />
  </template>
  <section class="user-sales-section">
  </section>


      </div>
    </div>

    <EditSaleModal v-if="showEditModal" :sale="selectedSale" @save="saveSale" @close="closeEditModal" />

    <!-- Sale Details Modal -->
    <div v-if="showDetailsModal" class="modal is-active">
      <div class="modal-background" @click="closeDetailsModal"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">
            <i class="fas fa-receipt mr-2"></i>
            Détails de la vente
          </p>
          <button class="delete" aria-label="close" @click="closeDetailsModal"></button>
        </header>
        <section class="modal-card-body">
          <div v-if="selectedSale" class="sale-details-content">
            <!-- Modern Sale Details Layout -->
            <div class="modern-sale-modal">
              <!-- Header Section -->
              <div class="sale-header-modern">
                <div class="sale-title-section">
                  <h2 class="sale-title">
                    <i class="fas fa-receipt"></i>
                    Ticket #{{ selectedSale.ticket_number }}
                  </h2>
                  <div class="sale-subtitle">
                    <span class="sale-date">
                      <i class="fas fa-calendar-alt"></i>
                      {{ formatDate(selectedSale.created_at) }}
                    </span>
                    <span class="sale-status" :class="`status-${selectedSale.status?.toLowerCase()}`">
                      <i :class="getStatusIcon(selectedSale.status)"></i>
                      {{ getStatusText(selectedSale.status) }}
                    </span>
                  </div>
                </div>
                <div class="sale-total-highlight">
                  <div class="total-amount-large">
                    {{ formatPrice(selectedSale.total_amount) }}
                  </div>
                  <div class="total-label">Montant total</div>
                </div>
              </div>

              <!-- Content Section -->
              <div class="sale-content-modern">
                <!-- Order Lines Section -->
                <div class="order-lines-section-modern">
                  <div class="section-header">
                    <h3 class="section-title">
                      <i class="fas fa-shopping-bag"></i>
                      Produits
                    </h3>
                    <div class="section-badge">
                      {{ selectedSale.order_lines?.length || 0 }} article{{ (selectedSale.order_lines?.length || 0) > 1 ? 's' : '' }}
                    </div>
                  </div>

                  <div class="products-list-modern">
                    <div class="product-item-single-line">
                      <div class="product-info">
                        <div class="product-name">Produits:</div>
                        <div class="product-details-single">
                          {{ formatOrderLines(selectedSale.order_lines) }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Summary Footer -->
                  <div class="order-summary">
                    <div class="summary-row">
                      <span>Sous-total:</span>
                      <span>{{ formatPrice(getOrderLinesTotal(selectedSale.order_lines)) }}</span>
                    </div>
                    <div class="summary-row total-row">
                      <span>Total:</span>
                      <span class="total-value">{{ formatPrice(selectedSale.total_amount) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-primary" @click="openEditModal(selectedSale)">
            <i class="fas fa-edit mr-2"></i>
            Modifier
          </button>
          <button class="button" @click="closeDetailsModal">
            <i class="fas fa-times mr-2"></i>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import axios from 'axios'

import EditSaleModal from './EditSaleModal.vue'

// When embedded in Dashboard, header/menu are hidden
const props = defineProps({
  embedded: { type: Boolean, default: false }
})

const sales = ref([])
const loading = ref(true)
const selectedSale = ref(null)
const showEditModal = ref(false)
const showDetailsModal = ref(false)

// Computed property to show scroll indicator text
const showScrollIndicator = computed(() => {
  const hasManyItems = selectedSale.value &&
                       selectedSale.value.order_lines &&
                       selectedSale.value.order_lines.length > 5
  console.log('showScrollIndicator:', hasManyItems, {
    selectedSale: !!selectedSale.value,
    hasOrderLines: !!(selectedSale.value?.order_lines),
    orderLinesLength: selectedSale.value?.order_lines?.length
  })
  // Force update to ensure reactivity
  if (hasManyItems) {
    nextTick(() => {
      console.log('Scroll indicator should be visible now')
      const indicator = document.querySelector('.scroll-indicator-text')
      if (indicator) {
        console.log('Scroll indicator element found:', indicator)
        console.log('Element styles:', window.getComputedStyle(indicator))
        console.log('Element visibility:', {
          display: indicator.style.display,
          visibility: indicator.style.visibility,
          opacity: indicator.style.opacity
        })
      } else {
        console.log('Scroll indicator element NOT found in DOM')
      }
    })
  }
  return hasManyItems
})

const selectSale = (sale) => {
  selectedSale.value = sale
  showDetailsModal.value = true
  // Check if table is scrollable after modal opens
  nextTick(() => {
    setTimeout(() => {
      checkScrollableTable()
    }, 100)
  })
}

const openEditModal = (sale) => {
  selectedSale.value = sale
  showEditModal.value = true
  showDetailsModal.value = false // Close details modal when opening edit modal
}

const closeEditModal = () => {
  showEditModal.value = false
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedSale.value = null
}

// Check if order lines table is scrollable
const checkScrollableTable = () => {
  nextTick(() => {
    const container = document.querySelector('.order-lines-modal-container')
    if (container) {
      const table = container.querySelector('.order-lines-modal-table')
      if (table && container) {
        const containerHeight = container.clientHeight
        const tableHeight = table.scrollHeight
        if (tableHeight > containerHeight) {
          container.classList.add('has-scroll')
          console.log('Table is scrollable:', { containerHeight, tableHeight, orderLinesCount: selectedSale.value?.order_lines?.length })
        } else {
          container.classList.remove('has-scroll')
          console.log('Table is not scrollable:', { containerHeight, tableHeight, orderLinesCount: selectedSale.value?.order_lines?.length })
        }
      }
    }
  })
}

// Status icon and color functions
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'complété':
    case 'completé':
      return 'fas fa-check-circle'
    case 'pending':
    case 'en attente':
      return 'fas fa-clock'
    case 'cancelled':
    case 'annulé':
    case 'annulée':
      return 'fas fa-times-circle'
    case 'refunded':
    case 'remboursé':
    case 'remboursée':
      return 'fas fa-undo-alt'
    default:
      return 'fas fa-question-circle'
  }
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'complété':
    case 'completé':
      return '#22c55e' // Green
    case 'pending':
    case 'en attente':
      return '#f59e0b' // Orange
    case 'cancelled':
    case 'annulé':
    case 'annulée':
      return '#ef4444' // Red
    case 'refunded':
    case 'remboursé':
    case 'remboursée':
      return '#6366f1' // Blue
    default:
      return '#6b7280' // Gray
  }
}

const getStatusText = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'Complété'
    case 'pending':
      return 'En attente'
    case 'cancelled':
      return 'Annulé'
    case 'refunded':
      return 'Remboursé'
    default:
      return status || 'Inconnu'
  }
}

const saveSale = async (updatedSale) => {
  try {
    const token = localStorage.getItem('token')

    // Verify that the sale has order lines before sending to API
    if (!updatedSale.order_lines || updatedSale.order_lines.length === 0) {
      console.error('Erreur: La vente doit contenir au moins une ligne de commande')
      alert('Erreur: La vente doit contenir au moins une ligne de commande')
      return
    }

    // Ensure price and total values are integers before sending to API
    const saleToUpdate = {
      ...updatedSale,
      total_amount: Math.round(updatedSale.total_amount),
      order_lines: updatedSale.order_lines.map(line => ({
        ...line,
        price: Math.round(line.price),
        total: Math.round(line.total)
      }))
    }

    await axios.put(`http://127.0.0.1:8000/api/sales/${updatedSale.id}`, saleToUpdate, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const index = sales.value.findIndex(sale => sale.id === updatedSale.id)
    if (index !== -1) {
      sales.value[index] = { ...updatedSale }
    }
    selectedSale.value = updatedSale
    showEditModal.value = false
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error.response?.data || error.message)
    alert('Erreur lors de la mise à jour de la vente: ' + (error.response?.data?.message || error.message))
  }
}

const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)} Ar`
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleDateString('fr-FR', options)
}

// Calculate total of order lines
const getOrderLinesTotal = (orderLines) => {
  if (!orderLines || !Array.isArray(orderLines)) return 0
  return orderLines.reduce((total, line) => total + (parseFloat(line.total) || 0), 0)
}

// Format order lines to display on a single line
const formatOrderLines = (orderLines) => {
  if (!orderLines || orderLines.length === 0) return 'Aucun produit'

  return orderLines.map(line => {
    const productName = line.product?.name || 'N/A'
    const quantity = line.quantity || 1
    return `${productName} (x${quantity})`
  }).join(', ')
}



// Function to get current cash register session
const fetchCurrentSession = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null

    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-register-session/my-active-session', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return data?.data || data || null
  } catch (error) {
    console.error('Impossible de récupérer la session de caisse:', error.response?.data || error.message)
    return null
  }
}

onMounted(async () => {
  loading.value = true
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  if (!user || !token) {
    loading.value = false
    return
  }

  try {
    // Get current session first
    const session = await fetchCurrentSession()

    if (!session) {
      console.error('Aucune session de caisse active trouvée')
      loading.value = false
      return
    }

    const response = await axios.get('http://127.0.0.1:8000/api/sales/current-session', {
      params: {
        user_id: user.id,
        cash_register_session_id: session.id
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    sales.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Erreur lors du chargement des ventes:', error.response?.data || error.message)
  } finally {
    loading.value = false
  }
})

// Watch for changes in selectedSale to check scrollable state
watch(selectedSale, (newSale) => {
  if (newSale && showDetailsModal.value) {
    nextTick(() => {
      setTimeout(() => {
        checkScrollableTable()
      }, 100)
    })
  }
}, { immediate: false })
</script>

<style scoped>
.full-screen-sales {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
}

.sales-container {
  margin-top: 70px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); /* Account for Profile header */
}

.sales-header {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.sales-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #d32f2f;
  margin: 0;
  text-align: center;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2rem;
  color: #666;
}

.sales-content {
  display: block;
  flex: 1;
  height: calc(100% - 80px);
}

.sales-left {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background: white;
  margin: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.no-sales {
  text-align: center;
  font-size: 1.2rem;
  color: #999;
  padding: 2rem;
}

.sales-table-container {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}



.sales-table th,
.sales-table td {
  padding: 12px 15px;
  border: 1px solid #ddd;
  text-align: left;
}

/* Sales table column sizing */
.sales-table th:nth-child(1), /* Date */
.sales-table td:nth-child(1) {
  width: 25%;
  max-width: 200px;
  text-align: left;
}

.sales-table th:nth-child(2), /* Ticket number */
.sales-table td:nth-child(2) {
  width: 20%;
  max-width: 150px;
  text-align: left;
}

.sales-table th:nth-child(3), /* Total amount */
.sales-table td:nth-child(3) {
  width: 20%;
  max-width: 120px;
  text-align: right;
}

.sales-table th:nth-child(4), /* Status */
.sales-table td:nth-child(4) {
  width: 15%;
  max-width: 100px;
  text-align: center;
}

.sales-table th:nth-child(5), /* Actions */
.sales-table td:nth-child(5) {
  width: 20%;
  max-width: 120px;
  text-align: center;
}

.sales-table th {
  background-color: #d32f2f;
  color: white;
  font-weight: 700;
  font-size: 0.9rem;
  position: sticky;
  top: 0;
  padding: 8px 12px;
}

.details-title {
  color: #d32f2f;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
  border-bottom: 2px solid #d32f2f;
  padding-bottom: 0.5rem;
}

.sales-table tbody tr {
  background-color: #fff;
  transition: background-color 0.3s ease;
}

.sales-table tbody tr:hover {
  background-color: #fce4e4;
  cursor: pointer;
}

.sales-table tbody tr.selected {
  background-color: #ffebee;
  border-left: 4px solid #d32f2f;
}

.edit-button {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.edit-button:hover {
  background-color: #b71c1c;
}

.order-lines-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: 400px; /* Limit height to enable scrolling */
}

.sale-info {
  background-color: #f8fafc;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  border-left: 4px solid #d32f2f;
}

.sale-info p {
  margin: 0.5rem 0;
  color: #333;
}

.order-lines-title {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.order-lines-table {
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.15);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fff;
  table-layout: fixed;
  max-height: 300px; /* Limit table height */
  overflow-y: auto; /* Enable vertical scrolling */
}

/* Custom scrollbar for order lines table */
.order-lines-table::-webkit-scrollbar {
  width: 8px;
}

.order-lines-table::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.order-lines-table::-webkit-scrollbar-thumb {
  background: #d32f2f;
  border-radius: 4px;
}

.order-lines-table::-webkit-scrollbar-thumb:hover {
  background: #b71c1c;
}



.order-lines-table th,
.order-lines-table td {
  padding: 6px 4px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-lines-table th:first-child,
.order-lines-table td:first-child {
  width: 40%;
  text-align: left;
  max-width: 200px;
  word-wrap: break-word;
  white-space: normal;
  line-height: 1.3;
}

/* Allow product names to wrap on very small screens */
@media (max-width: 480px) {
  .order-lines-table th:first-child,
  .order-lines-table td:first-child {
    white-space: normal;
    word-wrap: break-word;
    min-width: 120px;
    max-width: 150px;
    line-height: 1.3;
  }
}

.order-lines-table th:nth-child(2),
.order-lines-table td:nth-child(2) {
  width: 20%;
  text-align: center;
}

.order-lines-table th:nth-child(3),
.order-lines-table td:nth-child(3) {
  width: 20%;
  text-align: right;
}

.order-lines-table th:last-child,
.order-lines-table td:last-child {
  width: 20%;
  text-align: right;
}

.order-lines-table thead {
  background-color: #d32f2f;
  color: #fff;
  font-weight: 700;
  font-size: 0.85rem;
}

.order-lines-table tbody tr {
  background-color: #fff;
  transition: background-color 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  cursor: default;
}

.order-lines-table tbody tr:hover {
  background-color: #fce4e4;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.25);
}

.order-lines-table tbody td {
  border-bottom: none;
  border-right: 1px solid #eee;
}

.order-lines-table tbody td:last-child {
  border-right: none;
}

/* Responsive design for all screen types */

/* Large Desktop (1200px and up) */
@media (min-width: 1200px) {
  .sales-header {
    padding: 1.5rem 3rem;
  }

  .sales-title {
    font-size: 2rem;
  }
}

/* Desktop (1024px to 1199px) */
@media (max-width: 1199px) and (min-width: 1025px) {
}

/* Small Desktop / Large Tablet (769px to 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .sales-header {
    padding: 1rem 1.5rem;
  }
}

/* Tablet (481px to 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .order-lines-table {
    max-height: 250px; /* Smaller height for tablet */
  }

  .sales-left {
    margin: 0.5rem;
    padding: 0.75rem;
  }

  .sales-table {
    font-size: 0.85rem;
  }

  .sales-table th,
  .sales-table td {
    padding: 8px 10px;
  }

  .sales-table th {
    font-size: 0.8rem;
    padding: 6px 8px;
  }

  /* Responsive sales table columns for tablet */
  .sales-table th:nth-child(1),
  .sales-table td:nth-child(1) {
    width: 30%;
    max-width: 180px;
  }

  .sales-table th:nth-child(2),
  .sales-table td:nth-child(2) {
    width: 25%;
    max-width: 120px;
  }

  .sales-table th:nth-child(3),
  .sales-table td:nth-child(3) {
    width: 20%;
    max-width: 100px;
  }

  .sales-table th:nth-child(4),
  .sales-table td:nth-child(4) {
    width: 15%;
    max-width: 80px;
  }

  .sales-table th:nth-child(5),
  .sales-table td:nth-child(5) {
    width: 10%;
    max-width: 80px;
  }

  .order-lines-table {
    font-size: 0.85rem;
  }

  .order-lines-table th,
  .order-lines-table td {
    padding: 4px 3px;
  }

  .order-lines-table thead {
    font-size: 0.8rem;
  }

  .order-lines-table th:first-child,
  .order-lines-table td:first-child {
    width: 35%;
  }

  .sales-title {
    font-size: 1.6rem;
  }

  .details-title {
    font-size: 1.3rem;
  }
}

/* Large Mobile (361px to 480px) */
@media (max-width: 480px) and (min-width: 361px) {
  .order-lines-table {
    max-height: 200px; /* Smaller height for mobile */
  }
  .sales-header {
    padding: 0.75rem 1rem;
  }

  .sales-title {
    font-size: 1.4rem;
  }

  .sales-left {
    margin: 0.25rem;
    padding: 0.5rem;
  }

  .sales-table {
    font-size: 0.8rem;
  }

  .sales-table th,
  .sales-table td {
    padding: 6px 8px;
  }

  .sales-table th {
    font-size: 0.75rem;
    padding: 4px 6px;
  }

  /* Responsive sales table columns for large mobile */
  .sales-table th:nth-child(1),
  .sales-table td:nth-child(1) {
    width: 35%;
    max-width: 150px;
  }

  .sales-table th:nth-child(2),
  .sales-table td:nth-child(2) {
    width: 25%;
    max-width: 100px;
  }

  .sales-table th:nth-child(3),
  .sales-table td:nth-child(3) {
    width: 20%;
    max-width: 80px;
  }

  .sales-table th:nth-child(4),
  .sales-table td:nth-child(4) {
    width: 15%;
    max-width: 70px;
  }

  .sales-table th:nth-child(5),
  .sales-table td:nth-child(5) {
    width: 5%;
    max-width: 60px;
  }

  .order-lines-table {
    font-size: 0.8rem;
  }

  .order-lines-table th,
  .order-lines-table td {
    padding: 4px 3px;
  }

  .order-lines-table thead {
    font-size: 0.75rem;
  }

  .order-lines-table th:first-child,
  .order-lines-table td:first-child {
    width: 35%;
  }

  .details-title {
    font-size: 1.2rem;
  }

  .no-selection-icon {
    font-size: 2.5rem;
  }
}

/* Small Mobile (up to 360px) */
@media (max-width: 360px) {
  .order-lines-table {
    max-height: 180px; /* Even smaller height for small mobile */
  }
  .sales-header {
    padding: 0.5rem 0.75rem;
  }

  .sales-title {
    font-size: 1.2rem;
  }

  .sales-left {
    margin: 0.125rem;
    padding: 0.375rem;
  }

  .sales-table {
    font-size: 0.75rem;
  }

  .sales-table th,
  .sales-table td {
    padding: 4px 6px;
  }

  .sales-table th {
    font-size: 0.7rem;
    padding: 3px 4px;
  }

  .order-lines-table {
    font-size: 0.75rem;
  }

  .order-lines-table th,
  .order-lines-table td {
    padding: 3px 2px;
  }

  .order-lines-table thead {
    font-size: 0.7rem;
  }

  .order-lines-table th:first-child,
  .order-lines-table td:first-child {
    width: 35%;
  }

  .details-title {
    font-size: 1.1rem;
  }

  .no-selection-icon {
    font-size: 2rem;
  }

  .no-selection p {
    font-size: 1rem;
  }

  .edit-button {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  /* Responsive sales table columns for small mobile */
  .sales-table th:nth-child(1),
  .sales-table td:nth-child(1) {
    width: 40%;
    max-width: 120px;
  }

  .sales-table th:nth-child(2),
  .sales-table td:nth-child(2) {
    width: 25%;
    max-width: 80px;
  }

  .sales-table th:nth-child(3),
  .sales-table td:nth-child(3) {
    width: 20%;
    max-width: 70px;
  }

  .sales-table th:nth-child(4),
  .sales-table td:nth-child(4) {
    width: 10%;
    max-width: 50px;
  }

  .sales-table th:nth-child(5),
  .sales-table td:nth-child(5) {
    width: 5%;
    max-width: 50px;
  }
}

/* Extra Small Mobile (up to 320px) */
@media (max-width: 320px) {
  .order-lines-table {
    max-height: 150px; /* Smallest height for extra small mobile */
  }
  .sales-container {
    height: calc(100vh - 50px);
  }

  .sales-header {
    padding: 0.375rem 0.5rem;
  }

  .sales-title {
    font-size: 1.1rem;
  }

  .sales-left {
    margin: 0.125rem;
    padding: 0.25rem;
  }

  .sales-table {
    font-size: 0.7rem;
  }

  .sales-table th,
  .sales-table td {
    padding: 3px 4px;
  }

  .sales-table th {
    font-size: 0.65rem;
    padding: 2px 3px;
  }

  .order-lines-table {
    font-size: 0.7rem;
  }

  .order-lines-table th,
  .order-lines-table td {
    padding: 2px 1px;
  }

  .order-lines-table thead {
    font-size: 0.65rem;
  }

  .order-lines-table th:first-child,
  .order-lines-table td:first-child {
    width: 35%;
  }

  .details-title {
    font-size: 1rem;
  }

  .no-selection-icon {
    font-size: 1.5rem;
  }

  .no-selection p {
    font-size: 0.9rem;
  }

  .edit-button {
    padding: 4px 8px;
    font-size: 0.75rem;
  }

  /* Responsive sales table columns for extra small mobile */
  .sales-table th:nth-child(1),
  .sales-table td:nth-child(1) {
    width: 45%;
    max-width: 100px;
  }

  .sales-table th:nth-child(2),
  .sales-table td:nth-child(2) {
    width: 25%;
    max-width: 70px;
  }

  .sales-table th:nth-child(3),
  .sales-table td:nth-child(3) {
    width: 20%;
    max-width: 60px;
  }

  .sales-table th:nth-child(4),
  .sales-table td:nth-child(4) {
    width: 8%;
    max-width: 40px;
  }

  .sales-table th:nth-child(5),
  .sales-table td:nth-child(5) {
    width: 2%;
    max-width: 40px;
  }
}

/* Landscape orientation adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .sales-container {
    height: calc(100vh - 40px);
  }

  .sales-header {
    padding: 0.5rem 1rem;
  }

  .sales-title {
    font-size: 1.3rem;
  }

  .sales-left {
    margin: 0.25rem;
    padding: 0.5rem;
  }
}

/* High DPI / Retina displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .sales-table,
  .order-lines-table {
    border-width: 0.5px;
  }
}

/* Print styles */
@media print {
  .full-screen-sales {
    height: auto;
  }

  .sales-container {
    height: auto;
  }

  .sales-left {
    margin: 0;
    padding: 0.5rem;
    box-shadow: none;
    border: 1px solid #ddd;
  }

  .edit-button {
    display: none;
  }

  .sales-title,
  .details-title {
    color: black;
  }
}

/* Touch device optimizations */
@media (hover: none) and (pointer: coarse) {
  .sales-table tbody tr:hover {
    background-color: #fce4e4;
  }

  .edit-button {
    min-height: 44px;
    min-width: 44px;
  }

  .sales-table th,
  .sales-table td {
    min-height: 44px;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .sales-table tbody tr {
    transition: none;
  }

  .order-lines-table tbody tr {
    transition: none;
  }

  .edit-button {
    transition: none;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .sales-left,
  .sales-right {
    border: 2px solid #000;
  }

  .sales-table th,
  .order-lines-table thead {
    background-color: #000;
    color: #fff;
  }
}

/* Modal Styles */
.modal-card {
  max-width: 95vw;
  max-height: 85vh;
  margin: 0.5rem auto;
  z-index: 9999;
}

/* Modern Sale Modal Styles */
.modern-sale-modal {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

/* Header Section */
.sale-header-modern {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.sale-title-section {
  flex: 1;
}

.sale-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.sale-title i {
  font-size: 1.2rem;
  opacity: 0.9;
}

.sale-subtitle {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  opacity: 0.9;
}

.sale-date {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.sale-status {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sale-status.status-completed,
.sale-status.status-complété,
.sale-status.status-completé {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.sale-status.status-pending,
.sale-status.status-en attente {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.sale-status.status-cancelled,
.sale-status.status-annulé,
.sale-status.status-annulée {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.sale-total-highlight {
  text-align: right;
}

.total-amount-large {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 0.2rem;
}

.total-label {
  font-size: 0.8rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Content Section */
.sale-content-modern {
  padding: 1.5rem;
}

.order-lines-section-modern {
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #d32f2f;
}

.section-badge {
  background: #d32f2f;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* Products List - Single Line */
.products-list-modern {
  margin-bottom: 1rem;
}

.product-item-single-line {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.product-item-single-line:hover {
  background: #fef7f0;
  border-color: #d32f2f;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.1);
}

.product-info {
  flex: 1;
}

.product-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.product-details-single {
  color: #64748b;
  font-size: 0.9rem;
  line-height: 1.4;
  word-wrap: break-word;
  max-width: 100%;
}

/* Order Summary */
.order-summary {
  background: white;
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.total-row {
  font-size: 1.1rem;
  font-weight: 700;
  color: #d32f2f;
  border-bottom: none;
  padding-top: 0.75rem;
}

.total-value {
  font-size: 1.2rem;
}

.modal.is-active {
  z-index: 9998;
}

.modal-background {
  z-index: 9997;
}

.modal-card-head {
  background-color: #d32f2f;
  color: white;
}

.modal-card-title {
  color: white;
  font-weight: 700;
}



.modal-card-foot {
  justify-content: flex-end;
  gap: 0.5rem;
}

/* Responsive Modern Modal Styles */
@media (max-width: 768px) {
  .modal-card {
    max-width: 95vw;
    margin: 1rem auto;
  }

  .sale-header-modern {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
    padding: 1rem;
  }

  .sale-title-section {
    text-align: center;
  }

  .sale-title {
    font-size: 1.3rem;
    justify-content: center;
  }

  .sale-subtitle {
    justify-content: center;
    flex-wrap: wrap;
  }

  .sale-total-highlight {
    text-align: center;
  }

  .total-amount-large {
    font-size: 1.5rem;
  }

  .sale-content-modern {
    padding: 1rem;
  }

  .section-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
    text-align: center;
  }

  .section-title {
    font-size: 1rem;
  }

  .product-item-single-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .product-info {
    width: 100%;
  }

  .product-details-single {
    word-wrap: break-word;
    line-height: 1.5;
  }
}

@media (max-width: 480px) {
  .modal-card {
    max-width: 98vw;
    margin: 0.5rem auto;
  }

  .sale-header-modern {
    padding: 0.75rem;
  }

  .sale-title {
    font-size: 1.1rem;
  }

  .sale-subtitle {
    font-size: 0.8rem;
    gap: 0.5rem;
  }

  .total-amount-large {
    font-size: 1.3rem;
  }

  .sale-content-modern {
    padding: 0.75rem;
  }

  .order-lines-section-modern {
    padding: 0.75rem;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .product-item {
    padding: 0.5rem;
  }

  .product-name {
    font-size: 0.9rem;
  }

  .product-details {
    font-size: 0.8rem;
  }

  .product-total {
    font-size: 0.9rem;
  }

  .summary-row {
    font-size: 0.8rem;
  }

  .total-row {
    font-size: 1rem;
  }

  .total-value {
    font-size: 1.1rem;
  }
}
</style>
