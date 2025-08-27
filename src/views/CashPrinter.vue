<template>
  <Pos />
  <Profile />
  <section class="section">
    <div class="container">
      <div class="card shadow-box">
        <div class="card-content">

          <!-- Sélection de la caisse -->
          <div class="field">
            <label class="label">Choisir une caisse</label>
            <div class="control">
              <div class="cash-register-grid">
                <div v-for="register in filteredCashRegisters" :key="register.id" class="cash-register-card" :class="{
                  'connected': ['connected', 'in use'].includes(cashRegisterStatuses[register.id]),
                  'selected': selectedCashRegister === register.id,
                  'disabled': ['connected', 'in use'].includes(cashRegisterStatuses[register.id]) && connectedUserId !== currentUserId
                }" @click="selectCashRegister(register.id)">
                  <span class="icon is-large">
                    <i class="fas fa-desktop fa-2x"></i>
                  </span>
                  <div class="cash-register-name">{{ register.name }}</div>
                  <div class="status-tags">
                    <span v-if="['connected', 'in use'].includes(cashRegisterStatuses[register.id])"
                      class="tag is-success is-light">
                      {{ connectedUserId === currentUserId ? 'Vous êtes connecté' : 'Occupée' }}
                    </span>
                    <span v-else-if="cashRegisterStatuses[register.id] === 'disconnected'"
                      class="tag is-danger is-light">
                      Libre
                    </span>
                    <span v-else class="tag is-warning is-light">Inconnu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton de connexion -->
          <button class="button is-primary is-fullwidth mt-4" :disabled="!selectedCashRegister || isProcessing"
            @click="onConnectButtonClick">
            <span class="icon"><i class="fas fa-link"></i></span>
            <span>{{ getConnectButtonText() }}</span>
          </button>

          <!-- Boutons RAZ & Billetage après connexion -->
          <div v-if="isConnected && connectedUserId === currentUserId" class="buttons-container">
            <button class="button is-warning is-light" @click="resetCashRegister">
              <i class="fas fa-sync-alt"></i> Remise à zéro
            </button>
            <button class="button is-info is-light" @click="performCashCount">
              <i class="fas fa-money-bill-wave"></i> Billetage
            </button>
            <button class="button is-info is-light" @click="viewSales">
              <i class="fas fa-chart-line"></i> Mes ventes
            </button>
          </div>

          <!-- Indicateur de connexion -->
          <p v-if="isConnected && connectedUserId === currentUserId" class="has-text-success has-text-centered mt-3">
            ✅ Caisse connectée : {{ connectedCashRegisterName }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <AmountModal :isOpen="isAmountModalOpen" @close="closeAmountModal" @send="handleAmountModalSend" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import AmountModal from './AmountModal.vue'
import Pos from './Pos.vue'
import Profile from './Profile.vue'
const router = useRouter()

// États
const isAmountModalOpen = ref(false)
const isProcessing = ref(false)
const cashRegisters = ref([])
const cashRegisterStatuses = ref({})
const selectedCashRegister = ref(null)
const cashRegisterSessions = ref({})
const isConnected = ref(false)
const connectedCashRegisterName = ref('')
const connectedUserId = ref(null)
const currentUserId = ref(null)

// Méthodes Modales
const openAmountModal = () => {
  isAmountModalOpen.value = true
}

const closeAmountModal = () => {
  isAmountModalOpen.value = false
}

const handleAmountModalSend = (payload) => {
  sendFondDeCaisse(payload)
}

// Computed
const filteredCashRegisters = computed(() => {
  if (!cashRegisters.value.length) return []

  if (isConnected.value && connectedUserId.value === currentUserId.value) {
    return cashRegisters.value.filter(register => register.id === selectedCashRegister.value)
  }

  const activeSessionRegister = cashRegisters.value.find(register => {

    const session = cashRegisterSessions.value[register.id]
    return session?.user_id === currentUserId.value && !session?.is_closed
  })

  return activeSessionRegister ? [activeSessionRegister] : cashRegisters.value
})

// Méthodes
const selectCashRegister = (registerId) => {
  const status = cashRegisterStatuses.value[registerId]
  if (['connected', 'in use'].includes(status) && connectedUserId.value !== currentUserId.value) return
  selectedCashRegister.value = registerId
}

const getConnectButtonText = () => {
  if (isConnected.value && connectedUserId.value === currentUserId.value) return 'Résumé'
  return 'Connecter'
}

const fetchCashRegisters = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://127.0.0.1:8000/api/cash-registers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    cashRegisters.value = response.data
  } catch (error) {
    console.error('Erreur lors du chargement des caisses:', error)
    alert('Impossible de charger les caisses')
  }
}

const checkSessionStatus = async (cashRegisterId) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(
      `http://127.0.0.1:8000/api/cash-registers-sessions/${cashRegisterId}/status`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    cashRegisterStatuses.value[cashRegisterId] = response.data.status
    if (response.data.status === 'in use') {
      isConnected.value = true
      connectedUserId.value = currentUserId.value
      selectedCashRegister.value = cashRegisterId
      connectedCashRegisterName.value =
        cashRegisters.value.find(r => r.id === cashRegisterId)?.name || ''
    }
  } catch (error) {
    console.error(`Erreur vérification session caisse ${cashRegisterId}:`, error)
    cashRegisterStatuses.value[cashRegisterId] = 'error'
  }
}

const initializeSessions = async () => {
  await Promise.all(
    cashRegisters.value.map(register => checkSessionStatus(register.id))
  )
}

const sendFondDeCaisse = async ({ amount, note, startTicketNumber }) => {
  isProcessing.value = true
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))

    const response = await axios.post(
      'http://127.0.0.1:8000/api/cash-register-sessions',
      {
        cash_register_id: selectedCashRegister.value,
        user_id: user.id,
        starting_amount: amount,
        note: note,
        expected_cash_amount: 0,
        start_ticket_number: startTicketNumber
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )


    if (response.data) {
      localStorage.setItem('cashRegisterSession', JSON.stringify(response.data))

      if (startTicketNumber !== undefined) {
        localStorage.setItem('currentTicketNumber', startTicketNumber.toString())
      }

      isConnected.value = true
      connectedUserId.value = user.id
      await checkSessionStatus(selectedCashRegister.value)

      router.push({ name: 'direct' })
    }
  } catch (error) {
    console.error('Erreur connexion caisse:', error)
    alert(error.response?.data?.message || 'Erreur de connexion à la caisse')
  } finally {
    isProcessing.value = false
    closeAmountModal()
  }
}

const resetCashRegister = async () => {
  if (!confirm('Confirmez la remise à zéro ?')) return

  try {
    const token = localStorage.getItem('token')
    await axios.post(
      'http://127.0.0.1:8000/api/cash-registers/reset',
      { cash_register_id: selectedCashRegister.value },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    alert('RAZ effectuée avec succès !')
  } catch (error) {
    alert(error.response?.data?.message || 'Échec de la remise à zéro')
  }
}

const performCashCount = () => {
  if (!isConnected.value) return alert('Connectez-vous à une caisse d\'abord')
  router.push('billetage')
}

const viewSales = () => {
  router.push({ name: 'user-sales' })
}

const onConnectButtonClick = () => {
  if (isConnected.value && connectedUserId.value === currentUserId.value) {
    router.push({ name: 'direct' })
  } else {
    if (!selectedCashRegister.value) return alert('Sélectionnez une caisse')
    openAmountModal()
  }
}

// Lifecycle
onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) currentUserId.value = user.id
  await fetchCashRegisters()
  await initializeSessions()
})
</script>

<style scoped>
.shadow-box {
  max-width: 600px;
  margin: auto;
  text-align: center;
  padding: 30px;
  border-radius: 12px;
  background-color: #f9fafb;
  border: 1px solid #d1d5db;
  box-shadow: 0 5px 18px rgba(0, 0, 0, 0.15);
  transition: 0.3s ease-in-out;
  color: black;
}

button,
label,
p,
span,
h2,
small {
  color: black !important;
}

.cash-register-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.cash-register-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  transition: background-color 0.3s ease, filter 0.3s ease;
  text-align: center;
}

.cash-register-card:hover {
  background-color: #e6f0ff;
}

.cash-register-card.selected {
  background-color: #3273dc;
  color: white;
}

.cash-register-card.connected {
  background-color: rgba(255, 255, 255, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.5);
  filter: none;
  cursor: not-allowed;
  pointer-events: none;
}

.cash-register-card.disconnected {
  border: 2px solid #23d160;
}

.cash-register-name {
  margin-top: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  color: black;
}

.status-tags {
  margin-top: 8px;
}

.shadow-box:hover {
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
}

.buttons-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 12px;
}

.button {
  transition: 0.2s ease-in-out;
}

.button:hover {
  transform: scale(1.05);
}

.select.is-rounded select {
  border-radius: 8px;
  padding: 8px;
}
</style>
