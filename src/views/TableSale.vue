<template>
  <div class="flex flex-col gap-4 pb-6">
    <Profile v-if="!embedded" class="mb-2" />

    <!-- HEADER STICKY -->
    <section
      class="sticky top-[3rem] z-30 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:top-[3.25rem] lg:top-[3.5rem]"
    >
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-start gap-3">
          <span
            class="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"
          >
            <FontAwesomeIcon icon="fa-solid fa-table" />
          </span>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Table en service
            </p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <span class="text-lg font-semibold text-slate-900">
                {{
                  selectedTable
                    ? `Table ${selectedTable.table_number}`
                    : 'Aucune table sélectionnée'
                }}
              </span>
              <span v-if="selectedTable?.name" class="text-sm text-slate-500"
                >— {{ selectedTable.name }}</span
              >
              <span
                v-if="selectedTable"
                class="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold"
                :class="statusBadgeClass(selectedTable.status)"
              >
                <FontAwesomeIcon :icon="getStatusIcon(selectedTable.status)" />
                {{ getStatusText(selectedTable.status) }}
              </span>
            </div>
            <p v-if="selectedTable" class="text-xs text-slate-400">
              {{ selectedTable?.point_of_sale?.name || 'Point de vente non défini' }}
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <span
            class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600"
          >
            Articles : <span class="text-slate-900">{{ cart.length }}</span>
          </span>
          <span
            class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-600"
          >
            Total : <span class="text-slate-900">{{ formatPrice(displayTotal) }}</span>
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
            @click="openTableSelector"
          >
            <FontAwesomeIcon icon="fa-solid fa-table-list" />
            {{ selectedTable ? 'Changer de table' : 'Sélectionner une table' }}
          </button>
        </div>
      </div>
      <div
        v-if="currentPendingOrder"
        class="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700"
      >
        <font-awesome-icon :icon="iconClock" /> Commande en attente n°
        {{ currentPendingOrder.reference || currentPendingOrder.id }}
      </div>
    </section>

    <div class="grid gap-4 min-h-[calc(100vh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_320px]">
      <!-- PRODUITS -->
      <section
        class="sticky top-[5.25rem] flex max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex flex-col gap-3 border-b border-slate-100 pb-3">
          <header class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="flex items-center gap-2 text-base font-semibold text-slate-800">
                <FontAwesomeIcon icon="fa-solid fa-boxes" /> Produits
              </h2>
              <p class="text-xs text-slate-400">
                Ajoutez des articles au panier de la table sélectionnée.
              </p>
            </div>
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
          </header>
          <div class="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition"
              :class="
                activeCategory === null
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              "
              @click="showAllProducts"
            >
              Toutes
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition"
              :class="
                activeCategory?.id === category.id
                  ? 'bg-indigo-500 text-white shadow'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              "
              @click="loadProducts(category)"
            >
              {{ category.name }}
            </button>
          </div>
        </div>

        <div class="mt-3 flex-1 overflow-hidden">
          <div v-if="loadingProducts" class="flex h-full items-center justify-center py-10">
            <div
              class="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-indigo-500"
              role="status"
            >
              <span class="visually-hidden">Chargement...</span>
            </div>
            <span class="ml-2 text-slate-500">Chargement des produits...</span>
          </div>
          <div v-else-if="filteredProducts.length" class="h-full overflow-y-auto pr-1">
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <button
                v-for="product in filteredProducts"
                :key="product.id"
                type="button"
                class="group flex flex-col rounded-xl border border-slate-100 bg-white p-0 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                :disabled="isInteractionLocked"
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
                  <p class="truncate text-xs font-semibold text-slate-900">{{ product.name }}</p>
                  <p class="truncate text-[10px] text-slate-400">
                    {{ product.category_name || '—' }}
                  </p>
                  <p class="text-xs font-bold text-slate-900">
                    {{ formatPrice(product.price) }}
                  </p>
                </div>
              </button>
            </div>
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

      <!-- PANIER -->
      <aside
        class="sticky top-[5.25rem] flex max-h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 class="flex items-center gap-2 text-base font-semibold text-slate-800">
            <FontAwesomeIcon icon="fa-solid fa-shopping-cart" /> Panier
          </h2>
          <button
            v-if="cart.length"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
            @click="clearCart"
          >
            <FontAwesomeIcon icon="fa-solid fa-trash" /> Vider
          </button>
        </div>

        <div class="mt-3 flex-1 overflow-hidden">
          <!-- Panier avec articles -->
          <div v-if="cart.length" class="h-full space-y-3 overflow-y-auto pr-1">
            <div
              v-for="item in cart"
              :key="item.id"
              class="rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
            >
              <div class="flex items-start justify-between gap-3">
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
              <div class="mt-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                    @click="decrementQuantity(item)"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-minus" />
                  </button>
                  <span class="text-sm font-semibold text-slate-700">{{ item.quantity }}</span>
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                    @click="incrementQuantity(item)"
                  >
                    <FontAwesomeIcon icon="fa-solid fa-plus" />
                  </button>
                </div>
                <span class="text-sm font-semibold text-indigo-600">{{
                  formatPrice(item.price * item.quantity)
                }}</span>
              </div>
            </div>
          </div>

          <!-- Commande en attente (affichage si panier vide mais commande existante) -->
          <div v-else-if="currentPendingOrder" class="flex h-full flex-col overflow-hidden">
            <div
              class="flex flex-1 flex-col rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-3.5 shadow-sm"
            >
              <div class="mb-3 flex items-center justify-between border-b border-amber-100 pb-2">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-500"
                  >
                    <FontAwesomeIcon :icon="iconClock" />
                  </div>
                  <h3 class="text-sm font-bold text-amber-800">En attente</h3>
                </div>
                <span
                  class="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-wide text-amber-600 shadow-sm ring-1 ring-inset ring-amber-200"
                >
                  N° {{ currentPendingOrder.reference || currentPendingOrder.id }}
                </span>
              </div>

              <div class="flex-1 space-y-1.5 overflow-y-auto pr-1">
                <div
                  v-for="line in currentPendingOrder.order_lines || []"
                  :key="line.id"
                  class="group flex items-center justify-between rounded-xl bg-slate-50/80 px-2.5 py-2 transition-colors hover:bg-amber-50"
                >
                  <div class="flex flex-1 items-center gap-2 overflow-hidden pr-2">
                    <span
                      class="flex h-5 min-w-[20px] items-center justify-center rounded bg-white px-1 text-[10px] font-bold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200"
                    >
                      {{ line.quantity }}x
                    </span>
                    <span
                      class="truncate text-xs font-medium text-slate-700 group-hover:text-amber-900"
                    >
                      {{ line.product?.name || 'Produit' }}
                    </span>
                  </div>
                  <span class="whitespace-nowrap text-xs font-bold text-slate-800">
                    {{ formatPrice((line.price || 0) * line.quantity) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Panier vide -->
          <div
            v-else
            class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-10 text-center text-sm text-slate-400"
          >
            <FontAwesomeIcon icon="fa-solid fa-shopping-cart" class="mb-3 text-2xl" />
            Panier vide
          </div>
        </div>

        <!-- FOOTER PANIER -->
        <div class="mt-3 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
            <span>Total</span>
            <span class="text-indigo-600">{{ formatPrice(displayTotal) }}</span>
          </div>

          <div class="flex flex-col gap-2 pt-2">
            <button
              v-if="cart.length > 0 && !currentPendingOrder"
              type="button"
              :disabled="!selectedTable"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-200 disabled:opacity-50"
              @click="holdOrder"
            >
              <FontAwesomeIcon icon="fa-solid fa-receipt" /> Envoyer & imprimer
            </button>

            <button
              v-if="currentPendingOrder && !isAddingToPending"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              @click="beginAddToPending"
            >
              <FontAwesomeIcon icon="fa-solid fa-plus" /> Ajouter de nouveaux articles
            </button>

            <button
              v-if="currentPendingOrder && isAddingToPending"
              type="button"
              :disabled="cart.length === 0"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-60"
              @click="confirmAddToPending"
            >
              <FontAwesomeIcon icon="fa-solid fa-check" /> Commander & imprimer
            </button>

            <button
              v-if="cart.length > 0 || currentPendingOrder"
              type="button"
              :disabled="!selectedTable || (cart.length === 0 && !currentPendingOrder)"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
              @click="openPaymentModalDirectly"
            >
              <FontAwesomeIcon icon="fa-solid fa-check-circle" />
              {{ currentPendingOrder ? 'Payer la commande' : 'Valider la commande' }}
            </button>
          </div>
        </div>
      </aside>
    </div>

    <!-- MODALS -->
    <TableSelectorModal
      :is-open="showTableSelector"
      @close="closeTableSelector"
      @table-selected="onTableSelected"
    />
    <PaymentModal
      :is-open="isPaymentModalOpen"
      :total-amount="paymentTotalAmount"
      :sale-data="paymentSaleData"
      :sale-id="currentPendingOrder?.id ?? null"
      @close-modal="handleCloseModal"
      @payment-success="onPaymentSuccess"
      @payment-error="onPaymentError"
    />
    <InvoiceModal
      :is-open="isInvoiceModalOpen"
      :items="cart"
      :total="totalPrice"
      :client-name="selectedTable ? `Table ${selectedTable.table_number}` : 'Client'"
      :invoice-number="currentInvoiceNumber"
      :payment-method="currentPaymentMethod"
      @close-modal="closeInvoiceModal"
      @openPaymentModal="openPaymentModal"
    />
  </div>
</template>

<script>
import axios from 'axios'
import TableSelectorModal from '../components/TableSelectorModal.vue'
import PaymentModal from './PaymentModal.vue'
import InvoiceModal from './InvoiceModal.vue'
import Profile from './Profile.vue'
import placeholderImage from '../assets/avatar.png'
import { useAuth } from '@/composables/useAuth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { API_BASE_URL, API_URL } from '@/utils/api'
import { faClock } from '@fortawesome/free-solid-svg-icons'

// Cache global
let categoriesCache = null
let productsCache = []

export default {
  name: 'TableSale',
  components: { TableSelectorModal, PaymentModal, InvoiceModal, Profile, FontAwesomeIcon },

  props: {
    tableId: { type: [Number, String], default: null },
    embedded: { type: Boolean, default: false },
  },

  data() {
    return {
      iconClock: faClock,
      categories: [],
      products: [],
      filteredProducts: [],
      activeCategory: null,
      cart: [],
      searchQuery: '',
      selectedTable: null,
      showTableSelector: false,
      isPaymentModalOpen: false,
      isInvoiceModalOpen: false,
      currentInvoiceNumber: '',
      currentPaymentMethod: '',
      currentPendingOrder: null,
      existingPendingLines: [],
      lastAdditionLines: [],
      isAddingToPending: false,
      user: { name: '', email: '', point_of_sale_name: '' },
      isProcessing: false,
      loadingProducts: false,
    }
  },

  computed: {
    totalPrice() {
      return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    },
    displayTotal() {
      if (this.cart.length > 0) return this.totalPrice
      if (this.currentPendingOrder) {
        return parseFloat(
          this.currentPendingOrder.final_amount || this.currentPendingOrder.total_amount || 0,
        )
      }
      return 0
    },
    paymentTotalAmount() {
      if (this.cart.length > 0) return this.totalPrice
      if (this.currentPendingOrder) {
        return parseFloat(
          this.currentPendingOrder.final_amount || this.currentPendingOrder.total_amount || 0,
        )
      }
      return 0
    },
    paymentSaleData() {
      if (this.cart.length > 0) {
        return {
          items: this.prepareCartLines(this.cart),
          total_amount: this.totalPrice,
          point_of_sale_id: this.getCurrentUserPointOfSaleId(),
          table_id: this.selectedTable?.id,
        }
      }
      if (this.currentPendingOrder) {
        const pendingLines = (this.currentPendingOrder.order_lines || []).map((line) => ({
          product_id: line.product_id,
          quantity: line.quantity,
          unit_price: line.price,
          price: line.price,
          total: line.price * line.quantity,
        }))
        return {
          items: pendingLines,
          total_amount: parseFloat(
            this.currentPendingOrder.final_amount || this.currentPendingOrder.total_amount || 0,
          ),
          point_of_sale_id: this.getCurrentUserPointOfSaleId(),
          table_id: this.selectedTable?.id,
        }
      }
      return { items: [], total_amount: 0, point_of_sale_id: null, table_id: null }
    },
    isInteractionLocked() {
      return !!this.currentPendingOrder && !this.isAddingToPending
    },
  },

  watch: {
    tableId: {
      immediate: true,
      handler(newVal) {
        if (newVal && String(newVal) !== String(this.selectedTable?.id)) {
          this.loadTableAndData(Number(newVal))
        }
      },
    },
  },

  async mounted() {
    const { loadUserData } = useAuth()
    await loadUserData()
    if (this.tableId) {
      await this.loadTableAndData(Number(this.tableId))
    }
  },

  methods: {
    // ========== CHARGEMENT OPTIMISÉ ==========
    async loadTableAndData(tableId) {
      this.clearCart()
      this.currentPendingOrder = null
      this.existingPendingLines = []
      this.isAddingToPending = false

      const promises = [this.loadTable(tableId)]
      if (!categoriesCache) {
        promises.push(this.loadCategories())
      } else {
        this.categories = categoriesCache
        this.products = productsCache
        this.filteredProducts = [...this.products]
      }
      await Promise.all(promises)
    },

    async loadTable(tableId) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/tables/${tableId}`, {
          params: { with_sales: 1, with_point_of_sale: 1 },
          headers: { Authorization: `Bearer ${token}` },
        })
        const table = this.normalizeTableResponse(response.data)
        if (!table) {
          this.showNotification('Table introuvable', 'error')
          return
        }
        const userPointOfSaleId = this.getCurrentUserPointOfSaleId()
        if (userPointOfSaleId && this.resolveTablePointOfSaleId(table) !== userPointOfSaleId) {
          this.showNotification("Cette table n'appartient pas à votre point de vente", 'error')
          return
        }
        this.selectedTable = { ...table, status: this.normalizeStatus(table.status) }
        if (this.selectedTable.status === 'occupied') {
          await this.loadPendingOrdersForTable(this.selectedTable.id, { syncCart: true })
        }
      } catch (error) {
        console.error('Erreur chargement table:', error)
        this.showNotification('Erreur lors du chargement de la table', 'error')
      }
    },

    async loadCategories() {
      if (categoriesCache) {
        this.categories = categoriesCache
        this.products = productsCache
        this.filteredProducts = [...this.products]
        return
      }
      this.loadingProducts = true
      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        if (!user.point_of_sale_id || !token) return
        const res = await axios.get(`${API_BASE_URL}/categories`, {
          params: { with_products: 1, point_of_sale_id: user.point_of_sale_id, with_pricing: 1 },
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = Array.isArray(res.data) ? res.data : res.data.data || []
        this.categories = data
        categoriesCache = data

        // Extraction robuste des produits avec prix depuis pricing
        this.products = data.flatMap((cat) =>
          (cat.products || []).map((p) => {
            let price = 0
            if (p.pricing && Array.isArray(p.pricing) && p.pricing.length > 0) {
              // Prendre le premier pricing (ou celui correspondant au point de vente)
              price = parseFloat(p.pricing[0].price) || 0
            }
            return {
              ...p,
              category_id: cat.id,
              category_name: cat.name,
              price: price,
            }
          }),
        )
        productsCache = this.products
        this.filteredProducts = [...this.products]
      } catch (e) {
        console.error('Erreur chargement catégories:', e)
      } finally {
        this.loadingProducts = false
      }
    },

    // ========== GESTION DE LA TABLE ==========
    getCurrentUserPointOfSaleId() {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const pointOfSaleId = Number(user?.point_of_sale_id)
        return Number.isFinite(pointOfSaleId) && pointOfSaleId > 0 ? pointOfSaleId : null
      } catch {
        return null
      }
    },

    resolveTablePointOfSaleId(table) {
      const pointOfSaleId = Number(
        table?.point_of_sale_id ?? table?.pointOfSaleId ?? table?.point_of_sale?.id ?? null,
      )
      return Number.isFinite(pointOfSaleId) && pointOfSaleId > 0 ? pointOfSaleId : null
    },

    normalizeStatus(status) {
      const s = String(status || 'available')
        .trim()
        .toLowerCase()
      const map = {
        disponible: 'available',
        occupée: 'occupied',
        occupee: 'occupied',
        réservée: 'reserved',
        reservee: 'reserved',
        hors_service: 'out_of_order',
        horsservice: 'out_of_order',
      }
      return map[s] || s
    },

    normalizeTableResponse(payload) {
      if (!payload) return null
      if (Array.isArray(payload)) return payload[0] || null
      if (typeof payload === 'object' && 'data' in payload)
        return this.normalizeTableResponse(payload.data)
      return payload
    },

    async onTableSelected(table) {
      this.clearCart()
      this.currentPendingOrder = null
      this.existingPendingLines = []
      this.lastAdditionLines = []
      this.isAddingToPending = false
      this.selectedTable = table
      this.showTableSelector = false
      if (table.status === 'occupied') {
        await this.loadPendingOrdersForTable(table.id, { syncCart: true })
      }
    },

    openTableSelector() {
      this.showTableSelector = true
    },

    closeTableSelector() {
      this.showTableSelector = false
    },

    // ========== PRODUITS ==========
    formatPrice(price) {
      const val = Number.parseFloat(price) || 0
      return `${val.toLocaleString('fr-FR')} Ar`
    },

    getProductImageUrl(product) {
      const raw = product?.image || product?.product?.image
      if (!raw) return placeholderImage
      if (/^https?:\/\//i.test(raw)) return raw
      if (raw.startsWith('storage/')) return `${API_URL}/${raw}`
      if (raw.startsWith('products/')) return `${API_URL}/storage/${raw}`
      return `${API_URL}/storage/products/${raw}`
    },

    handleImageError(e) {
      if (e.target) {
        e.target.onerror = null
        e.target.src = placeholderImage
      }
    },

    productCardClasses(product) {
      const base =
        'product-card group flex flex-col rounded-3xl border bg-white p-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
      if (this.isInteractionLocked) {
        return `${base} border-rose-200 opacity-60 cursor-not-allowed`
      }
      return `${base} border-slate-100 hover:border-indigo-200`
    },

    loadProducts(category) {
      this.activeCategory = category
      // Utiliser les produits déjà chargés dans this.products pour éviter de re-filtrer à chaque fois
      this.filteredProducts = this.products.filter((p) => p.category_id === category.id)
      if (this.searchQuery) this.filterProducts()
    },

    showAllProducts() {
      this.activeCategory = null
      this.filteredProducts = [...this.products]
      if (this.searchQuery) this.filterProducts()
    },

    filterProducts() {
      let base = this.activeCategory
        ? this.products.filter((p) => p.category_id === this.activeCategory.id)
        : [...this.products]

      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase()
        base = base.filter((p) => p.name.toLowerCase().includes(q))
      }
      this.filteredProducts = base
    },

    addToCart(product) {
      if (this.isInteractionLocked) return
      const incomingId = String(product.id || product.product_id)
      const existing = this.cart.find((p) => String(p.id) === incomingId)
      if (existing) {
        existing.quantity++
      } else {
        this.cart.push({
          ...product,
          id: incomingId,
          quantity: 1,
          price: Number(product.price) || 0,
        })
      }
    },

    incrementQuantity(item) {
      item.quantity++
    },

    decrementQuantity(item) {
      if (item.quantity > 1) item.quantity--
      else this.removeItem(item)
    },

    removeItem(item) {
      this.cart = this.cart.filter((i) => i.id !== item.id)
    },

    clearCart() {
      this.cart = []
    },

    // ========== COMMANDES EN ATTENTE ==========
    prepareCartLines(cartItems = []) {
      return cartItems.map((i) => ({
        product_id: i.id,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        category_id: i.category_id,
      }))
    },

    stripLineForApi(line) {
      return { product_id: line.product_id, quantity: line.quantity, price: line.price }
    },

    async fetchCurrentSession() {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(`${API_BASE_URL}/my-active-session`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        return data?.data || data || null
      } catch {
        return null
      }
    },

    async updateTableStatus(tableId, status) {
      try {
        const token = localStorage.getItem('token')
        await axios.patch(
          `${API_BASE_URL}/tables/${tableId}/status`,
          { status },
          { headers: { Authorization: `Bearer ${token}` } },
        )
      } catch (e) {
        console.error('Erreur mise à jour statut table:', e)
      }
    },

    async holdOrder() {
      let sessionData = null
      try {
        sessionData = await this.fetchCurrentSession()
      } catch (e) {
        console.error('Erreur session:', e)
      }

      if (!sessionData || !sessionData.id) {
        this.$router.push({ name: 'cash-registers-machine-link' })
        return
      }

      if (this.cart.length === 0) {
        this.showNotification('Le panier est vide', 'warning')
        return
      }

      if (!this.selectedTable) {
        this.showNotification('Sélectionnez une table', 'warning')
        return
      }

      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user'))

        const cartLines = this.prepareCartLines(this.cart)
        const orderData = {
          table_id: Number(this.selectedTable.id),
          user_id: user.id,
          point_of_sale_id: user.point_of_sale_id,
          cash_register_session_id: sessionData.id,
          order_lines: cartLines.map((l) => this.stripLineForApi(l)),
        }

        const response = await axios.post(`${API_BASE_URL}/sales/pending-order`, orderData, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const pendingOrder = response.data?.data || response.data
        if (!pendingOrder || !pendingOrder.id)
          throw new Error("Le serveur n'a pas renvoyé d'ID de commande")

        this.currentPendingOrder = pendingOrder
        await this.updateTableStatus(this.selectedTable.id, 'occupied')
        this.selectedTable = { ...this.selectedTable, status: 'occupied' }
        await this.loadPendingOrdersForTable(this.selectedTable.id, {
          showToast: false,
          syncCart: false,
        })
        this.clearCart()
        this.lastAdditionLines = []
        this.isAddingToPending = false
        this.showNotification('Commande envoyée avec succès', 'success')
      } catch (error) {
        console.error('Erreur holdOrder:', error.response?.data || error.message)
        this.showNotification("Impossible d'envoyer la commande", 'error')
      }
    },

    async loadPendingOrdersForTable(tableId, options = {}) {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get(`${API_BASE_URL}/tables/${tableId}/pending-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const orders = Array.isArray(res.data) ? res.data : res.data?.data || []
        if (orders.length) {
          this.currentPendingOrder = orders[0]
          this.existingPendingLines = orders[0].order_lines || []
          if (options.syncCart) {
            this.cart = this.existingPendingLines.map((l) => ({
              id: l.product_id,
              name: l.product?.name || 'Produit',
              price: parseFloat(l.price) || 0,
              quantity: l.quantity,
            }))
          }
        } else {
          this.currentPendingOrder = null
          this.existingPendingLines = []
          if (options.syncCart) this.cart = []
        }
      } catch (e) {
        console.error('Erreur chargement commandes en attente:', e)
      }
    },

    beginAddToPending() {
      if (!this.currentPendingOrder) return
      this.isAddingToPending = true
      this.clearCart()
      this.showNotification('Ajoutez des articles puis cliquez sur "Commander & imprimer"', 'info')
    },

    async confirmAddToPending() {
      if (!this.currentPendingOrder) return
      if (this.cart.length === 0) {
        this.showNotification('Aucun article à ajouter', 'warning')
        return
      }

      if (this.isProcessing) return
      this.isProcessing = true

      try {
        const token = localStorage.getItem('token')
        const saleId = this.currentPendingOrder.id

        const existingLines = this.currentPendingOrder.order_lines || []
        const finalMap = new Map()

        for (const line of existingLines) {
          finalMap.set(parseInt(line.product_id), {
            quantity: line.quantity,
            price: parseFloat(line.price) || 0,
          })
        }

        for (const item of this.cart) {
          const productId = parseInt(item.id)
          const additionalQty = item.quantity
          const unitPrice = parseFloat(item.price) || 0
          const existing = finalMap.get(productId)
          const newQty = existing ? existing.quantity + additionalQty : additionalQty
          finalMap.set(productId, { quantity: newQty, price: unitPrice })
        }

        const orderLines = []
        for (const [productId, { quantity, price }] of finalMap.entries()) {
          if (quantity <= 0) continue
          orderLines.push({
            product_id: productId,
            quantity: quantity,
            price: Math.round(price),
            total: Math.round(quantity * price),
          })
        }

        await axios.put(
          `${API_BASE_URL}/sales/${saleId}/order-lines`,
          { order_lines: orderLines },
          { headers: { Authorization: `Bearer ${token}` } },
        )

        await this.loadPendingOrdersForTable(this.selectedTable.id, { syncCart: false })
        this.clearCart()
        this.isAddingToPending = false
        this.showNotification('Articles ajoutés avec succès', 'success')
      } catch (error) {
        console.error(error)
        this.showNotification("Erreur lors de l'ajout", 'error')
        await this.loadPendingOrdersForTable(this.selectedTable.id, { syncCart: false })
      } finally {
        this.isProcessing = false
      }
    },

    // ========== PAIEMENT ==========
    openPaymentModalDirectly() {
      if (!this.selectedTable) {
        this.showNotification('Sélectionnez une table', 'warning')
        return
      }
      if (this.cart.length === 0 && !this.currentPendingOrder) {
        this.showNotification('Panier vide', 'warning')
        return
      }
      this.isPaymentModalOpen = true
    },

    handleCloseModal() {
      this.isPaymentModalOpen = false
    },

    closeInvoiceModal() {
      this.isInvoiceModalOpen = false
    },

    openPaymentModal() {
      this.isInvoiceModalOpen = false
      this.isPaymentModalOpen = true
    },

    async onPaymentSuccess(data) {
      if (data.sale_id) {
        try {
          const token = localStorage.getItem('token')
          if (this.selectedTable) {
            await this.updateTableStatus(this.selectedTable.id, 'available')
            await this.loadPendingOrdersForTable(this.selectedTable.id, { syncCart: false })
          }
          // Impression facultative
          // await axios.post(`${API_BASE_URL}/printers/invoice/${data.sale_id}`, {}, { headers: { Authorization: `Bearer ${token}` } })
        } catch (e) {
          console.warn('Impression facture échouée :', e)
        }
      }

      if (this.selectedTable) {
        await this.updateTableStatus(this.selectedTable.id, 'available')
        await this.loadPendingOrdersForTable(this.selectedTable.id, { syncCart: false })
      }

      this.showNotification('Commande validée avec succès !', 'success')
      this.clearCart()
      this.currentPendingOrder = null
      this.existingPendingLines = []
      this.isAddingToPending = false
      this.isPaymentModalOpen = false
    },

    onPaymentError(error) {
      this.showNotification(error || 'Erreur paiement', 'error')
      this.isPaymentModalOpen = false
    },

    // ========== UTILITAIRES ==========
    showNotification(message, type = 'info') {
      console.log(`[${type}] ${message}`)
      // À remplacer par un système de toast si disponible
    },

    getStatusIcon(status) {
      const icons = {
        available: 'fa-solid fa-check-circle',
        occupied: 'fa-solid fa-users',
        reserved: 'fa-solid fa-calendar-check',
        out_of_order: 'fa-solid fa-wrench',
      }
      return icons[status] || 'fa-solid fa-question-circle'
    },

    getStatusText(status) {
      const texts = {
        available: 'Disponible',
        occupied: 'Occupée',
        reserved: 'Réservée',
        out_of_order: 'Hors service',
      }
      return texts[status] || 'Inconnu'
    },

    statusBadgeClass(status) {
      const classes = {
        available: 'border-emerald-200 bg-emerald-50 text-emerald-600',
        occupied: 'border-amber-200 bg-amber-50 text-amber-700',
        reserved: 'border-indigo-200 bg-indigo-50 text-indigo-600',
        out_of_order: 'border-rose-200 bg-rose-50 text-rose-600',
      }
      return classes[status] || 'border-slate-200 bg-slate-50 text-slate-500'
    },
  },
}
</script>

<style scoped>
.product-card.adding-to-cart {
  animation: cartPulse 0.4s ease;
}
@keyframes cartPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.2);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.25);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.2);
  }
}
</style>
