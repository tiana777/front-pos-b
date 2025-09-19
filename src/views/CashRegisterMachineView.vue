<template>
  <div class="min-h-screen bg-gray-100 text-gray-900">
    <Profile />

    <section class="pt-24 pb-12">
      <div class="max-w-4xl mx-auto px-4">
        <div class="bg-white rounded-2xl shadow-lg p-8">
          <header class="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h1 class="text-2xl font-semibold text-gray-900">Gestion des caisses (machines)</h1>
              <p class="mt-1 text-sm text-gray-500">
                Enregistrez ici le nom de la machine et rattachez-la à un point de vente.
              </p>
            </div>
            <button
              type="button"
              class="px-3 py-2 rounded-md border border-indigo-600 text-indigo-600 font-semibold hover:bg-indigo-50"
              @click="resetForm"
            >
              Nouvelle caisse
            </button>
          </header>

          <form class="space-y-5" @submit.prevent="submitForm">
            <div class="rounded-lg border border-gray-200 p-6 space-y-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm text-gray-600">
                  Nom de machine détecté :
                  <span v-if="machineName" class="font-semibold text-indigo-600">{{ machineName }}</span>
                  <span v-else class="text-amber-600">Non détecté</span>
                </p>
                <button
                  type="button"
                  class="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  @click="refreshMachineName"
                >
                  Réessayer
                </button>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700" for="cashregister-name">
                  Nom de la caisse / machine
                </label>
                <input
                  id="cashregister-name"
                  v-model="formName"
                  type="text"
                  class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex. POS-CAISSE-01"
                  maxlength="255"
                  required
                />
                <p class="text-xs text-gray-500 mt-1">
                  Le nom est prérempli avec le hostname de la machine mais reste modifiable.
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700" for="point-of-sale">
                  Point de vente
                </label>
                <select
                  id="point-of-sale"
                  v-model="selectedPointOfSaleId"
                  class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  :disabled="!isAdmin"
                  required
                >
                  <option :value="null" disabled>Choisir un point de vente</option>
                  <option v-for="pos in pointOfSales" :key="pos.id" :value="pos.id">
                    {{ pos.name }}
                  </option>
                </select>
                <p v-if="!isAdmin" class="text-xs text-gray-500 mt-1">
                  Ce champ est fixé sur votre point de vente.
                </p>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
                  :disabled="isSaving || !formValid"
                >
                  <span v-if="isSaving" class="flex items-center gap-2">
                    <i class="fas fa-spinner fa-spin"></i>
                    Enregistrement...
                  </span>
                  <span v-else>Enregistrer</span>
                </button>
                <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
                <p v-else-if="successMessage" class="text-sm text-green-600">{{ successMessage }}</p>
              </div>
            </div>
          </form>

  <section class="mt-10">
    <header class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-medium text-gray-800">Caisses par point de vente</h2>
      <span class="text-sm text-gray-500">Total : {{ cashRegisters.length }}</span>
    </header>

    <div v-if="groupedRegisters.length" class="space-y-6">
      <div
        v-for="group in groupedRegisters"
                :key="group.pointOfSaleId ?? 'none'"
                class="border border-gray-200 rounded-lg"
              >
                <div class="px-4 py-3 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-semibold text-gray-700">
                      {{ group.pointOfSaleName || 'Sans point de vente' }}
                    </h3>
                    <p class="text-xs text-gray-500">{{ group.registers.length }} caisse(s)</p>
                  </div>
                </div>
                <ul>
                  <li
                    v-for="register in group.registers"
                    :key="register.id"
              class="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm"
            >
              <span class="font-medium text-gray-800">{{ register.name }}</span>
              <div class="flex items-center gap-3">
                <span class="text-gray-500">ID&nbsp;: {{ register.id }}</span>
                <button
                  type="button"
                  class="text-xs text-red-600 hover:text-red-700"
                  @click="confirmDelete(register)"
                >
                  Supprimer
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <p v-else class="text-sm text-gray-500 text-center py-6">Aucune caisse enregistrée pour le moment.</p>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Profile from './Profile.vue'
import { useAuth } from '@/composables/useAuth'

const { isAdmin, currentUser, loadUserData } = useAuth()

const machineName = ref('')
const formName = ref('')
const pointOfSales = ref([])
const selectedPointOfSaleId = ref(null)
const cashRegisters = ref([])

const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const userPointOfSaleId = computed(() => currentUser.value?.point_of_sale_id ?? null)

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  if (!token) throw new Error("Token d'authentification manquant")
  return { Authorization: `Bearer ${token}` }
}

const detectMachineName = () => {
  let detected = ''

  try {
    if (typeof window !== 'undefined' && typeof window.require === 'function') {
      const os = window.require?.('os')
      if (os?.hostname) {
        detected = os.hostname()
      }
    }
  } catch (error) {
    console.warn('Détection via API Node impossible:', error)
  }

  if (!detected && typeof window !== 'undefined') {
    const stored =
      localStorage.getItem('cashRegisterMachineName') ||
      localStorage.getItem('cashPrinterName')
    if (stored) {
      detected = stored
    }
  }

  if (!detected && typeof window !== 'undefined') {
    const hostname = window.location?.hostname
    if (hostname && hostname !== 'localhost') {
      detected = hostname
    }
  }

  if (!detected && typeof navigator !== 'undefined') {
    const platform = navigator.userAgentData?.platform || navigator.platform || ''
    if (platform) {
      detected = `POS-${platform.replace(/\s+/g, '-').toUpperCase()}`
    }
  }

  return detected
}

const applyMachineName = () => {
  machineName.value = detectMachineName()
  formName.value = machineName.value
}

const refreshMachineName = () => {
  applyMachineName()
}

const fetchPointOfSales = async () => {
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/pointofsales', {
      headers: getAuthHeaders()
    })
    pointOfSales.value = data?.data || data || []

    if (isAdmin.value) {
      if (!selectedPointOfSaleId.value && pointOfSales.value.length) {
        selectedPointOfSaleId.value = pointOfSales.value[0].id
      }
    } else if (userPointOfSaleId.value) {
      selectedPointOfSaleId.value = userPointOfSaleId.value
      if (!pointOfSales.value.length) {
        pointOfSales.value = [
          {
            id: userPointOfSaleId.value,
            name: currentUser.value?.point_of_sale_name || 'Mon point de vente'
          }
        ]
      }
    }
  } catch (error) {
    console.error('Erreur chargement points de vente:', error)
    if (!isAdmin.value && userPointOfSaleId.value) {
      pointOfSales.value = [
        {
          id: userPointOfSaleId.value,
          name: currentUser.value?.point_of_sale_name || 'Mon point de vente'
        }
      ]
      selectedPointOfSaleId.value = userPointOfSaleId.value
    }
  }
}

const fetchCashRegisters = async () => {
  try {
    const { data } = await axios.get('http://127.0.0.1:8000/api/cash-registers', {
      headers: getAuthHeaders()
    })
    cashRegisters.value = data?.data || data || []
  } catch (error) {
    console.error('Erreur lors du chargement des caisses:', error)
  }
}

const groupedRegisters = computed(() => {
  if (!cashRegisters.value.length) return []

  const groups = new Map()
  cashRegisters.value.forEach((register) => {
    const posId = register.point_of_sale_id || 'none'
    if (!groups.has(posId)) {
      groups.set(posId, {
        pointOfSaleId: register.point_of_sale_id ?? null,
        pointOfSaleName: register.point_of_sale?.name || pointOfSales.value.find(pos => pos.id === register.point_of_sale_id)?.name || 'Sans point de vente',
        registers: []
      })
    }
    groups.get(posId).registers.push(register)
  })

  return Array.from(groups.values()).map(group => ({
    ...group,
    registers: group.registers.sort((a, b) => a.name.localeCompare(b.name))
  }))
})

const formValid = computed(() => {
  if (!formName.value?.trim()) return false
  if (isAdmin.value) {
    return Boolean(selectedPointOfSaleId.value)
  }
  return true
})

const submitForm = async () => {
  if (!formValid.value) return

  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const payload = {
      name: formName.value.trim()
    }

    if (isAdmin.value && selectedPointOfSaleId.value) {
      payload.point_of_sale_id = selectedPointOfSaleId.value
    }

    const { data } = await axios.post('http://127.0.0.1:8000/api/cash-registers', payload, {
      headers: getAuthHeaders()
    })

    const created = data?.data || data || null
    if (created) {
      cashRegisters.value.push(created)
      successMessage.value = 'Caisse enregistrée avec succès.'
      localStorage.setItem('cashRegisterMachineName', created.name)
      localStorage.setItem('cashPrinterName', created.name)
      machineName.value = created.name
      formName.value = created.name
    }
  } catch (error) {
    console.error('Erreur enregistrement caisse:', error)
    const validationError = error.response?.data?.details?.name?.[0]
    errorMessage.value = validationError
      || error.response?.data?.message
      || error.message
      || 'Enregistrement impossible.'
  } finally {
    isSaving.value = false
    await fetchCashRegisters()
  }
}

const resetForm = () => {
  applyMachineName()
  successMessage.value = ''
  errorMessage.value = ''
}

const deleteRegister = async (register) => {
  if (!register) return
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await axios.delete(`http://127.0.0.1:8000/api/cash-registers/${register.id}`, {
      headers: getAuthHeaders()
    })

    cashRegisters.value = cashRegisters.value.filter(item => item.id !== register.id)
    successMessage.value = `Caisse « ${register.name} » supprimée.`
  } catch (error) {
    console.error('Erreur suppression caisse:', error)
    errorMessage.value = error.response?.data?.message || error.message || 'Suppression impossible.'
  } finally {
    isSaving.value = false
  }
}

const confirmDelete = (register) => {
  if (!register) return
  const confirmed = window.confirm(`Confirmer la suppression de la caisse « ${register.name} » ?`)
  if (confirmed) {
    deleteRegister(register)
  }
}

onMounted(async () => {
  await loadUserData()
  applyMachineName()
  await Promise.all([fetchPointOfSales(), fetchCashRegisters()])
  if (!isAdmin.value && userPointOfSaleId.value) {
    selectedPointOfSaleId.value = userPointOfSaleId.value
  }
})
</script>

<style scoped>
button {
  transition: background 0.2s ease, color 0.2s ease;
}
</style>
