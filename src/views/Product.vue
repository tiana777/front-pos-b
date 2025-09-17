<template>
  <div class="product-list-container">
    <div class="header-section">
      <Profile />
    </div>
    <div class="main-layout">
      <div class="sidebar">
        <div class="sidebar-header">
          <h3>Catégories</h3>
          <router-link to="/categories" class="manage-categories-btn">
            <font-awesome-icon icon="fa-solid fa-cog" />
            Gérer
          </router-link>
        </div>
        <div class="category-buttons">
          <button :class="{ active: selectedCategory === null }" @click="selectCategory(null)">
            Tous
          </button>
          <button v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategory === cat.id }"
            @click="selectCategory(cat.id)">
            {{ cat.name }}
          </button>
        </div>
      </div>

      <div class="content">
        <div class="tabs-section">
          <div class="tabs">
            <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'">Produits</button>
            <button :class="{ active: activeTab === 'categories' }" @click="activeTab = 'categories'">Catégories</button>
          </div>
        </div>

        <div v-if="activeTab === 'products'">
          <div class="search-section">
            <div class="search-box">
              <input type="text" v-model.trim="searchQuery" placeholder="Rechercher un produit..." />
              <button @click="openAddModal" title="Ajouter un produit">
                <font-awesome-icon icon="fa-solid fa-plus" />
              </button>
            </div>
          </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Chargement en cours...</p>
        </div>

        <div v-else>
          <div v-if="filteredProducts.length === 0" class="no-results">
            Aucun produit trouvé
          </div>

          <div v-else class="products-section">
            <div class="products-list">
              <div v-for="product in filteredProducts" :key="product.id" class="product-card"
                :class="{ inactive: !product.status }">
                <div class="image-container">
                  <img :src="getProductImage(product)" :alt="product.name" loading="lazy" />
                </div>

                <div class="product-details">
                  <div class="product-header">
                    <h3>{{ product.name }}</h3>
                    <p class="product-ref">{{ product.ref }}</p>
                  </div>

                  <div class="product-meta">
                    <p class="price">{{ formatPrice(product.price) }}</p>
                    <span :class="['status', product.status ? 'active' : 'inactive']">
                      {{ product.status ? 'Actif' : 'Inactif' }}
                    </span>
                  </div>

                  <div class="product-actions">
                    <button @click.stop="openEditModal(product)">
                      <font-awesome-icon icon="fa-solid fa-pencil" />
                    </button>
                    <button @click.stop="confirmDelete(product)">
                      <font-awesome-icon icon="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div v-if="activeTab === 'categories'">
          <div class="search-section">
            <input type="text" v-model.trim="categorySearchQuery" placeholder="Rechercher une catégorie..." class="input" />
          </div>

          <div v-if="categoriesLoading" class="loading">
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
                    <button @click.stop="openCategoryEditModal(category)" class="button is-small is-info">
                      <font-awesome-icon icon="fa-solid fa-pencil" />
                    </button>
                    <button @click.stop="confirmCategoryDelete(category)" class="button is-small is-danger">
                      <font-awesome-icon icon="fa-solid fa-trash" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ProductEditModal :isOpen="isEditModalOpen" :product="selectedProduct" @close="closeEditModal" @save="handleSave" />
    <AddProductModal :isOpen="isAddModalOpen" @close="closeAddModal" @added="handleAdd" />

    <CategoryCreateModal :isOpen="isCategoryCreateModalOpen" @close="closeCategoryCreateModal" @added="handleCategoryAdded" />
    <CategoryEditModal :isOpen="isCategoryEditModalOpen" :categoryData="selectedCategory" @close="closeCategoryEditModal" @updated="handleCategoryUpdated" />

    <div v-if="isDeleteConfirmOpen" class="modal is-active">
      <div class="modal-background" @click="closeDeleteConfirm"></div>
      <div class="modal-card">

        <header class="modal-header">
          <h2 class="modal-title">Confirmer la suppression</h2>
          <button class="modal-close" aria-label="Fermer" @click="closeDeleteConfirm">&times;</button>
        </header>
        <section class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer le produit <strong>{{ productToDelete?.name }}</strong> ?</p>
        </section>
        <footer class="modal-footer">
          <button class="rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60" @click="deleteProduct" :disabled="isDeleting">Supprimer</button>
          <button class="rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60" @click="closeDeleteConfirm" :disabled="isDeleting">Annuler</button>
        </footer>
      </div>
    </div>

    <!-- Modal de confirmation de suppression de catégorie -->
    <div v-if="isCategoryDeleteConfirmOpen" class="modal is-active">
      <div class="modal-background" @click="closeCategoryDeleteConfirm"></div>
      <div class="modal-card">
        <header class="modal-card-head">
          <p class="modal-card-title">Confirmer la suppression</p>
          <button class="delete" @click="closeCategoryDeleteConfirm"></button>
        </header>
        <section class="modal-card-body">
          <p>Êtes-vous sûr de vouloir supprimer la catégorie <strong>{{ categoryToDelete?.name }}</strong> ?</p>
          <p class="has-text-danger">Cette action est irréversible et supprimera également tous les produits associés.</p>
        </section>
        <footer class="modal-card-foot">
          <button class="button is-danger" @click="deleteCategory" :disabled="isCategoryDeleting">Supprimer</button>
          <button class="button" @click="closeCategoryDeleteConfirm">Annuler</button>
        </footer>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import ProductEditModal from './ProductEditModal.vue'
import AddProductModal from './AddProductModal.vue'
import CategoryCreateModal from './CategoryCreateModal.vue'
import CategoryEditModal from './CategoryEditModal.vue'
import Profile from './Profile.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

// =============================================
// ÉTATS RÉACTIFS
// =============================================
const products = ref([])            // Liste de tous les produits
const categories = ref([])           // Liste des catégories
const searchQuery = ref('')          // Terme de recherche
const selectedCategory = ref(null)   // Catégorie sélectionnée
const loading = ref(true)            // État de chargement des données
const error = ref(null)              // Message d'erreur

// États des modals
const isEditModalOpen = ref(false)   // Modal d'édition ouvert/fermé
const selectedProduct = ref(null)    // Produit sélectionné pour édition
const isAddModalOpen = ref(false)    // Modal d'ajout ouvert/fermé

// États pour la suppression
const isDeleteConfirmOpen = ref(false) // Modal de confirmation de suppression
const productToDelete = ref(null)    // Produit à supprimer
const isDeleting = ref(false)        // État pendant la suppression

// =============================================
// MÉTHODES DE CHARGEMENT DES DONNÉES
// =============================================

/**
 * Charge les catégories avec leurs produits associés
 * et les prix spécifiques au point de vente
 */
const fetchData = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    const pointOfSaleId = user?.point_of_sale_id

    // Validation du point de vente
    if (!pointOfSaleId) {
      throw new Error("Point de vente non configuré pour cet utilisateur")
    }

    // Appel API pour récupérer les catégories avec produits et prix
    const response = await axios.get('http://127.0.0.1:8000/api/categories', {
      params: {
        with_products: 1,       // Inclure les produits
        point_of_sale_id: pointOfSaleId, // ID du point de vente
        with_pricing: 1,         // Inclure les prix
      },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    })

    // L'API retourne un objet {message, data} ou un tableau
    const apiResponse = response.data

    if (!Array.isArray(apiResponse)) {
      console.error("Structure de réponse inattendue:", apiResponse)
      throw new Error("Structure de réponse API invalide")
    }

    // Stockage des catégories
    categories.value = apiResponse

    // Transformation des produits
    products.value = categories.value.reduce((allProducts, category) => {
      if (category.products && Array.isArray(category.products)) {
        const categoryProducts = category.products.map(product => ({
          ...product,
          category_id: category.id,
          category_name: category.name,
          // Extraction du prix du tableau pricing
          price: extractProductPrice(product, pointOfSaleId)
        }))
        return [...allProducts, ...categoryProducts]
      }
      return allProducts
    }, [])

  } catch (e) {
    console.error("Erreur de chargement des données :", e)
    console.error("Détails de l'erreur :", e.response?.data || e.message)
    error.value = e.response?.data?.message || e.message || 'Erreur de chargement des données'
  } finally {
    loading.value = false
  }
}

/**
 * Extrait le prix d'un produit en fonction du point de vente
 */
const extractProductPrice = (product, pointOfSaleId) => {
  if (!product.pricing || !Array.isArray(product.pricing)) return null

  // Trouver le prix correspondant au point de vente
  const pricing = product.pricing.find(p => p.point_of_sale_id === pointOfSaleId)
  return pricing ? parseFloat(pricing.price) : null
}

// Chargement initial au montage du composant
onMounted(fetchData)

// =============================================
// MÉTHODES D'INTERFACE UTILISATEUR
// =============================================

/**
 * Sélectionne une catégorie pour filtrer les produits
 */
const selectCategory = (catId) => {
  selectedCategory.value = catId
}

/**
 * Formate un prix pour l'affichage
 */
const formatPrice = (price) => {
  return price ?
    new Intl.NumberFormat('fr-FR').format(price) + ' Ar' :
    'Non disponible'
}

/**
 * Retourne l'URL de l'image du produit
 */
const getProductImage = (product) => {
  if (product.image) {
    return `http://localhost:8000/storage/${product.image}`
  }
  // Image par défaut si non disponible
  return 'https://via.placeholder.com/300x300?text=Image+non+disponible'
}

// =============================================
// COMPUTED PROPERTIES
// =============================================

/**
 * Liste filtrée des produits basée sur la catégorie et la recherche
 */
const filteredProducts = computed(() => {
  let result = products.value

  // Filtrage par catégorie
  if (selectedCategory.value !== null) {
    result = result.filter(product =>
      product.category_id === selectedCategory.value
    )
  }

  // Filtrage par recherche (nom ou référence)
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(product =>
      product.name.toLowerCase().includes(query) ||
      (product.ref && product.ref.toLowerCase().includes(query))
    )
  }

  return result
})

// =============================================
// GESTION DES MODALS D'ÉDITION
// =============================================

/**
 * Ouvre le modal d'édition pour un produit
 */
const openEditModal = (product) => {
  // Clonage pour éviter la mutation directe
  selectedProduct.value = JSON.parse(JSON.stringify(product))
  isEditModalOpen.value = true
}

/**
 * Ferme le modal d'édition
 */
const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedProduct.value = null
}

/**
 * Sauvegarde les modifications d'un produit
 */
const handleSave = async (updatedProduct) => {
  const index = products.value.findIndex(p => p.id === updatedProduct.id)
  if (index !== -1) {
    // Mise à jour avec mise à jour des infos de catégorie et prix
    products.value[index] = {
      ...updatedProduct,
      category_id: updatedProduct.category_id,
      category_name: updatedProduct.category_name,
      price: updatedProduct.price !== undefined ? updatedProduct.price : products.value[index].price
    }
  }
  closeEditModal()
}

// =============================================
// GESTION DES MODALS D'AJOUT
// =============================================

/**
 * Ouvre le modal d'ajout de produit
 */
const openAddModal = () => {
  isAddModalOpen.value = true
}

/**
 * Ferme le modal d'ajout
 */
const closeAddModal = () => {
  isAddModalOpen.value = false
}

/**
 * Ajoute un nouveau produit à la liste
 */
const handleAdd = async (newProduct) => {
  try {
    const token = localStorage.getItem('token')
    // Récupération des détails complets du produit
    const response = await axios.get(`http://127.0.0.1:8000/api/products/${newProduct.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    // Création de l'objet produit complet
    const fullProduct = {
      ...response.data,
      category_id: newProduct.category_id,
      category_name: categories.value.find(c => c.id === newProduct.category_id)?.name || ''
    }

    // Ajout en tête de liste
    products.value = [fullProduct, ...products.value]
  } catch (error) {
    console.error('Erreur lors de la récupération du produit ajouté:', error)
    // Fallback: ajout du produit de base
    products.value = [newProduct, ...products.value]
  }
  closeAddModal()
}

// =============================================
// GESTION DE LA SUPPRESSION
// =============================================

/**
 * Ouvre la confirmation de suppression
 */
const confirmDelete = (product) => {
  productToDelete.value = product
  isDeleteConfirmOpen.value = true
}

/**
 * Ferme la confirmation de suppression
 */
const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  productToDelete.value = null
}

/**
 * Supprime définitivement un produit
 */
const deleteProduct = async () => {
  if (!productToDelete.value) return
  isDeleting.value = true
  try {
    const token = localStorage.getItem('token')
    // Appel API de suppression
    await axios.delete(`http://127.0.0.1:8000/api/products/${productToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    // Filtrage du produit supprimé
    products.value = products.value.filter(p => p.id !== productToDelete.value.id)
    closeDeleteConfirm()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error.response?.data || error)
    // Affichage d'une alerte en cas d'erreur
    alert(error.response?.data?.message || 'Erreur lors de la suppression du produit')
  } finally {
    isDeleting.value = false
  }
}
</script>
<style scoped>
/* Bulma removed; using Tailwind utilities in template */

.product-list-container {
  padding: 1.5rem;
  background-color: #f5f5f5;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.main-layout {
  margin-top: 2rem;
  /* Adds a clean, consistent space below the header */
  display: flex;
  gap: 2rem;
  flex-grow: 1;
}

.sidebar {
  width: 250px;
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sidebar h3 {
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.manage-categories-btn {
  color: #00d1b2;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.manage-categories-btn:hover {
  background-color: #f0f0f0;
}

.category-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-buttons button {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background-color: #f0f0f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  color: #555;
  font-weight: 500;
}

.category-buttons button:hover {
  background-color: #e0e0e0;
}

.category-buttons button.active {
  background-color: #00d1b2;
  color: white;
  font-weight: bold;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-section {
  display: flex;
  justify-content: flex-end;
}

.search-box {
  display: flex;
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.search-box input {
  flex-grow: 1;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  font-size: 1rem;
  border-radius: 8px 0 0 8px;
}

.search-box input:focus {
  outline: none;
}

.search-box button {
  padding: 0.75rem 1rem;
  background-color: #00d1b2;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  transition: background-color 0.2s;
}

.search-box button:hover {
  background-color: #00b89c;
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

.products-section {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.product-card.inactive {
  opacity: 0.6;
}

.image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  border-bottom: 1px solid #e0e0e0;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-details {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex-grow: 1;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.product-details h3 {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
  margin: 0;
  flex-grow: 1;
}

.product-ref {
  font-size: 0.9rem;
  color: #888;
  white-space: nowrap;
  margin-left: 0.5rem;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #00d1b2;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status.active {
  background-color: #ebfffc;
  color: #00d1b2;
}

.status.inactive {
  background-color: #ffe8e8;
  color: #e51a1a;
}

.product-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  justify-content: flex-end;
}

.product-actions button {
  background-color: #f0f0f0;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: #555;
}

.product-actions button:hover {
  background-color: #e0e0e0;
}

.product-actions button:first-child {
  color: #00d1b2;
}

.product-actions button:last-child {
  color: #e51a1a;
}

/* Modals */
.modal-card {
  width: 100%;
  max-width: 480px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #dbdbdb;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  color: #888;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #dbdbdb;
}
</style>
