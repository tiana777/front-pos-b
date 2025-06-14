<template>
  <div class="pos-container">
    <pos />
    <Profile />
    <PaymentModal :isOpen="isPaymentModalOpen" :totalAmount="totalPrice" @close-modal="handleCloseModal"
      @confirm-payment="handlePaymentConfirmation" />
    <div class="pos-content mt-6" style="margin: 1rem;">
      <!-- Catégories -->
      <div class="categories-panel">
        <div class="panel-header">
          <h2><font-awesome-icon icon="fa-solid fa-list" /> Catégories</h2>
        </div>
        <!-- Dans la section template -->
        <div class="categories-list" style="display: grid; grid-template-columns: 1fr 1fr; gap: 3px">
          <button v-for="category in categories" :key="category.id" class="category-btn" @click="loadProducts(category)"
            :class="{ 'active': activeCategory?.id === category.id }">
            <font-awesome-icon icon="fa-solid fa-folder" />
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Produits -->
      <div class="products-panel">
        <div class="panel-header">
          <h2><font-awesome-icon icon="fa-solid fa-boxes" /> Produits</h2>
          <div class="search-box">
            <font-awesome-icon icon="fa-solid fa-search" />
            <input type="text" placeholder="Rechercher..." v-model="searchQuery" @input="filterProducts">
          </div>
        </div>
        <div class="products-grid">
          <div v-for="product in filteredProducts" :key="product.id" class="product-card" @click="addToCart(product)">
            <img :src="`http://localhost:8000/storage/${product.image}`" class="product-image">

            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="price"><font-awesome-icon icon="fa-solid fa-tag" /> {{
                formatPrice(product.price)
              }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panier -->
      <div class="cart-panel">
        <div class="panel-header">
          <h2><font-awesome-icon icon="fa-solid fa-shopping-cart" /> Panier</h2>
          <button v-if="cart.length" class="clear-cart-btn" @click="clearCart">
            <font-awesome-icon icon="fa-solid fa-trash" />
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
                  <button @click="decrementQuantity(item)">
                    <font-awesome-icon icon="fa-solid fa-minus" />
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button @click="incrementQuantity(item)">
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
              <font-awesome-icon icon="fa-solid fa-check" /> Valider la commande
            </button>
          </div>
        </div>

        <div v-else class="empty-cart">
          <font-awesome-icon icon="fa-solid fa-shopping-cart" size="2x" />
          <p>Votre panier est vide</p>
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
  faTag,
  faShoppingCart,
  faTrash,
  faTimes,
  faMinus,
  faPlus,
  faCheck
} from '@fortawesome/free-solid-svg-icons'
import PaymentModal from './PaymentModal.vue'


// Ajoutez cette variable pour contrôler l'état de la modal
const isPaymentModalOpen = ref(false);

// Fonction pour ouvrir la modal (appelée par le bouton Valider)
const openPaymentModal = () => {
  isPaymentModalOpen.value = true;
};

// Fonction appelée quand la modal émet 'close-modal'
const handleCloseModal = () => {
  isPaymentModalOpen.value = false;

};

const paymentMethodMap = {
  'TPE': 1,
  'Orange Money': 2,
  'MVola': 3,
  'Espèce': 4,
  'Airtel Money': 5
};

const handlePaymentConfirmation = async (paymentData) => {
  console.log('Paiement confirmé:', paymentData);
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    console.error('Utilisateur non authentifié');
    return;
  }
  try {
    // Generate a unique ticket number (e.g., timestamp + random)
    const ticketNumber = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Calculate total amount from cart
    const totalAmount = cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Prepare sale data
    const saleData = {
      user_id: user.id,
      point_of_sale_id: user.point_of_sale_id,
      cash_register_session_id: JSON.parse(localStorage.getItem('cashRegisterSession'))?.id || null,
      total_amount: totalAmount,
      discount_percentage: paymentData.discount_percentage || 0,
      status: paymentData.status || 'completed',
      payment_id: paymentMethodMap[paymentData.method] || null,
      ticket_number: ticketNumber
    };
    console.log(saleData)

    const response = await axios.post('http://127.0.0.1:8000/api/sales', saleData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Vente créée avec succès:', response.data);

    // After sale creation, create order lines
    const saleId = response.data.id;
    for (const item of cart.value) {
      const orderLineData = {
        sale_id: saleId,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity
      };
      try {
        await axios.post('http://127.0.0.1:8000/api/orderlines', orderLineData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Ligne de commande créée:', orderLineData);
      } catch (orderLineError) {
        console.error('Erreur lors de la création de la ligne de commande:', orderLineError.response?.data || orderLineError.message);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la création de la vente:', error.response?.data || error.message);
  }
  handleCloseModal();
  clearCart();
}

// Exposez openPaymentModal si nécessaire (pour le bouton Valider)
defineExpose({
  openPaymentModal
});

// Modifiez la fonction checkout pour ouvrir la modal
const checkout = () => {
  if (cart.value.length === 0) return
  openPaymentModal()
}




// Ajouter les icônes à la bibliothèque
library.add(faList, faFolder, faBoxes, faSearch, faTag, faShoppingCart, faTrash, faTimes, faMinus, faPlus, faCheck)

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
    const response = await axios.get('http://127.0.0.1:8000/api/product_of_category_with_price', {
      params: { point_of_sale_id: user.point_of_sale_id },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    const data = Array.isArray(response.data) ? response.data : response.data.data || []
    categories.value = data

    products.value = data.flatMap(category =>
      (category.products || []).map(product => ({
        ...product,
        price: product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0
      }))
    )

    filteredProducts.value = [...products.value]
  } catch (error) {
    console.error('Erreur de chargement des produits :', error.response?.data || error.message)
  }
})

const handleImageError = (event) => {
  event.target.src = '/placeholder-image.png'; // Fallback to a placeholder
}
</script>

<style scoped>
/* Améliorations typographiques */
.panel-header h2 {
  font-size: 1.2rem;
  font-weight: 700;
  /* Plus gras */
  color: #000;
  /* Noir pur */
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-btn {
  font-weight: 600;
  /* Semi-gras */
  color: #000;
  /* Noir */
  /* ... autres propriétés inchangées ... */
}

.product-info h3 {
  font-size: 1rem;
  font-weight: 700;
  /* Gras */
  color: #000;
  /* Noir */
  margin: 0 0 8px 0;
}

.description {
  font-weight: 500;
  /* Medium */
  color: #333;
  /* Gris très foncé */
  /* ... autres propriétés inchangées ... */
}

.price {
  font-weight: 700;
  /* Gras */
  color: #d32f2f;
  /* Conserve la couleur rouge pour les prix */
  /* ... autres propriétés inchangées ... */
}

.item-name {
  font-size: 0.9rem;
  font-weight: 600;
  /* Semi-gras */
  color: #000;
  /* Noir */
  margin-bottom: 5px;
}

.item-price {
  font-weight: 700;
  /* Très gras */
  color: #d32f2f;
  /* ... autres propriétés inchangées ... */
}

.total-section {
  font-weight: 700;
  /* Très gras */
  color: #000;
  /* Noir */
  /* ... autres propriétés inchangées ... */
}

.total-price {
  font-weight: 800;
  /* Extra-gras */
  color: #d32f2f;
}

.checkout-btn {
  font-weight: 700;
  /* Gras */
  /* ... autres propriétés inchangées ... */
}

.empty-cart p {
  font-weight: 600;
  /* Semi-gras */
  color: #000;
  /* Noir */
}

/* Pour la modal de paiement (si vous l'ajoutez dans le même fichier) */
.modal-card-title {
  font-weight: 700;
  /* Gras */
  color: #fff;
  /* Blanc pour contraste sur fond rouge */
}

.payment-name {
  font-weight: 600;
  /* Semi-gras */
  color: #000;
  /* Noir */
}

.pos-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #28292b;
}

.pos-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Panels common styles */
.categories-panel,
.products-panel,
.cart-panel {
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin: 0px;
}

.panel-header {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.panel-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Categories panel */
.categories-panel {
  flex: 0 0 250px;
}

.categories-list {
  overflow-y: auto;
  padding: 10px;
}

.category-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 15px;
  margin-bottom: 8px;
  border: none;
  border-radius: 6px;
  background-color: #f1f1f1;
  color: #333;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 8px;
}

.category-btn:hover {
  background-color: #e9e9e9;
}

.category-btn.active {
  background-color: #d32f2f;
  color: white;
}

/* Products panel */
.products-panel {
  flex: 1;
}

.search-box {
  width: 200px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.search-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 0.9rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
  padding: 15px;
  overflow-y: auto;

}

.product-card {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* Pour pousser le prix en bas */
}

.product-image {
  width: 100%;
  height: 120px;
  /* Hauteur fixe pour l'image */
  object-fit: cover;
  /* Assure que l'image couvre la zone sans se déformer */
  border-radius: 6px 6px 0 0;
  /* Coins arrondis en haut */
  margin-bottom: 10px;
  background-color: #f0f0f0;
  /* Couleur de fond pour placeholder */
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border-color: #d32f2f;
}

.product-info {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  /* Permet à cette section de grandir */
}

.product-info h3 {
  font-size: 1rem;
  margin: 0 0 8px 0;
  color: #333;
}

.description {
  font-size: 0.8rem;
  color: #666;
  margin: 0 0 10px 0;
  flex-grow: 1;
}

.price {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  color: #d32f2f;
  margin: 0;
}

/* Cart panel */
.cart-panel {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
}

.clear-cart-btn {
  background: none;
  border: none;
  color: #d32f2f;
  cursor: pointer;
  font-size: 1rem;
}

.cart-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.cart-items {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  gap: 10px;
}

.remove-item-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  flex-shrink: 0;
}

.remove-item-btn:hover {
  color: #d32f2f;
}

.item-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.item-price {
  font-weight: 600;
  color: #d32f2f;
  min-width: 70px;
  text-align: right;
}

.cart-summary {
  padding: 15px;
  border-top: 1px solid #eee;
  background-color: #f8f9fa;
}

.total-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.total-price {
  font-weight: 600;
  color: #d32f2f;
}

.checkout-btn {
  width: 100%;
  padding: 12px;
  background-color: #d32f2f;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.checkout-btn:hover {
  background-color: #b71c1c;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-cart svg {
  margin-bottom: 15px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #d32f2f;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b71c1c;
}
</style>
