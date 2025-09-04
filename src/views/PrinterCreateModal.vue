<template>
  <div v-if="isOpen" class="modal is-active">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card">
      <header class="modal-header">
        <h2 class="modal-title">Ajouter une imprimante</h2>
        <button class="modal-close" aria-label="Fermer" @click="closeModal">&times;</button>
      </header>
      <section class="modal-body">
        <!-- Nom de l'imprimante -->
        <div class="field">
          <label class="label">Nom de l'imprimante *</label>
          <div class="control">
            <input class="input" type="text" v-model="printer.name" maxlength="255" required
              placeholder="Nom de l'imprimante" />
          </div>
        </div>

        <!-- Caisse associée -->
        <div class="field">
          <label class="label">Caisse associée *</label>
          <div class="control">
            <div class="select">
              <select v-model="printer.cash_register_id">
                <option :value="null" disabled>Choisir une caisse</option>
                <option v-for="register in cashRegisters" :key="register.id" :value="register.id">
                  {{ register.name }} [{{ register.point_of_sale ? register.point_of_sale.name : 'N/A' }}]
                </option>
              </select>

            </div>
          </div>
        </div>
        <!-- Type de connexion -->
        <div class="field">
          <label class="label">Type de connexion *</label>
          <div class="control">
            <div class="select">
              <select v-model="printer.connection_type">
                <option value="usb">USB</option>
                <option value="network">Réseau</option>
                <option value="bluetooth">Bluetooth</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Chemin du périphérique (pour USB) -->
        <div v-if="printer.connection_type === 'usb'" class="field">
          <label class="label">Chemin du périphérique *</label>
          <div class="control">
            <input class="input" type="text" v-model="printer.device_path" placeholder="/dev/usb/lp0" />
          </div>
        </div>

        <!-- Adresse IP (pour réseau) -->
        <div v-if="printer.connection_type === 'network'" class="field">
          <label class="label">Adresse IP *</label>
          <div class="control">
            <input class="input" type="text" v-model="printer.ip_address" placeholder="192.168.1.100" />
          </div>
        </div>

        <!-- Port (pour réseau) -->
        <div v-if="printer.connection_type === 'network'" class="field">
          <label class="label">Port *</label>
          <div class="control">
            <input class="input" type="number" v-model.number="printer.port" min="1" max="65535" />
          </div>
        </div>

        <!-- Timeout -->
        <div class="field">
          <label class="label">Timeout (secondes)</label>
          <div class="control">
            <input class="input" type="number" v-model.number="printer.timeout" min="1" />
          </div>
        </div>

        <!-- Par défaut -->
        <div class="field">
          <label class="checkbox">
            <input type="checkbox" v-model="printer.is_default" />
            Imprimante par défaut
          </label>
        </div>

        <!-- Active -->
        <div class="field">
          <label class="checkbox">
            <input type="checkbox" v-model="printer.is_active" />
            Active
          </label>
        </div>
      </section>
      <footer class="modal-footer">
        <button class="button button-success" :class="{ 'is-loading': isSaving }" @click="savePrinter"
          :disabled="isSaving || !isFormValid">
          Créer
        </button>
        <button class="button button-cancel" @click="closeModal" :disabled="isSaving">
          Annuler
        </button>
      </footer>
      <p v-if="saveError" class="save-error">{{ saveError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  isOpen: Boolean,
  selectedPOS: {
    type: Object,
    default: null
  }
})

const emits = defineEmits(['close', 'created'])

const printer = reactive({
  name: '',
  cash_register_id: null,
  connection_type: 'usb',
  device_path: '',
  ip_address: '192.168.',
  port: 9100,
  is_default: false,
  is_active: true
})

const cashRegisters = ref([])
const isSaving = ref(false)
const saveError = ref('')



const fetchCashRegisters = async () => {
  try {
    const token = localStorage.getItem('token')
    let url = 'http://localhost:8000/api/cash-registers'

    // Filter by selected POS if admin has selected one
    if (props.selectedPOS) {
      url += `?point_of_sale_id=${props.selectedPOS.id}`
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    cashRegisters.value = response.data.data ? response.data.data : response.data
  } catch (error) {
    console.error('Erreur lors du chargement des caisses:', error)
  }
}

onMounted(fetchCashRegisters)

const isFormValid = computed(() => {
  const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
  return printer.name.trim() &&
    printer.cash_register_id &&
    printer.connection_type &&
    (printer.connection_type !== 'usb' || printer.device_path.trim()) &&
    (printer.connection_type !== 'network' || (ipRegex.test(printer.ip_address.trim()) && printer.port))
})

const validateIPAddress = (ip) => {
  const ipRegex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
  return ipRegex.test(ip.trim())
}

const savePrinter = async () => {
  // Additional IP validation with user-friendly error message
  if (printer.connection_type === 'network' && !validateIPAddress(printer.ip_address)) {
    saveError.value = 'Adresse IP invalide. Format attendu: xxx.xxx.xxx.xxx'
    return
  }

  if (!isFormValid.value) return

  try {
    isSaving.value = true
    saveError.value = ''
    const token = localStorage.getItem('token')

    // Ensure all required fields are included and have correct format
    const printerData = {
      name: printer.name,
      cash_register_id: printer.cash_register_id,
      connection_type: printer.connection_type,
      device_path: printer.device_path,
      ip_address: printer.ip_address,
      port: printer.port,
      timeout: printer.timeout,
      is_default: printer.is_default,
      is_active: printer.is_active
    }

    const response = await axios.post(
      'http://localhost:8000/api/printers',
      printerData,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    emits('created', response.data.data ? response.data.data : response.data)
    resetForm()
    emits('close')
  } catch (error) {
    console.error('Erreur:', error.response?.data || error)
    saveError.value = error.response?.data?.message || 'Erreur lors de la création'
  } finally {
    isSaving.value = false
  }
}

const resetForm = () => {
  Object.assign(printer, {
    name: '',
    cash_register_id: null,
    connection_type: 'usb',
    device_path: '',
    ip_address: '192.168.',
    port: 9100,
    timeout: 30,
    is_default: false,
    is_active: true
  })
}

const closeModal = () => {
  resetForm()
  emits('close')
}
</script>

<style scoped>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';

.modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-background {
  background-color: rgba(10, 10, 10, 0.86);
}

.modal-card {
  margin: 0;
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
}

.modal-header {
  background-color: #fff;
  padding: 1.5rem;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  color: #888;
  position: absolute;
  top: 1rem;
  right: 1.5rem;
}

.modal-body {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 1.5rem;
}

.field {
  margin-bottom: 1.5rem;
}

.label {
  font-weight: bold;
  color: #4a4a4a;
  margin-bottom: 0.5rem;
}

.input,
.select select {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #dbdbdb;
  box-shadow: none;
  transition: border-color 0.2s;
}

.input:focus,
.select select:focus {
  border-color: #00d1b2;
  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
}

.select {
  width: 100%;
}

.checkbox {
  font-weight: normal;
  color: #4a4a4a;
}

.modal-footer {
  background-color: #fff;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dbdbdb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.button {
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-success {
  background-color: #00d1b2;
  color: white;
  border: none;
}

.button-success:hover {
  background-color: #00b89c;
}

.button-cancel {
  background-color: #f5f5f5;
  color: #4a4a4a;
  border: 1px solid #dbdbdb;
}

.button-cancel:hover {
  background-color: #e0e0e0;
}

.button.is-loading::after {
  animation: spinAround 0.5s infinite linear;
  border: 2px solid #fff;
  border-right-color: transparent;
  border-top-color: transparent;
  content: "";
  display: block;
  height: 1em;
  width: 1em;
  position: relative;
  top: 0;
  left: 0;
}

.save-error {
  color: #ff3860;
  text-align: center;
  margin-top: 1rem;
}

@keyframes spinAround {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
