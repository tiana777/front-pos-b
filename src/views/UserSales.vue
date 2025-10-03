<template>
  <div class="user-sales-layout grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
    <section class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h1 class="text-base font-semibold text-slate-800">Mes ventes</h1>
        <span class="text-xs font-semibold text-slate-400">{{ sales.length }} total</span>
      </div>

      <div class="mt-2.5 flex-1 overflow-hidden">
        <div
          v-if="loading"
          class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center text-sm text-slate-500"
        >
          <span class="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></span>
          <p class="mt-4 font-medium">Chargement des ventes...</p>
        </div>

        <template v-else>
          <div
            v-if="!sales.length"
            class="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-sm text-slate-500"
          >
            Aucune vente trouvée pour cette session
          </div>

          <div v-else class="flex h-full flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto">
              <table class="min-w-full divide-y divide-slate-100 text-sm">
                <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th class="px-4 py-3 text-left">Date</th>
                    <th class="px-4 py-3 text-left">Ticket</th>
                    <th class="px-4 py-3 text-left">Montant</th>
                    <th class="px-4 py-3 text-left">Statut</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="sale in sales"
                    :key="sale.id"
                    @click="selectSale(sale)"
                    :class="[
                      'cursor-pointer transition hover:bg-indigo-50/40',
                      selectedSale?.id === sale.id ? 'bg-indigo-50/60' : 'bg-white'
                    ]"
                  >
                    <td class="px-4 py-3 text-slate-600">{{ formatDate(sale.created_at) }}</td>
                    <td class="px-4 py-3 text-slate-600">{{ sale.ticket_number }}</td>
                    <td class="px-4 py-3 font-semibold text-slate-800">{{ formatPrice(sale.total_amount) }}</td>
                    <td class="px-4 py-3">
                      <span
                        :class="[
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                          sale.status === 'paid' || sale.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-slate-100 text-slate-500'
                        ]"
                      >
                        {{ sale.status || '—' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        type="button"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                        @click.stop="openEditModal(sale)"
                        aria-label="Modifier"
                      >
                        <FontAwesomeIcon icon="fa-solid fa-pen" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>
    </section>

    <aside class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="border-b border-slate-100 pb-2">
        <h2 class="text-base font-semibold text-slate-800">Détails</h2>
        <p class="text-xs text-slate-400">{{ selectedSale ? `Ticket ${selectedSale.ticket_number}` : 'Sélectionnez une vente' }}</p>
      </div>

      <div class="mt-2.5 flex-1 overflow-hidden">
        <div
          v-if="!selectedSale"
          class="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500"
        >
          <FontAwesomeIcon icon="fa-solid fa-receipt" class="mb-3 text-xl" />
          Choisissez une vente pour voir les détails.
        </div>

        <div v-else class="flex h-full flex-col overflow-hidden">
          <div class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600">
            <p class="flex items-center justify-between">
              <span class="font-semibold text-slate-800">Montant total</span>
              <span class="text-indigo-600">{{ formatPrice(selectedSale.total_amount) }}</span>
            </p>
            <p class="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Statut</span>
              <span class="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600">{{ selectedSale.status || '—' }}</span>
            </p>
          </div>

          <div class="mt-3 flex-1 overflow-hidden">
            <div class="flex h-full flex-col overflow-hidden">
              <div class="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 class="text-sm font-semibold text-slate-700">Articles</h3>
                <span class="text-xs text-slate-400">
                  {{ selectedSale.order_lines?.length || 0 }} ligne(s)
                </span>
              </div>

              <div v-if="selectedSale.order_lines?.length" class="flex-1 overflow-y-auto">
                <ul class="divide-y divide-slate-100">
                  <li
                    v-for="line in selectedSale.order_lines"
                    :key="line.id"
                    class="space-y-1 px-1 py-3"
                  >
                    <p class="text-sm font-semibold text-slate-800">{{ line.product?.name || 'Produit supprimé' }}</p>
                    <p class="text-xs text-slate-400">
                      {{ line.quantity }} × {{ formatPrice(line.price) }}
                    </p>
                    <p class="text-sm font-semibold text-indigo-600">
                      {{ formatPrice(line.total) }}
                    </p>
                  </li>
                </ul>
              </div>

              <div v-else class="flex flex-1 items-center justify-center text-xs text-slate-400">
                Aucun article pour cette vente
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>

  <EditSaleModal v-if="showEditModal" :sale="selectedSale" @save="saveSale" @close="closeEditModal" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import EditSaleModal from './EditSaleModal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const sales = ref([])
const loading = ref(true)
const selectedSale = ref(null)
const showEditModal = ref(false)

const selectSale = (sale) => {
  selectedSale.value = sale
}

const openEditModal = (sale) => {
  selectedSale.value = sale
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
}

const saveSale = async (updatedSale) => {
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://127.0.0.1:8000/api/sales/${updatedSale.id}`, updatedSale, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    const index = sales.value.findIndex((sale) => sale.id === updatedSale.id)
    if (index !== -1) {
      sales.value[index] = { ...updatedSale }
    }
    selectedSale.value = updatedSale
    showEditModal.value = false
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error.response?.data || error.message)
  }
}

const formatPrice = (price) => {
  const value = Number.parseFloat(price)
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar`
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

onMounted(async () => {
  loading.value = true
  const user = JSON.parse(localStorage.getItem('user'))
  const session = JSON.parse(localStorage.getItem('cashRegisterSession'))
  const token = localStorage.getItem('token')

  if (!user || !token) {
    loading.value = false
    return
  }

  try {
    const response = await axios.get('http://127.0.0.1:8000/api/sales/current-session', {
      params: {
        user_id: user.id,
        cash_register_session_id: session?.id,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    sales.value = response.data.data || response.data || []
    if (sales.value.length) {
      selectedSale.value = sales.value[0]
    }
  } catch (error) {
    console.error('Erreur lors du chargement des ventes:', error.response?.data || error.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.user-sales-layout {
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem);
}

@media (min-width: 1024px) {
  .user-sales-layout {
    height: calc(100vh - 5.5rem);
    height: calc(100dvh - 5.5rem);
    max-height: calc(100vh - 5.5rem);
    max-height: calc(100dvh - 5.5rem);
    overflow: hidden;
  }
}
</style>
