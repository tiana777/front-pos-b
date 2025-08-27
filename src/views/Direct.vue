<template>
  <div class="pos-container">
    <pos />
    <Profile />
    <PaymentModal :isOpen="isPaymentModalOpen" :totalAmount="totalPrice" @close-modal="handleCloseModal"
      @confirm-payment="handlePaymentConfirmation" />
    <InvoiceModal :isOpen="isInvoiceModalOpen" :items="cart" :total="totalPrice" :clientName="'Client'"
      :invoiceNumber="currentInvoiceNumber" :paymentMethod="currentPaymentMethod" @close-modal="closeInvoiceModal"
      @openPaymentModal="openPaymentModal" />

    <div class="pos-content">
      <!-- Catégories Panel -->
      <div class="categories-panel">
        <div class="panel-header">
          <h2>
            <font-awesome-icon icon="fa-solid fa-list" />
            Catégories
          </h2>
        </div>
        <div class="categories-list">
          <button v-for="category in categories" :key="category.id" class="category-btn" @click="loadProducts(category)"
            :class="{ 'active': activeCategory?.id === category.id }">
            <font-awesome-icon icon="fa-solid fa-folder" />
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Produits Panel -->
      <div class="products-panel">
        <div class="panel-header">
          <h2>
            <font-awesome-icon icon="fa-solid fa-boxes" />
            Produits
          </h2>
          <div class="search-box">
            <font-awesome-icon icon="fa-solid fa-search" />
            <input type="text" placeholder="Rechercher..." v-model="searchQuery" @input="filterProducts">
          </div>
        </div>
        <div class="products-grid">
          <div v-for="product in filteredProducts" :key="product.id" class="product-card" @click="addToCart(product)">
            <img :src="`http://localhost:8000/storage/${product.image}`" class="product-image"
              @error="handleImageError">
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="price">{{ formatPrice(product.price) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panier Panel -->
      <div class="cart-panel">
        <div class="panel-header">
          <h2>
            <font-awesome-icon icon="fa-solid fa-shopping-cart" />
            Panier
          </h2>
          <button v-if="cart.length" class="clear-cart-btn" @click="clearCart">
            <font-awesome-icon icon="fa-solid fa-trash" />
            Vider
          </button>
        </div>

        <div v-if="cart.length > 0" class="cart-content">
          <div class="cart-items">
            <div v-for="item in cart" :key="item.id" class="cart-item">
              <button class="remove-item-btn" @click="removeItem(item)">
                <font-awesome-icon icon="fa-solid fa-times" />
              </button>

              <div class="item-details">
                <span class="item-name">{{ item.name }}</span>
                <div class="quantity-controls">
                  <button class="control-btn" @click="decrementQuantity(item)">
                    <font-awesome-icon icon="fa-solid fa-minus" />
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button class="control-btn" @click="incrementQuantity(item)">
                    <font-awesome-icon icon="fa-solid fa-plus" />
                  </button>
                </div>
              </div>

              <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>

          <div class="cart-summary">
            <div class="total-section">
              <span>Total:</span>
              <span class="total-price">{{ formatPrice(totalPrice) }}</span>
            </div>
            <button class="checkout-btn" @click="checkout">
              <font-awesome-icon icon="fa-solid fa-check" />
              Valider
            </button>
          </div>
        </div>

        <div v-else class="empty-cart">
          <font-awesome-icon icon="fa-solid fa-shopping-cart" size="2x" />
          <p>Panier vide</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import Pos from './Pos.vue'
import Profile from './Profile.vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faList,
  faFolder,
  faBoxes,
  faSearch,
  faShoppingCart,
  faTrash,
  faTimes,
  faMinus,
  faPlus,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import PaymentModal from './PaymentModal.vue'
import InvoiceModal from './InvoiceModal.vue'

// Modal controls
const isPaymentModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)

const openPaymentModal = () => {
  isInvoiceModalOpen.value = false
  isPaymentModalOpen.value = true
}

const handleCloseModal = () => {
  isPaymentModalOpen.value = false
}

const paymentMethodMap = {
  'TPE': 1,
  'Orange Money': 2,
  'MVola': 3,
  'Espèce': 4,
  'Airtel Money': 5
}

const currentInvoiceNumber = ref('')
const currentPaymentMethod = ref('')

const generateInvoiceNumber = () => {
  return 'INV-' + Date.now()
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
}

const handlePaymentConfirmation = async (paymentData) => {
  console.log('Paiement confirmé:', paymentData)
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user'))
  if (!user) {
    console.error('Utilisateur non authentifié')
    return
  }
  try {
    const ticketNumber = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const totalAmount = cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const saleData = {
      user_id: user.id,
      point_of_sale_id: user.point_of_sale_id,
      cash_register_session_id: JSON.parse(localStorage.getItem('cashRegisterSession'))?.id || null,
      total_amount: totalAmount,
      discount_percentage: paymentData.discount_percentage || 0,
      status: paymentData.status || 'completed',
      payment_id: paymentMethodMap[paymentData.method] || null,
      ticket_number: ticketNumber
    }

    const response = await axios.post('http://127.0.0.1:8000/api/sales', saleData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    const saleId = response.data.id
    for (const item of cart.value) {
      const orderLineData = {
        sale_id: saleId,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      }
      await axios.post('http://127.0.0.1:8000/api/orderlines', orderLineData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
    }


    saleData.value = {
      ...response.data,
      items: [...cart.value],
      paymentMethod: paymentData.method
    }

    currentInvoiceNumber.value = `INV-${response.data.id || Date.now()}`
    currentPaymentMethod.value = paymentData.method

    clearCart()
    handleCloseModal()
  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error.response?.data || error.message)
    handleCloseModal()
  }
}

defineExpose({
  openPaymentModal
})

const checkout = () => {
  if (cart.value.length === 0) return
  currentInvoiceNumber.value = generateInvoiceNumber()
  currentPaymentMethod.value = 'En attente'
  isInvoiceModalOpen.value = true
}

// Add icons to library
library.add(faList, faFolder, faBoxes, faSearch, faShoppingCart, faTrash, faTimes, faMinus, faPlus, faCheck)

const categories = ref([])
const products = ref([])
const filteredProducts = ref([])
const cart = ref([])
const activeCategory = ref(null)
const searchQuery = ref('')

const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)} Ar`
}

const loadProducts = (category) => {
  activeCategory.value = category
  filteredProducts.value = category.products.map(p => ({
    ...p,
    price: p.pricing?.[0]?.price ? parseFloat(p.pricing[0].price) : 0
  }))
}

const filterProducts = () => {
  if (!searchQuery.value) {
    if (activeCategory.value) {
      loadProducts(activeCategory.value)
    } else {
      filteredProducts.value = [...products.value]
    }
    return
  }

  const query = searchQuery.value.toLowerCase()
  filteredProducts.value = products.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    (p.description && p.description.toLowerCase().includes(query))
  )
}

const addToCart = (product) => {
  const existing = cart.value.find(p => p.id === product.id)
  if (existing) {
    existing.quantity++
  } else {
    cart.value.push({
      ...product,
      quantity: 1,
      price: product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0
    })
  }
}

const incrementQuantity = (item) => {
  item.quantity++
}

const decrementQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--
  } else {
    removeItem(item)
  }
}

const removeItem = (item) => {
  cart.value = cart.value.filter(i => i.id !== item.id)
}

const clearCart = () => {
  cart.value = []
}

const totalPrice = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'))
  const token = localStorage.getItem('token')

  if (!user?.point_of_sale_id || !token) {
    console.error('Utilisateur non authentifié ou point de vente non défini')
    return
  }

  try {
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
    const data = Array.isArray(response.data) ? response.data : response.data.data || []
    categories.value = data
  } catch (error) {
    console.error('Erreur de chargement des produits :', error.response?.data || error.message)
  }
})

const handleImageError = (event) => {
  event.target.src = '/placeholder-image.png'
}
</script>
<style>
:root {
  --primary-color: #3e8ed0;
  --secondary-color: #48c78e;
  --accent-color: #f14668;
  --light-bg: #f5f5f5;
  --dark-text: #363636;
  --light-text: #7a7a7a;
  --border-color: #dbdbdb;
  --sidebar-width: 280px;
  --cart-width: 320px;
  --navbar-height: 70px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
  background-color: var(--light-bg);
  color: var(--dark-text);
  min-height: 100vh;
  overflow-x: hidden;
}

.pos-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header styles */
.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-color), #2c3e50);
  color: white;
  padding: 0.75rem 1.5rem;
  height: var(--navbar-height);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Main content layout */
.pos-content {
  display: flex;
  flex: 1;
  margin-top: var(--navbar-height);
  min-height: calc(100vh - var(--navbar-height));
}

/* Categories panel */
.categories-panel {
  width: var(--sidebar-width);
  background: white;
  border-right: 1px solid var(--border-color);
  padding: 1rem;
  overflow-y: auto;
}

.panel-header {
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--primary-color);
}

.panel-header h2 {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  border-radius: 6px;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-btn:hover {
  background-color: #f5f5f5;
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
}

/* Products panel */
.products-panel {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: white;
}

.search-box {
  position: relative;
  margin-bottom: 1.5rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 1rem;
}

.search-box .fa-search {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--light-text);
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.product-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 140px;
  object-fit: cover;
  background-color: #f5f5f5;
}

.product-info {
  padding: 0.75rem;
}

.product-info h3 {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price {
  font-weight: bold;
  color: var(--primary-color);
}

/* Cart panel */
.cart-panel {
  width: var(--cart-width);
  background: white;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.cart-panel .panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.clear-cart-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border: none;
  background: none;
  color: var(--accent-color);
  cursor: pointer;
  border-radius: 4px;
}

.clear-cart-btn:hover {
  background-color: #feecf0;
}

.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 1rem 1rem;
  overflow-y: auto;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--border-color);
}

.remove-item-btn {
  margin-right: 0.75rem;
  border: none;
  background: none;
  color: var(--accent-color);
  cursor: pointer;
}

.item-details {
  flex: 1;
}

.item-name {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-color);
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn:hover {
  background-color: #f5f5f5;
}

.item-price {
  font-weight: bold;
  color: var(--primary-color);
  min-width: 80px;
  text-align: right;
}

.cart-summary {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 2px solid var(--border-color);
}

.total-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
}

.total-price {
  color: var(--primary-color);
}

.checkout-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--secondary-color), #3a936c);
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.checkout-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--light-text);
  padding: 2rem;
}

.empty-cart p {
  margin-top: 1rem;
  font-size: 1.1rem;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* Responsive design */
@media (max-width: 1024px) {
  .categories-panel {
    width: 220px;
  }

  .cart-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .pos-content {
    flex-direction: column;
  }

  .categories-panel,
  .cart-panel {
    width: 100%;
    max-height: 250px;
  }

  .products-panel {
    order: 3;
    flex: 1;
  }
}
</style>
