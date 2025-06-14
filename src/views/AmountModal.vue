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
          <label class="label">Montant</label>
          <div class="control">
            <input class="input" type="number" v-model.number="amount" min="0" step="0.01"
              placeholder="Entrez le montant du fond de caisse" @input="validateAmount" />
          </div>
          <p v-if="amountError" class="help is-danger">{{ amountError }}</p>
        </div>
        <div class="field">
          <label class="label">Note</label>
          <div class="control">
            <input class="input" type="text" v-model="note" placeholder="Entrez une note (optionnel)" />
          </div>
        </div>
      </section>
      <footer class="modal-footer">
        <button class="button button-success" :class="{ 'is-loading': isSending }" @click="sendAmount"
          :disabled="isSending || !!amountError || amount === null">
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
import { ref, watch } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emits = defineEmits(['close', 'send'])

const amount = ref(null)
const note = ref('')
const amountError = ref('')
const isSending = ref(false)

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      amount.value = null
      note.value = ''
      amountError.value = ''
      isSending.value = false
    }
  }
)

const validateAmount = () => {
  if (amount.value === null || amount.value === '') {
    amountError.value = 'Le montant est requis.'
  } else if (amount.value < 0) {
    amountError.value = 'Le montant doit être positif.'
  } else {
    amountError.value = ''
  }
}

const sendAmount = () => {
  validateAmount()
  if (amountError.value) return
  isSending.value = true
  emits('send', { amount: amount.value, note: note.value })
  // Simulate async operation, then close modal
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
</style>
