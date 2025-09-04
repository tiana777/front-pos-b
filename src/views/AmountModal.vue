<template>
  <div v-if="isOpen" class="modal is-active">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card">
      <header class="modal-header">
        <h2 class="modal-title">Fond de caisse</h2>
        <button class="modal-close" aria-label="Fermer" @click="closeModal">&times;</button>
      </header>
      <section class="modal-body">
        <div class="field">
          <label class="label">Montant du fond de caisse</label>
          <div class="control">
            <input class="input" type="number" v-model.number="amount" min="0" step="0.01" placeholder="Montant"
              @input="validateAmount" />
          </div>
          <p v-if="amountError" class="help is-danger">{{ amountError }}</p>
        </div>

        <div class="field">
          <label class="label">Numéro de ticket initial</label>
          <div class="control">
            <div class="select is-fullwidth">
              <select v-model.number="ticketNumber" @change="validateTicketNumber">
                <option value="">-- Sélectionnez un numéro --</option>
                <option v-for="num in ticketNumbers" :key="num" :value="num">
                  {{ num }}
                </option>
              </select>
            </div>
          </div>
          <p v-if="ticketError" class="help is-danger">{{ ticketError }}</p>
        </div>

        <div class="field">
          <label class="label">Note</label>
          <div class="control">
            <input class="input" type="text" v-model="note" maxlength="50" placeholder="Note (max 50 caractères)" />
          </div>
        </div>
      </section>
      <footer class="modal-footer">
        <button class="button button-success" :class="{ 'is-loading': isSending }" @click="sendAmount"
          :disabled="isSending || !!amountError || !!ticketError || amount === null || ticketNumber === ''">
          Envoyer
        </button>
        <button class="button button-cancel" @click="closeModal" :disabled="isSending">
          Annuler
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emits = defineEmits(['close', 'send'])

const ticketNumbers = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 7300]
const amount = ref(null)
const ticketNumber = ref('')
const note = ref('')
const amountError = ref('')
const ticketError = ref('')
const isSending = ref(false)

const validateAmount = () => {
  if (amount.value === null || amount.value === '') {
    amountError.value = 'Le montant est requis.'
  } else if (amount.value < 0) {
    amountError.value = 'Le montant doit être positif.'
  } else {
    amountError.value = ''
  }
}

const validateTicketNumber = () => {
  if (ticketNumber.value === '') {
    ticketError.value = 'Le numéro de ticket est requis.'
  } else if (ticketNumber.value < 1000) {
    ticketError.value = 'Le numéro doit être au moins 1000.'
  } else {
    ticketError.value = ''
  }
}

const sendAmount = () => {
  validateAmount()
  validateTicketNumber()
  if (amountError.value || ticketError.value) return

  isSending.value = true

  // Save to cache
  const data = {
    amount: amount.value,
    ticketNumber: ticketNumber.value,
    note: note.value
  }

  emits('send', data)

  setTimeout(() => {
    isSending.value = false
    emits('close')
  }, 1000)
}

const closeModal = () => {
  emits('close')
}





</script>

<style scoped>
.modal-card {
  max-width: 400px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.label {
  color: black !important;
}

.modal-header {
  padding: 1.5rem;
  background-color: #a83232;
  color: white;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: white;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  border-top: 1px solid #eee;
}

.button-success {
  background-color: #d32f2f;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.button-success.is-loading {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-cancel {
  background-color: #ccc;
  color: #333;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
}

.select.is-fullwidth {
  width: 100%;
}

.select select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}
</style>
