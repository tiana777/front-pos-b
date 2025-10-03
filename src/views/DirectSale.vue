<template>
  <!-- <div class="flex flex-col min-h-screen bg-gray-100 text-gray-800"> -->

    <Profile />
    <Pos />

    <!-- Modals -->
    <PaymentModal
      :isOpen="isPaymentModalOpen"
      :totalAmount="totalPrice"
      @close-modal="handleCloseModal"
      @confirm-payment="handlePaymentConfirmation"
    />
    <InvoiceModal
      :isOpen="isInvoiceModalOpen"
      :items="cart"
      :total="totalPrice"
      :clientName="'Client'"
      :invoiceNumber="currentInvoiceNumber"
      :paymentMethod="currentPaymentMethod"
      @close-modal="closeInvoiceModal"
      @openPaymentModal="openPaymentModal"
    />

    <!-- Main content -->
    <div class="flex flex-1 fixed top-20 left-0 right-0 bottom-2">
      <!-- Catégories -->
      <div class="w-60 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div class="border-b-2 border-blue-600 mb-4 pb-2">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <font-awesome-icon icon="fa-solid fa-list" />
            Catégories
          </h2>
        </div>
        <div class="flex flex-col gap-2">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="loadProducts(category)"
            :class="[
              'flex items-center gap-2 px-3 py-2 rounded-md text-left transition',
              activeCategory?.id === category.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100'
            ]"
          >
            <font-awesome-icon icon="fa-solid fa-folder" />
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Produits -->
      <div class="flex-1 p-4 bg-white overflow-y-auto">
        <div class="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <font-awesome-icon icon="fa-solid fa-boxes" />
            Produits
          </h2>
          <div class="relative w-72">
            <font-awesome-icon
              icon="fa-solid fa-search"
              class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              v-model="searchQuery"
              @input="filterProducts"
              class="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="addToCart(product)"
            class="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
          >
            <img
              :src="`http://localhost:8000/storage/products/${product.image}`"
              class="w-full h-36 object-cover bg-gray-100"
              @error="handleImageError"
            />
            <div class="p-3">
              <h3 class="text-sm font-medium truncate">{{ product.name }}</h3>
              <p class="text-blue-600 font-bold">{{ formatPrice(product.price) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Panier -->
      <div class="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="flex items-center gap-2 text-lg font-semibold">
            <font-awesome-icon icon="fa-solid fa-shopping-cart" />
            Panier
          </h2>
          <button
            v-if="cart.length"
            @click="clearCart"
            class="flex items-center gap-1 text-red-500 hover:bg-red-50 px-2 py-1 rounded"
          >
            <font-awesome-icon icon="fa-solid fa-trash" />
            Vider
          </button>
        </div>

        <div v-if="cart.length > 0" class="flex-1 flex flex-col p-4 overflow-y-auto">
          <div class="flex-1 space-y-3">
            <div
              v-for="item in cart"
              :key="item.id"
              class="flex items-center border-b pb-2"
            >
              <button
                @click="removeItem(item)"
                class="text-red-500 hover:text-red-700 mr-3"
              >
                <font-awesome-icon icon="fa-solid fa-times" />
              </button>
              <div class="flex-1">
                <span class="block font-medium">{{ item.name }}</span>
                <div class="flex items-center gap-2">
                  <button
                    @click="decrementQuantity(item)"
                    class="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    <font-awesome-icon icon="fa-solid fa-minus" />
                  </button>
                  <span>{{ item.quantity }}</span>
                  <button
                    @click="incrementQuantity(item)"
                    class="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
                  >
                    <font-awesome-icon icon="fa-solid fa-plus" />
                  </button>
                </div>
              </div>
              <span class="font-bold text-blue-600 min-w-[80px] text-right">{{
                formatPrice(item.price * item.quantity)
              }}</span>
            </div>
          </div>

          <div class="mt-auto border-t pt-4">
            <div class="flex justify-between mb-3 font-semibold text-lg">
              <span>Total:</span>
              <span class="text-blue-600">{{ formatPrice(totalPrice) }}</span>
            </div>
            <button
              @click="checkout"
              class="w-full py-3 rounded-md bg-green-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition"
            >
              <font-awesome-icon icon="fa-solid fa-check" />
              Valider
            </button>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400">
          <font-awesome-icon icon="fa-solid fa-shopping-cart" size="2x" />
          <p class="mt-2">Panier vide</p>
        </div>
      </div>
    </div>
  <!-- </div> -->
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
import placeholderImage from '../assets/avatar.png'
import { useCashTransactionStore } from '@/stores/cashTransactionStore'
import { useCategories } from '@/composables/useCategories'

// Modal controls
const isPaymentModalOpen = ref(false)
const isInvoiceModalOpen = ref(false)

const cashTransactionStore = useCashTransactionStore()

const { categories, products, filteredProducts, activeCategory, loadCategories, loadProducts } = useCategories()

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
    const sessionData = await fetchCurrentSession()
    const sessionStartTicket = Number(sessionData?.start_ticket_number)

    const ticketNumberValue = Number.isInteger(sessionStartTicket) && sessionStartTicket >= 0
      ? sessionStartTicket
      : Date.now()

    const ticketNumber = ticketNumberValue.toString()
    const totalAmount = cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discount = Number(paymentData.discount_percentage ?? 0)
    const finalAmount = Number(
      paymentData.final_total !== undefined
        ? paymentData.final_total
        : (totalAmount * (1 - discount / 100)).toFixed(2)
    )

    const saleData = {
      user_id: user.id,
      point_of_sale_id: user.point_of_sale_id,
      cash_register_session_id: sessionData?.id || null,
      total_amount: Math.round(totalAmount), // Convert to integer
      discount_percentage: discount,
      status: paymentData.status || 'completed',
      payment_id: paymentMethodMap[paymentData.method] || null,
      ticket_number: Number(ticketNumber)
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
        price: Math.round(item.price), // Convert to integer
        total: Math.round(item.price * item.quantity) // Convert to integer
      }
      await axios.post('http://127.0.0.1:8000/api/orderlines', orderLineData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
    }

    if (sessionData?.id) {
      try {
        await axios.post('http://127.0.0.1:8000/api/cash-transactions', {
          session_id: sessionData.id,
          type: 'sale',
          amount: finalAmount,
          description: `Vente ticket #${ticketNumber}`
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })
        await cashTransactionStore.fetchTransactions()
      } catch (transactionError) {
        console.error('Erreur lors de la mise à jour des transactions de caisse:', transactionError.response?.data || transactionError.message)
      }
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/printers/invoice/${saleId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
    } catch (printError) {
      console.error('Erreur lors de l\'impression de la facture:', printError.response?.data || printError.message)
    }


    saleData.value = {
      ...response.data,
      items: [...cart.value],
      paymentMethod: paymentData.method,
      finalAmount
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

const authHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Token manquant')
  return { Authorization: `Bearer ${token}` }
}

const fetchCurrentSession = async () => {
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-register-session/my-active-session', {
      headers: authHeaders()
    })
    return data?.data || data || null
  } catch (error) {
    console.error('Impossible de récupérer la session de caisse:', error.response?.data || error.message)
    return null
  }
}

// Add icons to library
library.add(faList, faFolder, faBoxes, faSearch, faShoppingCart, faTrash, faTimes, faMinus, faPlus, faCheck)

const cart = ref([])
const searchQuery = ref('')

const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)} Ar`
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
  await loadCategories()
})

const handleImageError = (event) => {
  const target = event?.target
  if (!target) return
  if (target.dataset.fallbackApplied === 'true') return
  target.dataset.fallbackApplied = 'true'
  target.onerror = null
  target.src = placeholderImage
}
</script>
