<template>
  <!-- Modals -->
  <PaymentModal
    :isOpen="isPaymentModalOpen"
    :saleId="currentSaleId || 0"
    :totalAmount="totalPrice"
    :saleData="saleDataForModal"
    @close-modal="handleClosePaymentModal"
    @payment-success="handlePaymentSuccess"
    @payment-error="handlePaymentError"
  />

  <InvoiceModal
    :isOpen="isInvoiceModalOpen"
    :items="cart"
    :total="totalPrice"
    :clientName="'Client'"
    :invoiceNumber="currentInvoiceNumber"
    :paymentMethod="currentPaymentMethod"
    :payments="paymentsList"
    :discountPercentage="selectedDiscount"
    @close-modal="closeInvoiceModal"
  />

  <div class="direct-sale-layout grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
    <!-- Produits -->
    <section class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex flex-col gap-3 border-b border-slate-100 pb-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="flex items-center gap-2 text-base font-semibold text-slate-800">
            <FontAwesomeIcon icon="fa-solid fa-boxes" />
            Produits
          </h2>
          <div class="relative w-full sm:max-w-xs">
            <FontAwesomeIcon
              icon="fa-solid fa-search"
              class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              v-model="searchQuery"
              @input="filterProducts"
              class="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div class="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="[
              activeCategoryId === null
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            ]"
            @click="setActiveCategory(null)"
          >
            Toutes
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold transition"
            :class="[
              activeCategoryId === category.id
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            ]"
            @click="setActiveCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <div class="mt-2.5 flex-1 overflow-hidden">
        <div
          v-if="filteredProducts.length"
          class="grid h-full grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
        >
          <button
            v-for="product in filteredProducts"
            :key="product.id"
            type="button"
            class="group flex flex-col rounded-xl border border-slate-10 bg-white p-0 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            @click="addToCart(product)"
          >
            <div class="overflow-hidden rounded-lg bg-slate-100">
              <img
                :src="getProductImageUrl(product)"
                class="h-20 w-20 object-cover transition duration-300 group-hover:scale-105"
                @error="handleImageError"
                loading="lazy"
              />
            </div>
            <div class="mt-1.5 space-y-0.5">
              <p class="text-xs font-semibold text-slate-900 truncate">{{ product.name }}</p>
              <p class="text-[10px] text-slate-400 truncate">{{ product.category_name || '—' }}</p>
              <p class="text-xs font-bold text-slate-900">
                {{ formatPrice(product.price) }}
              </p>
            </div>
          </button>
        </div>

        <div
          v-else
          class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-slate-500"
        >
          <FontAwesomeIcon icon="fa-solid fa-boxes" class="mb-3 text-2xl text-slate-300" />
          Aucun produit disponible.
        </div>
      </div>
    </section>

    <!-- Panier -->
    <aside class="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h2 class="flex items-center gap-2 text-base font-semibold text-slate-800">
          <FontAwesomeIcon icon="fa-solid fa-shopping-cart" />
          Panier
        </h2>
        <button
          v-if="cart.length"
          type="button"
          class="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
          @click="clearCart"
        >
          <FontAwesomeIcon icon="fa-solid fa-trash" />
          Vider
        </button>
      </div>

      <div v-if="cart.length > 0" class="flex-1 space-y-2 overflow-y-auto py-3">
        <div
          v-for="item in cart"
          :key="item.id"
          class="rounded-xl border border-slate-100 bg-slate-50/60 p-2"
        >
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ item.name }}</p>
              <p class="text-xs text-slate-400">{{ formatPrice(item.price) }}</p>
            </div>
            <button
              type="button"
              class="text-slate-400 transition hover:text-rose-500"
              @click="removeItem(item)"
            >
              <FontAwesomeIcon icon="fa-solid fa-xmark" />
            </button>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                @click="decrementQuantity(item)"
              >
                <FontAwesomeIcon icon="fa-solid fa-minus" />
              </button>
              <span class="text-sm font-semibold text-slate-700">{{ item.quantity }}</span>
              <button
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                @click="incrementQuantity(item)"
              >
                <FontAwesomeIcon icon="fa-solid fa-plus" />
              </button>
            </div>
            <span class="text-sm font-semibold text-indigo-600">
              {{ formatPrice(item.price * item.quantity) }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-else
        class="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-slate-400"
      >
        <FontAwesomeIcon icon="fa-solid fa-shopping-cart" class="mb-3 text-2xl" />
        Panier vide
      </div>

      <div class="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
        <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>Total</span>
          <span class="text-indigo-600">{{ formatPrice(totalPrice) }}</span>
        </div>
        <button
          type="button"
          class="mt-3 w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
          @click="openPaymentModal"
          :disabled="!cart.length"
        >
          <span class="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <FontAwesomeIcon icon="fa-solid fa-check" />
          </span>
          Valider la commande
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { API_BASE_URL, API_URL } from '@/utils/api'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faBoxes, faSearch, faShoppingCart,
  faTrash, faMinus, faPlus, faCheck, faXmark
} from '@fortawesome/free-solid-svg-icons'

import PaymentModal from './PaymentModal.vue'
import InvoiceModal from './InvoiceModal.vue'
import placeholderImage from '../assets/avatar.png'

library.add(faBoxes, faSearch, faShoppingCart, faTrash, faMinus, faPlus, faCheck, faXmark)

// ========== ÉTATS ==========
const isPaymentModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)

const currentSaleId = ref(null)
const currentInvoiceNumber = ref('')
const currentPaymentMethod = ref('')
const paymentsList = ref([])

const cart = ref([])
const categories = ref([])
const products = ref([])
const filteredProducts = ref([])
const activeCategoryId = ref(null)
const searchQuery = ref('')
const user = ref(null)
const selectedDiscount = ref(0)

// Router pour redirection
const router = useRouter()

// ========== COMPUTED ==========
const totalPrice = computed(() => {
  return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const saleDataForModal = computed(() => ({
  items: cart.value.map(item => ({
    product_id: item.id,
    quantity: item.quantity,
    unit_price: Math.round(item.price),
    total: Math.round(item.price * item.quantity)
  })),
  total_amount: Math.round(totalPrice.value),
  customer_id: null,
  point_of_sale_id: user.value?.point_of_sale_id || null
}))

// ========== MÉTHODES ==========
const formatPrice = (price) => {
  const value = Number.parseFloat(price) || 0
  return `${value.toLocaleString('fr-FR')} Ar`
}

const getProductImageUrl = (product) => {
  const raw = product?.image || product?.product?.image
  if (!raw) return placeholderImage
  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('storage/')) return `${API_URL}/${raw}`
  if (raw.startsWith('products/')) return `${API_URL}/storage/${raw}`
  return `${API_URL}/storage/products/${raw}`
}

const handleImageError = (event) => {
  if (event?.target) {
    event.target.onerror = null
    event.target.src = placeholderImage
  }
}

// Gestion du panier
const addToCart = (product) => {
  // Sécuriser la récupération de l'identifiant unique
  const uniqueId = product.id || product.product_id;

  // Chercher si le produit existe déjà via cet ID unique
  const existing = cart.value.find(p => (p.id || p.product_id) === uniqueId);

  if (existing) {
    // Le produit est déjà là, on augmente la quantité
    existing.quantity++;
  } else {
    // C'est un nouveau produit, on l'ajoute
    cart.value.push({ 
      ...product, 
      id: uniqueId, // On force la présence de l'ID
      quantity: 1, 
      price: Number(product.price) || 0 
    });
  }
}

const incrementQuantity = (item) => { item.quantity++ }
const decrementQuantity = (item) => {
  if (item.quantity > 1) item.quantity--
  else removeItem(item)
}

const removeItem = (item) => {
  cart.value = cart.value.filter(i => i.id !== item.id)
}

const clearCart = () => {
  cart.value = []
}

// Filtres produits
const applyFilters = () => {
  let base = products.value
  if (activeCategoryId.value !== null) {
    base = base.filter(p => p.category_id === activeCategoryId.value)
  }
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    base = base.filter(p => p.name.toLowerCase().includes(query))
  }
  filteredProducts.value = base
}

const setActiveCategory = (categoryId) => {
  activeCategoryId.value = categoryId
  applyFilters()
}

const filterProducts = () => applyFilters()

// Ouverture du modal de paiement
const openPaymentModal = () => {
  if (cart.value.length === 0) {
    alert('Ajoutez des produits au panier avant de valider')
    return
  }
  currentSaleId.value = null
  isPaymentModalOpen.value = true
}

const handleClosePaymentModal = () => {
  isPaymentModalOpen.value = false
}

// ======================
// SUCCÈS DU PAIEMENT
// ======================
const handlePaymentSuccess = (data) => {
  const saleId = data.sale_id || data.id

  if (!saleId) {
    console.error('ID de vente manquant dans la réponse', data)
    alert('Erreur : ID de vente non reçu')
    return
  }

  let receivedPayments = []

  if (data.payments && Array.isArray(data.payments)) {
    receivedPayments = data.payments
  } else if (data.sale?.payments && Array.isArray(data.sale.payments)) {
    receivedPayments = data.sale.payments
  }

  paymentsList.value = receivedPayments.map(p => ({
    payment_method_name: p.payment_method_name || p.method || p.type || 'Paiement',
    amount: Math.round(p.amount || 0),
    reference: p.reference || ''
  }))

  currentSaleId.value = saleId
  currentInvoiceNumber.value = `INV-${saleId.toString().padStart(6, '0')}`
  currentPaymentMethod.value = paymentsList.value[0]?.payment_method_name || 'Espèces'

  isPaymentModalOpen.value = false
  isInvoiceModalOpen.value = true
}

const handlePaymentError = (error) => {
  console.error('Erreur lors du paiement :', error)
  alert(error?.message || 'Une erreur est survenue lors du traitement du paiement')
}

const closeInvoiceModal = () => {
  isInvoiceModalOpen.value = false
  paymentsList.value = []
  currentSaleId.value = null
  currentInvoiceNumber.value = ''
  currentPaymentMethod.value = ''
  clearCart()
}

// ========== VÉRIFICATION SESSION ACTIVE ==========
const checkActiveSessionAndRedirect = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    // Pas de token → rediriger vers login (ou modale)
    router.push({ name: 'login' })
    return false
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/my-active-session`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const hasSession = response.data?.has_active_session === true
    if (!hasSession) {
      // Rediriger vers la modale de connexion caisse
      router.push({ name: 'cash-registers-machine-link' })
      return false
    }
    return true
  } catch (error) {
    console.error('Erreur vérification session:', error)
    // En cas d'erreur (404, etc.), on considère qu'il n'y a pas de session
    router.push({ name: 'cash-registers-machine-link' })
    return false
  }
}

// ========== CHARGEMENT INITIAL ==========
onMounted(async () => {
  // 1. Vérifier la session active avant toute chose
  const sessionOk = await checkActiveSessionAndRedirect()
  if (!sessionOk) return

  // 2. Charger les données utilisateur
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      user.value = JSON.parse(userData)
    } catch (e) {
      console.error('Erreur parsing user:', e)
    }
  }

  const token = localStorage.getItem('token')
  if (!user.value?.point_of_sale_id || !token) {
    console.error('Utilisateur non authentifié ou point de vente manquant')
    return
  }

  // 3. Charger catégories et produits
  try {
    const response = await axios.get(`${API_BASE_URL}/categories`, {
      params: {
        with_products: 1,
        point_of_sale_id: user.value.point_of_sale_id,
        with_pricing: 1,
      },
      headers: { Authorization: `Bearer ${token}` }
    })

    const data = Array.isArray(response.data) ? response.data : response.data.data || []

    categories.value = data

    products.value = data.flatMap(category =>
      (category.products || []).map(product => ({
        ...product,
        category_id: category.id,
        category_name: category.name,
        price: product.pricing?.[0]?.price 
          ? Number.parseFloat(product.pricing[0].price) 
          : 0,
      }))
    )

    applyFilters()
  } catch (error) {
    console.error('Erreur de chargement des catégories/produits:', error.response?.data || error.message)
  }
})
</script>

<style scoped>
/* Vos styles restent identiques */
.direct-sale-layout {
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem);
}

@media (min-width: 1024px) {
  .direct-sale-layout {
    height: calc(100vh - 5.5rem);
    height: calc(100dvh - 5.5rem);
    max-height: calc(100vh - 5.5rem);
    max-height: calc(100dvh - 5.5rem);
    overflow: hidden;
  }
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>