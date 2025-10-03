<template>
  <div v-if="isOpen" class="invoice-modal-overlay" @click.self="closeModal">
    <div class="invoice-modal">
      <div class="invoice-header">
        <div class="company-logo">
          <img :src="companyLogo || '/default-logo.png'" :alt="companyName || 'Logo de l\'entreprise'"
            class="logo-image" />
        </div>
        <div class="invoice-info">
          <h1>FACTURE</h1>
          <div class="invoice-meta">
            <p style="font-weight: bold; color: black;">N° Facture: {{ invoiceNumber || 'N/A' }}</p>
            <p style="font-weight: bold; color: black;">Date: {{ currentDate }}</p>
            <p style="font-weight: bold; color: black;">Client: {{ clientName || 'Client non spécifié' }}</p>
          </div>
        </div>
      </div>

      <div class="invoice-body">
        <table class="invoice-table">
          <thead>
            <tr>
              <th style="font-weight: bold; color: black;">Description</th>
              <th style="font-weight: bold; color: black;">Quantité</th>
              <th style="font-weight: bold; color: black;">Prix unitaire</th>
              <th style="font-weight: bold; color: black;">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td>{{ item.name }}</td>
              <td>{{ item.quantity }}</td>
              <td>{{ item.price }} Ar</td>
              <td>{{ item.quantity * item.price }} Ar</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="invoice-summary">
        <div class="summary-row">
          <span style="color: black;">Sous-total:</span>
          <span style="color: black;">{{ subtotal }} Ar</span>
        </div>
        <div class="summary-row total">
          <span style="color: black;">Total:</span>
          <span style="color: black;">{{ totalAmount }} Ar</span>
        </div>
      </div>

      <div class="invoice-footer">
        <button class="btn btn-primary" @click="openPaymentModal">Ouvrir Paiement</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InvoiceModal',
  props: {
    isOpen: {
      type: Boolean,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    },
    clientName: {
      type: String,
      default: 'Client non spécifié'
    },
    invoiceNumber: {
      type: [Number, String],
      default: 'N/A'
    },
    companyLogo: {
      type: String,
      default: '/default-logo.png'
    },
    companyName: {
      type: String,
      default: 'Votre entreprise'
    },

  },
  data() {
    return {
      currentDate: new Date().toLocaleDateString('fr-FR')
    };
  },
  computed: {
    subtotal() {
      if (!this.items || this.items.length === 0) {
        return '0.00';
      }
      const total = this.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
      return total.toFixed(2);
    },

    totalAmount() {
      const total = parseFloat(this.subtotal);
      return total;
    }
  },
  methods: {
    closeModal() {
      this.$emit('close-modal');
    },
    openPaymentModal() {
      this.$emit('openPaymentModal');

    }
  }
};
</script>

<style scoped>
.invoice-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.invoice-modal {
  background: white;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
}

.invoice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.company-logo {
  flex: 0 0 auto;
}

.logo-image {
  max-height: 100px;
  max-width: 200px;
  height: auto;
  width: auto;
  object-fit: contain;
}

.invoice-info {
  text-align: right;
}

.invoice-info h1 {
  margin: 0 0 1rem 0;
  color: #1a1a1a;
  font-size: 2.5rem;
}

.invoice-meta p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
}

.invoice-body {
  padding: 2rem;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table th,
.invoice-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.invoice-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.invoice-summary {
  padding: 1rem 2rem;
  text-align: right;
}

.summary-row {
  display: flex;
  justify-content: flex-end;
  margin: 0.5rem 0;
}

.summary-row span:first-child {
  margin-right: 2rem;
  font-weight: bold;
}

.summary-row.total {
  font-size: 1.2rem;
  font-weight: bold;
  border-top: 2px solid #333;
  padding-top: 0.5rem;
}

.invoice-footer {
  display: flex;
  justify-content: center;
  padding: 2rem;
  border-top: 1px solid #e0e0e0;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

@media print {
  .invoice-modal-overlay {
    background: none;
  }

  .invoice-modal {
    box-shadow: none;
    width: 100%;
    max-width: none;
    max-height: none;
    overflow: visible;
  }

  .invoice-footer {
    display: none;
  }
}

@media (max-width: 600px) {
  .invoice-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .invoice-info {
    text-align: center;
    margin-top: 1rem;
  }
}
</style>
