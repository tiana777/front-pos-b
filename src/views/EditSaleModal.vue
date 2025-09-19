<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <h2>Modifier la vente - Ticket {{ sale.ticket_number }}</h2>
      <form @submit.prevent="save">
        <div class="form-group">
          <label for="ticketNumber">Numéro de ticket</label>
          <input id="ticketNumber" type="number" min="0" step="1" v-model.number="editableSale.ticket_number" required />
        </div>
        <div class="form-group">
          <label for="status">Statut</label>
          <select id="status" v-model="editableSale.status" required>
            <option value="pending">En attente</option>
            <option value="completed">Terminée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
        <div class="order-lines-edit">
          <h3>Lignes de commande</h3>
          <div v-for="(line, index) in editableSale.order_lines" :key="line.id" class="order-line-edit">
            <div>
              <label>Produit:</label>
              <span>{{ line.product.name }}</span>
            </div>
            <div>
              <label>Quantité:</label>
              <input type="number" min="1" v-model.number="editableSale.order_lines[index].quantity" required />
            </div>
            <div>
              <label>Prix unitaire:</label>
              <input type="number" min="0" step="0.01" v-model.number="editableSale.order_lines[index].price"
                required />
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="submit">Enregistrer</button>
          <button type="button" @click="close">Annuler</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, defineEmits, defineProps } from 'vue'

const props = defineProps({
  sale: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['save', 'close'])

const editableSale = reactive(JSON.parse(JSON.stringify(props.sale)))

watch(() => props.sale, (newSale) => {
  Object.assign(editableSale, JSON.parse(JSON.stringify(newSale)))
})

const close = () => {
  emit('close')
}

const save = () => {
  console.log('Save method called with editableSale:', editableSale)
  // Calculate total for each order line
  editableSale.order_lines.forEach(line => {
    line.total = line.quantity * line.price
  })
  // Calculate total amount for sale
  editableSale.total_amount = editableSale.order_lines.reduce((sum, line) => sum + line.total, 0)
  emit('save', editableSale)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #444;
}

input[type="number"],
input[type="text"],
select {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input[type="number"]:focus,
input[type="text"]:focus,
select:focus {
  outline: none;
  border-color: #d32f2f;
  box-shadow: 0 0 8px rgba(211, 47, 47, 0.3);
}

.order-lines-edit {
  margin-top: 2rem;
  border-top: 2px solid #eee;
  padding-top: 1.5rem;
}

.order-line-edit {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
  align-items: center;
}

.order-line-edit>div {
  flex: 1;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  margin-top: 2rem;
}

button {
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: background-color 0.3s ease;
  box-shadow: 0 2px 6px rgba(211, 47, 47, 0.3);
}

button[type="submit"] {
  background-color: #d32f2f;
  color: white;
}

button[type="submit"]:hover {
  background-color: #b71c1c;
  box-shadow: 0 4px 12px rgba(183, 28, 28, 0.5);
}

button[type="button"] {
  background-color: #f0f0f0;
  color: #555;
  box-shadow: none;
}

button[type="button"]:hover {
  background-color: #ddd;
}
</style>
