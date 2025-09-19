<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg max-w-2xl w-[90%] max-h-[90vh] overflow-y-auto shadow-xl font-sans text-gray-800">
      <div class="flex justify-between items-center p-8 border-b-2 border-gray-200">
        <div class="flex-shrink-0">
          <img
            :src="companyLogo || '/default-logo.png'"
            :alt="companyName || 'Logo de l\'entreprise'"
            class="max-h-[100px] max-w-[200px] h-auto w-auto object-contain"
          />
        </div>
        <div class="text-right">
          <h1 class="m-0 mb-4 text-gray-900 text-4xl font-bold">FACTURE</h1>
          <div>
            <p class="font-bold text-black my-1">N° Facture: {{ invoiceNumber || 'N/A' }}</p>
            <p class="font-bold text-black my-1">Date: {{ currentDate }}</p>
            <p class="font-bold text-black my-1">Client: {{ clientName || 'Client non spécifié' }}</p>
          </div>
        </div>
      </div>

      <div class="p-8">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="bg-gray-100 font-bold text-black p-3 text-left border-b">Description</th>
              <th class="bg-gray-100 font-bold text-black p-3 text-left border-b">Quantité</th>
              <th class="bg-gray-100 font-bold text-black p-3 text-left border-b">Prix unitaire</th>
              <th class="bg-gray-100 font-bold text-black p-3 text-left border-b">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td class="p-3 border-b">{{ item.name }}</td>
              <td class="p-3 border-b">{{ item.quantity }}</td>
              <td class="p-3 border-b">{{ item.price }} €</td>
              <td class="p-3 border-b">{{ (item.quantity * item.price).toFixed(2) }} €</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-8 pb-4 text-right">
        <div class="flex justify-end items-center my-2">
          <span class="font-bold text-black mr-8">Sous-total:</span>
          <span class="font-bold text-black">{{ subtotal }} €</span>
        </div>
        <div class="flex justify-end items-center text-lg font-bold border-t-2 border-gray-800 pt-2">
          <span class="font-bold text-black mr-8">Total:</span>
          <span class="font-bold text-black">{{ totalAmount }} €</span>
        </div>
      </div>

      <div class="flex justify-center p-8 border-t">
        <button
          class="px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          @click="openPaymentModal"
        >
          Ouvrir Paiement
        </button>
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
      return total.toFixed(2);
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
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.bg-black {
  background-color: black;
}

.bg-opacity-50 {
  --tw-bg-opacity: 0.5;
  background-color: rgb(0 0 0 / var(--tw-bg-opacity));
}

.flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}

.items-center {
  align-items: center;
}

.z-\[1000\] {
  z-index: 1000;
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
