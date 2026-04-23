<template>
  <div class="table-sales-view">
    <Profile v-if="!embedded" />

    <section class="table-sales-content">
      <header class="table-sales-header">
        <div class="header-info">
          <h1>
            <font-awesome-icon icon="fa-solid fa-table" />
            Service en salle
          </h1>
          <p>Surveillez les tables, leur état et accédez rapidement à la prise de commande.</p>
        </div>
        <div class="header-actions">
          <button type="button" class="action-button" @click="refreshData">
            <font-awesome-icon icon="fa-solid fa-rotate" />
            Actualiser
          </button>
        </div>
      </header>

      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <label for="statusFilter">Statut</label>
            <select id="statusFilter" v-model="statusFilter" @change="filterTables">
              <option value="">Tous</option>
              <option value="occupied">Occupées</option>
              <option value="available">Disponibles</option>
              <option value="reserved">Réservées</option>
            </select>
          </div>
        </div>
      </div>

      <div class="tables-wrapper">
        <div v-if="loading" class="state loading">
          <span class="spinner"></span>
          Chargement des tables…
        </div>
        <template v-else>
          <div v-if="!filteredTables.length" class="state empty">
            Aucune table ne correspond aux filtres sélectionnés.
          </div>
          <div v-else class="tables-grid">
            <article
              v-for="table in filteredTables"
              :key="table.id"
              class="table-card"
              :class="`status-${table.status || 'unknown'}`"
            >
              <header class="table-card__header">
                <div class="table-card__info">
                  <p class="table-card__number">Table {{ table.table_number }}</p>
                  <p v-if="table.name" class="table-card__name">{{ table.name }}</p>
                  <div class="table-card__status">
                    <font-awesome-icon :icon="getStatusIcon(table.status)" />
                    <span>{{ getStatusText(table.status) }}</span>
                  </div>
                </div>
                <div class="table-card__meta">
                  <div class="table-card__actions">
                    <button
                      type="button"
                      class="icon-button"
                      :disabled="table.status === 'out_of_order'"
                      @click="startTableService(table)"
                      title="Prendre la commande"
                    >
                      <font-awesome-icon icon="fa-solid fa-plus" />
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      @click="viewTableDetails(table)"
                      title="Détails de la table"
                    >
                      <font-awesome-icon icon="fa-solid fa-eye" />
                    </button>
                    <button
                      type="button"
                      class="icon-button"
                      @click="printTableBill(table)"
                      title="Imprimer la facture"
                    >
                      <font-awesome-icon icon="fa-solid fa-print" />
                    </button>
                  </div>
                </div>
              </header>
            </article>
          </div>
        </template>
      </div>
    </section>

    <!-- Modal détails table -->
    <div v-if="showTableDetails" class="modal-overlay" @click="closeTableDetails">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h3>Table {{ selectedTable?.table_number }}</h3>
          <button type="button" class="icon-button" @click="closeTableDetails">
            <font-awesome-icon icon="fa-solid fa-xmark" />
          </button>
        </header>
        <section class="modal-body">
          <div v-if="selectedTable" class="table-details">
            <div class="detail-row">
              <span class="label">Numéro</span>
              <span class="value">{{ selectedTable.table_number }}</span>
            </div>
            <div v-if="selectedTable.name" class="detail-row">
              <span class="label">Nom</span>
              <span class="value">{{ selectedTable.name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Capacité</span>
              <span class="value">{{ selectedTable.capacity }} personnes</span>
            </div>
            <div class="detail-row">
              <span class="label">Statut</span>
              <span class="value status-pill" :class="`status-${selectedTable.status}`">
                {{ getStatusText(selectedTable.status) }}
              </span>
            </div>
            <div v-if="selectedTable.description" class="detail-row">
              <span class="label">Description</span>
              <span class="value">{{ selectedTable.description }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import Profile from './Profile.vue'

export default {
  name: 'TableSales',
  components: { Profile },
  props: {
    embedded: { type: Boolean, default: false }
  },
  data() {
    return {
      tables: [],
      statusFilter: '',
      loading: false,
      showTableDetails: false,
      selectedTable: null
    }
  },
  computed: {
    filteredTables() {
      let filtered = [...this.tables]
      if (this.statusFilter) {
        filtered = filtered.filter(table => table.status === this.statusFilter)
      }
      return filtered
    }
  },
  methods: {
    normalizeStatus(status) {
      const normalized = String(status || 'available').trim().toLowerCase()
      const aliases = {
        disponible: 'available',
        available: 'available',
        libre: 'available',
        occupee: 'occupied',
        occupée: 'occupied',
        occupied: 'occupied',
        reservee: 'reserved',
        réservée: 'reserved',
        reserved: 'reserved',
        hors_service: 'out_of_order',
        horsservice: 'out_of_order',
        out_of_order: 'out_of_order',
        outoforder: 'out_of_order'
      }
      return aliases[normalized] || normalized
    },

    getStatusIcon(status) {
      const icons = {
        available: 'fa-solid fa-circle-check',
        occupied: 'fa-solid fa-users',
        reserved: 'fa-solid fa-calendar-check',
        out_of_order: 'fa-solid fa-wrench'
      }
      return icons[status] || 'fa-solid fa-circle-question'
    },

    getStatusText(status) {
      const texts = {
        available: 'Disponible',
        occupied: 'Occupée',
        reserved: 'Réservée',
        out_of_order: 'Hors service'
      }
      return texts[status] || 'Inconnu'
    },

    async startTableService(table) {
      if (!table || !table.id) return
      if (table.status === 'out_of_order') {
        alert('Cette table est hors service pour le moment.')
        return
      }
      this.$router.push({
        name: 'dashboard-table-order',
        params: { tableId: table.id }
      })
    },

    async loadTables() {
      this.loading = true
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(`${API_BASE_URL}/tables`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const rawTables = Array.isArray(response.data) ? response.data : response.data.data || []
        this.tables = rawTables.map(table => ({
          ...table,
          status: this.normalizeStatus(table.status)
        }))
        console.log('Tables chargées :', this.tables.length)
      } catch (error) {
        console.error('Erreur chargement tables:', error)
      } finally {
        this.loading = false
      }
    },

    filterTables() {
      // computed filteredTables fait le travail
    },

    refreshData() {
      this.loadTables()
    },

    viewTableDetails(table) {
      this.selectedTable = table
      this.showTableDetails = true
    },

    closeTableDetails() {
      this.showTableDetails = false
      this.selectedTable = null
    },

    printTableBill(table) {
      console.log('Impression facture table:', table.table_number)
    }
  },

  mounted() {
    this.loadTables()
  }
}
</script>

<style scoped>
.table-sales-view {
  min-height: 100vh;
  padding: 3rem 1.5rem;
  background: linear-gradient(160deg, #eef2ff 0%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.table-sales-content {
  width: 100%;
  max-width: none;
  margin: 0;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.12);
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.table-sales-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.table-sales-header h1 {
  margin: 0;
  font-size: 1.9rem;
  font-weight: 700;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.table-sales-header p {
  margin: 0.35rem 0 0;
  color: #64748b;
  max-width: 520px;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #dbe4ff;
  background: rgba(59, 130, 246, 0.08);
  color: #1d4ed8;
  font-weight: 600;
  padding: 0.65rem 1.1rem;
  border-radius: 0.9rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
  background: rgba(59, 130, 246, 0.12);
}

.filters-card {
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.6);
  border-radius: 1rem;
  padding: 1.25rem 1.5rem;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.filter-item select {
  height: 2.75rem;
  border-radius: 0.85rem;
  border: 1px solid #dbe4ff;
  background: #fff;
  color: #1e293b;
  padding: 0 0.9rem;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-item select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.tables-wrapper {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  border-radius: 1rem;
  font-weight: 600;
  color: #1e293b;
  background: rgba(226, 232, 240, 0.4);
}

.state.loading {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.state.empty {
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
}

.spinner {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  border: 3px solid rgba(148, 163, 184, 0.25);
  border-top-color: #1d4ed8;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 1.25rem;
}

.table-card {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.85), #fff);
  border: 1px solid rgba(226, 232, 240, 0.7);
  border-radius: 1.15rem;
  padding: 1.25rem 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.12);
}

.table-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.table-card__info {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.table-card__number {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f172a;
}

.table-card__name {
  margin: 0;
  color: #475569;
  font-weight: 600;
}

.table-card__status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
}

.table-card.status-available .table-card__status,
.status-pill.status-available {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
}

.table-card.status-occupied .table-card__status,
.status-pill.status-occupied {
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
}

.table-card.status-reserved .table-card__status,
.status-pill.status-reserved {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.table-card.status-out_of_order .table-card__status,
.status-pill.status-out_of_order {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.table-card__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.6rem;
}

.table-card__actions {
  display: flex;
  gap: 0.4rem;
}

.icon-button {
  border: none;
  background: rgba(226, 232, 240, 0.65);
  color: #334155;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.icon-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
}

.icon-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  padding: 1.5rem;
  backdrop-filter: blur(2px);
  z-index: 1100;
}

.modal-content {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: linear-gradient(140deg, #eef2ff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #1e293b;
}

.modal-body {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.table-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  background: rgba(248, 250, 252, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.7);
  gap: 1rem;
}

.detail-row .label {
  color: #64748b;
  font-weight: 600;
}

.detail-row .value {
  color: #0f172a;
  font-weight: 600;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  text-transform: capitalize;
}

@media (max-width: 1024px) {
  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  }
}

@media (max-width: 768px) {
  .table-sales-view {
    padding: 2rem 1rem;
  }

  .table-sales-content {
    padding: 1.5rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>