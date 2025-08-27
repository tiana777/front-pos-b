<template>
  <div class="pos-manage-container">
    <h1>Gestion des Points de Vente</h1>

    <div class="actions">
      <button @click="showAddForm = true">Ajouter un Point de Vente</button>
    </div>

    <div v-if="loading" class="loading">Chargement des points de vente...</div>

    <div v-else>
      <table class="pos-table">
        <thead>
          <tr>
            <th class="has-text-black">Nom</th>
            <th class="has-text-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pos in pointsOfSale" :key="pos.id">
            <td class="has-text-black">{{ pos.name }}</td>
            <td class="has-text-black">
              <button @click="editPointOfSale(pos)">Éditer</button>
              <button @click="deletePointOfSale(pos.id)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add/Edit Form Modal -->
    <div v-if="showAddForm || showEditForm" class="modal-overlay">
      <div class="modal-content">
        <h2>{{ showEditForm ? 'Éditer Point de Vente' : 'Ajouter Point de Vente' }}</h2>
        <form @submit.prevent="submitForm">
          <label for="name">Nom:</label>
          <input id="name" v-model="form.name" required />

          <div class="modal-actions">
            <button type="submit">{{ showEditForm ? 'Mettre à jour' : 'Ajouter' }}</button>
            <button type="button" @click="closeForm">Annuler</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const pointsOfSale = ref([])
const loading = ref(true)
const showAddForm = ref(false)
const showEditForm = ref(false)
const form = ref({
  id: null,
  name: ''
})

const fetchPointsOfSale = async () => {
  loading.value = true
  try {
    const response = await axios.get('http://127.0.0.1:8000/api/point_of_sales')
    pointsOfSale.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des points de vente:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (showEditForm.value) {
    // Update existing point of sale
    try {
      await axios.put(`http://127.0.0.1:8000/api/point_of_sales/${form.value.id}`, {
        name: form.value.name
      })
      await fetchPointsOfSale()
      closeForm()
    } catch (error) {
      console.error('Erreur lors de la mise à jour du point de vente:', error)
    }
  } else {
    // Add new point of sale
    try {
      await axios.post('http://127.0.0.1:8000/api/point_of_sales', {
        name: form.value.name
      })
      await fetchPointsOfSale()
      closeForm()
    } catch (error) {
      console.error('Erreur lors de l\'ajout du point de vente:', error)
    }
  }
}

const editPointOfSale = (pos) => {
  form.value.id = pos.id
  form.value.name = pos.name
  showEditForm.value = true
  showAddForm.value = false
}

const deletePointOfSale = async (id) => {
  if (confirm('Voulez-vous vraiment supprimer ce point de vente ?')) {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/point_of_sales/${id}`)
      await fetchPointsOfSale()
    } catch (error) {
      console.error('Erreur lors de la suppression du point de vente:', error)
    }
  }
}

const closeForm = () => {
  showAddForm.value = false
  showEditForm.value = false
  form.value.id = null
  form.value.name = ''
}

onMounted(() => {
  fetchPointsOfSale()
})
</script>

<style scoped>
.pos-manage-container {
  padding: 1rem;
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}

.actions {
  margin-bottom: 1rem;
}

.pos-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.pos-table th,
.pos-table td {
  border: 1px solid #ccc;
  padding: 0.5rem;
  text-align: left;
}

button {
  margin-right: 0.5rem;
  padding: 0.3rem 0.6rem;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #b71c1c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  text-align: left;
}

.modal-actions {
  margin-top: 1rem;
  text-align: right;
}

input {
  width: 100%;
  padding: 0.5rem;
  margin-top: 0.3rem;
  box-sizing: border-box;
}
</style>
