<template>
  <div class="product-list-container">
    <pos />
    <h1 class="title">Liste des Produits</h1>
    <div class="main-layout">
      <!-- Sidebar : Liste des catégories -->
      <div class="sidebar">
        <h3>Catégories</h3>
        <button :class="{ active: selectedCategory === null }" @click="selectCategory(null)">
          Tous
        </button>
        <button v-for="cat in categories" :key="cat.id" :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)">
          {{ cat.name }}
        </button>
      </div>

      <!-- Content : Boîte de recherche et grille de produits -->
      <div class="content">
        <div class="search-box is-flex is-justify-content-space-between is-align-items-center">
          <input type="text" v-model.trim="searchQuery" placeholder="Rechercher un produit..." class="search-input" />
          <button class="button is-primary is-light ml-3" @click="openAddModal" title="Ajouter un produit">
            <span class="icon">
              <font-awesome-icon icon="fa-solid fa-plus" />
            </span>
          </button>
        </div>
        <div v-if="loading" class="loading">Chargement en cours...</div>
        <div v-else>
          <div v-if="filteredProducts.length === 0" class="no-results">
            Aucun produit trouvé
          </div>
          <div v-else class="products-list">
            <div v-for="product in filteredProducts" :key="product.id" class="product-list-item"
              :class="{ inactive: !product.status }">
              <div class="image-container">
                <img :src="`http://localhost:8000/storage/${product.image}`" :alt="product.name" class="product-image"
                  loading="lazy" />
              </div>
              <div class="product-info">
                <!-- Nom du produit -->
                <div class="product-container">
                  <!-- Colonne 1 : Nom & Référence -->
                  <div class="column">
                    <h3 class="product-name">{{ product.name }}</h3>
                    <h3 class="product-ref">{{ product.ref }}</h3>
                  </div>

                  <!-- Colonne 2 : Prix & Statut -->
                  <div class="column">
                    <div class="info-row">
                      <p class="price">{{ product.price ? product.price : 'Non disponible' }} Ar</p>
                    </div>
                    <p class="status" :class="product.status ? 'active' : 'inactive'">
                      {{ product.status ? 'Actif' : 'Inactif' }}
                    </p>
                  </div>
                </div>

                <!-- Bouton Éditer -->

                <div class="buttons are-small is-flex is-justify-content-flex-end mt-2">
                  <button class="button is-info is-light" @click.stop="openEditModal(product)">
                    <span class="icon">
                      <font-awesome-icon icon="fa-solid fa-pencil" />
                    </span>
                  </button>
                  <button class="button is-danger is-light ml-2" @click.stop="confirmDelete(product)">
                    <span class="icon">
                      <font-awesome-icon icon="fa-solid fa-trash" />
                    </span>
                  </button>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal d'édition -->
    <ProductEditModal :isOpen="isEditModalOpen" :product="selectedProduct" @close="closeEditModal" @save="handleSave" />

    <!-- Modal d'ajout -->
    <AddProductModal :isOpen="isAddModalOpen" @close="closeAddModal" @added="handleAdd" />

    <!-- Modal de confirmation de suppression -->
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
          <button class="button is-danger" @click="deleteProduct" :disabled="isDeleting">Supprimer</button>
          <button class="button" @click="closeDeleteConfirm" :disabled="isDeleting">Annuler</button>
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
import Pos from './Pos.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
// Références réactives principales
const products = ref([])
const searchQuery = ref('')
const selectedCategory = ref(null)
const isEditModalOpen = ref(false)
const selectedProduct = ref(null)
const isAddModalOpen = ref(false)
const loading = ref(true)
const error = ref(null)
const categories = ref([])

// Chargement des catégories via l'API
const fetchCategories = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://127.0.0.1:8000/api/categories', {
      headers: { Authorization: `Bearer ${token}` },
    })
    categories.value = response.data
  } catch (e) {
    console.error("Erreur de chargement des catégories :", e)
  }
}

// Chargement des produits via l'API
const fetchProducts = async () => {
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))
    const { data } = await axios.get('http://127.0.0.1:8000/api/products', {
      params: { point_of_sale_id: user?.point_of_sale_id || null },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
    products.value = data
  } catch (err) {
    error.value =
      err.response?.data?.message || 'Erreur de chargement des produits'
    console.error('Erreur:', err)
  } finally {
    loading.value = false
  }
}

// Appel des chargements lors du montage
onMounted(() => {
  fetchCategories()
  fetchProducts()
})

// Méthode pour sélectionner une catégorie
const selectCategory = (catId) => {
  selectedCategory.value = catId
}

// Computed qui retourne la liste filtrée selon la recherche et la catégorie sélectionnée
const filteredProducts = computed(() => {
  let result = products.value
  if (selectedCategory.value !== null) {
    result = result.filter((product) => {
      // On compare avec product.category_id ou product.category.id si l'objet category existe
      return product.category
        ? product.category.id === selectedCategory.value
        : product.category_id === selectedCategory.value
    })
  }
  if (searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((product) =>
      product.name.toLowerCase().includes(query)
    )
  }
  return result
})

// Gestion du modal d'édition
const openEditModal = (product) => {
  // Clonage pour éviter les effets secondaires liés aux proxies Vue
  selectedProduct.value = JSON.parse(JSON.stringify(product))
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedProduct.value = null
}

// Gestion de la sauvegarde d'un produit édité
const handleSave = async (updatedProduct) => {
  console.log('Produit mis à jour reçu :', updatedProduct);

  const index = products.value.findIndex(p => p.id === updatedProduct.id);
  console.log('Index trouvé :', index);

  if (index !== -1) {
    const updatedProducts = [...products.value];

    const matchedCategory = categories.value.find(c =>
      c.id === (updatedProduct.category_id || updatedProduct.category?.id)
    );

    // Récupérer le point_of_sale_id de l'utilisateur connecté depuis localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const userPointOfSaleId = user?.point_of_sale_id;

    if (!userPointOfSaleId) {
      console.error('Point of sale ID introuvable dans le localStorage');
      return;
    }

    // Trouver le pricing correspondant au point de vente de l'utilisateur
    const matchedPricing = updatedProduct.pricing.find(p => p.point_of_sale_id === userPointOfSaleId);

    updatedProducts[index] = {
      ...updatedProduct,
      category: matchedCategory || null,
      price: matchedPricing?.price || updatedProduct.price // Assure que seul le bon prix est utilisé
    };

    products.value = updatedProducts;
    console.log('Produits mis à jour :', products.value);
  } else {
    console.warn('Produit non trouvé dans la liste !');
  }

  closeEditModal();
}

// Gestion du modal d'ajout
const openAddModal = () => {
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

// Gestion de l'ajout d'un produit
const handleAdd = async (newProduct) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`http://127.0.0.1:8000/api/products/${newProduct.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const fullProduct = response.data
    console.log('Produit complet récupéré:', fullProduct)
    products.value = [fullProduct, ...products.value]
    console.log('Liste des produits mise à jour:', products.value)
  } catch (error) {
    console.error('Erreur lors de la récupération du produit ajouté:', error)
    // Fallback to adding the original newProduct if fetch fails
    products.value = [newProduct, ...products.value]
  }
  closeAddModal()
}

// Gestion du modal de confirmation de suppression
const isDeleteConfirmOpen = ref(false)
const productToDelete = ref(null)
const isDeleting = ref(false)

const confirmDelete = (product) => {
  productToDelete.value = product
  isDeleteConfirmOpen.value = true
}

const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  productToDelete.value = null
}

const deleteProduct = async () => {
  if (!productToDelete.value) return
  console.log(productToDelete.value.id)
  isDeleting.value = true
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`http://127.0.0.1:8000/api/products/${productToDelete.value.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    products.value = products.value.filter(p => p.id !== productToDelete.value.id)
    closeDeleteConfirm()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error.response?.data || error)
    alert(error.response?.data?.message || 'Erreur lors de la suppression du produit')
  } finally {
    isDeleting.value = false
  }
}


</script>

<style scoped>
/* Container général */
.product-list-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding: 0;
}

.title {
  padding: 5rem 2rem 0;
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Layout principal */
.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0;
  overflow: hidden;
}

/* Sidebar modernisée */
.sidebar {
  background: white;
  padding: 1.5rem;
  border-right: 1px solid #e2e8f0;
  height: calc(100vh - 80px);
  overflow-y: auto;
}

.sidebar h3 {
  font-size: 0.9rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1rem;
}

.sidebar button {
  width: 100%;
  padding: 0.75rem 1rem;
  margin: 0.25rem 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #475569;
  font-size: 0.95rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar button::before {
  content: '';
  width: 6px;
  height: 6px;
  background: #cbd5e1;
  border-radius: 50%;
}

.sidebar button:hover,
.sidebar button.active {
  background: #f1f5f9;
  color: #2563eb;
}

.sidebar button.active::before {
  background: #2563eb;
}

/* Contenu principal */
.content {
  height: calc(100vh - 80px);
  overflow-y: auto;
  padding: 2rem;
  background: #f8fafc;
}

/* Boîte de recherche améliorée */
.search-box {
  position: relative;
  margin-bottom: 2rem;
  /* max-width: 400px; */
}

.search-input {
  width: 100%;
  padding: 0.875rem 1.25rem;
  padding-left: 2.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>') no-repeat 1rem center;
  background-size: 20px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Grille de produits moderne */
.products-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
  padding: 1rem 0;
}

.product-list-item {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.product-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
}

/* Image avec effet hover */
.image-container {
  position: relative;
  padding-top: 100%;
  background: #f8fafc;
  overflow: hidden;
}

.image-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 60%, rgba(0, 0, 0, 0.05) 100%);
  z-index: 1;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-list-item:hover .product-image {
  transform: scale(1.03);
}

/* Informations produit */
.product-info {
  padding: 1.25rem;
}

.product-name {
  font-size: 1rem;
  font-weight: 400;
  color: #07090c;
}

.product-ref {
  font-size: 1rem;
  font-weight: 400;
  color: #07090c;
}

.product-container {
  display: flex;
  gap: 20px;
  /* Espacement entre les colonnes */
}

.column {
  flex: 1;
  /* Chaque colonne prend 50% de l'espace */
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.category {
  font-size: 0.85rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.price {
  font-weight: 700;
  color: #2563eb;
  font-size: 1.1rem;
}

.status {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  display: inline-block;
  width: fit-content;
}

.status.active {
  background: #dbeafe;
  color: #2563eb;
}

.status.inactive {
  background: #fee2e2;
  color: #dc2626;
}

/* Bouton Éditer modernisé */
.edit-button {
  width: 100%;
  margin-top: 1rem;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.edit-button:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

/* État de chargement moderne */
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50vh;
  font-size: 1rem;
  color: #64748b;
}

.loading::after {
  content: "";
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  margin-left: 0.75rem;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .main-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    display: none;
    /* Cache la sidebar sur mobile */
  }

  .content {
    padding: 1.5rem;
    height: auto;
  }

  .products-list {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

@media (max-width: 480px) {
  .title {
    padding: 1rem;
    font-size: 1.5rem;
  }

  .content {
    padding: 1rem;
  }

  .products-list {
    grid-template-columns: 1fr;
  }
}
</style>
