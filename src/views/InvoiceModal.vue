<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex min-h-screen items-center justify-center p-4">
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="closeModal"></div>

      <div class="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl transition-all">
        <div class="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 class="text-xl font-bold text-slate-800">Facture</h2>
          <button
            @click="closeModal"
            class="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <FontAwesomeIcon icon="fa-solid fa-times" />
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto p-6">
          <div class="mb-6 text-center">
            <h3 class="text-2xl font-bold text-indigo-600">FACTURE</h3>
            <p class="mt-1 text-sm text-slate-500">N° {{ invoiceNumber }}</p>
            <p class="text-xs text-slate-400">{{ currentDate }}</p>
          </div>

          <div class="mb-6 rounded-lg bg-slate-50 p-4">
            <div class="flex justify-between">
              <div>
                <p class="text-xs font-semibold text-slate-500">CLIENT</p>
                <p class="font-medium text-slate-800">{{ clientName || 'Client particulier' }}</p>
              </div>
              <div class="text-right">
                <p class="text-xs font-semibold text-slate-500">MODE DE PAIEMENT</p>
                <p class="font-medium text-slate-800">{{ paymentMethod || 'Non spécifié' }}</p>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <table class="w-full">
              <thead class="border-b border-slate-200">
                <tr class="text-left text-xs font-semibold text-slate-500">
                  <th class="pb-2">ARTICLE</th>
                  <th class="pb-2 text-center">QTÉ</th>
                  <th class="pb-2 text-right">PRIX U.</th>
                  <th class="pb-2 text-right">TOTAL</th>
                 </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="(item, index) in items" :key="index" class="text-sm">
                  <td class="py-3 text-slate-800">{{ item.name }}</td>
                  <td class="py-3 text-center text-slate-600">{{ item.quantity }}</td>
                  <td class="py-3 text-right text-slate-600">{{ formatPrice(item.price) }}</td>
                  <td class="py-3 text-right font-semibold text-slate-800">
                    {{ formatPrice(item.price * item.quantity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Détail des paiements -->
          <div v-if="uniquePayments && uniquePayments.length > 0" class="mb-6 rounded-lg bg-indigo-50 p-4">
            <p class="mb-2 text-sm font-semibold text-indigo-800">Détail des paiements</p>
            <div class="space-y-2">
              <div
                v-for="(payment, index) in uniquePayments"
                :key="index"
                class="flex items-center justify-between text-sm border-b border-indigo-100 pb-2 last:border-0"
              >
                <div class="flex items-center gap-2">
                  <FontAwesomeIcon 
                    :icon="getPaymentIcon(payment.payment_method_name)" 
                    class="text-indigo-600" 
                  />
                  <div>
                    <span class="text-slate-700 font-medium">{{ payment.payment_method_name }}</span>
                    <div v-if="payment.reference" class="text-xs text-slate-500">
                      Réf: {{ payment.reference }}
                    </div>
                  </div>
                </div>
                <span class="font-semibold text-indigo-700">{{ formatPrice(payment.amount) }}</span>
              </div>
            </div>
            <div class="mt-3 pt-2 border-t border-indigo-200 flex justify-between text-sm font-semibold">
              <span class="text-indigo-800">Total payé</span>
              <span class="text-indigo-800">{{ formatPrice(totalPaymentsAmount) }}</span>
            </div>
          </div>

          <!-- Section trop-perçu / solde restant -->
          <div v-if="totalPaymentsAmount !== finalTotal" 
               :class="[
                 'mb-6 rounded-lg p-4',
                 totalPaymentsAmount > finalTotal ? 'bg-amber-50' : 'bg-red-50'
               ]"
          >
            <p class="mb-2 text-sm font-semibold" :class="totalPaymentsAmount > finalTotal ? 'text-amber-800' : 'text-red-800'">
              {{ totalPaymentsAmount > finalTotal ? '⚠️ Trop-perçu' : '❌ Solde restant' }}
            </p>
            
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-700">Total dû</span>
                <span class="font-semibold">{{ formatPrice(finalTotal) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-700">Total payé</span>
                <span class="font-semibold">{{ formatPrice(totalPaymentsAmount) }}</span>
              </div>
              <div class="flex justify-between text-base font-bold pt-2 border-t" 
                   :class="totalPaymentsAmount > finalTotal ? 'border-amber-200' : 'border-red-200'">
                <span>{{ totalPaymentsAmount > finalTotal ? '💰 Monnaie à rendre' : '💸 Reste à payer' }}</span>
                <span :class="totalPaymentsAmount > finalTotal ? 'text-green-600' : 'text-red-600'">
                  {{ formatPrice(Math.abs(totalPaymentsAmount - finalTotal)) }}
                </span>
              </div>
            </div>
          </div>

          <div class="border-t border-slate-200 pt-4">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600">Sous-total</span>
                <span class="text-slate-800">{{ formatPrice(total) }}</span>
              </div>
              <div v-if="discountPercentage > 0" class="flex justify-between text-sm">
                <span class="text-slate-600">Remise ({{ discountPercentage }}%)</span>
                <span class="text-red-600">-{{ formatPrice(discountAmount) }}</span>
              </div>
              <div class="flex justify-between text-lg font-bold">
                <span class="text-slate-800">TOTAL À PAYER</span>
                <span class="text-indigo-600">{{ formatPrice(finalTotal) }}</span>
              </div>
              
              <!-- Statut du paiement -->
              <div class="flex justify-between text-sm mt-2 pt-2 border-t border-slate-200" 
                   :class="totalPaymentsAmount >= finalTotal ? 'text-green-600' : 'text-red-500'">
                <span>Statut</span>
                <span class="font-semibold">
                  {{ totalPaymentsAmount >= finalTotal ? '✓ PAYÉ' : '⚠️ PAIEMENT PARTIEL' }}
                </span>
              </div>
            </div>
          </div>

          <div class="mt-6 text-center text-xs text-slate-400">
            <p>Merci de votre visite !</p>
            <p class="mt-1">Règlement effectué le {{ currentDateTime }}</p>
          </div>
        </div>

        <div class="flex gap-3 border-t border-slate-200 p-4">
          <button
            @click="printInvoice"
            class="flex-1 rounded-lg border border-indigo-200 bg-white px-4 py-2 font-semibold text-indigo-600 transition hover:bg-indigo-50"
          >
            <FontAwesomeIcon icon="fa-solid fa-print" class="mr-2" />
            Imprimer
          </button>
          <button
            @click="closeModal"
            class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimes, faPrint, faMoneyBillWave, faMobileAlt, faCreditCard, faFileInvoice } from '@fortawesome/free-solid-svg-icons'

library.add(faTimes, faPrint, faMoneyBillWave, faMobileAlt, faCreditCard, faFileInvoice)

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  items: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  clientName: {
    type: String,
    default: 'Client'
  },
  invoiceNumber: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: ''
  },
  payments: {
    type: Array,
    default: () => []
  },
  discountPercentage: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close-modal'])

// Icône selon le mode de paiement
const getPaymentIcon = (methodName) => {
  const name = methodName.toLowerCase()
  if (name.includes('espèce') || name.includes('cash')) return 'fa-solid fa-money-bill-wave'
  if (name.includes('orange') || name.includes('airtel') || name.includes('wave') || name.includes('mtn')) return 'fa-solid fa-mobile-alt'
  if (name.includes('carte')) return 'fa-solid fa-credit-card'
  if (name.includes('chèque')) return 'fa-solid fa-file-invoice'
  return 'fa-solid fa-money-bill-wave'
}

// Regrouper et fusionner les paiements par méthode
const uniquePayments = computed(() => {
  if (!props.payments?.length) return []
  
  const paymentMap = new Map()
  
  props.payments.forEach(payment => {
    const methodName = payment.payment_method_name || 'Paiement'
    const key = methodName
    
    if (paymentMap.has(key)) {
      const existing = paymentMap.get(key)
      existing.amount += Number(payment.amount || 0)
    } else {
      paymentMap.set(key, {
        amount: Number(payment.amount || 0),
        payment_method_name: methodName,
        reference: payment.reference || ''
      })
    }
  })
  
  return Array.from(paymentMap.values())
})

const totalPaymentsAmount = computed(() => {
  return uniquePayments.value.reduce((sum, p) => sum + p.amount, 0)
})

const discountAmount = computed(() => {
  return (props.total * props.discountPercentage) / 100
})

const finalTotal = computed(() => {
  return props.total - discountAmount.value
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const currentDateTime = computed(() => {
  return new Date().toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const formatPrice = (price) => {
  const value = Number.parseFloat(price)
  if (!Number.isFinite(value)) return '—'
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Ar`
}

const closeModal = () => {
  emit('close-modal')
}

const printInvoice = () => {
  window.print()
}
</script>

<style scoped>
@media print {
  .fixed {
    position: relative !important;
  }
  
  .fixed button {
    display: none !important;
  }
  
  .overflow-y-auto {
    overflow: visible !important;
    max-height: none !important;
  }
  
  .bg-black {
    background: none !important;
  }
  
  .shadow-xl {
    box-shadow: none !important;
  }
}
</style>