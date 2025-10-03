<template>

  <div class="table-sales">
    <div class="page-header">
      <h1><font-awesome-icon icon="fa-solid fa-table" /> Ventes par table</h1>
      <div class="header-actions">
        <button @click="refreshData" class="btn-refresh">
          <font-awesome-icon icon="fa-solid fa-rotate" />
          Actualiser
        </button>
        <button @click="openTableLayout" class="btn-layout">
          <font-awesome-icon icon="fa-solid fa-table-cells" />
          Plan de salle
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Statut:</label>
        <select v-model="statusFilter" @change="filterTables">
          <option value="">Tous</option>
          <option value="occupied">Occupées</option>
          <option value="available">Disponibles</option>
          <option value="reserved">Réservées</option>
        </select>
      </div>
      <div class="filter-group">
        <label>Point de vente:</label>
        <select v-model="pointOfSaleFilter" @change="filterTables">
          <option value="">Tous</option>
          <option v-for="pos in pointsOfSale" :key="pos.id" :value="pos.id">
            {{ pos.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tables avec ventes actives -->
    <div class="tables-grid">
      <div
        v-for="table in filteredTables"
        :key="table.id"
        class="table-card"
        :class="table.status"
      >
        <div class="table-header">
          <div class="table-info">
            <h3 class="table-number">{{ table.table_number }}</h3>
            <p v-if="table.name" class="table-name">{{ table.name }}</p>
            <div class="table-status">
              <font-awesome-icon :icon="getStatusIcon(table.status)" />
              {{ getStatusText(table.status) }}
            </div>
          </div>
          <div class="table-actions">
            <button
              @click="startTableService(table)"
              class="btn-service"
              :disabled="table.status === 'out_of_order'"
              title="Prendre la commande"
            >
              <font-awesome-icon icon="fa-solid fa-plus" />
            </button>
            <button @click="viewTableDetails(table)" class="btn-view" title="Détails de la table">
              <font-awesome-icon icon="fa-solid fa-eye" />
            </button>
            <button @click="printTableBill(table)" class="btn-print" title="Imprimer la facture">
              <font-awesome-icon icon="fa-solid fa-print" />
            </button>
          </div>
        </div>

        <div v-if="table.active_sales && table.active_sales.length > 0" class="active-sales">
          <div class="sales-list">
            <div
              v-for="sale in table.active_sales"
              :key="sale.id"
              class="sale-item"
            >
              <div class="sale-header" @click="toggleSaleLines(sale.id)" style="cursor: pointer;">
                <div class="sale-info">
                  <span class="sale-number">#{{ sale.ticket_number }}</span>
                  <span class="sale-time">{{ formatTime(sale.created_at) }}</span>
                </div>
                <div class="sale-total">{{ formatPrice(sale.total_amount) }}</div>
                <div class="sale-toggle">
                  <font-awesome-icon :icon="isSaleExpanded(sale.id) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
                </div>
              </div>
              <transition name="fade">
                <div v-if="isSaleExpanded(sale.id) && sale.order_lines && sale.order_lines.length" class="sale-lines">
                  <div
                    v-for="line in sale.order_lines"
                    :key="line.id || line.product_id || line.name"
                    class="sale-line"
                  >
                    <span class="line-name">{{ line.name }}</span>
                    <span class="line-qty">×{{ line.quantity }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>

        <div v-else class="no-sales">
          <font-awesome-icon icon="fa-solid fa-receipt" />
          <p>Aucune commande en cours</p>
        </div>

      </div>
    </div>

    <!-- Modal de détails de table -->
    <div v-if="showTableDetails" class="modal-overlay" @click="closeTableDetails">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Détails de la table {{ selectedTable?.table_number }}</h3>
          <button @click="closeTableDetails" class="btn-close-modal">
            <font-awesome-icon icon="fa-solid fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedTable" class="table-details">
            <div class="detail-row">
              <span class="label">Numéro:</span>
              <span class="value">{{ selectedTable.table_number }}</span>
            </div>
            <div v-if="selectedTable.name" class="detail-row">
              <span class="label">Nom:</span>
              <span class="value">{{ selectedTable.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Capacité:</span>
              <span class="value">{{ selectedTable.capacity }} personnes</span>
            </div>
            <div class="detail-row">
              <span class="label">Statut:</span>
              <span class="value status" :class="selectedTable.status">
                {{ getStatusText(selectedTable.status) }}
              </span>
            </div>
            <div v-if="selectedTable.description" class="detail-row">
              <span class="label">Description:</span>
              <span class="value">{{ selectedTable.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de détails de vente -->
    <div v-if="showSaleDetails" class="modal-overlay" @click="closeSaleDetails">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>Détails de la vente #{{ selectedSale?.ticket_number }}</h3>
          <button @click="closeSaleDetails" class="btn-close-modal">
            <font-awesome-icon icon="fa-solid fa-times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="selectedSale" class="sale-details">
            <div class="sale-info-grid">
              <div class="info-item">
                <span class="label">Table:</span>
                <span class="value">{{ selectedSale.table?.table_number }}</span>
              </div>
              <div class="info-item">
                <span class="label">Serveur:</span>
                <span class="value">{{ selectedSale.user?.name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Date:</span>
                <span class="value">{{ formatDateTime(selectedSale.created_at) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Statut:</span>
                <span class="value status" :class="selectedSale.status">
                  {{ getSaleStatusText(selectedSale.status) }}
                </span>
              </div>
            </div>

            <div class="sale-items">
              <h4>Articles commandés</h4>
              <div class="items-list">
                <div
                  v-for="item in selectedSale.order_lines"
                  :key="item.id"
                  class="item-row"
                >
                  <div class="item-info">
                    <span class="item-name">{{ item.product?.name }}</span>
                    <span class="item-quantity">×{{ item.quantity }}</span>
                  </div>
                  <div class="item-price">{{ formatPrice(item.price) }}</div>
                  <div class="item-total">{{ formatPrice(item.total) }}</div>
                </div>
              </div>
            </div>

            <div class="sale-summary">
              <div class="summary-row">
                <span>Sous-total:</span>
                <span>{{ formatPrice(selectedSale.total_amount) }}</span>
              </div>
              <div v-if="selectedSale.discount_percentage > 0" class="summary-row discount">
                <span>Remise ({{ selectedSale.discount_percentage }}%):</span>
                <span>-{{ formatPrice(selectedSale.total_amount * selectedSale.discount_percentage / 100) }}</span>
              </div>
              <div class="summary-row total">
                <span>Total:</span>
                <span>{{ formatPrice(selectedSale.total_amount * (1 - selectedSale.discount_percentage / 100)) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'TableSales',
  data() {
    return {
      tables: [],
      pointsOfSale: [],
      statusFilter: '',
      pointOfSaleFilter: '',
      showTableDetails: false,
      showSaleDetails: false,
      selectedTable: null,
      selectedSale: null,
      expandedSales: {}
    }
  },
  computed: {
    filteredTables() {
      let filtered = [...this.tables]

      if (this.statusFilter) {
        filtered = filtered.filter(table => table.status === this.statusFilter)
      }

      if (this.pointOfSaleFilter) {
        filtered = filtered.filter(table => table.point_of_sale_id == this.pointOfSaleFilter)
      }

      return filtered
    }
  },
    methods: {
      formatPrice(price) {
        return `${parseFloat(price).toFixed(2)} Ar`
      },

      toggleSaleLines(saleId) {
        this.expandedSales[saleId] = !this.expandedSales[saleId]
      },

      isSaleExpanded(saleId) {
        return !!this.expandedSales[saleId]
      },

      formatTime(dateTime) {
        return new Date(dateTime).toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      },

    formatDateTime(dateTime) {
      return new Date(dateTime).toLocaleString('fr-FR')
    },

    getStatusIcon(status) {
      const icons = {
        'available': 'fa-solid fa-circle-check',
        'occupied': 'fa-solid fa-users',
        'reserved': 'fa-solid fa-calendar-check',
        'out_of_order': 'fa-solid fa-wrench'
      }
      return icons[status] || 'fa-solid fa-circle-question'
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

    getSaleStatusText(status) {
      const texts = {
        'pending': 'En attente',
        'completed': 'Terminée',
        'cancelled': 'Annulée'
      }
      return texts[status] || status
    },

    getTableTotal(table) {
      if (!table.active_sales) return 0
      return table.active_sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0)
    },

    isSaleActive(sale) {
      if (!sale) return false
      const status = (sale.status || sale.state || sale.sale_status || '').toString().toLowerCase()
      if (!status) return true
      return !['completed', 'complete', 'terminée', 'terminee', 'closed', 'fermee', 'paid', 'paye', 'cancelled', 'annulée', 'annulee', 'annule', 'refunded'].includes(status)
    },

    normalizeSaleLine(rawLine) {
      if (!rawLine) return null

      const product = rawLine.product || rawLine.item || {}
      const name = product.name || rawLine.name || rawLine.product_name || 'Produit'
      const quantity = Number(rawLine.quantity ?? rawLine.qty ?? 0) || 0
      const price = Number(rawLine.price ?? rawLine.unit_price ?? rawLine.unitPrice ?? product?.price ?? 0) || 0
      const total = Number(rawLine.total ?? rawLine.total_amount ?? rawLine.amount ?? quantity * price) || 0
      const id = rawLine.id ?? rawLine.order_line_id ?? rawLine.line_id ?? `${name}-${price}`
      const categoryId = rawLine.category_id ?? product?.category_id ?? null
      const printerTypeId = rawLine.printer_type_id ?? product?.printer_type_id ?? null

      return {
        ...rawLine,
        id,
        name,
        quantity,
        price,
        total,
        category_id: categoryId,
        printer_type_id: printerTypeId,
        product
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

        const price = Number(line.price ?? product?.price ?? 0) || 0
        const categoryId = line.category_id ?? product?.category_id ?? null
        const printerTypeId = line.printer_type_id ?? product?.printer_type_id ?? null
        const key = `${productId}|${price}|${categoryId ?? ''}|${printerTypeId ?? ''}`

        const name = line.name || product?.name || 'Produit'
        const quantity = Number(line.quantity ?? 0) || 0
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
            product
          })
        }
      })

      return Array.from(aggregated.values()).map(item => ({
        ...item,
        quantity: Number(item.quantity.toFixed(3)),
        total: Number((Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2))
      }))
    },

    normalizeSale(rawSale, table = null) {
      if (!rawSale) return null

      const lines = Array.isArray(rawSale.order_lines)
        ? rawSale.order_lines
        : Array.isArray(rawSale.lines)
          ? rawSale.lines
          : Array.isArray(rawSale.items)
            ? rawSale.items
            : []

      const normalizedLines = this.aggregateLineItems(
        lines
          .map(line => this.normalizeSaleLine(line))
          .filter(Boolean)
      )

      let total = Number(rawSale.total_amount ?? rawSale.total ?? rawSale.amount ?? rawSale.total_price ?? 0)
      if ((!total || Number.isNaN(total)) && normalizedLines.length > 0) {
        total = normalizedLines.reduce((sum, line) => sum + (line.total ?? 0), 0)
      }

      const createdAt = rawSale.created_at || rawSale.createdAt || rawSale.date || rawSale.emitted_at || rawSale.updated_at || new Date().toISOString()
      const id = rawSale.id ?? rawSale.sale_id ?? rawSale.order_id ?? null
      const ticket = rawSale.ticket_number || rawSale.invoice_number || rawSale.reference || rawSale.code || rawSale.order_number || (id ? `SALE-${id}` : 'Commande')

      return {
        ...rawSale,
        id,
        order_lines: normalizedLines,
        total_amount: Number.isFinite(total) ? total : 0,
        created_at: createdAt,
        status: rawSale.status || rawSale.state || rawSale.sale_status || '',
        ticket_number: ticket,
        table: rawSale.table || table || null
      }
    },

    resolveActiveSales(rawTable) {
      if (!rawTable || typeof rawTable !== 'object') return []
      const candidates = [
        rawTable.active_sales,
        rawTable.activeSales,
        rawTable.pending_orders,
        rawTable.pendingOrders,
        rawTable.open_sales,
        rawTable.openSales,
        rawTable.sales
      ]

      let source = []
      for (const arr of candidates) {
        if (Array.isArray(arr) && arr.length) {
          source = arr
          break
        }
      }

      return source
        .map(sale => this.normalizeSale(sale, rawTable))
        .filter(sale => sale && this.isSaleActive(sale))
    },

    normalizeTable(rawTable) {
      if (!rawTable || typeof rawTable !== 'object') return rawTable
      const activeSales = this.resolveActiveSales(rawTable)
      return {
        ...rawTable,
        active_sales: activeSales
      }
    },

    async loadPendingOrdersForTables(tables = []) {
      if (!Array.isArray(tables) || !tables.length) return

      const token = localStorage.getItem('token')
      const tasks = []

      tables.forEach(table => {
        if (!table || !table.id) return
        const url = `http://127.0.0.1:8000/api/tables/${table.id}/pending-orders`
        tasks.push((async () => {
          try {
            const response = await axios.get(url, {
              headers: { Authorization: `Bearer ${token}` }
            })

            const pendingOrders = Array.isArray(response.data)
              ? response.data
              : Array.isArray(response.data?.data)
                ? response.data.data
                : []

            const normalizedPending = []
            for (const rawOrder of pendingOrders) {
              let normalized = this.normalizeSale(rawOrder, table)
              if (normalized && (!normalized.order_lines || normalized.order_lines.length === 0)) {
                const details = await this.fetchSaleDetails(normalized.id)
                if (details) {
                  normalized = this.normalizeSale(details, table)
                }
              }
              if (normalized && this.isSaleActive(normalized)) {
                normalizedPending.push(normalized)
              }
            }

            const existing = Array.isArray(table.active_sales) ? table.active_sales : []
            const merged = [...existing]
            const indexById = new Map(existing.map((sale, idx) => [sale.id, idx]))

            normalizedPending.forEach(order => {
              if (!order) return

              if (indexById.has(order.id)) {
                const idx = indexById.get(order.id)
                merged[idx] = order
              } else {
                indexById.set(order.id, merged.length)
                merged.push(order)
              }
            })

            table.active_sales = merged
          } catch (error) {
            console.error(`Erreur lors du chargement des commandes en attente pour la table ${table.id}:`, error.response?.data || error.message)
          }
        })())
      })

      if (tasks.length) {
        try {
          await Promise.all(tasks)
        } catch (error) {
          console.error('Erreur lors de la récupération des commandes en attente:', error)
        }
      }
    },

    async fetchSaleDetails(saleId) {
      if (!saleId) return null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`http://127.0.0.1:8000/api/sales/${saleId}`, {
          params: { with_lines: 1, with_order_lines: 1 },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        return response.data?.data || response.data || null
      } catch (error) {
        console.error('Erreur lors du chargement des détails de vente:', error.response?.data || error.message)
        return null
      }
    },

    async populateSaleLines(tables = []) {
      if (!Array.isArray(tables) || !tables.length) return

      const tasks = []

      tables.forEach(table => {
        const sales = Array.isArray(table.active_sales) ? table.active_sales : []
        sales.forEach(sale => {
          if (!sale || (sale.order_lines && sale.order_lines.length)) return
          tasks.push((async () => {
            const details = await this.fetchSaleDetails(sale.id)
            if (!details) return
            const normalized = this.normalizeSale(details, table)
            Object.assign(sale, normalized)
          })())
        })
      })

      if (tasks.length) {
        try {
          await Promise.all(tasks)
        } catch (error) {
          console.error('Erreur lors de la récupération des lignes de commande:', error)
        }
      }
    },

    async startTableService(table) {
      if (!table || !table.id) {
        return
      }

      if (table.status === 'out_of_order') {
        alert('Cette table est hors service pour le moment.')
        return
      }

      this.$router.push({
        name: 'table-order',
        params: { tableId: table.id }
      })
    },

    async updateTableStatus(tableId, status) {
      try {
        const token = localStorage.getItem('token')
        await axios.put(`http://127.0.0.1:8000/api/tables/${tableId}`,
          { status },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          }
        )
        return true
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut de la table :', error.response?.data || error.message)
        alert("Impossible de mettre à jour le statut de la table. Veuillez réessayer.")
        return false
      }
    },

    async loadTables() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://127.0.0.1:8000/api/tables', {
          params: {
            with_sales: 1,
            with_point_of_sale: 1
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        const rawTables = Array.isArray(response.data) ? response.data : response.data.data || []
        this.tables = rawTables.map(table => this.normalizeTable(table))
        await this.populateSaleLines(this.tables)
        await this.loadPendingOrdersForTables(this.tables)
      } catch (error) {
        console.error('Erreur lors du chargement des tables:', error.response?.data || error.message)
      }
    },

    async loadPointsOfSale() {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://127.0.0.1:8000/api/pointofsales', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        this.pointsOfSale = Array.isArray(response.data) ? response.data : response.data.data || []
      } catch (error) {
        console.error('Erreur lors du chargement des points de vente:', error.response?.data || error.message)
      }
    },

    filterTables() {
      // La logique de filtrage est dans le computed filteredTables
    },

    refreshData() {
      this.loadTables()
    },

    openTableLayout() {
      this.$router.push({ name: 'tables-layout' })
    },

    viewTableDetails(table) {
      this.selectedTable = table
      this.showTableDetails = true
    },

    closeTableDetails() {
      this.showTableDetails = false
      this.selectedTable = null
    },

    viewSaleDetails(sale) {
      this.selectedSale = sale
      this.showSaleDetails = true
    },

    closeSaleDetails() {
      this.showSaleDetails = false
      this.selectedSale = null
    },

    printTableBill(table) {
      // TODO: Implémenter l'impression de la facture de table
      console.log('Impression de la facture pour la table:', table.table_number)
    },

    async closeSale(sale) {
      if (!confirm('Êtes-vous sûr de vouloir fermer cette vente ?')) {
        return
      }

      try {
        const token = localStorage.getItem('token')
        await axios.put(`http://127.0.0.1:8000/api/sales/${sale.id}`,
          { status: 'completed' },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        // Recharger les données
        this.loadTables()
      } catch (error) {
        console.error('Erreur lors de la fermeture de la vente:', error.response?.data || error.message)
      }
    }
  },

  async mounted() {
    await Promise.all([
      this.loadTables(),
      this.loadPointsOfSale()
    ])
  }
}
</script>

<style scoped>
.table-sales {
  padding: 2rem;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.page-header h1 {
  margin: 0;
  color: #1e293b;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-refresh, .btn-layout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-refresh:hover, .btn-layout:hover {
  background: #f8fafc;
  border-color: #9ca3af;
}

.filters-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  gap: 2rem;
  align-items: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 600;
  color: #374151;
}

.filter-group select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.table-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.2s;
}

.table-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.table-card.available {
  border-left: 4px solid #10b981;
}

.table-card.occupied {
  border-left: 4px solid #f59e0b;
}

.table-card.reserved {
  border-left: 4px solid #3b82f6;
}

.table-card.out_of_order {
  border-left: 4px solid #6b7280;
}

.table-header {
  padding: 1rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.table-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 700;
}

.table-name {
  margin: 0 0 0.5rem 0;
  color: #64748b;
  font-size: 0.875rem;
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
  background: #d1fae5;
  color: #065f46;
}

.table-status.occupied {
  background: #fef3c7;
  color: #92400e;
}

.table-status.reserved {
  background: #dbeafe;
  color: #1e40af;
}

.table-status.out_of_order {
  background: #f3f4f6;
  color: #374151;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-service, .btn-view, .btn-print {
  width: 32px;
  height: 32px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-service {
  background: #ede9fe;
  border-color: #c4b5fd;
  color: #5b21b6;
}

.btn-view:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.btn-print:hover {
  background: #059669;
  color: white;
  border-color: #059669;
}

.btn-service:hover {
  background: #7c3aed;
  color: white;
  border-color: #7c3aed;
}

.btn-service:disabled {
  cursor: not-allowed;
  background: #f3f4f6;
  color: #9ca3af;
  border-color: #e5e7eb;
}

.active-sales {
  padding: 1rem;
}

.active-sales h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.sales-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sale-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.sale-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.sale-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.sale-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.sale-number {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.sale-time {
  font-size: 0.875rem;
  color: #64748b;
}

.sale-total {
  font-weight: 700;
  color: #2563eb;
  font-size: 1.125rem;
  text-align: right;
}

.sale-toggle {
  color: #64748b;
  font-size: 1rem;
  transition: color 0.2s;
}

.sale-header:hover .sale-toggle {
  color: #374151;
}

.sale-lines {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.sale-line {
  display: inline-flex;
  align-items: center;
  font-size: 0.875rem;
  color: #4b5563;
  padding: 0.25rem 0.5rem;
  margin: 0.25rem;
  background: #ffffff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.sale-line .line-name {
  margin-right: 0.5rem;
  font-weight: 500;
}

.sale-line .line-qty {
  font-weight: 600;
  color: #1f2937;
  background: #e5e7eb;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.sale-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-details, .btn-close {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
  justify-content: center;
}

.btn-details:hover {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
  transform: translateY(-1px);
}

.btn-close:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
  transform: translateY(-1px);
}

.no-sales {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
}

.no-sales font-awesome-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.table-footer {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-capacity {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.875rem;
}

.total-amount {
  font-weight: 700;
  color: #dc2626;
  font-size: 1.125rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 800px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 600;
}

.btn-close-modal {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #f3f4f6;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: #e5e7eb;
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  font-weight: 600;
  color: #374151;
}

.detail-row .value {
  color: #64748b;
}

.detail-row .value.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.sale-details {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.sale-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: 600;
  color: #374151;
}

.info-item .value {
  color: #64748b;
}

.info-item .value.status {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.sale-items {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.sale-items h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 6px;
  align-items: center;
}

.item-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-weight: 500;
  color: #1e293b;
}

.item-quantity {
  color: #64748b;
  font-size: 0.875rem;
}

.item-price, .item-total {
  text-align: right;
  font-weight: 600;
  color: #2563eb;
}

.sale-summary {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: #f8fafc;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.summary-row.discount {
  color: #dc2626;
}

.summary-row.total {
  border-top: 2px solid #e2e8f0;
  padding-top: 1rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

@media (max-width: 768px) {
  .table-sales {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .filters-section {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .tables-grid {
    grid-template-columns: 1fr;
  }

  .sale-info-grid {
    grid-template-columns: 1fr;
  }

  .item-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .item-price, .item-total {
    text-align: left;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
</style>
