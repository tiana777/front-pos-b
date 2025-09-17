<template>
  <Profile />
  <section class="py-16">
    <div class="max-w-xl mx-auto">
      <div class="bg-gray-50 border border-gray-300 rounded-xl shadow-lg p-8 text-black transition duration-300 hover:shadow-xl">
        <div>
          <!-- Sélection de la caisse -->

          <div v-if="!isAdmin" class="field">
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
                  <div class="font-semibold mt-3 text-base">{{ register.name }}</div>
                  <div class="mt-2">
                    <span
                      v-if="['connected', 'in use'].includes(cashRegisterStatuses[register.id])"
                      class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs"
                    >
                      {{ connectedUserId === currentUserId ? 'Vous êtes connecté' : 'Occupée' }}
                    </span>
                    <span
                      v-else-if="cashRegisterStatuses[register.id] === 'disconnected'"
                      class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs"
                    >
                      Libre
                    </span>
                    <span v-else class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Inconnu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton de connexion -->

          <button class="button is-primary is-fullwidth mt-4" @click="onConnectButtonClick">
            <span class="icon"><i class="fas fa-link"></i></span>

            <span>{{ getConnectButtonText() }}</span>
          </button>

          <!-- Boutons RAZ & Billetage après connexion -->

          <div v-if="isConnected && connectedUserId === currentUserId && !isAdmin" class="buttons-container">
            <button class="button is-warning is-light" @click="resetCashRegister">

              <i class="fas fa-sync-alt"></i> Remise à zéro
            </button>
            <button class="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center gap-2 font-semibold hover:bg-blue-200" @click="performCashCount">
              <i class="fas fa-money-bill-wave"></i> Billetage
            </button>
            <button class="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center gap-2 font-semibold hover:bg-blue-200" @click="viewSales">
              <i class="fas fa-chart-line"></i> Mes ventes
            </button>
          </div>

          <!-- Indicateur de connexion -->

          <p v-if="isConnected && connectedUserId === currentUserId" class="has-text-success has-text-centered mt-3">
            ✅ {{ isAdmin ? 'Administrateur connecté' : `Caisse connectée : ${connectedCashRegisterName}` }}

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
import Profile from './Profile.vue'
import { useAuth } from '@/composables/useAuth'
const router = useRouter()

const { isAdmin, currentUser, loadUserData } = useAuth()

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
  if (!Array.isArray(cashRegisters.value) || !cashRegisters.value.length) return []

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
  if (isAdmin.value) return 'Accéder'
  if (isConnected.value && connectedUserId.value === currentUserId.value) return 'Résumé'
  return 'Connecter'
}

const fetchCashRegisters = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('http://127.0.0.1:8000/api/cash-registers', {
      headers: { Authorization: `Bearer ${token}` }
    })
    cashRegisters.value = response.data.data ? response.data.data : response.data
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
  if (Array.isArray(cashRegisters.value)) {
    await Promise.all(
      cashRegisters.value.map(register => checkSessionStatus(register.id))
    )
  } else {
    console.error('cashRegisters is not an array:', cashRegisters.value)
  }
}

const sendFondDeCaisse = async ({ amount, ticketNumber, note }) => {
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
        start_ticket_number: ticketNumber
      },
      { headers: { Authorization: `Bearer ${token}` } }
    )



    if (response.data) {
      localStorage.setItem('cashRegisterSession', JSON.stringify(response.data))

      if (ticketNumber !== undefined) {
        localStorage.setItem('currentTicketNumber', ticketNumber.toString())
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
  if (isAdmin.value) {
    router.push({ name: 'direct' })
  } else if (isConnected.value && connectedUserId.value === currentUserId.value) {
    router.push({ name: 'direct' })
  } else {
    if (!selectedCashRegister.value) return alert('Sélectionnez une caisse')
    openAmountModal()
  }
}

// Lifecycle
onMounted(async () => {
  await loadUserData()
  const user = currentUser.value
  if (user) currentUserId.value = user.id
  if (isAdmin.value) {
    isConnected.value = true
    connectedUserId.value = user.id
  } else {
    await fetchCashRegisters()
    await initializeSessions()
  }
})
</script>


