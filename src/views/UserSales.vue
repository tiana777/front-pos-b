<template>
  <section class="user-sales-section">
    <h1 class="title">Mes Ventes</h1>
    <div v-if="loading" class="loading">Chargement des ventes...</div>
    <div v-else>
      <table v-if="sales.length" class="sales-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Numéro de ticket</th>
            <th>Montant total</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in sales" :key="sale.id">
            <td>{{ formatDate(sale.created_at) }}</td>
            <td>{{ sale.ticket_number }}</td>
            <td>{{ formatPrice(sale.total_amount) }}</td>
            <td>{{ sale.status }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-sales">Aucune vente trouvée pour cette session.</div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const sales = ref([])
const loading = ref(true)

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

  if (!user || !session || !token) {
    loading.value = false
    return
  }

  try {
    // Fetch sales for the connected user and session
    const response = await axios.get('http://127.0.0.1:8000/api/sales/current-session', {
      params: {
        user_id: user.id,
        cash_register_session_id: session.id
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    sales.value = response.data.data || []
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
}

.sales-table th,
.sales-table td {
  padding: 12px 15px;
  border: 1px solid #ddd;
  text-align: left;
}

.sales-table th {
  background-color: #f5f5f5;
  color: #d32f2f;
  font-weight: 700;
}

.sales-table tbody tr:hover {
  background-color: #f9e6e6;
  cursor: pointer;
}
</style>
