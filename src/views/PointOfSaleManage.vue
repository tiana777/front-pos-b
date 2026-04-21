<template>
<tbody class="divide-y divide-slate-100">
  <template v-for="pos in pointsOfSale" :key="pos.id">
    <tr class="bg-white hover:bg-slate-50 transition">
      <td class="px-4 py-3 font-medium text-slate-800">
        <div class="flex items-center gap-2">
          <FontAwesomeIcon icon="fa-solid fa-store" class="text-indigo-400" />
          {{ pos.name }}
        </div>
      </td>
      <td class="px-4 py-3">
        <div class="flex items-center gap-1">
          <FontAwesomeIcon icon="fa-solid fa-users" class="text-slate-400 text-xs" />
          <span class="text-sm font-semibold text-slate-700">{{ pos.users?.length || 0 }}</span>
          <span class="text-xs text-slate-500">utilisateur(s)</span>
        </div>
      </td>
      <td class="px-4 py-3 text-slate-500 text-xs">{{ formatDate(pos.created_at) }}</td>
      <td class="px-4 py-3">
        <div class="flex justify-end gap-2">
          <button type="button" class="p-1.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition" @click="editPointOfSale(pos)">
            <FontAwesomeIcon icon="fa-solid fa-pen" class="text-sm" />
          </button>
          <button type="button" class="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" @click="deletePointOfSale(pos.id)">
            <FontAwesomeIcon icon="fa-solid fa-trash" class="text-sm" />
          </button>
        </div>
      </td>
    </tr>

    <!-- Ligne détaillée : utilisateurs associés + formulaire d'association -->
    <tr class="bg-slate-50/40">
      <td colspan="4" class="px-4 py-3">
        <div class="text-xs space-y-3">
          <!-- Titre et compteur -->
          <div class="flex items-center justify-between">
            <div class="font-semibold text-slate-600 flex items-center gap-1">
              <FontAwesomeIcon icon="fa-solid fa-user-check" class="text-indigo-500" />
              Utilisateurs affectés
            </div>
            <span class="text-slate-400 text-[11px]">{{ pos.users?.length || 0 }} membre(s)</span>
          </div>

          <!-- Liste des utilisateurs (badges) -->
          <div v-if="pos.users && pos.users.length" class="flex flex-wrap gap-2">
            <div v-for="user in pos.users" :key="user.id" class="flex items-center gap-2 bg-white rounded-full border border-slate-200 pl-2 pr-1 py-1 shadow-sm">
              <FontAwesomeIcon icon="fa-solid fa-user-circle" class="text-slate-400 text-sm" />
              <span class="text-slate-700 text-xs font-medium">{{ user.name }}</span>
              <span class="text-slate-400 text-[10px] hidden sm:inline">{{ user.email }}</span>
              <div class="flex gap-1 ml-1">
                <button @click="openEditUserModal(user)" class="text-indigo-500 hover:text-indigo-700 p-1" title="Modifier">
                  <FontAwesomeIcon icon="fa-solid fa-pen" class="text-[10px]" />
                </button>
                <button @click="deleteUserFromPos(user.id, pos.id)" class="text-rose-500 hover:text-rose-700 p-1" title="Retirer">
                  <FontAwesomeIcon icon="fa-solid fa-trash" class="text-[10px]" />
                </button>
              </div>
            </div>
          </div>
          <div v-else class="text-slate-400 italic text-xs">Aucun utilisateur pour ce point de vente.</div>

          <!-- Formulaire d'association -->
          <div class="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
            <span class="text-slate-500 text-xs">➕ Ajouter un utilisateur :</span>
            <select v-model="selectedUserForPos[pos.id]" class="rounded-lg border border-slate-200 px-2 py-1 text-xs bg-white w-48">
              <option :value="null">-- Sélectionner --</option>
              <option v-for="user in getAvailableUsersForPos(pos)" :key="user.id" :value="user.id">
                {{ user.name }} ({{ user.email }})
              </option>
            </select>
            <button @click="attachUserToPos(selectedUserForPos[pos.id], pos.id)" :disabled="!selectedUserForPos[pos.id]" class="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs text-white hover:bg-indigo-700 disabled:opacity-50 transition">
              <FontAwesomeIcon icon="fa-solid fa-plus" class="text-[10px]" /> Attacher
            </button>
          </div>
        </div>
      </td>
    </tr>
  </template>
</tbody>

  <PointOfSaleModal
    :is-open="showAddForm || showEditForm"
    :title="showEditForm ? 'Éditer un point de vente' : 'Ajouter un point de vente'"
    :submit-label="showEditForm ? 'Mettre à jour' : 'Ajouter'"
    :initial-name="form.name"
    @submit="submitForm"
    @close="closeForm"
  />
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import axios from 'axios'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import PointOfSaleModal from './PointOfSaleModal.vue'
import { API_BASE_URL } from '@/utils/api'
import { faStore, faUserCheck, faUserCircle } from '@fortawesome/free-solid-svg-icons'

const pointsOfSale = ref([])
const loading = ref(true)
const error = ref(null)
const showAddForm = ref(false)
const showEditForm = ref(false)
const form = ref({ id: null, name: '' })

// Tous les utilisateurs et sélection par point de vente
const allUsers = ref([])
const selectedUserForPos = reactive({})

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const fetchPointsOfSale = async () => {
  loading.value = true
  error.value = null
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/point-of-sales`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    pointsOfSale.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Erreur chargement:', err)
    if (err.response?.status === 401) {
      error.value = 'Session expirée. Veuillez vous reconnecter.'
      localStorage.removeItem('token')
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } else {
      error.value = err.response?.data?.message || 'Impossible de charger les points de vente'
    }
  } finally {
    loading.value = false
  }
}

const fetchAllUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    allUsers.value = response.data.data || response.data || []
  } catch (err) {
    console.error('Erreur chargement utilisateurs:', err)
  }
}

const getAvailableUsersForPos = (pos) => {
  const currentUserIds = pos.users?.map(u => u.id) || []
  return allUsers.value.filter(user => 
    !currentUserIds.includes(user.id) && (user.point_of_sale_id === null || user.point_of_sale_id === pos.id)
  )
}

const submitForm = async (name) => {
  if (typeof name === 'string') form.value.name = name
  const token = localStorage.getItem('token')
  try {
    if (showEditForm.value) {
      await axios.put(`${API_BASE_URL}/point-of-sales/${form.value.id}`,
        { name: form.value.name },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } else {
      await axios.post(`${API_BASE_URL}/point-of-sales`,
        { name: form.value.name },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    }
    await fetchPointsOfSale()
    closeForm()
  } catch (err) {
    console.error('Erreur submission:', err)
    alert(err.response?.data?.message || 'Une erreur est survenue')
  }
}

const editPointOfSale = (pos) => {
  form.value = { id: pos.id, name: pos.name }
  showEditForm.value = true
  showAddForm.value = false
}

const deletePointOfSale = async (id) => {
  if (!confirm('Voulez-vous vraiment supprimer ce point de vente ?')) return
  const token = localStorage.getItem('token')
  try {
    await axios.delete(`${API_BASE_URL}/point-of-sales/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    await fetchPointsOfSale()
  } catch (err) {
    console.error('Erreur suppression:', err)
    alert(err.response?.data?.message || 'Suppression impossible')
  }
}

const deleteUserFromPos = async (userId, pointOfSaleId) => {
  if (!confirm('Voulez-vous vraiment retirer cet utilisateur de ce point de vente ?')) return
  const token = localStorage.getItem('token')
  try {
    const userResponse = await axios.get(`${API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const userData = userResponse.data
    await axios.put(`${API_BASE_URL}/users/${userId}`,
      { name: userData.name, email: userData.email, point_of_sale_id: null },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    // Recharger les deux listes pour mettre à jour les données
    await Promise.all([fetchPointsOfSale(), fetchAllUsers()])
  } catch (err) {
    console.error('Erreur retrait utilisateur:', err)
    alert(err.response?.data?.message || 'Impossible de retirer cet utilisateur')
  }
}

const attachUserToPos = async (userId, pointOfSaleId) => {
  if (!userId) return
  const token = localStorage.getItem('token')
  try {
    await axios.post(`${API_BASE_URL}/point-of-sales/${pointOfSaleId}/users/${userId}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    // Recharger les deux listes pour que l'utilisateur disparaisse de la liste déroulante
    await Promise.all([fetchPointsOfSale(), fetchAllUsers()])
    delete selectedUserForPos[pointOfSaleId]  // réinitialiser la sélection
  } catch (err) {
    console.error('Erreur association:', err)
    alert(err.response?.data?.message || 'Impossible d\'associer l\'utilisateur')
  }
}

const closeForm = () => {
  showAddForm.value = false
  showEditForm.value = false
  form.value = { id: null, name: '' }
}

const openCreate = () => {
  showAddForm.value = true
  form.value = { id: null, name: '' }
}

onMounted(() => {
  fetchPointsOfSale()
  fetchAllUsers()
})
</script>

<style scoped>
.pos-layout {
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem);
}
@media (min-width: 1024px) {
  .pos-layout {
    height: calc(100vh - 5.5rem);
    height: calc(100dvh - 5.5rem);
    max-height: calc(100vh - 5.5rem);
    max-height: calc(100dvh - 5.5rem);
    overflow: hidden;
  }
}
</style>