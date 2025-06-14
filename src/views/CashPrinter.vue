<template>
  <section class="section">
    <div class="container">
      <div class="card shadow-box">
        <div class="card-content">
          <h2 class="title is-5 has-text-centered">Connexion à une caisse</h2>

          <!-- Sélection de la caisse -->
          <div class="field">
            <label class="label">Choisir une caisse</label>
            <div class="control">
              <div class="cash-register-grid">
                <div v-for="register in filteredCashRegisters" :key="register.id" class="cash-register-card"
                  :class="{ 'connected': cashRegisterStatuses[register.id] === 'connected', 'selected': selectedCashRegister === register.id }"
                  @click="selectedCashRegister = register.id">
                  <span class="icon is-large">
                    <i class="fas fa-desktop fa-2x"></i>
                  </span>
                  <div class="cash-register-name">{{ register.name }}</div>
                  <div class="status-tags">
                    <span v-if="cashRegisterStatuses[register.id] === 'connected'"
                      class="tag is-success is-light">Connecté</span>
                    <span v-else-if="cashRegisterStatuses[register.id] === 'disconnected'"
                      class="tag is-danger is-light">Déconnecté</span>
                    <span v-else class="tag is-warning is-light">Inconnu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bouton de connexion -->
          <button class="button is-primary is-fullwidth mt-4" :disabled="!selectedCashRegister"
            @click="onConnectButtonClick">
            <span class="icon"><i class="fas fa-link"></i></span>
            <span>
              {{ isConnected && connectedUserId === currentUserId ?
                'Résumé' : 'Connect cash' }}</span>
          </button>

          <!-- Boutons RAZ & Billetage après connexion -->
          <div v-if="isConnected" class="buttons-container">
            <button class="button is-warning is-light" @click="resetCashRegister">
              <i class="fas fa-sync-alt"></i> Remise à zéro
            </button>
            <button class="button is-info is-light" @click="performCashCount">
              <i class="fas fa-money-bill-wave"></i> Billetage
            </button>
            <button class="button is-info is-light" @click="performCashCount">
              <i class="fas fa-money-bill-wave"></i> Mes ventes
            </button>
          </div>

          <!-- Indicateur de connexion -->
          <p v-if="isConnected" class="has-text-success has-text-centered mt-3">
            ✅ Caisse connectée : {{ connectedCashRegisterName }}
          </p>
        </div>
      </div>
    </div>
  </section>
  <AmountModal :isOpen="isAmountModalOpen" @close="closeAmountModal" @send="handleAmountModalSend" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import AmountModal from './AmountModal.vue'

const router = useRouter()

const isAmountModalOpen = ref(false)

const openAmountModal = () => {
  isAmountModalOpen.value = true
}

const closeAmountModal = () => {
  isAmountModalOpen.value = false
}

const sendFondDeCaisse = async ({ amount, note }) => {
  try {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user'))

    console.log('Before sendFondDeCaisse: selectedCashRegister:', selectedCashRegister.value, 'currentUserId:', currentUserId.value, 'connectedUserId:', connectedUserId.value, 'isConnected:', isConnected.value)

    if (!token || !user) {
      console.error("Erreur : Aucun token ou utilisateur trouvé.")
      alert('Token ou utilisateur manquant.')
      return
    }
    if (!selectedCashRegister.value) {
      alert('Veuillez sélectionner une caisse.')
      return
    }
    const response = await axios.post('http://127.0.0.1:8000/api/cash-registers-sessions', {
      cash_register_id: selectedCashRegister.value,
      user_id: user.id,
      starting_amount: amount,
      note: note
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.data) {
      // Store session in localStorage
      localStorage.setItem('cashRegisterSession', JSON.stringify(response.data.data))
      router.push({ name: 'direct' })
      closeAmountModal()
    } else {
      console.log('Échec de l\'envoi du fond de caisse.')
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du fond de caisse :', error.response?.data || error)
    console.log('Erreur lors de l\'envoi du fond de caisse.')
  }
}

const handleAmountModalSend = (payload) => {
  sendFondDeCaisse(payload)
}

const cashRegisters = ref([])
const cashRegisterStatuses = ref({})
const selectedCashRegister = ref('')
const isConnected = ref(true)
const connectedCashRegisterName = ref('')
const connectedUserId = ref(null)
const currentUserId = ref(null)

// Computed filtered cash registers based on connected user session
import { computed } from 'vue'

const filteredCashRegisters = computed(() => {
  if (isConnected.value && connectedUserId.value === currentUserId.value) {
    // Show only the connected cash register
    return cashRegisters.value.filter(register => register.id === selectedCashRegister.value)
  }
  // If user has active session on any cash register, show only that one
  const activeSessionRegister = cashRegisters.value.find(register => {
    const session = cashRegisterSessions.value[register.id]
    return session && session.user_id === currentUserId.value && session.is_closed === false
  })
  if (activeSessionRegister) {
    return [activeSessionRegister]
  }
  // Otherwise show all cash registers
  return cashRegisters.value
})

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'))
  if (user) {
    currentUserId.value = user.id
    connectedUserId.value = user.id
  }
  await fetchCashRegisters()

  // Check if user has active session on any cash register
  const activeSessionRegister = cashRegisters.value.find(register => {
    const session = cashRegisterSessions.value[register.id]
    return session && session.user_id === currentUserId.value && session.is_closed === false
  })
  isConnected.value = !!activeSessionRegister
  if (activeSessionRegister) {
    selectedCashRegister.value = activeSessionRegister.id
  }
})

// Additional reactive to store session info per cash register
const cashRegisterSessions = ref({})

const fetchCashRegisters = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await axios.get('http://127.0.0.1:8000/api/cash-registers', {
      headers: { Authorization: `Bearer ${token}` }
    })

    cashRegisters.value = response.data

    // Fetch status and session for each cash register
    for (const register of cashRegisters.value) {
      await checkSessionStatus(register.id)
    }
  } catch (error) {
    console.error('Erreur lors du chargement des caisses:', error)
  }
}

// Update checkSessionStatus to store session info
const checkSessionStatus = async (cashRegisterId) => {
  try {
    const token = localStorage.getItem('token')

    const response = await axios.get(`http://127.0.0.1:8000/api/cash-registers-sessions/${cashRegisterId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.has_active_session === true) {
      cashRegisterStatuses.value[cashRegisterId] = 'connected'
      cashRegisterSessions.value[cashRegisterId] = response.data.session
    } else {
      cashRegisterStatuses.value[cashRegisterId] = 'disconnected'
      cashRegisterSessions.value[cashRegisterId] = null
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de la session :', error)
    cashRegisterStatuses.value[cashRegisterId] = 'unknown'
    cashRegisterSessions.value[cashRegisterId] = null
  }
}



const connectCashRegister = async () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    console.log('Before connect: selectedCashRegister:', selectedCashRegister.value, 'currentUserId:', currentUserId.value, 'connectedUserId:', connectedUserId.value, 'isConnected:', isConnected.value);

    if (!token || !user) {
      console.error("Erreur : Aucun token ou utilisateur trouvé.");
      return;
    }

    const response = await axios.post(
      'http://127.0.0.1:8000/api/cash-registers-sessions',
      {
        cash_register_id: selectedCashRegister.value,
        user_id: user.id,
        point_of_sale_id: user.point_of_sale_id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      isConnected.value = true;

      connectedCashRegisterName.value = response.data.cash_register_name;
      connectedUserId.value = response.data.session.user_id || null;
      console.log(connectedCashRegisterName.value)
      selectedCashRegister.value = response.data.session.cash_register_id || selectedCashRegister.value;


    } else {
      console.warn("La connexion à la caisse a échoué.");
      isConnected.value = false;
    }
  } catch (error) {
    isConnected.value = false;
    console.error("Échec de la connexion à la caisse:", error.response?.data || error.message);
  }
};

const onConnectButtonClick = () => {
  if (isConnected.value && Number(connectedUserId.value) === Number(currentUserId.value)) {
    router.push({ name: 'direct' })
  } else {
    openAmountModal()
  }
}

// RAZ (Remise à zéro)
const resetCashRegister = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token d\'authentification manquant.');
      return;
    }
    const response = await axios.post('http://127.0.0.1:8000/api/cash-registers/reset', {
      cash_register_id: selectedCashRegister.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      alert('RAZ effectuée avec succès !');
    } else {
      alert('Échec de la remise à zéro.');
    }
  } catch (error) {
    alert('Erreur lors de la remise à zéro.');
  }
}

// Billetage
const performCashCount = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token d\'authentification manquant.');
      return;
    }
    const response = await axios.post('http://127.0.0.1:8000/api/cash-registers/cash-count', {
      cash_register_id: selectedCashRegister.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      alert('Billetage effectué avec succès !');
    } else {
      alert('Échec du billetage.');
    }
  } catch (error) {
    console.error('Erreur lors du billetage :', error.response?.data || error);
    alert('Erreur lors du billetage.');
  }
}
watch([currentUserId, connectedUserId], ([newCurrentUserId, newConnectedUserId]) => {
  console.log('Watch IDs: currentUserId=', newCurrentUserId, 'connectedUserId=', newConnectedUserId)
})
onMounted(fetchCashRegisters)
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
  color: black;
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
  /* Bulma green */
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
