<template>
  <Profile />
  <section class="py-16">
    <div class="max-w-xl mx-auto">
      <div class="bg-gray-50 border border-gray-300 rounded-xl shadow-lg p-8 text-black transition duration-300 hover:shadow-xl">
        <div>
          <div v-if="!isAdmin">
            <div class="rounded-lg border border-gray-200 bg-white p-5">
              <h2 class="text-lg font-semibold text-gray-800 mb-3">Machine actuelle</h2>
              <p class="text-sm text-gray-600">
                Nom détecté :
                <span v-if="machineIdentifier" class="font-semibold text-blue-700">{{ machineIdentifier }}</span>
                <span v-else class="text-amber-600">Non détecté</span>
              </p>

              <p v-if="hasActiveSession" class="mt-3 text-sm text-blue-700 bg-blue-50 rounded-md px-3 py-2">
                Session ouverte sur <strong>{{ activeSession?.cash_register?.name }}</strong>.
                Utilisez «&nbsp;Résumé &amp; Continuer&nbsp;» pour reprendre vos ventes.
              </p>

              <div v-if="loadingRegisters" class="text-center text-gray-500 py-6">
                Chargement des caisses...
              </div>
              <div v-else class="mt-4 space-y-3">
                <div v-if="machineRegister">
                  <p class="text-sm text-gray-700">
                    Caisse associée : <strong>{{ machineRegister.name }}</strong>
                    <span v-if="machineRegister.point_of_sale?.name" class="text-gray-500">
                      — {{ machineRegister.point_of_sale.name }}
                    </span>
                  </p>
                  <p class="text-xs text-gray-500">
                    Statut :
                    <span :class="['font-semibold', statusBadgeClass(machineRegister.id)]">
                      {{ statusBadgeText(machineRegister.id) || 'Disponible' }}
                    </span>
                  </p>
                </div>
                <div v-else class="space-y-2">
                  <p class="text-sm text-red-600">
                    Aucune caisse n'est associée à cette machine. Créez-la avant de continuer.
                  </p>
                  <button
                    type="button"
                    class="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
                    @click="goToMachineManagement"
                  >
                    Créer / associer une caisse
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="field">
            <label class="label">Choisir une caisse</label>
            <div class="control">
              <div v-if="loadingRegisters" class="text-center text-gray-500 py-6">
                Chargement des caisses...
              </div>
              <div v-else>
                <div v-if="availableRegisters.length" class="cash-register-grid">
                  <button
                    v-for="register in availableRegisters"
                    :key="register.id"
                    type="button"
                    class="cash-register-card"
                    :class="{
                      connected: registerStatuses[register.id] === 'connected',
                      selected: selectedCashRegister === register.id,
                      disabled: isRegisterLocked(register.id)
                    }"
                    :aria-disabled="isRegisterLocked(register.id)"
                    :aria-pressed="selectedCashRegister === register.id"
                    :disabled="isRegisterLocked(register.id)"
                    :tabindex="isRegisterLocked(register.id) ? -1 : 0"
                    @click="selectCashRegister(register.id)"
                    @keyup.enter.prevent="selectCashRegister(register.id)"
                    @keyup.space.prevent="selectCashRegister(register.id)"
                  >
                    <span class="icon is-large">
                      <i class="fas fa-desktop fa-2x"></i>
                    </span>
                    <div class="font-semibold mt-3 text-base">{{ register.name }}</div>
                    <div class="mt-2">
                      <span
                        v-if="statusBadgeText(register.id)"
                        :class="['px-2 py-1 rounded text-xs font-semibold', statusBadgeClass(register.id)]"
                      >
                        {{ statusBadgeText(register.id) }}
                      </span>
                    </div>
                  </button>
                </div>
                <div v-else class="text-center text-gray-400 py-6">
                  Aucune caisse disponible.
                </div>
              </div>
            </div>
          </div>

          <p v-if="errorMessage" class="text-red-600 text-center mt-4 text-sm">{{ errorMessage }}</p>
          <p
            v-if="machineIdentifier && !isAdmin"
            class="text-gray-500 text-center mt-2 text-sm"
          >
            Machine détectée&nbsp;: <strong>{{ machineIdentifier }}</strong>
          </p>
          <p
            v-if="machineIdentifierMessage"
            class="text-amber-600 text-center mt-2 text-sm"
          >
            {{ machineIdentifierMessage }}
          </p>

          <button
            class="button is-primary is-fullwidth mt-4"
            :class="{ 'is-loading': isProcessing }"
            type="button"
            :disabled="connectButtonDisabled"
            :aria-disabled="connectButtonDisabled"
            :aria-busy="isProcessing"
            @click="onConnectButtonClick"
          >
            <span class="icon"><i class="fas fa-link"></i></span>
            <span>{{ connectButtonText }}</span>
          </button>

          <div v-if="isSelfConnected && !isAdmin" class="buttons-container">
            <button class="button is-warning is-light" type="button" @click="resetCashRegister">
              <i class="fas fa-sync-alt"></i> Remise à zéro
            </button>
            <button
              class="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center gap-2 font-semibold hover:bg-blue-200"
              type="button"
              @click="performCashCount"
            >
              <i class="fas fa-money-bill-wave"></i> Billetage
            </button>
            <button
              class="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center gap-2 font-semibold hover:bg-blue-200"
              type="button"
              @click="viewSales"
            >
              <i class="fas fa-chart-line"></i> Mes ventes
            </button>
          </div>

          <p v-if="isSelfConnected" class="has-text-success has-text-centered mt-3">
            ✅ Caisse connectée : {{ activeSession?.cash_register?.name || connectedCashRegisterName }}
          </p>
        </div>
      </div>
    </div>
  </section>

  <AmountModal :isOpen="isAmountModalOpen" @close="closeAmountModal" @send="handleAmountModalSend" />

  <div v-if="isSummaryModalOpen" class="modal is-active">
    <div class="modal-background" @click="closeSummaryModal"></div>
    <div class="modal-card summary-modal">
      <header class="modal-card-head">
        <p class="modal-card-title">Résumé de la session</p>
        <button class="delete" type="button" aria-label="Fermer" @click="closeSummaryModal"></button>
      </header>
      <section class="modal-card-body">
        <div v-if="summaryLoading" class="text-center text-gray-500 py-4">
          Chargement du résumé...
        </div>
        <p v-else-if="summaryError" class="text-red-600 text-sm text-center">
          {{ summaryError }}
        </p>
        <div v-else>
          <div class="summary-row">
            <span class="summary-label">Caisse</span>
            <span class="summary-value">{{ activeSession?.cash_register?.name }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Ouverte par</span>
            <span class="summary-value">{{ activeSession?.user?.name || 'Moi' }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Ouverte le</span>
            <span class="summary-value">{{ formatDate(activeSession?.opened_at) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Fond de caisse</span>
            <span class="summary-value">{{ formatCurrency(activeSession?.starting_amount) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Total transactions</span>
            <span class="summary-value">{{ formatCurrency(sessionSummary?.total_transactions) }}</span>
          </div>
          <div class="summary-row">
            <span class="summary-label">Écarts signalés</span>
            <span class="summary-value">{{ formatCurrency(sessionSummary?.total_discrepancies) }}</span>
          </div>
          <div class="summary-row" v-if="sessionSummary?.session?.expected_cash_amount !== undefined">
            <span class="summary-label">Montant attendu</span>
            <span class="summary-value">{{ formatCurrency(sessionSummary?.session?.expected_cash_amount) }}</span>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button
          class="button is-primary"
          type="button"
          :disabled="summaryLoading"
          @click="continueAfterSummary"
        >
          Continuer à vendre
        </button>
        <button class="button" type="button" :disabled="summaryLoading" @click="closeSummaryModal">
          Fermer
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import AmountModal from './AmountModal.vue'
const router = useRouter()
const { isAdmin, currentUser, loadUserData } = useAuth()

const isAmountModalOpen = ref(false)
const isProcessing = ref(false)
const loadingRegisters = ref(false)
const cashRegisters = ref([])
const registerStatuses = ref({})
const registerOwners = ref({})
const selectedCashRegister = ref(null)
const activeSession = ref(null)
const errorMessage = ref('')
const machineIdentifierMessage = ref('')
const connectedCashRegisterName = ref('')

const machineIdentifier = ref('')

const machineRegister = computed(() => {
  const registers = Array.isArray(cashRegisters.value) ? cashRegisters.value : []
  return findRegisterForMachine(registers)
})

const isSummaryModalOpen = ref(false)
const summaryLoading = ref(false)
const summaryError = ref('')
const sessionSummary = ref(null)

const currentUserId = computed(() => currentUser.value?.id ?? null)

const isSessionOpen = (session) => {
  if (!session) return false
  const value = session.is_closed
  return value === false || value === null || value === undefined || value === 0 || value === '0'
}

const hasActiveSession = computed(() => isSessionOpen(activeSession.value))
const activeRegisterId = computed(() => (hasActiveSession.value ? activeSession.value.cash_register_id : null))
const isSelfConnected = computed(() => hasActiveSession.value && activeSession.value.user_id === currentUserId.value)

const availableRegisters = computed(() => {
  const registers = Array.isArray(cashRegisters.value) ? cashRegisters.value : []
  if (!registers.length) return []

  if (hasActiveSession.value) {
    return registers.filter(register => register.id === activeRegisterId.value)
  }

  if (!isAdmin.value) {
    return machineRegister.value ? [machineRegister.value] : []
  }

  return registers
})

const connectButtonText = computed(() => {
  if (isAdmin.value) return 'Accéder'
  if (isSelfConnected.value) return 'Résumé & Continuer'
  return 'Connecter'
})

const connectButtonDisabled = computed(() => {
  if (isProcessing.value) return true
  if (isAdmin.value) return false
  if (isSelfConnected.value) return false
  if (hasActiveSession.value) return true
  return !machineRegister.value || !selectedCashRegister.value
})

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error("Token d'authentification manquant")
  return { Authorization: `Bearer ${token}` }
}

const statusBadgeText = (registerId) => {
  if (isSelfConnected.value && registerId === activeRegisterId.value) {
    return 'Occupée (vous)'
  }
  const status = registerStatuses.value[registerId]
  const owner = registerOwners.value[registerId]
  if (status === 'connected') {
    return owner === currentUserId.value ? 'Occupée (vous)' : 'Occupée'
  }
  if (status === 'error') return 'Erreur'
  return 'Disponible'
}

const statusBadgeClass = (registerId) => {
  const status = statusBadgeText(registerId)
  if (status.includes('Erreur')) return 'bg-red-100 text-red-700'
  if (status.includes('Occupée (vous)')) return 'bg-blue-100 text-blue-700'
  if (status.includes('Occupée')) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

const isRegisterLocked = (registerId) => {
  if (isSelfConnected.value && registerId === activeRegisterId.value) return true
  const status = registerStatuses.value[registerId]
  const owner = registerOwners.value[registerId]
  return status === 'connected' && owner && owner !== currentUserId.value
}

const selectCashRegister = (registerId) => {
  if (loadingRegisters.value || isProcessing.value) return
  if (isRegisterLocked(registerId)) return
  if (hasActiveSession.value && registerId !== activeRegisterId.value) return
  selectedCashRegister.value = registerId
}

const fetchCashRegisters = async () => {
  loadingRegisters.value = true
  errorMessage.value = ''
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-registers', {
      headers: getAuthHeaders()
    })
    const registers = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    cashRegisters.value = registers
  } catch (error) {
    console.error('Erreur lors du chargement des caisses:', error)
    errorMessage.value = error.response?.data?.message || 'Impossible de charger les caisses'
    cashRegisters.value = []
  } finally {
    loadingRegisters.value = false
  }
}

const resolveMachineIdentifier = () => {
  machineIdentifierMessage.value = ''
  try {
    const storedIdentifiers = [
      localStorage.getItem('cashRegisterMachineName'),
      localStorage.getItem('cashPrinterName'),
      localStorage.getItem('cash_printer_name'),
      localStorage.getItem('machineIdentifier')
    ]

    const envIdentifier = import.meta.env?.VITE_CASH_PRINTER_NAME

    const resolved = [...storedIdentifiers, envIdentifier]
      .map(value => (typeof value === 'string' ? value.trim() : ''))
      .find(value => value)

    machineIdentifier.value = resolved || ''

    if (!machineIdentifier.value && !isAdmin.value) {
      machineIdentifierMessage.value = 'Identifiant machine introuvable. Configurez le nom de cashprinter pour cette machine.'
    }
  } catch (error) {
    console.error('Erreur récupération identifiant machine:', error)
    machineIdentifier.value = ''
    machineIdentifierMessage.value = "Impossible de déterminer l'identifiant de la machine."
  }
}

function normalizeName(name) {
  return (name || '').toString().trim().toLowerCase()
}

function findRegisterForMachine(registers) {
  if (!machineIdentifier.value) return null
  const normalizedMachineName = normalizeName(machineIdentifier.value)
  return registers.find(register => normalizeName(register.name) === normalizedMachineName) || null
}

const fetchRegisterStatus = async (registerId) => {
  try {
    const { data } = await axios.get(`http://127.0.0.1:8000/api/cash-registers-sessions/${registerId}/status`, {
      headers: getAuthHeaders()
    })

    const statusResponse = data.status ?? 'available'
    const sessionOwner = data.session?.user_id ?? data.user_id ?? null
    const normalizedStatus = statusResponse === 'in use' ? 'connected' : statusResponse

    registerStatuses.value = {
      ...registerStatuses.value,
      [registerId]: normalizedStatus
    }

    const owners = { ...registerOwners.value }
    if (sessionOwner) {
      owners[registerId] = sessionOwner
    } else {
      delete owners[registerId]
    }
    registerOwners.value = owners
  } catch (error) {
    registerStatuses.value = {
      ...registerStatuses.value,
      [registerId]: 'error'
    }
    console.error(`Erreur statut caisse ${registerId}:`, error.response?.data || error.message)
  }
}

const fetchMyActiveSession = async () => {
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-register-session/my-active-session', {
      headers: getAuthHeaders()
    })

    const session = data?.data || data || null

    if (isSessionOpen(session)) {
      activeSession.value = session
      selectedCashRegister.value = session.cash_register_id
      connectedCashRegisterName.value = session.cash_register?.name || ''
      registerStatuses.value = {
        ...registerStatuses.value,
        [session.cash_register_id]: 'connected'
      }
      registerOwners.value = {
        ...registerOwners.value,
        [session.cash_register_id]: session.user_id
      }
    } else {
      activeSession.value = null
      if (!isAdmin.value) {
        selectedCashRegister.value = null
      }
    }
  } catch (error) {
    if (error.response?.status !== 404) {
      console.error('Erreur récupération session active:', error.response?.data || error.message)
    }
    activeSession.value = null
    if (!isAdmin.value) {
      selectedCashRegister.value = null
    }
  }
}

const initializeSessions = async () => {
  const registers = Array.isArray(cashRegisters.value) ? cashRegisters.value : []
  await Promise.all(registers.map(register => fetchRegisterStatus(register.id)))
  if (hasActiveSession.value) {
    selectedCashRegister.value = activeRegisterId.value
  } else if (!selectedCashRegister.value) {
    if (machineRegister.value) {
      selectedCashRegister.value = machineRegister.value.id
      machineIdentifierMessage.value = ''
    } else {
      const fallback = registers.find(register => !isRegisterLocked(register.id)) || registers[0]
      selectedCashRegister.value = fallback?.id ?? null

      if (!isAdmin.value && machineIdentifier.value) {
        machineIdentifierMessage.value = `Aucune caisse ne correspond au nom « ${machineIdentifier.value} ». Créez-la depuis la gestion des caisses.`
      }
    }
  }
}

const openAmountModal = () => {
  if (isProcessing.value) return
  isAmountModalOpen.value = true
}

const closeAmountModal = () => {
  isAmountModalOpen.value = false
}

const handleAmountModalSend = (payload) => {
  if (isProcessing.value) return
  sendFondDeCaisse(payload)
}

const sendFondDeCaisse = async ({ amount, ticketNumber, note }) => {
  if (!selectedCashRegister.value && !isAdmin.value) {
    alert('Sélectionnez une caisse')
    return
  }

  isProcessing.value = true
  try {
    const user = currentUser.value
    if (!user?.id) throw new Error('Utilisateur non authentifié')

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

      router.push({ name: 'dashboard-direct' })
    }
  } catch (error) {
    console.error('Erreur connexion caisse:', error)
    alert(error.response?.data?.message || error.message || 'Erreur de connexion à la caisse')
  } finally {
    isProcessing.value = false
    closeAmountModal()
  }
}

const resetCashRegister = async () => {
  if (isSelfConnected.value) {
    alert('Fermez votre session avant de réinitialiser la caisse.')
    return
  }
  if (!selectedCashRegister.value) {
    alert('Sélectionnez une caisse')
    return
  }
  if (!confirm('Confirmez la remise à zéro ?')) return

  try {
    await axios.post('http://127.0.0.1:8000/api/cash-registers/reset', {
      cash_register_id: selectedCashRegister.value
    }, {
      headers: getAuthHeaders()
    })
    alert('RAZ effectuée avec succès !')
    await initializeSessions()
  } catch (error) {
    console.error('Erreur reset caisse:', error)
    alert(error.response?.data?.message || 'Échec de la remise à zéro')
  }
}

const performCashCount = () => {
  if (!isSelfConnected.value) {
    alert("Connectez-vous à une caisse d'abord")
    return
  }
  router.push({ name: 'billetage' })
}

const viewSales = () => {
  router.push({ name: 'dashboard-user-sales' })
}

const onConnectButtonClick = () => {
  if (isConnected.value && connectedUserId.value === currentUserId.value) {
    router.push({ name: 'dashboard-direct' })
  } else {
    if (!selectedCashRegister.value) return alert('Sélectionnez une caisse')
    openAmountModal()
  }
  if (isSelfConnected.value) {
    openSummaryModal()
    return
  }
  if (!selectedCashRegister.value || !machineRegister.value) {
    alert('Associez cette machine à une caisse avant de continuer.')
    return
  }
  openAmountModal()
}

const formatCurrency = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0,00 Ar'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(number)
}

const formatDate = (date) => {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  return parsed.toLocaleString('fr-FR')
}

// Lifecycle
onMounted(async () => {
  try {
    await loadUserData()
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error)
  }

  resolveMachineIdentifier()
  await fetchMyActiveSession()
  await fetchCashRegisters()
  await initializeSessions()
})
</script>
