<template>
  <Profile />

  <div class="table-sale">
    <!-- Header avec informations de table -->
    <div class="table-sale-header">
      <div class="table-info-section">
        <div v-if="selectedTable" class="current-table-info">
          <div class="table-display">
            <i class="fas fa-table"></i>
            <span class="table-number">{{ selectedTable.table_number }}</span>
            <span v-if="selectedTable.name" class="table-name">- {{ selectedTable.name }}</span>
          </div>
          <div class="table-status" :class="selectedTable.status">
            <i :class="getStatusIcon(selectedTable.status)"></i>
            {{ getStatusText(selectedTable.status) }}
          </div>
        </div>
        <div v-else class="no-table-selected">
          <i class="fas fa-table"></i>
          <span>Aucune table sélectionnée</span>
        </div>
        <div class="table-actions">
          <button @click="openTableSelector" class="btn-table-select">
            <i class="fas fa-table"></i>
            {{ selectedTable ? 'Changer de table' : 'Sélectionner une table' }}
          </button>
        </div>
      </div>

      <div class="sale-info">
        <div class="sale-summary">
          <span class="summary-label">Articles:</span>
          <span class="summary-value">{{ cart.length }}</span>
        </div>
        <div class="sale-total">
          <span class="total-label">Total:</span>
          <span class="total-value">{{ formatPrice(totalPrice) }}</span>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="table-sale-content">
      <!-- Catégories -->
      <div class="categories-section">
        <div class="section-header">
          <h3><i class="fas fa-list"></i> Catégories</h3>
        </div>
        <div class="categories-list">
          <button
            v-for="category in categories"
            :key="category.id"
            @click="loadProducts(category)"
            :class="[
              'category-btn',
              activeCategory?.id === category.id ? 'active' : '',
              isInteractionLocked ? 'disabled' : ''
            ]"
            :disabled="isInteractionLocked"
          >
            <i class="fas fa-folder"></i>
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- Produits -->
      <div class="products-section">
        <div class="section-header">
          <h3><i class="fas fa-boxes"></i> Produits</h3>
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              type="text"
              placeholder="Rechercher..."
              v-model="searchQuery"
              @input="filterProducts"
              :disabled="isInteractionLocked"
            />
          </div>
        </div>
        <div class="products-grid">
          <div
            v-for="product in filteredProducts"
            :key="product.id"
            @click="(!isInteractionLocked && canSelectProduct(product)) ? addToCart(product, $event) : null"
            :class="['product-card', getProductClass(product), isInteractionLocked ? 'locked' : '']"
          >
            <div class="product-card-inner">
              <div v-if="isProductPopular(product)" class="product-popular">
                Populaire
              </div>
              <div v-if="isProductOnPromotion(product)" class="product-promotion">
                Promo
              </div>
              <div class="product-card-media">
                <img
                  :src="`http://localhost:8000/storage/products/${product.image}`"
                  :alt="product.name"
                  @error="handleImageError"
                  :class="{ 'locked-image': isInteractionLocked }"
                />
              </div>
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <div class="product-stock" v-if="product.stock !== null && product.stock !== undefined">
                  Stock: {{ product.stock }}
                </div>
                <p class="product-price">{{ formatPrice(product.price) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panier -->
      <div class="cart-section">
        <div class="section-header">
          <h3><i class="fas fa-shopping-cart"></i> Panier</h3>
          <button v-if="cart.length" @click="clearCart" class="btn-clear-cart" :disabled="isInteractionLocked">
            <i class="fas fa-trash"></i>
            Vider
          </button>
        </div>

        <div v-if="cart.length > 0" class="cart-content">
          <table class="cart-items">
            <tbody>
              <tr
                v-for="item in cart"
                :key="item.id"
                class="cart-item"
              >
                <td class="item-name">{{ item.name }}</td>
                <td class="item-decrement">
                  <button @click="decrementQuantity(item)" class="btn-quantity" :disabled="isInteractionLocked">
                    -
                  </button>
                </td>
                <td class="item-quantity">{{ item.quantity }}</td>
                <td class="item-increment">
                  <button @click="incrementQuantity(item)" class="btn-quantity" :disabled="isInteractionLocked">
                    +
                  </button>
                </td>
                <td class="item-total">{{ formatPrice(item.price * item.quantity) }}</td>
                <td class="item-remove">
                  <button @click="removeItem(item)" class="btn-remove" :disabled="isInteractionLocked" title="Supprimer">
                    <font-awesome-icon icon="fa-solid fa-trash" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="cart-footer">
            <div class="cart-total">
              <span class="total-label">Total:</span>
              <span class="total-amount">{{ formatPrice(totalPrice)}}Ar</span>
            </div>

            <!-- Boutons d'actions du panier -->
            <div class="cart-actions">
              <!-- Boutons pour les commandes en attente -->
              <div class="action-row">
                <button
                  v-if="cart.length > 0 && !currentPendingOrder"
                  @click="holdOrder"
                  class="btn-hold-order"
                >
                  <font-awesome-icon icon="fa-solid fa-receipt" />
                  Envoyer & imprimer
                </button>

                <button
                  v-if="currentPendingOrder && isInteractionLocked"
                  @click="beginAddToPending"
                  class="btn-add-to-order"
                >
                  <i class="fas fa-plus"></i>
                  Ajouter
                </button>

                <button
                  v-if="currentPendingOrder && isAddingToPending"
                  @click="confirmAddToPending"
                  class="btn-add-to-order"
                  :disabled="cart.length === 0"
                >
                  <i class="fas fa-check"></i>
                  Commander & imprimer
                </button>

              </div>

              <!-- Bouton principal de validation (checkout) -->
              <div class="action-row">
                <button
                  v-if="cart.length > 0 || currentPendingOrder"
                  @click="handleCheckout"
                  class="btn-checkout"
                  :class="{ 'pending-order': currentPendingOrder }"
                >
                  <i class="fas fa-check-circle"></i>
                  {{ currentPendingOrder ? 'Valider commande' : 'Valider la commande' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <p>Panier vide</p>
          <small>Sélectionnez une table et ajoutez des produits</small>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <TableSelectorModal
      :is-open="showTableSelector"
      @close="closeTableSelector"
      @table-selected="onTableSelected"
    />

    <PaymentModal
      :is-open="isPaymentModalOpen"
      :total-amount="totalPrice"
      @close-modal="handleCloseModal"
      @confirm-payment="handlePaymentConfirmation"
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
import { useCategories } from '@/composables/useCategories'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const API_BASE_URL = rawApiBaseUrl.replace(/\/?$/, '')

export default {
  name: 'TableSale',
  components: {
    TableSelectorModal,
    PaymentModal,
    InvoiceModal,
    Profile,
    FontAwesomeIcon
  },
  props: {
    tableId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      ...useCategories(),
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
      categoryPrinterTypes: {},
      productCatalog: {},
      printersCache: [],
      isAddingToPending: false,
      user: { name: '', email: '', point_of_sale_name: '' }
    }
  },
  computed: {
    totalPrice() {
      return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    },

    isInteractionLocked() {
      return this.currentPendingOrder && !this.isAddingToPending
    },

    isAdmin() {
      const { isAdmin } = useAuth()
      return isAdmin.value
    }
  },
  watch: {
    tableId: {
      immediate: true,
      handler(newVal) {
        this.handleTableIdChange(newVal)
      }
    }
  },
  methods: {

      async handleTableIdChange(newVal) {
        if (newVal === undefined || newVal === null || newVal === '') {
          return
        }

        const numericId = Number(newVal)

      if (!Number.isFinite(numericId) || numericId <= 0) {
        console.warn('Identifiant de table invalide reçu:', newVal)
        return
      }

      if (this.selectedTable && Number(this.selectedTable.id) === numericId) {
        return
      }

      await this.loadTableFromRoute(numericId)
    },



    async loadTableFromRoute(tableId) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/tables/${tableId}`, {
          params: {
            with_sales: 1,
            with_point_of_sale: 1
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const table = this.normalizeTableResponse(response.data)

        if (!table) {
          console.warn('Impossible de charger la table demandée')
          this.showNotification('Table introuvable', 'error')
          return
        }

        await this.onTableSelected(table)
      } catch (error) {
        console.error('Erreur lors du chargement de la table:', error.response?.data || error.message)
        this.showNotification('Erreur lors du chargement de la table', 'error')
      }
    },

    normalizeTableResponse(payload) {
      if (!payload) return null

      if (Array.isArray(payload)) {
        return payload[0] || null
      }

      if (typeof payload === 'object' && payload !== null && Object.prototype.hasOwnProperty.call(payload, 'data')) {
        return this.normalizeTableResponse(payload.data)
      }

      return payload
    },

    syncRouteWithTable(tableId) {
      if (!this.$route || this.$route.name !== 'table-order') {
        return
      }

      const currentParam = this.$route.params?.tableId

      if (tableId === null || tableId === undefined || tableId === '') {
        if (currentParam === undefined) {
          return
        }
        this.$router.replace({ name: 'table-order', params: {} })
        return
      }

      if (String(currentParam) === String(tableId)) {
        return
      }

      this.$router.replace({
        name: 'table-order',
        params: { tableId }
      })
    },

    formatPrice(price) {
      return `${parseFloat(price).toFixed(0)} `
    },

    resolveCategoryPrinterTypeId(category) {
      if (!category) return null
      if (category.printer_type_id) return category.printer_type_id
      if (typeof category.printer_type === 'number') return category.printer_type
      if (category.printer_type && typeof category.printer_type === 'object') {
        return category.printer_type.id ?? category.printer_type.printer_type_id ?? null
      }
      if (category.id && this.categoryPrinterTypes[category.id]) {
        return this.categoryPrinterTypes[category.id]
      }
      return null
    },

    resolveProductPrinterTypeId(product, fallbackCategory = null) {
      if (!product) return null
      if (product.printer_type_id) return product.printer_type_id
      if (typeof product.printer_type === 'number') return product.printer_type
      if (product.printer_type && typeof product.printer_type === 'object') {
        return product.printer_type.id ?? product.printer_type.printer_type_id ?? null
      }
      const resolvedCategory = product.category || fallbackCategory || (product.category_id ? { id: product.category_id } : null)
      if (resolvedCategory && resolvedCategory.printer_type_id) {
        return resolvedCategory.printer_type_id
      }
      if (resolvedCategory && resolvedCategory.printer_type && typeof resolvedCategory.printer_type === 'object') {
        return resolvedCategory.printer_type.id ?? resolvedCategory.printer_type.printer_type_id ?? null
      }
      if (resolvedCategory && resolvedCategory.id && this.categoryPrinterTypes[resolvedCategory.id]) {
        return this.categoryPrinterTypes[resolvedCategory.id]
      }
      if (product.category_id && this.categoryPrinterTypes[product.category_id]) {
        return this.categoryPrinterTypes[product.category_id]
      }
      return null
    },

    registerProduct(product, overrides = {}) {
      if (!product || !product.id) return

      const category = overrides.category || product.category || null
      const categoryId = overrides.category_id ?? product.category_id ?? category?.id ?? null
      const resolvedCategoryPrinterType = overrides.printer_type_id ?? this.resolveProductPrinterTypeId(product, category) ?? (categoryId ? this.categoryPrinterTypes[categoryId] : null)
      const price = Number(overrides.price ?? product.price ?? (product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0)) || 0

      if (categoryId && resolvedCategoryPrinterType && this.categoryPrinterTypes[categoryId] !== resolvedCategoryPrinterType) {
        this.categoryPrinterTypes = {
          ...this.categoryPrinterTypes,
          [categoryId]: resolvedCategoryPrinterType
        }
      }

      this.productCatalog = {
        ...this.productCatalog,
        [product.id]: {
          id: product.id,
          name: product.name,
          category_id: categoryId,
          printer_type_id: resolvedCategoryPrinterType,
          price,
          product: { ...product }
        }
      }
    },

    aggregateLineItems(lines = []) {
      if (!Array.isArray(lines) || lines.length === 0) {
        return []
      }

      const aggregated = new Map()

      lines.forEach(line => {
        if (!line) return

        const product = line.product || null
        const productId = line.product_id ?? line.id ?? product?.id ?? null
        if (!productId) return

        const price = Number(line.price ?? line.unit_price ?? line.unitPrice ?? product?.price ?? 0) || 0
        const categoryId = line.category_id ?? product?.category_id ?? null
        const printerTypeId = line.printer_type_id ?? product?.printer_type_id ?? null
        const key = `${productId}|${price}|${categoryId ?? ''}|${printerTypeId ?? ''}`

        const name = line.name || product?.name || 'Produit'
        const quantity = Number(line.quantity ?? line.qty ?? 0) || 0
        const total = Number(line.total ?? line.total_amount ?? line.amount ?? quantity * price) || 0

        if (aggregated.has(key)) {
          const existing = aggregated.get(key)
          existing.quantity += quantity
          existing.total += total
        } else {
          aggregated.set(key, {
            ...line,
            product_id: productId,
            name,
            quantity,
            price,
            total,
            category_id: categoryId,
            printer_type_id: printerTypeId,
            product: product || line.product || null
          })
        }
      })

      return Array.from(aggregated.values()).map(item => ({
        ...item,
        quantity: Number(item.quantity.toFixed(3)),
        total: Number((Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2))
      }))
    },

    prepareCartLines(cartItems = []) {
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return []
      }

      const rawLines = cartItems.map(item => ({
        product_id: item.id,
        name: item.name,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
        category_id: item.category_id ?? null,
        printer_type_id: item.printer_type_id ?? null,
        product: item
      }))

      return this.aggregateLineItems(rawLines)
    },

    normalizeProduct(product, category, fallbackPrinterTypeId = null) {
      if (!product) return null

      const normalizedCategoryId = product.category_id ?? category?.id ?? null
      const normalizedPrice = Number(
        product.price ??
        (Array.isArray(product.pricing) && product.pricing.length ? parseFloat(product.pricing[0].price) : 0)
      ) || 0
      const normalizedPrinterTypeId = this.resolveProductPrinterTypeId(product, category) ?? fallbackPrinterTypeId ?? (normalizedCategoryId ? this.categoryPrinterTypes[normalizedCategoryId] : null)

      const baseProduct = {
        ...product,
        category_id: normalizedCategoryId,
        price: normalizedPrice,
        printer_type_id: normalizedPrinterTypeId
      }

      const stock = this.resolveProductStock(baseProduct)
      const normalizedProduct = {
        ...baseProduct,
        stock: stock,
      }

      normalizedProduct.isAvailable = this.checkProductAvailability(normalizedProduct)

      this.registerProduct(normalizedProduct, {
        category,
        category_id: normalizedCategoryId,
        printer_type_id: normalizedPrinterTypeId,
        price: normalizedPrice
      })

      return normalizedProduct
    },

    getStatusIcon(status) {
      const icons = {
        'available': 'fas fa-check-circle',
        'occupied': 'fas fa-users',
        'reserved': 'fas fa-calendar-check',
        'out_of_order': 'fas fa-wrench'
      }
      return icons[status] || 'fas fa-question-circle'
    },

    getStatusText(status) {
      const texts = {
        'available': 'Disponible',
        'occupied': 'Occupée',
        'reserved': 'Réservée',
        'out_of_order': 'Hors service'
      }
      return texts[status] || 'Inconnu'
    },

    async loadCategories() {
      console.log('loadCategories: Starting function execution')

      try {
        const token = localStorage.getItem('token')
        console.log('loadCategories: Token retrieved:', token ? 'Present' : 'Missing')
        if (!token) {
          console.log('loadCategories: No token found, returning early')
          return
        }

        console.log('loadCategories: Making /me API call')
        const userResponse = await axios.get(`${API_BASE_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const user = userResponse.data.user
        console.log('loadCategories: User data received:', user)

        if (!user.point_of_sale_id) {
          console.log('loadCategories: No point_of_sale_id in user data, returning early')
          return
        }

        console.log('loadCategories: Making /categories API call with point_of_sale_id:', user.point_of_sale_id)
        const response = await axios.get(`${API_BASE_URL}/categories`, {
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

        const rawCategories = Array.isArray(response.data) ? response.data : response.data.data || []
        console.log('loadCategories: Raw categories received:', rawCategories.length, 'categories')

        const categoryPrinterMap = { ...this.categoryPrinterTypes }
        const aggregatedProducts = []

        console.log('loadCategories: Processing categories for printer types')
        rawCategories.forEach(category => {
          if (!category || !category.id) return
          const printerTypeId = this.resolveCategoryPrinterTypeId(category)
          if (printerTypeId) {
            categoryPrinterMap[category.id] = printerTypeId
          }
        })
        console.log('loadCategories: Category printer map after processing:', categoryPrinterMap)

        console.log('loadCategories: Normalizing products')
        rawCategories.forEach(category => {
          const fallbackPrinterTypeId = this.resolveCategoryPrinterTypeId(category) ?? (category?.id ? categoryPrinterMap[category.id] : null)
          if (Array.isArray(category?.products)) {
            category.products = category.products.map(product => {
              const normalized = this.normalizeProduct(product, category, fallbackPrinterTypeId)
              aggregatedProducts.push(normalized)
              return normalized
            })
          }
        })
        console.log('loadCategories: Aggregated products count:', aggregatedProducts.length)

        this.categories = rawCategories
        this.categoryPrinterTypes = categoryPrinterMap
        this.products = aggregatedProducts
        this.filteredProducts = aggregatedProducts

        console.log('loadCategories: Function completed successfully')
      } catch (error) {
        console.error('loadCategories: Error occurred:', error)
        console.error('loadCategories: Error response:', error.response?.data)
        console.error('loadCategories: Error status:', error.response?.status)
        console.error('loadCategories: Error message:', error.message)
        this.showNotification('Erreur lors du chargement des catégories', 'error')
      }
    },

    loadProducts(category) {
      this.activeCategory = category
      const fallbackPrinterTypeId = this.resolveCategoryPrinterTypeId(category)
      const products = category?.products || []

      this.filteredProducts = products.map(product => {
        const categoryId = product.category_id ?? category?.id ?? null
        const printerTypeId = product.printer_type_id ?? this.resolveProductPrinterTypeId(product, category) ?? fallbackPrinterTypeId
        const price = Number(
          product.price ??
          (Array.isArray(product.pricing) && product.pricing.length ? parseFloat(product.pricing[0].price) : 0)
        ) || 0
        const stock = this.resolveProductStock(product)

        const normalized = {
          ...product,
          category_id: categoryId,
          printer_type_id: printerTypeId,
          price,
          stock,
        }

        normalized.isAvailable = this.checkProductAvailability(normalized)

        this.registerProduct(normalized, {
          category,
          category_id: categoryId,
          printer_type_id: printerTypeId,
          price
        })

        return normalized
      })
    },

    resolveProductStock(product) {
      if (!product) return null

      const candidates = [
        product.stock,
        product.available_stock,
        product.quantity,
        product.available_quantity,
        product.inventory?.quantity,
        product.inventory?.stock
      ]

      for (const value of candidates) {
        if (typeof value === 'number' && Number.isFinite(value)) {
          return value
        }

        if (typeof value === 'string') {
          const trimmed = value.trim()
          if (trimmed !== '') {
            const parsed = Number(trimmed)
            if (Number.isFinite(parsed)) {
              return parsed
            }
          }
        }
      }

      return null
    },

    checkProductAvailability(product) {
      if (!product) {
        return false
      }

      if (Object.prototype.hasOwnProperty.call(product, 'is_available')) {
        return Boolean(product.is_available)
      }

      if (Object.prototype.hasOwnProperty.call(product, 'isAvailable')) {
        return Boolean(product.isAvailable)
      }

      const stock = this.resolveProductStock(product)
      const hasStock = stock === null || stock === undefined ? true : Number(stock) > 0

      const rawPrice = product.price ?? (Array.isArray(product.pricing) && product.pricing.length ? product.pricing[0].price : 0)
      const numericPrice = Number(rawPrice)
      const hasValidPrice = !Number.isNaN(numericPrice) && numericPrice > 0

      return hasStock && hasValidPrice
    },

    canSelectProduct(product) {
      if (this.isInteractionLocked) {
        return false
      }

      if (!product) {
        return false
      }

      if (product.isAvailable === false) {
        return false
      }

      const stockValue = this.resolveProductStock(product)
      if (stockValue === null || stockValue === undefined) {
        return true
      }

      return Number(stockValue) > 0
    },

    getProductClass(product) {
      const classes = []

      if (this.canSelectProduct(product)) {
        classes.push('available')
      } else {
        classes.push('out-of-stock')
      }

      // Ajouter les indicateurs spéciaux
      if (this.isProductPopular(product)) {
        classes.push('has-popular-badge')
      }

      if (this.isProductOnPromotion(product)) {
        classes.push('has-promotion-badge')
      }

      return classes.join(' ')
    },

    isProductPopular(product) {
      // Simulation : un produit est populaire s'il a été vendu plus de 10 fois
      // Dans un vrai système, cela viendrait de la base de données
      return product.sales_count > 10 || Math.random() > 0.8
    },

    isProductOnPromotion(product) {
      // Simulation : un produit est en promotion s'il a un prix réduit
      // Dans un vrai système, cela viendrait de la base de données
      return product.original_price && product.original_price > product.price
    },

    filterProducts() {
      if (!this.searchQuery) {
        if (this.activeCategory) {
          this.loadProducts(this.activeCategory)
        } else {
          this.filteredProducts = [...this.products]
        }
        return
      }

      const query = this.searchQuery.toLowerCase()
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      )
    },

    addToCart(product, evt) {
      if (!this.selectedTable) {
        alert('Veuillez d\'abord sélectionner une table')
        return
      }

      if (!this.canSelectProduct(product)) {
        alert('Ce produit n\'est pas disponible ou en rupture de stock')
        return
      }

      const categoryId = product.category_id ?? this.activeCategory?.id ?? product.category?.id ?? null
      const printerTypeId = product.printer_type_id ?? this.resolveProductPrinterTypeId(product, this.activeCategory) ?? (categoryId ? this.categoryPrinterTypes[categoryId] : null)
      const availableStock = this.resolveProductStock(product)

      const existing = this.cart.find(p => p.id === product.id)
      if (existing) {
        if (availableStock !== null && availableStock !== undefined && existing.quantity >= availableStock) {
          alert(`Stock insuffisant. Plus que ${availableStock} unités disponibles.`)
          return
        }
        existing.quantity++
        if (!existing.printer_type_id && printerTypeId) {
          existing.printer_type_id = printerTypeId
        }
      } else {
        const price = product.price ?? (product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0)
        this.cart.push({
          ...product,
          category_id: categoryId,
          printer_type_id: printerTypeId,
          quantity: 1,
          price: Number(price) || 0,
          stock: availableStock
        })
      }

      this.registerProduct(product, {
        category: this.activeCategory,
        category_id: categoryId,
        printer_type_id: printerTypeId,
        price: product.price ?? (product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0)
      })

      // Animation de feedback
      this.showAddToCartAnimation(product)

      // Animation sur la carte produit
      let productCard = null
      if (evt?.currentTarget && typeof evt.currentTarget.closest === 'function') {
        productCard = evt.currentTarget.closest('.product-card')
      } else if (evt?.target && typeof evt.target.closest === 'function') {
        productCard = evt.target.closest('.product-card')
      }
      if (productCard) {
        productCard.classList.add('adding-to-cart')
        setTimeout(() => {
          productCard.classList.remove('adding-to-cart')
        }, 600)
      }
    },

    showAddToCartAnimation(product) {
      // Créer un élément de notification temporaire
      const notification = document.createElement('div')
      notification.className = 'add-to-cart-notification'
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-check"></i>
          <span>${product.name} ajouté au panier</span>
        </div>
      `
      document.body.appendChild(notification)

      // Styliser la notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: '#10b981',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        animation: 'slideInFromRight 0.3s ease-out'
      })

      // Supprimer la notification après 2 secondes
      setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease-in'
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 300)
      }, 2000)
    },

    incrementQuantity(item) {
      item.quantity++
    },

    decrementQuantity(item) {
      if (item.quantity > 1) {
        item.quantity--
      } else {
        this.removeItem(item)
      }
    },

    removeItem(item) {
      this.cart = this.cart.filter(i => i.id !== item.id)
    },

    clearCart() {
      this.cart = []
    },

    openTableSelector() {
      this.showTableSelector = true
    },

    closeTableSelector() {
      this.showTableSelector = false
    },

    async beginAddToPending() {
      if (!this.currentPendingOrder) {
        return
      }

      this.isAddingToPending = true
      this.clearCart()
      this.lastAdditionLines = []

      if (this.selectedTable) {
        await this.loadPendingOrdersForTable(this.selectedTable.id, { showToast: false, syncCart: false })
      }
    },

    async confirmAddToPending() {
      await this.addProductsToPending()
    },

    async onTableSelected(table) {
      // Vider le panier et réinitialiser les commandes en attente lors du changement de table
      this.clearCart()
      this.currentPendingOrder = null
      this.existingPendingLines = []
      this.lastAdditionLines = []
      this.isAddingToPending = false

      this.selectedTable = table
      this.syncRouteWithTable(table?.id ?? null)
      this.showTableSelector = false

      if (table.status === 'occupied') {
        await this.loadPendingOrdersForTable(table.id, { syncCart: true })
      }
    },

    async updateTableStatus(tableId, status) {
      try {
        const token = localStorage.getItem('token')
        await axios.patch(
          `${API_BASE_URL}/tables/${tableId}/status`,
          { status },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        )
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de la table :', error.response?.data || error.message)
      }
    },

    async handleCheckout() {
      if (!this.selectedTable) {
        alert('Veuillez sélectionner une table avant de valider')
        return
      }

      if (this.currentPendingOrder) {
        const baselineQuantities = new Map(
          this.existingPendingLines.map(line => [line.product_id, line.quantity])
        )

        const hasUnsyncedItems = this.cart.some(item => {
          const baseQuantity = baselineQuantities.get(item.id) || 0
          return item.quantity > baseQuantity
        })

        if (hasUnsyncedItems) {
          const { success } = await this.addToPendingOrder({
            showNotification: false,
            recordAddition: false
          })
          if (!success) {
            this.showNotification('Impossible d\'ajouter les nouveaux produits à la commande', 'error')
            return
          }
        } else {
          await this.loadPendingOrdersForTable(this.selectedTable.id, {
            showToast: false,
            syncCart: false
          })
        }

        const pendingOrder = this.currentPendingOrder

        const invoiceNumber = pendingOrder?.invoice_number || pendingOrder?.reference
        this.currentInvoiceNumber = invoiceNumber || this.generateInvoiceNumber()
        this.currentPaymentMethod = pendingOrder?.payment?.name || 'En attente'
        this.isInvoiceModalOpen = true
        return
      }

      if (this.cart.length === 0) return

      this.currentInvoiceNumber = this.generateInvoiceNumber()
      this.currentPaymentMethod = 'En attente'
      this.isInvoiceModalOpen = true
    },

    generateInvoiceNumber() {
      return 'TABLE-' + Date.now()
    },

    openPaymentModal() {
      this.isInvoiceModalOpen = false
      this.isPaymentModalOpen = true
    },

    handleCloseModal() {
      this.isPaymentModalOpen = false
    },

    closeInvoiceModal() {
      this.isInvoiceModalOpen = false
    },

    async handlePaymentConfirmation(paymentData) {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user'))

      if (!user) {
        console.error('Utilisateur non authentifié')
        return
      }

      this.currentPaymentMethod = paymentData.method || 'Inconnu'

      try {
        const sessionData = await this.fetchCurrentSession()

        const totalAmount = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        const discount = Number(paymentData.discount_percentage ?? 0)
        const computedFinalAmount = Number(
          paymentData.final_total !== undefined && paymentData.final_total !== null
            ? paymentData.final_total
            : (totalAmount * (1 - discount / 100)).toFixed(2)
        )
        const finalAmount = Number.isFinite(computedFinalAmount) ? computedFinalAmount : totalAmount
        const paymentMethodId = this.getPaymentMethodId(paymentData.method)

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }

        let saleId = null
        let invoiceNumber = this.currentInvoiceNumber

        if (this.currentPendingOrder) {
          const payload = {
            payment_id: paymentMethodId,
            discount_percentage: discount,
            final_total: Number(finalAmount.toFixed(2)),
            cash_register_session_id: sessionData?.id || null
          }

          const response = await axios.post(
            `${API_BASE_URL}/sales/${this.currentPendingOrder.id}/validate`,
            payload,
            { headers }
          )

          const validatedSale = response.data || {}
          saleId = validatedSale.id || this.currentPendingOrder.id
          invoiceNumber = validatedSale.invoice_number || invoiceNumber
          this.currentPendingOrder = null
          this.existingPendingLines = []
          this.isAddingToPending = false
        } else {
          const saleData = {
            user_id: user.id,
            point_of_sale_id: user.point_of_sale_id,
            table_id: this.selectedTable.id,
            cash_register_session_id: sessionData?.id || null,
            total_amount: Number(finalAmount.toFixed(2)),
            discount_percentage: discount,
            status: paymentData.status || 'completed',
            payment_id: paymentMethodId,
            ticket_number: Number(Date.now().toString())
          }

          const response = await axios.post(`${API_BASE_URL}/sales`, saleData, { headers })
          saleId = response.data.id
          invoiceNumber = response.data.invoice_number || invoiceNumber

          const aggregatedCart = this.prepareCartLines(this.cart)

          for (const line of aggregatedCart) {
            const orderLineData = {
              sale_id: saleId,
              product_id: line.product_id,
              quantity: line.quantity,
              price: Number(line.price),
              total: Number((line.price * line.quantity).toFixed(2))
            }

            await axios.post(`${API_BASE_URL}/orderlines`, orderLineData, { headers })
          }
        }

        if (saleId) {
          try {
            await axios.post(`${API_BASE_URL}/printers/invoice/${saleId}`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (printError) {
            console.error('Erreur lors de l\'impression de la facture:', printError.response?.data || printError.message)
          }
        } else {
          console.warn('Impossible d\'imprimer la facture : identifiant de vente introuvable')
        }

        if (this.selectedTable) {
          await this.updateTableStatus(this.selectedTable.id, 'available')
        }

        this.currentInvoiceNumber = invoiceNumber || this.generateInvoiceNumber()
        this.showNotification('Commande validée et ticket imprimé', 'success')

        this.currentPendingOrder = null
        this.clearCart()
        this.selectedTable = null
        this.existingPendingLines = []
        this.lastAdditionLines = []
        this.isAddingToPending = false

        this.isPaymentModalOpen = false
        this.isInvoiceModalOpen = false
      } catch (error) {
        console.error('Erreur lors du traitement du paiement:', error.response?.data || error.message)
        this.showNotification('Paiement impossible, veuillez réessayer', 'error')
      } finally {
        this.handleCloseModal()
      }
    },

    getPaymentMethodId(method) {
      const paymentMethodMap = {
        'TPE': 1,
        'Orange Money': 2,
        'MVola': 3,
        'Espèce': 4,
        'Airtel Money': 5
      }
      return paymentMethodMap[method] || null
    },

    async fetchCurrentSession() {
      try {
        const token = localStorage.getItem('token')
        const { data } = await axios.get(`${API_BASE_URL}/cash-register-session/my-active-session`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        return data?.data || data || null
      } catch (error) {
        console.error('Impossible de récupérer la session de caisse:', error.response?.data || error.message)
        return null
      }
    },

    handleImageError(event) {
      const target = event?.target
      if (!target) return
      if (target.dataset.fallbackApplied === 'true') return
      target.dataset.fallbackApplied = 'true'
      target.onerror = null
      target.src = placeholderImage
    },

    // Méthodes pour les commandes en attente
    async holdOrder() {
      if (this.cart.length === 0) return
      if (!this.selectedTable) {
        alert('Veuillez sélectionner une table avant d\'envoyer la commande')
        return
      }

      try {
        const token = localStorage.getItem('token')
        const user = JSON.parse(localStorage.getItem('user'))
        const sessionData = await this.fetchCurrentSession()

        const cartLines = this.prepareCartLines(this.cart)

        cartLines.forEach(line => {
          const productRef = line.product || { id: line.product_id, name: line.name, category_id: line.category_id }
          const categoryRef = productRef?.category || (line.category_id ? { id: line.category_id } : this.activeCategory || null)

          this.registerProduct(productRef, {
            category: categoryRef,
            category_id: line.category_id ?? categoryRef?.id ?? null,
            printer_type_id: line.printer_type_id ?? this.resolveProductPrinterTypeId(productRef, categoryRef) ?? null,
            price: line.price
          })
        })

        const orderData = {
          table_id: this.selectedTable.id,
          user_id: user.id,
          point_of_sale_id: user.point_of_sale_id,
          cash_register_session_id: sessionData?.id || null,
          order_lines: cartLines.map(line => this.stripLineForApi(line))
        }

        const response = await axios.post(`${API_BASE_URL}/sales/pending-order`, orderData, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        this.currentPendingOrder = response.data?.data || response.data || null

        await this.printPendingOrder({ lines: cartLines })

        await this.updateTableStatus(this.selectedTable.id, 'occupied')
        if (this.selectedTable) {
          this.selectedTable.status = 'occupied'
        }

        await this.loadPendingOrdersForTable(this.selectedTable.id, { showToast: false, syncCart: false })

        this.cart = []
        this.lastAdditionLines = []
        this.isAddingToPending = false
        this.showNotification('Commande envoyée et imprimée', 'success')
      } catch (error) {
        console.error('Erreur lors de l\'envoi de la commande:', error.response?.data || error.message)
        this.showNotification('Impossible d\'envoyer la commande', 'error')
      }
    },

    async addToPendingOrder(options = {}) {
      const {
        showNotification = true,
        recordAddition = true,
        lines = null
      } = options

      if (!this.currentPendingOrder) {
        return { success: false, additions: [] }
      }

      const manualLines = Array.isArray(lines) ? lines : null

      if ((!manualLines || manualLines.length === 0) && this.cart.length === 0) {
        return { success: false, additions: [] }
      }

      try {
        const token = localStorage.getItem('token')

        const baselineQuantities = new Map(
          this.existingPendingLines.map(line => [line.product_id, line.quantity])
        )

        const sourceLines = manualLines && manualLines.length > 0
          ? manualLines
          : this.cart.map(item => ({
              product_id: item.id,
              quantity: item.quantity,
              price: item.price
            }))

        const additions = sourceLines.reduce((acc, line) => {
          const productId = line.product_id ?? line.id
          const catalogEntry = this.productCatalog[productId] || {}
          const desiredQuantity = Number(line.quantity) || 0
          const price = Number(line.price) || 0

          if (desiredQuantity <= 0) {
            return acc
          }

          const baseQuantity = baselineQuantities.get(productId) || 0
          const quantityToAdd = manualLines && manualLines.length > 0
            ? desiredQuantity
            : desiredQuantity - baseQuantity

          if (quantityToAdd <= 0) {
            return acc
          }

          const categoryId = line.category_id ?? catalogEntry.category_id ?? null
          const printerTypeId = line.printer_type_id ?? catalogEntry.printer_type_id ?? (categoryId ? this.categoryPrinterTypes[categoryId] : null)

          acc.push({
            product_id: productId,
            quantity: quantityToAdd,
            price,
            category_id: categoryId,
            printer_type_id: printerTypeId
          })

          return acc
        }, [])

        if (additions.length === 0) {
          if (showNotification) {
            this.showNotification('Aucun nouveau produit à ajouter', 'info')
          }
          return { success: false, additions: [] }
        }

        await axios.post(`${API_BASE_URL}/sales/${this.currentPendingOrder.id}/add-products`, {
          order_lines: additions
        }, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        await this.loadPendingOrdersForTable(this.selectedTable.id, { showToast: false, syncCart: false })

        if (recordAddition) {
          this.lastAdditionLines = additions
        }

        if (showNotification) {
          this.showNotification('Produits ajoutés à la commande', 'success')
        }
        return { success: true, additions }
      } catch (error) {
        console.error('Erreur lors de l\'ajout:', error.response?.data || error.message)
        if (showNotification) {
          this.showNotification('Erreur lors de l\'ajout à la commande', 'error')
        }
        return { success: false, additions: [] }
      }
    },

    async addProductsToPending() {
      if (!this.currentPendingOrder) return

      const cartSnapshot = this.cart.map(item => ({ ...item }))

      if (cartSnapshot.length === 0) {
        this.showNotification('Panier vide, rien à ajouter', 'info')
        this.isAddingToPending = false
        return
      }

      const payloadLines = this.prepareCartLines(cartSnapshot)

      this.clearCart()

      const { success, additions } = await this.addToPendingOrder({
        showNotification: false,
        recordAddition: true,
        lines: payloadLines
      })

      if (!success) {
        this.showNotification('Échec de l\'ajout, veuillez réessayer', 'error')
        this.cart = cartSnapshot.map(item => ({ ...item }))
        return
      }

      this.showNotification('Produits ajoutés à la commande', 'success')

      try {
        await this.printPendingOrder({ showSuccess: false, lines: additions })
        this.showNotification('Ticket additionnel imprimé', 'success')
      } catch (error) {
        console.error('Erreur lors de l\'impression du ticket additionnel:', error)
        this.showNotification('Impression du ticket additionnel impossible', 'error')
      }
    },

    normalizeLinesForPrinting(inputLines = []) {
      const baseLines = Array.isArray(inputLines) && inputLines.length > 0
        ? inputLines
        : this.existingPendingLines

      const normalized = baseLines
        .map(line => {
          const productId = line.product_id ?? line.id
          const catalogEntry = this.productCatalog[productId] || {}
          const categoryId = line.category_id ?? catalogEntry.category_id ?? null
          const printerTypeId = line.printer_type_id ?? catalogEntry.printer_type_id ?? (categoryId ? this.categoryPrinterTypes[categoryId] : null)
          const price = Number(line.price ?? catalogEntry.price ?? 0) || 0
          const quantity = Number(line.quantity) || 0

          return {
            ...line,
            product_id: productId,
            quantity,
            price,
            category_id: categoryId,
            printer_type_id: printerTypeId
          }
        })
        .filter(line => line.quantity > 0)

      return this.aggregateLineItems(normalized)
    },

    stripLineForApi(line) {
      return {
        product_id: line.product_id,
        quantity: line.quantity,
        price: line.price
      }
    },

    getPrinterTypeId(printer) {
      if (!printer) return null
      return printer.printer_type_id ?? printer.printer_type?.id ?? printer.printer_type ?? null
    },

    getPrinterTypeCode(printer) {
      if (!printer) return null
      return (printer.printer_type?.code || printer.printer_type?.name || '').toString().toLowerCase()
    },

    isPrinterActive(printer) {
      if (!printer) return false
      if (printer.is_active === true || printer.is_active === 'true' || printer.is_active === 1) return true
      if (printer.is_active === false || printer.is_active === 'false' || printer.is_active === 0) return false
      return true
    },

    isCashPrinter(printer) {
      if (!printer) return false
      const code = this.getPrinterTypeCode(printer)
      return Boolean(printer.is_default) || code === 'cash' || code === 'invoice'
    },

    async ensurePrintersLoaded(force = false) {
      if (!force && Array.isArray(this.printersCache) && this.printersCache.length > 0) {
        return this.printersCache
      }

      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/printers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = Array.isArray(response.data?.data) ? response.data.data : Array.isArray(response.data) ? response.data : []
        this.printersCache = Array.isArray(data) ? data : []
      } catch (error) {
        console.error('Erreur lors du chargement des imprimantes:', error.response?.data || error.message)
        this.printersCache = []
      }

      return this.printersCache
    },

    async sendPrintJob(printerId, lines) {
      if (!printerId || !Array.isArray(lines) || lines.length === 0) return

      const token = localStorage.getItem('token')
      await axios.post(
        `${API_BASE_URL}/sales/${this.currentPendingOrder.id}/print-pending/${printerId}`,
        { order_lines: lines.map(line => this.stripLineForApi(line)) },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
    },

    async printPendingOrder(options = {}) {
      if (!this.currentPendingOrder) return

      const {
        showSuccess = true,
        lines = []
      } = options

      const normalizedLines = this.normalizeLinesForPrinting(lines)
      if (!normalizedLines.length) {
        this.showNotification('Aucune ligne à imprimer', 'info')
        return
      }

      const printers = (await this.ensurePrintersLoaded()).filter(printer => this.isPrinterActive(printer))

      if (!printers.length) {
        this.showNotification('Aucune imprimante disponible', 'warning')
        return
      }

      const errors = []
      const printedPrinterIds = new Set()

      const cashPrinters = printers.filter(printer => this.isCashPrinter(printer))
      for (const printer of cashPrinters) {
        if (printedPrinterIds.has(printer.id)) continue
        try {
          await this.sendPrintJob(printer.id, normalizedLines)
        } catch (error) {
          errors.push({ printer, error })
        }
        printedPrinterIds.add(printer.id)
      }

      const printersByType = printers.reduce((acc, printer) => {
        const typeId = this.getPrinterTypeId(printer)
        if (!typeId) return acc
        if (!acc[typeId]) acc[typeId] = []
        acc[typeId].push(printer)
        return acc
      }, {})

      const linesByType = normalizedLines.reduce((acc, line) => {
        if (!line.printer_type_id) return acc
        const key = line.printer_type_id
        if (!acc[key]) acc[key] = []
        acc[key].push(line)
        return acc
      }, {})

      for (const [typeId, typeLines] of Object.entries(linesByType)) {
        const targetPrinters = printersByType[typeId] || []
        if (!targetPrinters.length) continue
        for (const printer of targetPrinters) {
          if (printedPrinterIds.has(printer.id)) continue
          try {
            await this.sendPrintJob(printer.id, typeLines)
          } catch (error) {
            errors.push({ printer, error })
          }
          printedPrinterIds.add(printer.id)
        }
      }

      if (errors.length) {
        console.error('Certaines impressions ont échoué:', errors)
        this.showNotification('Certaines impressions ont échoué. Consultez la console.', 'error')
      } else if (showSuccess) {
        this.showNotification('Commande imprimée avec succès!', 'success')
      }
    },

    async loadPendingOrdersForTable(tableId, options = {}) {
      const {
        showToast = true,
        notifyWhenEmpty = false,
        syncCart = false
      } = options

      try {
        const token = localStorage.getItem('token')

        const response = await axios.get(`${API_BASE_URL}/tables/${tableId}/pending-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const pendingOrders = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : []

        if (pendingOrders.length > 0) {
          // Prendre la première commande en attente
          const pendingOrder = pendingOrders[0]
          this.currentPendingOrder = pendingOrder

          const orderLines = Array.isArray(pendingOrder.order_lines)
            ? pendingOrder.order_lines
            : Array.isArray(pendingOrder.orderLines)
              ? pendingOrder.orderLines
              : []

          if (orderLines.length > 0) {
            const mappedLines = orderLines.map(line => {
              const productData = line.product || {}
              const categoryData = productData.category || (productData.category_id ? { id: productData.category_id } : null)
              const price = Number(line.price || line.unit_price || productData.price || 0) || 0
              const quantity = line.quantity || 1
              const categoryId = productData.category_id ?? categoryData?.id ?? null
              const printerTypeId = this.resolveProductPrinterTypeId(productData, categoryData)

              if (line.product || Object.keys(productData).length > 0) {
                this.registerProduct({ ...productData, id: line.product_id, price }, {
                  category: categoryData,
                  category_id: categoryId,
                  printer_type_id: printerTypeId,
                  price
                })
              } else if (!this.productCatalog[line.product_id]) {
                const fallbackName = productData.name || 'Produit inconnu'
                this.registerProduct({ id: line.product_id, name: fallbackName, category_id: categoryId, price }, {
                  category_id: categoryId,
                  printer_type_id: printerTypeId,
                  price
                })
              }

              return {
                product_id: line.product_id,
                name: productData.name || 'Produit inconnu',
                price,
                quantity,
                category_id: categoryId,
                printer_type_id: printerTypeId,
                product: productData
              }
            })

            this.existingPendingLines = this.aggregateLineItems(mappedLines)

            if (syncCart) {
              this.cart = this.existingPendingLines.map(line => ({
                id: line.product_id,
                name: line.name,
                price: line.price,
                quantity: line.quantity,
                category_id: line.category_id,
                printer_type_id: line.printer_type_id,
                product: line.product || null
              }))
              this.lastAdditionLines = []
              this.isAddingToPending = false
            }

            if (!syncCart) {
              this.lastAdditionLines = []
            }

            if (showToast) {
              this.showNotification('Commande en attente chargée', 'success')
            }
          } else {
            console.warn('Aucune ligne de commande trouvée pour cette commande en attente')
            this.existingPendingLines = []
            if (syncCart) {
              this.cart = []
              this.lastAdditionLines = []
            }
            if (showToast) {
              this.showNotification('Commande en attente trouvée mais vide', 'warning')
            }
          }

          return pendingOrder
        }

        this.currentPendingOrder = null
        this.existingPendingLines = []
        this.lastAdditionLines = []
        if (syncCart) {
          this.cart = []
        }
        this.isAddingToPending = false
        if (showToast && notifyWhenEmpty) {
          this.showNotification('Aucune commande en attente pour cette table', 'info')
        }
        return null
      } catch (error) {
        console.error('Erreur lors du chargement des commandes en attente:', error.response?.data || error.message)
        if (showToast) {
          this.showNotification('Erreur lors du chargement de la commande', 'error')
        }
        this.existingPendingLines = []
        this.lastAdditionLines = []
        if (syncCart) {
          this.cart = []
        }
        this.isAddingToPending = false
        return null
      }
    },

    showNotification(message, type = 'info') {
      const notification = document.createElement('div')
      notification.className = `notification notification-${type}`
      notification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
          <span>${message}</span>
        </div>
      `
      document.body.appendChild(notification)

      // Styliser la notification
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: type === 'success' ? '#10b981' : type === 'error' ? '#dc2626' : '#3b82f6',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontWeight: '600',
        animation: 'slideInFromRight 0.3s ease-out'
      })

      // Supprimer la notification après 3 secondes
      setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease-in'
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 300)
      }, 3000)
    }
  },

  async mounted() {
    const { loadUserData } = useAuth()
    await loadUserData()
    await this.loadCategories()
}
}
</script>

<style scoped>
.table-sale {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding-top: 5rem;
}

.table-sale-header {
  background: white;
  border-bottom: 1px solid #e2e8f0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-info-section {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.current-table-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.table-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #2563eb;
  font-weight: 600;
}

.table-number {
  font-size: 1.25rem;
  font-weight: 700;
}

.table-name {
  color: #64748b;
}

.table-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.table-status.available {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
  border: 1px solid #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  animation: pulse-available 3s infinite;
}

@keyframes pulse-available {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
  }
  50% {
    box-shadow: 0 2px 12px rgba(16, 185, 129, 0.3);
  }
}

.table-status.occupied {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  border: 1px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  animation: pulse-occupied-header 2s infinite;
}

@keyframes pulse-occupied-header {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
  }
  50% {
    box-shadow: 0 2px 15px rgba(245, 158, 11, 0.3);
  }
}

.table-status.reserved {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border: 1px solid #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
}

.table-status.reserved::after {
  content: '⏰';
  margin-left: 0.5rem;
  font-size: 0.875rem;
}

.table-status.out_of_order {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #dc2626;
  border: 1px solid #ef4444;
  opacity: 0.8;
  position: relative;
}

.table-status.out_of_order::before {
  content: '🚫';
  margin-right: 0.5rem;
  font-size: 0.875rem;
}

.table-status.out_of_order::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(45deg);
  width: 60%;
  height: 2px;
  background: #dc2626;
  z-index: 1;
}

.no-table-selected {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-style: italic;
}

.table-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-table-select, .btn-table-clear {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-table-select {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-table-select:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.btn-table-clear {
  background: white;
  color: #dc2626;
  border-color: #dc2626;
}

.btn-table-clear:hover {
  background: #dc2626;
  color: white;
}

.sale-info {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.sale-summary, .sale-total {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label, .total-label {
  color: #64748b;
  font-weight: 500;
}

.summary-value {
  font-weight: 600;
  color: #2563eb;
}

.total-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #dc2626;
}

.table-sale-content {
  flex: 1;
  display: grid;
  grid-template-columns: 250px 1fr 450px;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

.categories-section, .products-section, .cart-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.categories-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.category-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
}

.category-btn:hover {
  background: #f8fafc;
  border-color: #d1d5db;
}

.category-btn.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.category-btn.disabled,
.category-btn:disabled {
  background: #f3f4f6;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.category-btn.disabled:hover,
.category-btn:disabled:hover {
  background: #f3f4f6;
  border-color: #e5e7eb;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 0.75rem;
  color: #9ca3af;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-box input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.search-box input:disabled {
  background: #f9fafb;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.products-grid {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
  align-items: stretch;
}

.product-card {
  position: relative;
  width: 100%;
  padding-top: 100%;
  animation: fadeInUp 0.4s ease-out;
}

.product-card:nth-child(even) {
  animation-delay: 0.1s;
}

.product-card:nth-child(3n) {
  animation-delay: 0.2s;
}

.product-card-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.product-card:hover .product-card-inner {
  border-color: #2563eb;
  box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
  transform: translateY(-4px);
}

.product-card.locked {
  pointer-events: none;
  opacity: 0.6;
}

.product-card.locked .product-card-inner {
  filter: grayscale(0.3);
}

.product-card.locked .product-card-inner::before,
.product-card.locked .product-card-inner::after {
  opacity: 0;
}

.product-card:active .product-card-inner {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

.product-card-media {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.product-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.product-card-media img.locked-image {
  filter: grayscale(0.3);
}

.product-card:hover .product-card-media img {
  transform: scale(1.05);
}

.product-info {
  padding: 1rem;
  background: white;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-info h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.3;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  flex: 1 1 auto;
}

.product-price {
  margin: 0;
  color: #2563eb;
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  margin-top: auto;
}

.product-price::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 1rem;
  right: 1rem;
  height: 2px;
  background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.product-card:hover .product-price::after {
  transform: scaleX(1);
}

.product-card-inner::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.product-card:hover .product-card-inner::before {
  opacity: 1;
  transform: scale(1);
  background: rgba(37, 99, 235, 0.2);
}

.product-card-inner::after {
  content: '+';
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
}

.product-card:hover .product-card-inner::after {
  opacity: 1;
  transform: scale(1);
}

/* Indicateur de stock */
.product-stock {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background: #f3f4f6;
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  z-index: 5;
}

.product-card.available .product-stock {
  background: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.product-card.out-of-stock .product-stock {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

/* Indicateurs spéciaux */
.product-popular,
.product-promotion {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: #f59e0b;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  z-index: 5;
}

.product-promotion {
  background: #dc2626;
}

.product-popular::after {
  content: '🔥';
  margin-left: 0.25rem;
}

.product-promotion::after {
  content: '💰';
  margin-left: 0.25rem;
}

/* État disponible / rupture */
.product-card.available .product-card-inner {
  border-color: #10b981;
}

.product-card.available:hover .product-card-inner {
  border-color: #059669;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.15);
}

.product-card.available .product-card-inner::after {
  background: #10b981;
}

.product-card.out-of-stock .product-card-inner {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-card.out-of-stock .product-card-inner::before {
  opacity: 0;
}

.product-card.out-of-stock .product-card-inner::after {
  content: 'Rupture';
  background: rgba(220, 38, 38, 0.9);
  top: 50%;
  right: auto;
  left: 50%;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  opacity: 1;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
}

.product-card.out-of-stock:hover .product-card-inner {
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.product-card.out-of-stock:hover .product-card-inner::after {
  transform: translate(-50%, -50%);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Style pour les produits sans image */
.product-card-media img[src*="avatar.png"],
.product-card-media img:not([src]) {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-card-media img[src*="avatar.png"]::after,
.product-card-media img:not([src])::after {
  content: '📦';
  font-size: 2rem;
  opacity: 0.5;
}

/* Améliorations pour les écrans tactiles */
@media (hover: none) and (pointer: coarse) {
  .product-card {
    min-height: 200px;
    border-width: 3px;
  }

  .product-card:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
  }

  .product-card::after {
    opacity: 0.8;
    transform: scale(1);
    background: #10b981;
  }

  .product-card::before {
    opacity: 0.6;
    transform: scale(1);
  }

  .product-info {
    padding: 1.25rem;
  }

  .product-info h4 {
    font-size: 1rem;
    height: auto;
    -webkit-line-clamp: unset;
  }
}

/* Animation de chargement pour les produits */
.product-card.loading .product-card-inner {
  pointer-events: none;
}

.product-card.loading .product-card-media img {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Animations pour les notifications */
@keyframes slideInFromRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOutToRight {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Animation pour l'ajout au panier */
.product-card.adding-to-cart .product-card-inner {
  animation: addToCartPulse 0.6s ease-out;
}

@keyframes addToCartPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
}

.cart-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

}

.cart-items {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
}

.cart-items tbody {
  display: block;
  max-height: 300px;
  overflow-y: auto;
}

.cart-items tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.cart-items td {
  padding: 0.5rem 0.25rem;
  vertical-align: middle;
  border-bottom: 1px solid #f3f4f6;
}

.cart-item {
  min-height: 40px;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 40%;
}

.item-decrement,
.item-increment {
  width: 40px;
  text-align: center;
}

.item-quantity {
  width: 40px;
  text-align: center;
  font-weight: 600;
}

.item-total {
  text-align: right;
  font-weight: 600;
  color: #2563eb;
  width: 20%;
}

.item-remove {
  width: 40px;
  text-align: center;
}

.btn-quantity {
  width: 32px;
  height: 32px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.btn-quantity:hover {
  background: #f8fafc;
  border-color: #9ca3af;
}

.item-quantity {
  min-width: 2rem;
  text-align: center;
  font-weight: 600;
}

.item-total {
  text-align: right;
  font-weight: 600;
  color: #2563eb;
  width: 20%;
}

.btn-remove {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: #dc2626;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: background 0.2s;
}

.btn-remove:hover {
  background: #b91c1c;
}

.btn-quantity:disabled,
.btn-remove:disabled,
.btn-clear-cart:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cart-footer {
  border-top: 1px solid #e2e8f0;
  padding: 1rem;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
}

.total-label {
  color: #374151;
}

.total-amount {
  color: #dc2626;
}

.btn-checkout {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  flex: 1;
  min-height: 48px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn-checkout {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: 2px solid transparent;
}

.btn-checkout:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.btn-checkout.pending-order {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  position: relative;
}

.btn-checkout.pending-order::after {
  content: '📋';
  position: absolute;
  top: -8px;
  right: -8px;
  background: #fbbf24;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
  animation: pulse-pending 2s infinite;
}

@keyframes pulse-pending {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 2px 12px rgba(251, 191, 36, 0.6);
  }
}

.btn-checkout.pending-order:hover {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.btn-hold-order, .btn-add-to-order {
  padding: 0.75rem 1rem;
  border: 2px solid;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  min-height: 44px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-hold-order:disabled, .btn-add-to-order:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-hold-order {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  border-color: #f59e0b;
}

.btn-hold-order:hover {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);
}

.btn-add-to-order {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  color: white;
  border-color: #3b82f6;
}

.btn-add-to-order:hover {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.cart-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cart-actions .action-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.cart-actions .action-row:last-child {
  justify-content: center;
}

/* Responsive layout for cart actions */
@media (min-width: 768px) {
  .cart-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .cart-actions .action-row {
    grid-column: span 2;
  }

  .cart-actions .action-row:last-child {
    grid-column: span 2;
    justify-content: center;
  }
}

.btn-clear-cart {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid #dc2626;
  border-radius: 6px;
  background: white;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear-cart:hover {
  background: #dc2626;
  color: white;
}

.empty-cart {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  text-align: center;
}

.empty-cart i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-cart p {
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.empty-cart small {
  font-size: 0.875rem;
}

@media (max-width: 1200px) {
  .table-sale-content {
    grid-template-columns: 200px 1fr 300px;
  }
}

@media (max-width: 768px) {
  .table-sale-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .table-info-section {
    justify-content: space-between;
  }

  .table-sale-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .categories-section {
    max-height: 200px;
  }

  .products-section {
    max-height: 300px;
  }

  .cart-section {
    max-height: 350px;
  }

  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }

  .product-card {
    aspect-ratio: 1 / 1;
  }

  .product-card-media img {
    flex: 1 1 auto;
  }

  .product-info {
    padding: 0.75rem;
  }

  .product-info h4 {
    font-size: 0.875rem;
    height: 2.1rem;
  }

  .product-stock {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .product-popular, .product-promotion {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }
}

/* Améliorations pour les très petits écrans */
@media (max-width: 480px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .product-card {
    aspect-ratio: 1 / 1;
  }

  .product-card-media img {
    flex: 1 1 auto;
  }

  .product-info h4 {
    font-size: 0.8rem;
    height: 1.8rem;
  }

  .product-price {
    font-size: 1rem;
  }

  .table-sale-header {
    padding: 0.75rem 1rem;
  }

  .table-sale-content {
    padding: 0.75rem;
    gap: 0.75rem;
  }
}

.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-start {
  display: flex;
  align-items: center;
}

.menu-toggle {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.navbar-link {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  color: white;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  margin-right: 5px;
}

.logout-icon {
  margin-left: 10px;
  cursor: pointer;
  color: #dc2626;
}

.logout-icon:hover {
  color: #b91c1c;
}

.has-dropdown:hover .navbar-dropdown {
  display: block;
}

.navbar-item.has-text-danger {
  color: red;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.side-menu {
  position: fixed;
  top: 100px;
  left: -280px;
  width: 280px;
  height: calc(100vh - 60px);
  background: #f5f5f5;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  color: black;
  z-index: 1100;
}

.side-menu.is-open {
  transform: translateX(280px);
}

.menu-header {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  padding: 1rem 1.5rem;
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
  text-align: center;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(67, 97, 238, 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
}

.menu-header:hover {
  background: linear-gradient(135deg, #3a0ca3, #4361ee);
  box-shadow: 0 6px 10px rgba(58, 12, 163, 0.6);
  cursor: pointer;
}

.menu-content {
  padding: 1rem;
  color: black;
}

.menu-button {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  font-weight: bold;
  background-color: #ddd;
  color: black;
  border: none;
  cursor: pointer;
}

.menu-divider {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid #ccc;
}

.admin-title {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  padding: 1rem 1.5rem;
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
  text-align: center;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(67, 97, 238, 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
}

.admin-title:hover {
  background: linear-gradient(135deg, #3a0ca3, #4361ee);
  box-shadow: 0 6px 10px rgba(58, 12, 163, 0.6);
  cursor: pointer;
}

</style>
