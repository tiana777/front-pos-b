<template>
  <template v-if="!embedded">
    <Profile />
  </template>
  <section class="user-sales-section">

    <h1 class="title has-text-black">Mes Ventes</h1>
    <div v-if="loading" class="loading">Chargement des ventes...</div>
    <div v-else>
      <table v-if="sales.length" class="sales-table">
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
            <td @click="selectSale(sale)">{{ formatDate(sale.created_at) }}</td>
            <td @click="selectSale(sale)">{{ sale.ticket_number }}</td>
            <td @click="selectSale(sale)">{{ formatPrice(sale.total_amount) }}</td>
            <td @click="selectSale(sale)">{{ sale.status }}</td>
            <td class="has-text-black">
              <button @click="openEditModal(sale)" class="edit-button">Modifier</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-sales">Aucune vente trouvée pour cette session.</div>

      <div v-if="selectedSale" class="order-lines-section">
        <h2>Détails de la vente - Ticket {{ selectedSale.ticket_number }}</h2>
        <table class="order-lines-table">
          <thead>
            <tr>
              <th class="has-text-black">Produit</th>
              <th class="has-text-black">Quantité</th>
              <th class="has-text-black">Prix unitaire</th>
              <th class="has-text-black">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in selectedSale.order_lines" :key="line.id">
              <td class="has-text-black">{{ line.product.name }}</td>
              <td class="has-text-black">{{ line.quantity }}</td>
              <td class="has-text-black">{{ formatPrice(line.price) }}</td>
              <td class="has-text-black">{{ formatPrice(line.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <EditSaleModal v-if="showEditModal" :sale="selectedSale" @save="saveSale" @close="closeEditModal" />
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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

const selectSale = (sale) => {
  selectedSale.value = sale
}

const openEditModal = (sale) => {
  selectedSale.value = sale
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveSale = async (updatedSale) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://127.0.0.1:8000/api/sales/${updatedSale.id}`, updatedSale, {
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
  }
}

const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)} Ar`
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleDateString('fr-FR', options)
}

onMounted(async () => {
  loading.value = true
  const user = JSON.parse(localStorage.getItem('user'))
  const session = JSON.parse(localStorage.getItem('cashRegisterSession'))
  const token = localStorage.getItem('token')

  if (!user || !token) {
    loading.value = false
    return
  }

  try {
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
</script>

<style scoped>
.user-sales-section {
  max-width: 900px;
  margin: 2rem auto;
  padding: 1rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  color: #333;
}

.title {
  text-align: center;
  margin-bottom: 1.5rem;
  font-weight: 700;
  font-size: 1.8rem;
  color: #d32f2f;
}

.loading {
  text-align: center;
  font-size: 1.2rem;
  color: #666;
}

.no-sales {
  text-align: center;
  font-size: 1.2rem;
  color: #999;
  margin-top: 2rem;
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

.sales-table th {
  background-color: #d32f2f;
  color: white;
  font-weight: 700;
  font-size: 1rem;
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
  margin-top: 2rem;
  padding: 1rem;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-lines-section h2 {
  color: #d32f2f;
  font-size: 1.5rem;
  margin-bottom: 1rem;
  text-align: center;
}

.order-lines-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 10px;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(211, 47, 47, 0.15);
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #fff;
}

.order-lines-table th,
.order-lines-table td {
  padding: 12px 20px;
  text-align: left;
}

.order-lines-table thead {
  background-color: #d32f2f;
  color: #fff;
  font-weight: 700;
  font-size: 1rem;
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

@media (max-width: 768px) {
  .user-sales-section {
    margin: 1rem;
    padding: 0.5rem;
  }

  .sales-table {
    font-size: 0.9rem;
  }

  .sales-table th,
  .sales-table td {
    padding: 8px 10px;
  }

  .order-lines-table {
    font-size: 0.9rem;
  }
}
</style>
