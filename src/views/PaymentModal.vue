<template>
  <div v-if="isOpen" class="payment-overlay" @click.self="closeModal">
    <section class="payment-card">
      <header class="payment-header">
        <div class="title">
          <font-awesome-icon icon="fa-solid fa-credit-card" />
          <span>Mode de paiement</span>
        </div>
        <button type="button" class="icon ghost" @click="closeModal" aria-label="Fermer">
          <font-awesome-icon icon="fa-solid fa-xmark" />
        </button>
      </header>

      <section class="payment-body">
        <div class="amount-panel">
          <div class="amount-field">
            <label>Total initial</label>
            <div class="field-value muted">{{ formatPrice(totalAmount) }}</div>
          </div>

          <div class="amount-field">
            <label>Remise rapide</label>
            <div class="chip-group">
              <button
                v-for="option in discountOptions"
                :key="option"
                type="button"
                class="chip"
                :class="{ active: selectedDiscount === option }"
                @click="selectDiscount(option)"
              >
                {{ option }}%
              </button>
            </div>
          </div>

          <div class="amount-field">
            <label>Total après remise</label>
            <div class="field-value highlight">{{ formatPrice(discountedTotal) }}</div>
          </div>

          <!-- Section pour le paiement en tranches -->
          <div class="amount-field installment-section">
            <div class="installment-header">
              <label>Paiement en tranches</label>
              <button 
                type="button" 
                class="toggle-installment"
                :class="{ active: isInstallmentActive }"
                @click="toggleInstallment"
              >
                <font-awesome-icon :icon="isInstallmentActive ? 'fa-solid fa-toggle-on' : 'fa-solid fa-toggle-off'" />
                {{ isInstallmentActive ? 'Activé' : 'Désactivé' }}
              </button>
            </div>
            
            <div v-if="isInstallmentActive" class="installment-controls">
              <div class="installment-input-group">
                <label>Montant à payer maintenant</label>
                <input
                  type="text"
                  v-model="installmentAmount"
                  @input="validateInstallmentAmount"
                  placeholder="0"
                  class="installment-amount-input"
                  ref="installmentAmountInput"
                  readonly
                />
              </div>

              <div class="installment-details" v-if="installmentAmount > 0">
                <div class="installment-item first-payment">
                  <span>Paiement immédiat</span>
                  <strong>{{ formatPrice(installmentAmountValue) }}</strong>
                </div>
                <div v-if="installmentAmountValue < discountedTotal" class="installment-item remaining-payments">
                  <span>Reste à payer</span>
                  <strong>{{ formatPrice(remainingBalance) }}</strong>
                </div>
                <div class="installment-total">
                  <span>Total à payer</span>
                  <strong>{{ formatPrice(discountedTotal) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Champs spécifiques selon le mode de paiement (toujours visibles quand mode tranche désactivé) -->
        <template v-if="!isInstallmentActive">
          <div class="details-grid full-row" v-if="selectedPayment === 'TPE'">
            <label>Référence TPE</label>
            <input
              type="text"
              v-model="cardNumber"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              ref="cardNumberInput"
            />
          </div>

          <div class="details-grid" v-if="selectedPayment === 'Espèce'">
            <label>Montant reçu</label>
            <input
              type="text"
              v-model="amountReceived"
              @input="calculateChange"
              placeholder="0"
              ref="amountReceivedInput"
            />
          </div>

          <div class="details-grid" v-if="isMobilePayment">
            <label>Numéro de téléphone</label>
            <input
              type="tel"
              v-model="phoneNumber"
              placeholder="034 12 345 67"
              ref="phoneInput"
            />
          </div>

          <div class="details-grid" v-if="selectedPayment && !isMobilePayment">
            <label>Monnaie à rendre</label>
            <div class="field-value" :class="{ positive: changeAmount >= 0, negative: changeAmount < 0 }">
              {{ formatPrice(Math.abs(changeAmount)) }}
            </div>
          </div>
        </template>

        <!-- Mode de paiement préféré pour les tranches (visible seulement quand mode tranche activé) -->
        <div class="preferred-payment-section" v-if="isInstallmentActive">
          <label>Mode de paiement préféré pour les tranches</label>
          <div class="preferred-payment-buttons">
            <button
              v-for="payment in payments"
              :key="payment.name"
              type="button"
              class="preferred-payment-btn"
              :class="{ active: preferredPaymentMethod === payment.name }"
              @click="selectPreferredPaymentMethod(payment.name)"
            >
              <font-awesome-icon :icon="getPaymentIcon(payment.name)" />
              <span>{{ payment.name }}</span>
            </button>
          </div>
        </div>

        <!-- Section des méthodes de paiement (TOUJOURS visible) -->
        <div class="payment-layout">
          <div class="methods">
            <button
              v-for="payment in payments"
              :key="payment.name"
              type="button"
              class="method"
              :class="{ active: selectedPayment === payment.name }"
              @click="selectPaymentMethod(payment.name)"
            >
              <font-awesome-icon :icon="getPaymentIcon(payment.name)" />
              <span>{{ payment.name }}</span>
              <font-awesome-icon
                v-if="selectedPayment === payment.name"
                icon="fa-solid fa-check-circle"
                class="check"
              />
            </button>
          </div>

          <!-- Clavier adapté selon le contexte -->
          <div class="keypad">
            <template v-if="isInstallmentActive">
              <!-- Clavier pour le montant de l'acompte -->
              <button class="keypad-button active" @click="appendToInstallmentAmount('7')">7</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('8')">8</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('9')">9</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('4')">4</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('5')">5</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('6')">6</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('1')">1</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('2')">2</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('3')">3</button>
              <button class="keypad-button active" @click="appendToInstallmentAmount('0')">0</button>
              <button class="keypad-button" disabled>•</button>
              <button class="keypad-button danger" @click="clearInstallmentAmount">
                <font-awesome-icon icon="fa-solid fa-delete-left" />
              </button>
            </template>
            <template v-else>
              <!-- Clavier standard pour les paiements -->
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('7')">7</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('8')">8</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('9')">9</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('4')">4</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('5')">5</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('6')">6</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('1')">1</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('2')">2</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('3')">3</button>
              <button :class="keypadButtonClass(isCashPadLocked)" :disabled="isCashPadLocked" @click="appendToField('0')">0</button>
              <button
                v-if="isMobilePayment"
                class="keypad-button"
                @click="appendToField(' ')">
                Espace
              </button>
              <button v-else class="keypad-button" disabled>•</button>
              <button class="keypad-button danger" @click="clearField">
                <font-awesome-icon icon="fa-solid fa-delete-left" />
              </button>
            </template>
          </div>
        </div>

        <!-- Message pour le mode tranche -->
        <div v-if="isInstallmentActive && installmentAmountValue > 0" class="installment-message">
          <font-awesome-icon icon="fa-solid fa-info-circle" />
          <span>Paiement immédiat de {{ formatPrice(installmentAmountValue) }} avec {{ selectedPayment || 'mode de paiement à sélectionner' }}</span>
        </div>
      </section>

      <footer class="payment-footer">
        <button type="button" class="ghost" @click="closeModal">
          <font-awesome-icon icon="fa-solid fa-xmark" />
          Annuler
        </button>
        <button
          type="button"
          class="primary"
          :disabled="!isPaymentValid"
          @click="confirmPayment"
        >
          <font-awesome-icon icon="fa-solid fa-check" />
          {{ isInstallmentActive ? 'Confirmer l\'acompte' : 'Confirmer le paiement' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, nextTick } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faCreditCard,
  faCheckCircle,
  faXmark,
  faCheck,
  faMoneyBillWave,
  faHandHoldingDollar,
  faMobileScreen,
  faCashRegister,
  faDeleteLeft,
  faCircle,
  faToggleOn,
  faToggleOff,
  faMinus,
  faPlus,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons'

library.add(faCreditCard, faCheckCircle, faXmark, faCheck, faMoneyBillWave, faHandHoldingDollar, faMobileScreen, faCashRegister, faDeleteLeft, faCircle, faToggleOn, faToggleOff, faMinus, faPlus, faInfoCircle)

const props = defineProps({
  isOpen: Boolean,
  totalAmount: {
    type: Number,
    default: 0,
    validator: value => !Number.isNaN(value)
  }
})

const emits = defineEmits(['close-modal', 'confirm-payment'])

const payments = ref([
  { name: 'Espèce', icon: 'fa-solid fa-hand-holding-dollar' },
  { name: 'TPE', icon: 'fa-solid fa-credit-card' },
  { name: 'Orange Money', icon: 'fa-solid fa-mobile-screen' },
  { name: 'MVola', icon: 'fa-solid fa-mobile-screen' },
  { name: 'Airtel Money', icon: 'fa-solid fa-mobile-screen' }
])

const amountReceivedInput = ref(null)
const cardNumberInput = ref(null)
const phoneInput = ref(null)
const installmentAmountInput = ref(null)
const selectedPayment = ref('')
const amountReceived = ref('')
const changeAmount = ref(0)
const phoneNumber = ref('')
const cardNumber = ref('')
const isProcessing = ref(false)
const mobilePayments = ['Orange Money', 'MVola', 'Airtel Money']
const discountOptions = [0, 50, 100]
const selectedDiscount = ref(0)

// Variables pour le paiement en tranches
const isInstallmentActive = ref(false)
const installmentAmount = ref('')
const preferredPaymentMethod = ref('')

const isMobilePayment = computed(() => mobilePayments.includes(selectedPayment.value))
const isValidPhoneNumber = computed(() => {
  if (!isMobilePayment.value) return true
  return phoneNumber.value.replace(/\D/g, '').length >= 10
})

const discountedTotal = computed(() => {
  const base = Math.round(props.totalAmount || 0)
  const discount = Math.max(0, Math.min(100, selectedDiscount.value))
  return Math.round(base * (100 - discount) / 100)
})

// Computed pour le montant de l'acompte
const installmentAmountValue = computed(() => {
  return parseInt(installmentAmount.value, 10) || 0
})

const remainingBalance = computed(() => {
  return Math.max(0, discountedTotal.value - installmentAmountValue.value)
})

const isPaymentValid = computed(() => {
  if (isInstallmentActive.value) {
    // En mode acompte : besoin du mode de paiement préféré ET du montant valide
    return selectedPayment.value && 
           installmentAmountValue.value > 0 && 
           installmentAmountValue.value <= discountedTotal.value
  }
  
  // Mode paiement normal
  if (!selectedPayment.value) return false
  if (selectedPayment.value === 'TPE') return cardNumber.value.replace(/\D/g, '').length === 16
  if (isMobilePayment.value) return isValidPhoneNumber.value
  if (selectedPayment.value === 'Espèce') return (parseInt(amountReceived.value, 10) || 0) >= discountedTotal.value
  return true
})

const isCashPadLocked = computed(() => {
  if (selectedPayment.value !== 'Espèce') return false
  return (parseInt(amountReceived.value, 10) || 0) >= discountedTotal.value && discountedTotal.value > 0
})

const formatPrice = (price) => {
  const amount = Math.round(Number(price) || 0)
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} Ar`
}

// Méthodes pour le paiement en tranches
const toggleInstallment = () => {
  isInstallmentActive.value = !isInstallmentActive.value
  if (!isInstallmentActive.value) {
    installmentAmount.value = ''
  } else {
    nextTick(() => {
      installmentAmountInput.value?.focus()
    })
  }
}

const validateInstallmentAmount = () => {
  // Nettoie le montant pour ne garder que les chiffres
  installmentAmount.value = installmentAmount.value.replace(/[^0-9]/g, '')
  
  // Vérifie que le montant ne dépasse pas le total
  const amount = parseInt(installmentAmount.value, 10) || 0
  if (amount > discountedTotal.value) {
    installmentAmount.value = discountedTotal.value.toString()
  }
}

const appendToInstallmentAmount = (value) => {
  if (value === ' ') return
  const current = installmentAmount.value === '0' ? '' : installmentAmount.value
  const newValue = current + value
  const amount = parseInt(newValue, 10) || 0
  
  if (amount <= discountedTotal.value) {
    installmentAmount.value = newValue
  } else {
    // Si le montant dépasse, on met le maximum
    installmentAmount.value = discountedTotal.value.toString()
  }
}

const clearInstallmentAmount = () => {
  installmentAmount.value = installmentAmount.value.slice(0, -1)
}

const selectPreferredPaymentMethod = (method) => {
  preferredPaymentMethod.value = method
}

const selectPaymentMethod = (method) => {
  selectedPayment.value = method
  nextTick(() => {
    if (method === 'TPE') cardNumberInput.value?.focus()
    else if (isMobilePayment.value) phoneInput.value?.focus()
    else if (method === 'Espèce') amountReceivedInput.value?.focus()
  })
}

const appendToField = (value) => {
  if (selectedPayment.value === 'TPE') {
    const current = cardNumber.value.replace(/\D/g, '')
    if (current.length >= 16 && value !== ' ') return
    const newValue = current + (value === ' ' ? '' : value)
    cardNumber.value = newValue.match(/.{1,4}/g)?.join(' ').slice(0, 19) || ''
  } else if (isMobilePayment.value) {
    const current = phoneNumber.value.replace(/\D/g, '')
    if (current.length >= 10 && value !== ' ') return
    phoneNumber.value = (current + value)
      .replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4')
      .slice(0, 14)
  } else if (selectedPayment.value === 'Espèce') {
    if (value === ' ') return
    const newValue = amountReceived.value === '0' ? value : amountReceived.value + value
    amountReceived.value = newValue.replace(/[^0-9]/g, '')
    calculateChange()
  }
}

const clearField = () => {
  if (selectedPayment.value === 'TPE') {
    const current = cardNumber.value.replace(/\D/g, '').slice(0, -1)
    cardNumber.value = current.match(/.{1,4}/g)?.join(' ') || ''
  } else if (isMobilePayment.value) {
    phoneNumber.value = phoneNumber.value.slice(0, -1).trim()
  } else if (selectedPayment.value === 'Espèce') {
    amountReceived.value = amountReceived.value.slice(0, -1) || '0'
    calculateChange()
  }
}

const calculateChange = () => {
  const received = parseInt(amountReceived.value, 10) || 0
  changeAmount.value = received - discountedTotal.value
}

const selectDiscount = (value) => {
  selectedDiscount.value = value
  if (selectedPayment.value === 'Espèce') calculateChange()
  
  // Ajuste le montant de l'acompte si nécessaire
  if (isInstallmentActive.value && installmentAmountValue.value > discountedTotal.value) {
    installmentAmount.value = discountedTotal.value.toString()
  }
}

const getPaymentIcon = (paymentName) => payments.value.find(p => p.name === paymentName)?.icon || 'fa-solid fa-credit-card'

const keypadButtonClass = (disabled) => [
  'keypad-button',
  disabled ? 'disabled' : 'active'
]

const closeModal = () => {
  selectedPayment.value = ''
  amountReceived.value = ''
  changeAmount.value = 0
  phoneNumber.value = ''
  cardNumber.value = ''
  selectedDiscount.value = 0
  isProcessing.value = false
  isInstallmentActive.value = false
  installmentAmount.value = ''
  preferredPaymentMethod.value = ''
  emits('close-modal')
}

const confirmPayment = () => {
  isProcessing.value = true
  
  let paymentData
  
  if (isInstallmentActive.value) {
    paymentData = {
      type: 'installment',
      total: props.totalAmount,
      discount_percentage: selectedDiscount.value,
      final_total: discountedTotal.value,
      immediate_payment: installmentAmountValue.value,
      remaining_balance: remainingBalance.value,
      payment_method: selectedPayment.value, // Mode de paiement pour l'acompte
      preferred_payment_method: preferredPaymentMethod.value || selectedPayment.value // Mode préféré pour les futures tranches
    }
  } else {
    paymentData = {
      type: 'full',
      method: selectedPayment.value,
      total: props.totalAmount,
      discount_percentage: selectedDiscount.value,
      final_total: discountedTotal.value,
      reference: selectedPayment.value === 'TPE' ? cardNumber.value : null,
      phone: isMobilePayment.value ? phoneNumber.value : null,
      received: selectedPayment.value === 'Espèce' ? (parseInt(amountReceived.value, 10) || 0) : null,
      change: parseInt(changeAmount.value, 10) || 0
    }
  }
  
  emits('confirm-payment', paymentData)
  isProcessing.value = false
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    amountReceived.value = ''
    phoneNumber.value = ''
    cardNumber.value = ''
    selectedDiscount.value = 0
    isInstallmentActive.value = false
    installmentAmount.value = ''
    preferredPaymentMethod.value = ''
  }
})

watch(discountedTotal, (newTotal) => {
  if (isInstallmentActive.value && installmentAmountValue.value > newTotal) {
    installmentAmount.value = newTotal.toString()
  }
})
</script>

<style scoped>
/* Tous les styles restent identiques */
.payment-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
  z-index: 1100;
}

.payment-card {
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  background: #fff;
  border-radius: 1.5rem;
  box-shadow: 0 35px 70px rgba(15, 23, 42, 0.22);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.payment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(140deg, #eef2ff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}

.payment-header .title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 700;
  color: #1e293b;
  font-size: 1.1rem;
}

.payment-header .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.payment-header .icon.ghost {
  background: rgba(148, 163, 184, 0.18);
  color: #475569;
}

.payment-header .icon.ghost:hover {
  background: rgba(148, 163, 184, 0.28);
}

.payment-body {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  background: rgba(248, 250, 252, 0.9);
  flex: 1;
  overflow-y: auto;
}

.amount-panel {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
}

.amount-field {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.amount-field label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  color: #64748b;
}

.field-value {
  border-radius: 1rem;
  padding: 0.8rem 1rem;
  font-weight: 700;
  color: #1e293b;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.7);
}

.field-value.muted {
  background: rgba(248, 250, 252, 0.9);
}

.field-value.highlight {
  background: rgba(129, 140, 248, 0.12);
  color: #4338ca;
}

.field-value.positive {
  color: #16a34a;
}

.field-value.negative {
  color: #dc2626;
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  border: none;
  border-radius: 9999px;
  padding: 0.45rem 0.9rem;
  font-weight: 600;
  background: rgba(148, 163, 184, 0.16);
  color: #475569;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.chip:hover {
  transform: translateY(-1px);
  background: rgba(148, 163, 184, 0.24);
}

.chip.active {
  background: rgba(79, 70, 229, 0.9);
  color: #fff;
  box-shadow: 0 12px 25px rgba(79, 70, 229, 0.28);
}

.installment-section {
  grid-column: 1 / -1;
  background: #f8fafc;
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.installment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.toggle-installment {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-installment:hover {
  background: #f1f5f9;
}

.toggle-installment.active {
  background: #818cf8;
  color: white;
  border-color: #818cf8;
}

.toggle-installment.active:hover {
  background: #6366f1;
}

.installment-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.installment-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.installment-input-group label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.installment-amount-input {
  border-radius: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #1f2937;
  outline: none;
  transition: border 0.2s ease, box-shadow 0.2s ease;
  font-size: 1.1rem;
  cursor: pointer;
  background-color: #f9fafb;
}

.installment-amount-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
  background-color: #fff;
}

.installment-amount-input[readonly] {
  background-color: #f9fafb;
  cursor: pointer;
}

.installment-details {
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
}

.installment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px dashed #e2e8f0;
}

.installment-item:last-child {
  border-bottom: none;
}

.installment-item.first-payment {
  color: #059669;
}

.installment-item.remaining-payments {
  color: #7c3aed;
}

.installment-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0 0 0;
  margin-top: 0.5rem;
  border-top: 2px solid #e2e8f0;
  font-weight: 700;
  color: #1f2937;
}

.details-grid {
  width: 100%;
  display: grid;
  gap: 0.6rem;
}

.amounts-row {
  align-items: end;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr);
}

.details-grid label {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.details-grid input {
  border-radius: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: #fff;
  padding: 0.75rem 1rem;
  font-weight: 600;
  color: #1f2937;
  outline: none;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.details-grid input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.18);
}

.preferred-payment-section {
  padding: 1rem;
  background: #f1f5f9;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
}

.preferred-payment-section label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.preferred-payment-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.preferred-payment-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e2e8f0;
  background: white;
  color: #475569;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preferred-payment-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: #f8fafc;
}

.preferred-payment-btn.active {
  background: #818cf8;
  color: white;
  border-color: #818cf8;
}

.preferred-payment-btn.active:hover {
  background: #6366f1;
}

.payment-layout {
  display: grid;
  gap: 1.5rem;
  border-radius: 1.25rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid rgba(226, 232, 240, 0.7);
}

@media (min-width: 900px) {
  .payment-layout {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    align-items: stretch;
  }

  .details-grid.full-row {
    grid-column: 1 / -1;
  }
}

.methods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.method {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.9rem 0.6rem;
  border-radius: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.7);
  background: rgba(248, 250, 252, 0.7);
  color: #475569;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.method:hover {
  transform: translateY(-1px);
  box-shadow: 0 15px 35px rgba(79, 70, 229, 0.15);
}

.method.active {
  background: rgba(79, 70, 229, 0.95);
  color: #fff;
  border-color: transparent;
  box-shadow: 0 20px 45px rgba(79, 70, 229, 0.28);
}

.method .check {
  position: absolute;
  top: 0.45rem;
  right: 0.55rem;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(3, minmax(70px, 1fr));
  grid-auto-rows: minmax(72px, 1fr);
  gap: 0.6rem;
  max-width: 320px;
  margin: 0 auto;
  height: 100%;
}

.keypad-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.85rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.8);
  font-weight: 700;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
  min-height: 72px;
}

@media (min-width: 900px) {
  .keypad { height: 100%; align-content: stretch; }
  .keypad-button { height: 100%; }
}

.keypad-button.active:hover {
  transform: translateY(-1px);
  background: rgba(226, 232, 240, 0.9);
}

.keypad-button.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.keypad-button.danger {
  background: rgba(248, 113, 113, 0.16);
  color: #dc2626;
  border-color: rgba(248, 113, 113, 0.3);
}

.installment-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #dbeafe;
  border-radius: 1rem;
  color: #1e40af;
  font-weight: 600;
  border: 1px solid #bfdbfe;
}

.installment-message svg {
  font-size: 1.25rem;
}

.payment-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 2rem;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  background: #fff;
}

.payment-footer button {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 9999px;
  padding: 0.75rem 1.6rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.payment-footer .ghost {
  background: rgba(148, 163, 184, 0.2);
  color: #475569;
}

.payment-footer .ghost:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 25px rgba(148, 163, 184, 0.2);
}

.payment-footer .primary {
  background: rgba(79, 70, 229, 0.95);
  color: #fff;
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.3);
}

.payment-footer .primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.payment-footer .primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 50px rgba(79, 70, 229, 0.35);
}

@media (max-width: 768px) {
  .payment-card {
    border-radius: 1rem;
  }

  .payment-header {
    padding: 1rem 1.5rem;
  }

  .payment-body {
    padding: 1.5rem;
  }

  .amount-panel {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .payment-layout {
    flex-direction: column;
    padding: 1rem;
  }

  .keypad {
    max-width: none;
  }
  
  .preferred-payment-buttons {
    grid-template-columns: repeat(2, 1fr);
  }

  .payment-footer {
    padding: 1rem 1.5rem;
    flex-direction: column-reverse;
  }

  .payment-footer button {
    width: 100%;
    justify-content: center;
  }
}
</style>