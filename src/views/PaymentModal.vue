<template>
    <div v-if="isOpen" class="modal is-active">
        <div class="modal-background" @click="closeModal"></div>
        <div class="modal-card">
            <header class="modal-card-head has-background-black">
                <p class="modal-card-title has-text-white">
                    <font-awesome-icon icon="fa-solid fa-credit-card" class="mr-2" />
                    Mode de paiement
                </p>
                <button class="delete" aria-label="close" @click="closeModal"></button>
            </header>

            <section class="modal-card-body">
                <!-- Montant total -->
                <div class="field mb-3">
                    <label class="label has-text-weight-bold">Total à payer</label>
                    <div class="control has-icons-right">
                        <input class="input is-large has-text-weight-bold" :value="formatPrice(totalAmount)" readonly
                            disabled>
                        <span class="icon is-right is-large">
                            <span class="has-text-weight-bold">Ar</span>
                        </span>
                    </div>
                </div>

                <!-- Référence TPE -->
                <div class="field mb-5" v-if="selectedPayment === 'TPE'">
                    <label class="label has-text-weight-bold">Référence</label>
                    <div class="control">
                        <input class="input is-large" v-model="cardNumber" placeholder="1234 5678 9012 3456" type="text"
                            maxlength="19" ref="cardNumberInput">
                    </div>
                </div>

                <!-- Montant reçu -->
                <div class="field mb-5" v-if="selectedPayment === 'Espèce'">
                    <label class="label has-text-weight-bold">Montant reçu</label>
                    <div class="control has-icons-right">
                        <input class="input is-large has-text-weight-bold" v-model="amountReceived"
                            @input="calculateChange" placeholder="0.00" ref="amountReceivedInput">
                        <span class="icon is-right is-large">
                            <span class="has-text-weight-bold">Ar</span>
                        </span>
                    </div>
                </div>

                <!-- Numéro mobile -->
                <div class="field mb-5" v-if="isMobilePayment">
                    <label class="label has-text-weight-bold">Numéro de téléphone</label>
                    <div class="control">
                        <input class="input is-large" v-model="phoneNumber" placeholder="034 12 345 67" type="tel"
                            ref="phoneInput">
                    </div>
                </div>

                <!-- Monnaie à rendre -->
                <div class="field mb-5" v-if="!isMobilePayment">
                    <label class="label has-text-weight-bold">Monnaie à rendre</label>
                    <div class="control">
                        <input class="input is-large has-text-weight-bold"
                            :class="changeAmount >= 0 ? 'has-text-success' : 'has-text-danger'"
                            :value="formatPrice(Math.abs(changeAmount))" readonly>
                    </div>
                </div>

                <!-- Options de paiement et pavé numérique -->
                <div class="payment-container">
                    <div class="payment-options">
                        <div v-for="(payment, index) in payments" :key="index" class="payment-option"
                            :class="{ 'is-active': selectedPayment === payment.name }"
                            @click="selectPaymentMethod(payment.name)">
                            <div class="payment-icon">
                                <font-awesome-icon :icon="getPaymentIcon(payment.name)" />
                            </div>
                            <div class="payment-name">{{ payment.name }}</div>
                            <div v-if="selectedPayment === payment.name" class="payment-check">
                                <font-awesome-icon icon="fa-solid fa-check-circle" />
                            </div>
                        </div>
                    </div>

                    <div class="numeric-keypad" :class="{ 'is-mobile-payment': isMobilePayment }">
                        <div class="keypad-row">
                            <button class="keypad-button" @click="appendToField('7')">7</button>
                            <button class="keypad-button" @click="appendToField('8')">8</button>
                            <button class="keypad-button" @click="appendToField('9')">9</button>
                        </div>
                        <div class="keypad-row">
                            <button class="keypad-button" @click="appendToField('4')">4</button>
                            <button class="keypad-button" @click="appendToField('5')">5</button>
                            <button class="keypad-button" @click="appendToField('6')">6</button>
                        </div>
                        <div class="keypad-row">
                            <button class="keypad-button" @click="appendToField('1')">1</button>
                            <button class="keypad-button" @click="appendToField('2')">2</button>
                            <button class="keypad-button" @click="appendToField('3')">3</button>
                        </div>
                        <div class="keypad-row">
                            <button class="keypad-button" @click="appendToField('0')">0</button>
                            <button class="keypad-button" @click="appendToField(' ')"
                                v-if="isMobilePayment">Espace</button>
                            <button class="keypad-button" @click="appendDecimal()" v-else>
                                <font-awesome-icon icon="fa-solid fa-circle" />
                            </button>
                        </div>
                        <div class="keypad-row">
                            <button class="keypad-button is-danger" @click="clearField">
                                <font-awesome-icon icon="fa-solid fa-delete-left" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer class="modal-card-foot is-flex is-justify-content-space-between">
                <button class="button is-light" @click="closeModal">
                    <font-awesome-icon icon="fa-solid fa-times" class="mr-2" />
                    Annuler
                </button>
                <button class="button is-danger is-focused" :disabled="!isPaymentValid" @click="confirmPayment"
                    :class="{ 'is-loading': isProcessing }">
                    <font-awesome-icon icon="fa-solid fa-check" class="mr-2" />
                    Confirmer le paiement
                </button>
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits, watch, nextTick } from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
    faCreditCard,
    faCheckCircle,
    faTimes,
    faCheck,
    faMoneyBillWave,
    faMobileScreen,
    faCashRegister,
    faDeleteLeft,
    faCircle
} from '@fortawesome/free-solid-svg-icons';

// Ajout des icônes à la bibliothèque
library.add(
    faCreditCard,
    faCheckCircle,
    faTimes,
    faCheck,
    faMoneyBillWave,
    faMobileScreen,
    faCashRegister,
    faDeleteLeft,
    faCircle
);


const props = defineProps({
    isOpen: Boolean,
    totalAmount: {
        type: Number,
        default: 0,
        validator: value => !isNaN(value)
    }
});

const emits = defineEmits(['close-modal', 'confirm-payment']);

// Références
const payments = ref([
    { name: 'TPE', icon: 'fa-solid fa-credit-card' },
    { name: 'Orange Money', icon: 'fa-solid fa-mobile-screen' },
    { name: 'MVola', icon: 'fa-solid fa-mobile-screen' },
    { name: 'Espèce', icon: 'fa-solid fa-money-bill-wave' },
    { name: 'Airtel Money', icon: 'fa-solid fa-mobile-screen' }
]);

const amountReceivedInput = ref(null);
const cardNumberInput = ref(null);
const phoneInput = ref(null);
const selectedPayment = ref('');
const amountReceived = ref('0');
const changeAmount = ref(0);
const phoneNumber = ref('');
const cardNumber = ref('');
const isProcessing = ref(false);
const mobilePayments = ['Orange Money', 'MVola', 'Airtel Money'];

// Computed
const isMobilePayment = computed(() => mobilePayments.includes(selectedPayment.value));
const isValidPhoneNumber = computed(() => {
    if (!isMobilePayment.value) return true;
    return phoneNumber.value.replace(/\D/g, '').length >= 10;
});
const isPaymentValid = computed(() => {
    if (!selectedPayment.value) return false;
    if (selectedPayment.value === 'TPE') return cardNumber.value.replace(/\D/g, '').length === 16;
    if (isMobilePayment.value) return isValidPhoneNumber.value;
    if (selectedPayment.value === 'Espèce') return parseFloat(amountReceived.value) >= props.totalAmount;
    return true;
});

// Méthodes
const formatPrice = (price) => {
    return parseFloat(price).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$& ');
};

const selectPaymentMethod = (method) => {
    selectedPayment.value = method;
    nextTick(() => {
        if (method === 'TPE') cardNumberInput.value?.focus();
        else if (isMobilePayment.value) phoneInput.value?.focus();
        else if (method === 'Espèce') amountReceivedInput.value?.focus();
    });
};

const appendToField = (value) => {
    if (selectedPayment.value === 'TPE') {
        const current = cardNumber.value.replace(/\D/g, '');
        if (current.length >= 16 && value !== ' ') return;
        const newValue = current + (value === ' ' ? '' : value);
        cardNumber.value = newValue.match(/.{1,4}/g)?.join(' ').substr(0, 19) || '';
    }
    else if (isMobilePayment.value) {
        const current = phoneNumber.value.replace(/\D/g, '');
        if (current.length >= 10 && value !== ' ') return;
        phoneNumber.value = (current + value)
            .replace(/(\d{3})(\d{2})(\d{3})(\d{2})/, '$1 $2 $3 $4')
            .substr(0, 14);
    }
    else if (selectedPayment.value === 'Espèce') {
        if (value === ' ') return;
        const newValue = amountReceived.value === '0' ? value : amountReceived.value + value;
        amountReceived.value = newValue.replace(/[^0-9.]/g, '');
        calculateChange();
    }
};

const appendDecimal = () => {
    if (!amountReceived.value.includes('.')) {
        amountReceived.value += amountReceived.value ? '.' : '0.';
    }
};

const clearField = () => {
    if (selectedPayment.value === 'TPE') {
        const current = cardNumber.value.replace(/\D/g, '').slice(0, -1);
        cardNumber.value = current.match(/.{1,4}/g)?.join(' ') || '';
    }
    else if (isMobilePayment.value) {
        phoneNumber.value = phoneNumber.value.slice(0, -1).trim();
    }
    else if (selectedPayment.value === 'Espèce') {
        amountReceived.value = amountReceived.value.slice(0, -1) || '0';
        calculateChange();
    }
};

const calculateChange = () => {
    const received = parseFloat(amountReceived.value) || 0;
    changeAmount.value = received - props.totalAmount;
};

const getPaymentIcon = (paymentName) => {
    return payments.value.find(p => p.name === paymentName)?.icon || 'fa-solid fa-credit-card';
};

const closeModal = () => {
    selectedPayment.value = '';
    amountReceived.value = '0';
    changeAmount.value = 0;
    phoneNumber.value = '';
    cardNumber.value = '';
    isProcessing.value = false;
    emits('close-modal');
};

const confirmPayment = () => {
    isProcessing.value = true;
    const paymentData = {
        method: selectedPayment.value,
        total: props.totalAmount,
        reference: selectedPayment.value === 'TPE' ? cardNumber.value : null,
        phone: isMobilePayment.value ? phoneNumber.value : null,
        received: selectedPayment.value === 'Espèce' ? parseFloat(amountReceived.value) : null,
        change: changeAmount.value
    };
    emits('confirm-payment', paymentData);
};

// Watchers
watch(() => props.isOpen, (newVal) => {
    if (newVal) {
        amountReceived.value = '0';
        phoneNumber.value = '';
        cardNumber.value = '';
    }
});
</script>
<style scoped>
.modal-card {
    max-width: 650px;
    /* Légèrement plus large */
    max-height: 95vh;
    /* Un peu plus de hauteur */
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 8px;
    /* Coins arrondis */
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    /* Ombre portée plus douce */
}

.modal-card-head {
    border-bottom: 1px solid #4a4a4a;
    /* Ligne de séparation plus subtile */
}

.modal-card-title {
    font-size: 1.25rem;
    /* Taille de titre légèrement augmentée */
}

.modal-card-body {
    flex-grow: 1;
    padding: 1.5rem;
    /* Plus de padding interne */
    overflow-y: auto;
    background-color: #f9f9f9;
    /* Fond légèrement grisé pour le corps */
}

.field .label {
    margin-bottom: 0.75rem;
    /* Espace accru sous les labels */
    font-size: 0.9rem;
    color: #363636;
}

.input.is-large {
    font-size: 1.3rem;
    /* Taille de police pour les inputs importants */
    border-radius: 6px;
    /* Coins arrondis pour les inputs */
}

input:disabled,
input[readonly] {
    background-color: #f0f0f0;
    /* Fond plus distinct pour les champs non éditables */
    cursor: not-allowed;
}

/* Conteneur des paiements et du clavier */
.payment-container {
    display: flex;
    gap: 1.5rem;
    /* Espace accru entre les options de paiement et le clavier */
    align-items: flex-start;
    /* Aligner en haut pour une meilleure disposition */
    margin-top: 1rem;
}

/* Boutons de paiement */
.payment-options {
    display: grid;
    /* Utilisation de grid pour une meilleure flexibilité */
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    /* Colonnes responsives */
    gap: 0.75rem;
    /* Espace entre les boutons de paiement */
    flex: 1;
}

.payment-option {
    min-height: 60px;
    /* Hauteur minimale */
    padding: 0.75rem;
    font-size: 0.9rem;
    /* Taille de police ajustée */
    background-color: #ffffff;
    /* Fond blanc */
    color: #333;
    /* Texte plus foncé */
    border: 1px solid #dbdbdb;
    /* Bordure subtile */
    border-radius: 6px;
    /* Coins arrondis */
    cursor: pointer;
    text-align: center;
    display: flex;
    flex-direction: column;
    /* Icône au-dessus du texte */
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.payment-option:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    border-color: #007bff;
}

.payment-option.is-active {
    background-color: #007bff;
    color: white;
    border-color: #0056b3;
    box-shadow: 0 2px 5px rgba(0, 123, 255, 0.3);
}

.payment-option.is-active .payment-name,
.payment-option.is-active .payment-icon {
    color: white;
}

.payment-icon {
    font-size: 1.2rem;
    /* Taille d'icône augmentée */
    margin-bottom: 0.3rem;
}

.payment-name {
    font-weight: 500;
}

.payment-check {
    color: #2ecc71;
    /* Vert pour la coche */
    font-size: 1.1rem;
    position: absolute;
    top: 5px;
    right: 5px;
}

.payment-option.is-active .payment-check {
    color: white;
}


/* Clavier numérique */
.numeric-keypad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    /* Passage à 3 colonnes pour le clavier principal */
    gap: 0.5rem;
    /* Espace accru entre les touches */
    padding: 0.5rem;
    /* Padding réduit car les boutons ont leur propre style */
    flex: 0 0 220px;
    /* Largeur fixe pour le clavier */
    background-color: #ffffff;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.numeric-keypad.is-mobile-payment .keypad-row:nth-child(4) button:nth-child(2) {
    grid-column: span 1;
    /* S'assurer que le bouton Espace prend une colonne */
}

.numeric-keypad.is-mobile-payment .keypad-row:nth-child(4) button:nth-child(1) {
    grid-column: span 1;
}


.keypad-row {
    display: contents;
    /* Permet aux boutons d'être des enfants directs du grid */
}

.keypad-button {
    font-size: 1.4rem;
    /* Taille de police augmentée */
    padding: 0;
    /* Le padding sera géré par la hauteur/largeur et flex */
    width: 100%;
    aspect-ratio: 1 / 1;
    /* Boutons carrés */
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    /* Coins arrondis */
    background-color: #fdfdfd;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    cursor: pointer;
}

.keypad-button:hover {
    background-color: #f0f0f0;
    border-color: #c0c0c0;
    transform: translateY(-1px);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.keypad-button:active {
    background-color: #e0e0e0;
    transform: translateY(0px);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.keypad-button.is-danger {
    background-color: #ffdddd;
    color: #cc0000;
    border-color: #ffb8b8;
}

.keypad-button.is-danger:hover {
    background-color: #ffcccc;
    color: #b30000;
}

.keypad-button.is-success {
    background-color: #ddffdd;
    color: #008000;
    border-color: #b8ffb8;
}

.keypad-button.is-success:hover {
    background-color: #ccffcc;
    color: #006600;
}

.numeric-keypad .keypad-row:last-child .keypad-button:first-child {
    grid-column: span 1;
    /* Le bouton Effacer prend une colonne */
}

/* Style for the last row in mobile payment mode - Clear button takes one column */
.numeric-keypad.is-mobile-payment .keypad-row:last-child .keypad-button:first-child {
    grid-column: span 1;
    /* En mode paiement mobile, le bouton Effacer prend une colonne */
}

.numeric-keypad.is-mobile-payment .keypad-row:nth-child(4) button:nth-child(2) {
    /* Espace button */
    font-size: 0.9rem;
}


.modal-card-foot {
    background-color: #f0f0f0;
    /* Fond légèrement différent pour le pied de page */
    border-top: 1px solid #dbdbdb;
    /* Ligne de séparation */
    padding: 1rem 1.5rem;
    /* Padding ajusté */
}

.modal-card-foot .button {
    font-weight: 500;
}


/* Adaptation mobile */
@media (max-width: 768px) {
    .modal-card {
        width: 98%;
        /* Presque pleine largeur en mobile */
        max-height: 98vh;
        margin: 1vh auto;
    }

    .modal-card-body {
        padding: 1rem;
        /* Padding réduit pour mobile */
    }

    .payment-container {
        flex-direction: column;
        align-items: stretch;
        /* Étirer les enfants */
        gap: 1rem;
    }

    .payment-options {
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        /* Ajustement pour mobile */
        gap: 0.5rem;
        width: 100%;
    }

    .payment-option {
        min-height: 55px;
        font-size: 0.85rem;
    }

    .payment-icon {
        font-size: 1.1rem;
    }

    .numeric-keypad {
        width: 100%;
        /* Pleine largeur en mobile */
        flex: 1 0 auto;
        /* Permettre au clavier de grandir si nécessaire */
        grid-template-columns: repeat(3, 1fr);
        /* Maintenir 3 colonnes pour le clavier principal */
        padding: 0.5rem;
    }

    .numeric-keypad.is-mobile-payment {
        grid-template-columns: repeat(3, 1fr);
        /* S'assurer que le clavier mobile reste à 3 colonnes */
    }

    .keypad-button {
        font-size: 1.2rem;
        /* Taille de police légèrement réduite pour mobile */
    }

    /* The clear button in the last row for non-mobile payment keypad should span one column */
    .numeric-keypad .keypad-row:last-child .keypad-button:first-child {
        grid-column: span 1;
    }

    /* The clear button in the last row for mobile payment keypad should span one column */
    .numeric-keypad.is-mobile-payment .keypad-row:last-child .keypad-button:first-child {
        grid-column: span 1;
    }

    .numeric-keypad.is-mobile-payment .keypad-row:nth-child(4) button:nth-child(2) {
        /* Espace button */
        font-size: 0.8rem;
    }


    .modal-card-foot {
        padding: 0.75rem 1rem;
    }

    .modal-card-foot .button {
        font-size: 0.9rem;
    }
}
</style>
