<template>
  <div class="category-manage-container">
    <Profile />
    <div class="header-section">
      <h1>Gestion des Catégories</h1>
      <button @click="openCreateModal" class="button is-primary">
        <font-awesome-icon icon="fa-solid fa-plus" />
        Ajouter une catégorie
      </button>
    </div>

    <div class="main-layout">
      <div class="content">
        <div class="search-section">
          <input type="text" v-model.trim="searchQuery" placeholder="Rechercher une catégorie..." class="input" />
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Chargement en cours...</p>
        </div>

        <div v-else>
          <div v-if="filteredCategories.length === 0" class="no-results">
            Aucune catégorie trouvée
          </div>

          <div v-else class="categories-section">
            <div class="categories-list">
              <div v-for="category in filteredCategories" :key="category.id" class="category-card">
                <div class="category-details">
                  <h3>{{ category.name }}</h3>
                  <p v-if="category.description">{{ category.description }}</p>

                  <p class="product-count">{{ category.products_count || 0 }} produits</p>
                </div>

                <div class="category-actions">
                  <button @click.stop="openEditModal(category)" class="button is-small is-info">
                    <font-awesome-icon icon="fa-solid fa-pencil" />
                  </button>
                  <button @click.stop="confirmDelete(category)" class="button is-small is-danger">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CategoryCreateModal :isOpen="isCreateModalOpen" @close="closeCreateModal" @added="handleAdded" />

    <CategoryEditModal :isOpen="isEditModalOpen" :categoryData="selectedCategory" @close="closeEditModal"
      @updated="handleUpdated" />

    <!-- Modal de confirmation de suppression -->
    <div v-if="isDeleteConfirmOpen" class="modal is-active">
      <div class="modal-background" @click="closeDeleteConfirm"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Confirmer la suppression</p>
          <button class="delete" @click="closeDeleteConfirm"></button>
        </header>
        <section class="modal-card-body">
          <p>Êtes-vous sûr de vouloir supprimer la catégorie <strong>{{ categoryToDelete?.name }}</strong> ?</p>
          <p class="has-text-danger">Cette action est irréversible et supprimera également tous les produits associés.
          </p>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-danger" @click="deleteCategory" :disabled="isDeleting">Supprimer</button>
          <button class="button" @click="closeDeleteConfirm" :disabled="isDeleting">Annuler</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import Profile from './Profile.vue'
import CategoryCreateModal from './CategoryCreateModal.vue'
import CategoryEditModal from './CategoryEditModal.vue'
import { usePrinterTypes } from '../composables/usePrinterTypes.js'

// =============================================
// ÉTATS RÉACTIFS
// =============================================
const categories = ref([])
const searchQuery = ref('')
const loading = ref(true)
const error = ref(null)

// États des modals
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const selectedCategory = ref(null)

// États pour la suppression
const isDeleteConfirmOpen = ref(false)
const categoryToDelete = ref(null)
const isDeleting = ref(false)

const { printerTypes, fetchPrinterTypes } = usePrinterTypes()

// =============================================
// MÉTHODES DE CHARGEMENT DES DONNÉES
// =============================================

/**
 * Charge les catégories depuis l'API
 */
const fetchCategories = async () => {
  try {
    loading.value = true
    const user = JSON.parse(localStorage.getItem('user'))
    const token = localStorage.getItem('token');
    const response = await axios.get('http://127.0.0.1:8000/api/categories', {
      params: {
        'with_products': 1,
        'point_of_sale_id': user.point_of_sale_id,
        'with_pricing': 1,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })
    console.log(categories)
    const data = Array.isArray(response.data) ? response.data : response.data.data || []
    categories.value = data.map(cat => ({
      ...cat,
      products_count: cat.products ? cat.products.length : 0
    }))
    loading.value = false
  } catch (error) {
    console.error('Erreur de chargement des produits :', error.response?.data || error.message)
    loading.value = false
  }
};

// Chargement initial
onMounted(() => {
  fetchCategories()
  fetchPrinterTypes()
})

// =============================================
// COMPUTED PROPERTIES
// =============================================

/**
 * Liste filtrée des catégories basée sur la recherche
 */
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return categories.value
  const query = searchQuery.value.toLowerCase()
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(query) ||
    (category.description && category.description.toLowerCase().includes(query))
  )
})



// =============================================
// GESTION DES MODALS
// =============================================

/**
 * Ouvre le modal de création
 */
const openCreateModal = () => {
  isCreateModalOpen.value = true
}

/**
 * Ferme le modal de création
 */
const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

/**
 * Gère l'ajout d'une nouvelle catégorie
 */
const handleAdded = async (newCategory) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('http://127.0.0.1:8000/api/categories', newCategory, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    categories.value.push(response.data)
    closeCreateModal()
  } catch (e) {
    console.error('Erreur lors de l\'ajout:', e)
    alert(e.response?.data?.message || 'Erreur lors de l\'ajout de la catégorie')
  }
}

/**
 * Ouvre le modal d'édition
 */
const openEditModal = (category) => {
  selectedCategory.value = { ...category }
  isEditModalOpen.value = true
}

/**
 * Ferme le modal d'édition
 */
const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedCategory.value = null
}

/**
 * Gère la mise à jour d'une catégorie
 */
const handleUpdated = async (updatedCategory) => {
  try {
    console.log(updatedCategory)
    const token = localStorage.getItem('token')
    const response = await axios.put(`http://127.0.0.1:8000/api/categories/${updatedCategory.id}`, updatedCategory, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    // Rafraîchir la liste des catégories après mise à jour
    await fetchCategories()
    closeEditModal()
  } catch (e) {
    console.error('Erreur lors de la modification:', e)
    alert(e.response?.data?.message || 'Erreur lors de la modification de la catégorie')
  }
}

// =============================================
// GESTION DE LA SUPPRESSION
// =============================================

/**
 * Ouvre la confirmation de suppression
 */
const confirmDelete = (category) => {
  categoryToDelete.value = category
  isDeleteConfirmOpen.value = true
}

/**
 * Ferme la confirmation de suppression
 */
const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  categoryToDelete.value = null
}

/**
 * Supprime une catégorie
 */
const deleteCategory = async () => {
  if (!categoryToDelete.value) return
  isDeleting.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`http://127.0.0.1:8000/api/categories/${categoryToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    categories.value = categories.value.filter(c => c.id !== categoryToDelete.value.id)
    closeDeleteConfirm()
  } catch (e) {
    console.error('Erreur lors de la suppression:', e)
    alert(e.response?.data?.message || 'Erreur lors de la suppression de la catégorie')
  } finally {
    isDeleting.value = false
  }
}


</script>

<style scoped>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';

.category-manage-container {
  padding: 1.5rem;
  background-color: #f5f5f5;
  min-height: 100vh;
  margin-top: 70px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-section h1 {
  margin: 0;
  color: #333;
}

.search-section {
  margin-bottom: 1.5rem;
}

.search-section .input {
  max-width: 400px;
}

.loading,
.no-results {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #777;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #00d1b2;
  animation: spin 1s ease infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.categories-section {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.categories-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.category-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.category-details h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.category-details p {
  margin: 0.25rem 0;
  color: #666;
}

.product-count {
  font-size: 0.9rem;
  color: #888;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.category-actions .button {
  min-width: 36px;
}
</style>
