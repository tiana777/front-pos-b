<template>
  <div class="sales-layout grid gap-3 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
    <aside class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-semibold text-slate-800">Filtres</h2>
        <span class="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">{{ filteredSales.length }}</span>
      </div>

      <div class="mt-4 space-y-3 overflow-y-auto pb-1">
        <div>
          <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Recherche</label>
          <div class="relative mt-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Ticket, produit, date..."
              class="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Période</label>
          <select
            id="periodFilter"
            v-model="periodFilter"
            @change="applyPeriodFilter"
            class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Toutes</option>
            <option value="today">Aujourd'hui</option>
            <option value="thisWeek">Cette semaine</option>
            <option value="thisMonth">Ce mois</option>
          </select>
        </div>

        <div class="grid gap-2">
          <div>
            <label for="startDate" class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Date début</label>
            <input
              id="startDate"
              type="date"
              v-model="startDate"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label for="endDate" class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Date fin</label>
            <input
              id="endDate"
              type="date"
              v-model="endDate"
              class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
      </div>
    </aside>

    <section class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h1 class="text-base font-semibold text-slate-800">Ventes</h1>
        <span class="text-xs font-semibold text-slate-400">{{ filteredSales.length }} résultat(s)</span>
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
            v-if="filteredSales.length === 0"
            class="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-sm text-slate-500"
          >
            Aucune vente trouvée
          </div>

          <div v-else class="flex h-full flex-col overflow-hidden">
            <div class="flex-1 overflow-y-auto space-y-3 pr-1">
              <article
                v-for="(sale, index) in filteredSales"
                :key="sale?.id ?? sale?.ticket_number ?? sale?.created_at ?? index"
                class="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
              >
                <header class="flex flex-wrap items-center gap-3">
                  <div class="flex flex-col">
                    <p class="text-sm font-semibold text-slate-800">Ticket {{ sale.ticket_number || '—' }}</p>
                    <p class="text-xs text-slate-400">{{ formatDate(sale.created_at) }}</p>
                  </div>
                  <span class="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                    {{ formatPrice(sale.total_amount || 0) }}
                  </span>
                  <div class="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                      @click.stop="toggleSale(sale.id)"
                    >
                      <FontAwesomeIcon :icon="expandedSales.has(sale.id) ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'" />
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                      @click.stop="editSale(sale.id)"
                    >
                      <FontAwesomeIcon icon="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-rose-500 transition hover:border-rose-200 hover:text-rose-600"
                      @click.stop="deleteSale(sale.id)"
                    >
                      <FontAwesomeIcon icon="fa-solid fa-trash" />
                    </button>
                  </div>
                </header>

                <transition name="fade">
                  <div v-if="expandedSales.has(sale.id)" class="mt-3 rounded-2xl border border-slate-100 bg-white">
                    <table class="w-full text-sm">
                      <thead class="text-xs uppercase tracking-wide text-slate-400">
                        <tr class="border-b border-slate-100">
                          <th class="px-4 py-2 text-left">Produit</th>
                          <th class="px-4 py-2 text-left">Quantité</th>
                          <th class="px-4 py-2 text-left">Prix unitaire</th>
                          <th class="px-4 py-2 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="line in sale.order_lines"
                          :key="line.id"
                          class="border-b border-slate-100 last:border-none"
                        >
                          <td class="px-4 py-2 text-slate-600">{{ line.product?.name || 'N/A' }}</td>
                          <td class="px-4 py-2 text-slate-600">{{ line.quantity }}</td>
                          <td class="px-4 py-2 text-slate-600">{{ formatPrice(line.price) }}</td>
                          <td class="px-4 py-2 font-semibold text-slate-700">{{ formatPrice(line.total) }}</td>
                        </tr>
                        <tr>
                          <td colspan="3" class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Total
                          </td>
                          <td class="px-4 py-3 text-sm font-bold text-slate-800">
                            {{ formatPrice(totalLinesAmount(sale)) }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </transition>
              </article>
            </div>
          </div>
        </template>
      </div>
    </section>
  </div>

  <EditSaleModal v-if="isEditModalOpen" :sale="saleToEdit" @save="saveSale" @close="closeEditModal" />
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import EditSaleModal from './EditSaleModal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  embedded: { type: Boolean, default: false },
})

const sales = ref([])
const loading = ref(true)
const searchQuery = ref('')
const expandedSales = ref(new Set())

const periodFilter = ref('')
const startDate = ref('')
const endDate = ref('')

const isEditModalOpen = ref(false)
const saleToEdit = ref(null)

const openEditModal = (sale) => {
  saleToEdit.value = sale
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  saleToEdit.value = null
}

const saveSale = async (updatedSale) => {
  const index = sales.value.findIndex((s) => s.id === updatedSale.id)
  if (index !== -1) {
    sales.value[index] = updatedSale
  }
  try {
    const token = localStorage.getItem('token')
    await axios.put(`http://127.0.0.1:8000/api/sales/${updatedSale.id}`, updatedSale, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la vente:', error.response?.data || error.message)
  }
  closeEditModal()
}

const editSale = (saleId) => {
  const sale = sales.value.find((s) => s.id === saleId)
  if (sale) {
    openEditModal(sale)
  }
}

const applyPeriodFilter = () => {
  const now = new Date()
  if (periodFilter.value === 'today') {
    startDate.value = now.toISOString().slice(0, 10)
    endDate.value = now.toISOString().slice(0, 10)
  } else if (periodFilter.value === 'thisWeek') {
    const firstDayOfWeek = new Date(now)
    firstDayOfWeek.setDate(now.getDate() - now.getDay())
    startDate.value = firstDayOfWeek.toISOString().slice(0, 10)
    endDate.value = new Date().toISOString().slice(0, 10)
  } else if (periodFilter.value === 'thisMonth') {
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    startDate.value = firstDayOfMonth.toISOString().slice(0, 10)
    endDate.value = new Date().toISOString().slice(0, 10)
  } else {
    startDate.value = ''
    endDate.value = ''
  }
}

const filteredSales = computed(() => {
  let filtered = sales.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter((sale) => {
      if (!sale) return false

      const ticketValue = sale.ticket_number != null ? sale.ticket_number.toString() : ''
      const ticketMatch = ticketValue.toLowerCase().includes(query)

      const dateValue = formatDate(sale.created_at)
      const dateMatch = dateValue.toLowerCase().includes(query)

      const productMatch = sale.order_lines?.some((line) => {
        const name = typeof line?.product?.name === 'string' ? line.product.name : ''
        return name.toLowerCase().includes(query)
      })

      return ticketMatch || dateMatch || productMatch
    })
  }

  if (startDate.value) {
    filtered = filtered.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      const start = new Date(startDate.value)
      start.setHours(0, 0, 0, 0)
      return saleDate >= start
    })
  }

  if (endDate.value) {
    filtered = filtered.filter((sale) => {
      const saleDate = new Date(sale.created_at)
      const end = new Date(endDate.value)
      end.setHours(23, 59, 59, 999)
      return saleDate <= end
    })
  }

  return filtered.filter((sale) => sale && typeof sale === 'object')
})

const formatPrice = (price) => {
  const value = Number.parseFloat(price)
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Ar`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
}

const totalLinesAmount = (sale) => {
  if (!sale?.order_lines?.length) return 0
  return sale.order_lines.reduce((sum, line) => sum + (Number(line.total) || 0), 0)
}

const toggleSale = (saleId) => {
  if (expandedSales.value.has(saleId)) {
    expandedSales.value.delete(saleId)
  } else {
    expandedSales.value.add(saleId)
  }
  expandedSales.value = new Set(expandedSales.value)
}

const deleteSale = async (saleId) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
    return
  }
  try {
    const token = localStorage.getItem('token')
    await axios.delete(`http://127.0.0.1:8000/api/sales/${saleId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    sales.value = sales.value.filter((s) => s.id !== saleId)
  } catch (error) {
    console.error('Erreur lors de la suppression de la vente:', error.response?.data || error.message)
  }
}

onMounted(async () => {
  const user = JSON.parse(localStorage.getItem('user'))
  const session = JSON.parse(localStorage.getItem('cashRegisterSession'))
  const token = localStorage.getItem('token')

  if (!user?.point_of_sale_id || !token || !session) {
    console.error('Utilisateur non authentifié, point de vente ou session non défini')
    loading.value = false
    return
  }

  try {
    const response = await axios.get('http://127.0.0.1:8000/api/sales', {
      params: {
        user_id: user.id,
        cash_register_session_id: session.id,
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    sales.value = response.data.data || response.data
  } catch (error) {
    console.error('Erreur lors du chargement des ventes:', error.response?.data || error.message)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.sales-layout {
  min-height: calc(100vh - 5rem);
  min-height: calc(100dvh - 5rem);
}

@media (min-width: 1024px) {
  .sales-layout {
    height: calc(100vh - 5.5rem);
    height: calc(100dvh - 5.5rem);
    max-height: calc(100vh - 5.5rem);
    max-height: calc(100dvh - 5.5rem);
    overflow: hidden;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
