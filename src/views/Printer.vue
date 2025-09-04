/* eslint-disable vue/multi-word-component-names */
<template>
  <div class="printer-list-container">
    <div class="header-section">
      <h1>Gestion des Imprimantes</h1>
    </div>
    <div class="main-layout">
      <div class="sidebar">
        <h3>Filtres</h3>
        <div class="filter-section">
          <label>Type de connexion</label>
          <div class="filter-buttons">
            <button :class="{ active: selectedConnectionType === null }" @click="selectConnectionType(null)">
              Tous
            </button>
            <button :class="{ active: selectedConnectionType === 'usb' }" @click="selectConnectionType('usb')">
              USB
            </button>
            <button :class="{ active: selectedConnectionType === 'network' }" @click="selectConnectionType('network')">
              Réseau
            </button>
            <button :class="{ active: selectedConnectionType === 'bluetooth' }"
              @click="selectConnectionType('bluetooth')">
              Bluetooth
            </button>
          </div>
        </div>


      </div>

      <div class="content">
        <div class="search-section">
          <button @click="openAddModal" title="Ajouter une imprimante" class="add-button">
            <font-awesome-icon icon="fa-solid fa-plus" />
          </button>
        </div>

        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <p>Chargement en cours...</p>
        </div>

        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchPrinters">Réessayer</button>
        </div>

        <div v-else>
          <div v-if="filteredPrinters.length === 0" class="no-results">
            Aucune imprimante trouvée
          </div>

          <div v-else class="printers-section">
            <div class="printers-list">
              <div v-for="printer in filteredPrinters" :key="printer.id" class="printer-card"
                :class="{ inactive: !isActive(printer) }">
                <div class="printer-details">
                  <div class="printer-header">
                    <h3>{{ printer.name }}</h3>
                    <div class="badges">
                      <span v-if="printer.is_default == 1" class="badge default">Par défaut</span>
                      <span :class="['badge', isActive(printer) ? 'active' : 'inactive']">
                        {{ isActive(printer) ? 'Actif' : 'Inactif' }}
                      </span>
                    </div>
                  </div>

                  <div class="printer-meta">
                    <p><strong>Type:</strong> {{ getConnectionTypeLabel(printer.connection_type) }}</p>
                    <p v-if="printer.cash_register"><strong>Cash name:</strong> {{ printer.cash_register.name }}</p>
                    <p v-if="printer.cash_register && printer.cash_register.point_of_sale"><strong>POS:</strong> {{
                      printer.cash_register.point_of_sale.name }}
                    </p>
                    <p v-if="printer.connection_type === 'network'">
                      <strong>Réseau:</strong> {{ printer.ip_address }}
                    </p>
                    <p v-if="printer.connection_type === 'usb'">
                      <strong>Périphérique:</strong> {{ printer.device_path }}
                    </p>
                    <p><strong>Timeout:</strong> {{ printer.timeout !== undefined && printer.timeout !== null ?
                      printer.timeout : 'N/A' }}s</p>
                  </div>

                  <div class="printer-actions">
                    <button @click.stop="openEditModal(printer)">
                      <font-awesome-icon icon="fa-solid fa-pencil" />
                    </button>
                    <button @click.stop="confirmDelete(printer)">
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

    <PrinterEditModal :isOpen="isEditModalOpen" :printer="selectedPrinter" :isEdit="true" @close="closeEditModal"
      @save="handleSave" :selectedPOS="posStore.selectedPOS" />
    <PrinterCreateModal :isOpen="isAddModalOpen" @close="closeAddModal" @created="handleAdd"
      :selectedPOS="posStore.selectedPOS" />

    <div v-if="isDeleteConfirmOpen" class="modal is-active">
      <div class="modal-background" @click="closeDeleteConfirm"></div>
      <div class="modal-card">
        <header class="modal-header">
          <h2 class="modal-title">Confirmer la suppression</h2>
          <button class="modal-close" aria-label="Fermer" @click="closeDeleteConfirm">&times;</button>
        </header>
        <section class="modal-body">
          <p>Êtes-vous sûr de vouloir supprimer l'imprimante <strong>{{ printerToDelete?.name }}</strong> ?</p>
        </section>
        <footer class="modal-footer">
          <button class="button is-danger" @click="deletePrinter" :disabled="isDeleting">Supprimer</button>
          <button class="button" @click="closeDeleteConfirm" :disabled="isDeleting">Annuler</button>
          <p v-if="deleteError" class="delete-error">{{ deleteError }}</p>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import PrinterEditModal from './PrinterEditModal.vue'
import PrinterCreateModal from './PrinterCreateModal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import printerService from '../services/printerService.js'
import { usePosStore } from '../stores/posStore.js'
import { useAuth } from '../composables/useAuth.js'

const posStore = usePosStore()

// États réactifs
const printers = ref([])
const selectedConnectionType = ref(null)
const loading = ref(true)
const error = ref(null)

const { isAdmin, loadUserData } = useAuth()
const isUserAdmin = ref(false)

// États des modals
const isEditModalOpen = ref(false)
const selectedPrinter = ref(null)
const isAddModalOpen = ref(false)

// États pour la suppression
const isDeleteConfirmOpen = ref(false)
const printerToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')

const fetchPrinters = async () => {
  try {
    loading.value = true
    const response = await printerService.getAll()
    // Fix: assign printers.value to array of printers
    printers.value = response.data.data ? response.data.data : response.data
  } catch (e) {
    console.error("Erreur de chargement des imprimantes :", e)
    error.value = e.response?.data?.message || e.message || 'Erreur de chargement des données'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadUserData()
  isUserAdmin.value = isAdmin.value
  if (isUserAdmin.value) {
    await fetchPrinters()
  }
})

// Méthodes d'interface utilisateur
const selectConnectionType = (type) => {
  selectedConnectionType.value = type
}

const getConnectionTypeLabel = (type) => {
  const labels = {
    usb: 'USB',
    network: 'Réseau',
    bluetooth: 'Bluetooth'
  }
  return labels[type] || type
}

const isActive = (printer) => {
  return printer.is_active === true || printer.is_active === 'true' || printer.is_active == 1
}

// Propriétés calculées
const filteredPrinters = computed(() => {
  let result = Array.isArray(printers.value) ? printers.value : []

  // Filtrage par POS sélectionné (pour les admins)
  if (isUserAdmin.value && posStore.selectedPOS) {
    result = result.filter(printer =>
      printer.cash_register &&
      printer.cash_register.point_of_sale &&
      printer.cash_register.point_of_sale.id === posStore.selectedPOS.id
    )
  }

  // Filtrage par type de connexion
  if (selectedConnectionType.value !== null) {
    result = result.filter(printer => printer.connection_type === selectedConnectionType.value)
  }

  return result
})

// Gestion des modals d'édition
const openEditModal = (printer) => {
  selectedPrinter.value = { ...printer }
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedPrinter.value = null
}

const handleSave = async (updatedPrinter) => {
  // Handle API response structure - might be nested in data.data
  const printerData = updatedPrinter.data ? (updatedPrinter.data.data ? updatedPrinter.data.data : updatedPrinter.data) : updatedPrinter

  const index = printers.value.findIndex(p => p.id === printerData.id)
  if (index !== -1) {
    printers.value[index] = printerData
  }
  closeEditModal()
}

// Gestion des modals d'ajout
const openAddModal = () => {
  isAddModalOpen.value = true
}

const closeAddModal = () => {
  isAddModalOpen.value = false
}

const handleAdd = async (newPrinter) => {
  printers.value = [newPrinter, ...printers.value]
  closeAddModal()
}

// Gestion de la suppression
const confirmDelete = (printer) => {
  printerToDelete.value = printer
  isDeleteConfirmOpen.value = true
}

const closeDeleteConfirm = () => {
  isDeleteConfirmOpen.value = false
  printerToDelete.value = null
}

const deletePrinter = async () => {
  if (!printerToDelete.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await printerService.delete(printerToDelete.value.id)
    printers.value = printers.value.filter(p => p.id !== printerToDelete.value.id)
    closeDeleteConfirm()
  } catch (error) {
    console.error('Erreur lors de la suppression:', error.response?.data || error)
    deleteError.value = error.response?.data?.message || 'Erreur lors de la suppression de l\'imprimante'
  } finally {
    isDeleting.value = false
  }
}
</script>

<style scoped>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';

.printer-list-container {
  padding: 1.5rem;
  background-color: #f8f9fa;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
}

.header-section {
  margin-bottom: 2rem;
  text-align: center;
}

.header-section h1 {
  font-size: 2.2rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.main-layout {
  display: flex;
  gap: 2rem;
  flex-grow: 1;
}

.sidebar {
  width: 260px;
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
  border: 1px solid #e2e8f0;
}

.sidebar h3 {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.2rem;
  text-align: center;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section label {
  display: block;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
}

.filter-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.filter-buttons button {
  width: 100%;
  padding: 0.9rem 1.1rem;
  text-align: left;
  background-color: #f7fafc;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
}

.filter-buttons button:hover {
  background-color: #e2e8f0;
}

.filter-buttons button.active {
  background-color: #3182ce;
  color: white;
  border-color: #3182ce;
  font-weight: 600;
}

.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-section {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 1.5rem;
}

.add-button {
  padding: 0.9rem 1.2rem;
  background-color: #3182ce;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 12px;
  transition: background-color 0.2s ease;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.add-button:hover {
  background-color: #2c5282;
}

.loading,
.no-results,
.error {
  text-align: center;
  margin-top: 2rem;
  font-size: 1.2rem;
  color: #718096;
  font-weight: 500;
}

.error p {
  color: #e53e3e;
}

.error button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.error button:hover {
  background-color: #2c5282;
}

.spinner {
  border: 4px solid #e2e8f0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border-left-color: #3182ce;
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

.printers-section {
  background-color: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.printers-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.printer-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
}

.printer-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.printer-card.inactive {
  opacity: 0.7;
}

.printer-details {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  flex-grow: 1;
}

.printer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.printer-details h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
  flex-grow: 1;
  line-height: 1.3;
}

.badges {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.badge {
  padding: 0.4rem 0.8rem;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge.default {
  background-color: #38a169;
  color: white;
}

.badge.active {
  background-color: #38a169;
  color: white;
}

.badge.inactive {
  background-color: #e53e3e;
  color: white;
}

.printer-meta {
  font-size: 0.95rem;
  color: #4a5568;
  line-height: 1.5;
}

.printer-meta p {
  margin: 0.4rem 0;
  font-weight: 500;
}

.printer-meta strong {
  color: #2d3748;
  font-weight: 600;
}

.printer-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: auto;
  justify-content: flex-end;
  padding-top: 0.8rem;
}

.printer-actions button {
  background-color: #f7fafc;
  border: 1px solid #d1d5db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #4a5568;
  font-size: 1rem;
}

.printer-actions button:hover {
  background-color: #e2e8f0;
}

.printer-actions button:first-child {
  color: #38a169;
  border-color: #38a169;
}

.printer-actions button:first-child:hover {
  background-color: #38a169;
  color: white;
}

.printer-actions button:last-child {
  color: #e53e3e;
  border-color: #e53e3e;
}

.printer-actions button:last-child:hover {
  background-color: #e53e3e;
  color: white;
}

/* Modals */
.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.modal-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 10, 10, 0.86);
}

.modal-card {
  width: 100%;
  max-width: 480px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  background-color: #ffffff;
  position: relative;
  z-index: 1001;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background-color: #f8f9fa;
  border-radius: 12px 12px 0 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  line-height: 1;
  color: #718096;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #2d3748;
}

.modal-body {
  padding: 1.5rem;
  font-size: 1rem;
  color: #2d3748;
  line-height: 1.5;
  background-color: #ffffff;
}

.modal-footer {
  padding: 1.2rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  border-top: 1px solid #e2e8f0;
  background-color: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

.modal-footer .button {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background-color 0.2s ease;
}

.modal-footer .button:hover {
  background-color: #e2e8f0;
}

.delete-error {
  color: #e53e3e;
  font-size: 0.9rem;
  margin-top: 0.5rem;
  text-align: center;
}
</style>
