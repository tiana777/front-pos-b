<template>

  <div v-if="isOpen" class="modal is-active">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card">
      <header class="modal-header">
        <h2 class="modal-title">Éditer le produit</h2>
        <button class="modal-close" aria-label="Fermer" @click="closeModal">&times;</button>
      </header>
      <section class="modal-body">
        <!-- Nom du produit -->
        <div class="field">
          <label class="label">Nom du produit</label>
          <div class="control">
            <input class="input" type="text" v-model="localProduct.name" maxlength="255" required
              placeholder="Nom du produit" />
          </div>
        </div>
        <!-- Ref du produit -->
        <div class="field">
          <label class="label">Réference du produit</label>
          <div class="control">
            <input class="input" type="text" v-model="localProduct.ref" maxlength="255" required
              placeholder="Nom du produit" />
          </div>
        </div>

        <!-- Prix -->
        <div class="field">
          <label class="label">Prix</label>
          <div class="control">
            <input class="input" type="number" v-model.number="localProduct.price" min="0" step="0.01" required
              placeholder="Prix" />
          </div>
        </div>

        <!-- Statut actif -->
        <div class="field">
          <label class="checkbox">
            <input type="checkbox" v-model="localProduct.status" />
            Actif
          </label>
        </div>

        <!-- Catégorie -->
        <div class="field">
          <label class="label">Catégorie</label>
          <div class="control">
            <div class="select">
              <select v-model="localProduct.category_id">
                <option :value="null" disabled>Choisir une catégorie</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Image -->
        <div class="field">
          <label class="label">Image</label>
          <div class="control">
            <input type="file" accept="image/*" @change="onImageChange" />
          </div>
          <p v-if="imageError" class="help is-danger">{{ imageError }}</p>
          <figure class="image-preview">
            <img :src="imageUrl" :alt="localProduct.name" class="product-image" loading="lazy" />
          </figure>
        </div>
      </section>
      <footer class="modal-footer">
        <button class="button button-success" :class="{ 'is-loading': isSaving }" @click="saveProduct"
          :disabled="isSaving">
          Enregistrer
        </button>
        <button class="button button-cancel" @click="closeModal" :disabled="isSaving">
          Annuler
        </button>
      </footer>
      <p v-if="saveError" class="save-error">{{ saveError }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, reactive, onMounted, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  isOpen: Boolean,
  product: Object
})

const emits = defineEmits(['close', 'save'])

const localProduct = reactive({
  id: null,
  name: '',
  ref: '',
  price: 0,
  status: false,
  category_id: null,
  image: null,
  imagePreview: ''
})

const categories = ref([])
const imageError = ref('')

const fetchCategories = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`http://127.0.0.1:8000/api/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    categories.value = response.data
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message)
  }
}

onMounted(fetchCategories)

watch(
  () => props.product,
  (newProduct) => {
    if (newProduct) {
      Object.assign(localProduct, {
        id: newProduct.id,
        name: newProduct.name,
        ref: newProduct.ref,
        price: newProduct.price,
        status: newProduct.status,
        category_id: newProduct.category_id,
        image: null,
        imagePreview: newProduct.image
          ? (newProduct.image.startsWith('blob:') ? newProduct.image : `http://localhost:8000/storage/${newProduct.image}`)
          : 'http://localhost:8000/storage/products/default-product-image.jpg'
      })
    }
  },
  { immediate: true }
)

const price = computed({
  get() {
    return localProduct.price
  },
  set(value) {
    localProduct.price = value
  }
})

const imageUrl = computed(() => {
  return localProduct.imagePreview || 'http://localhost:8000/storage/products/default-product-image.jpg'
})

const onImageChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  if (!file.type.startsWith('image/')) {
    imageError.value = "Type de fichier invalide"
    return
  }
  if (file.size > 2048 * 1024) {
    imageError.value = "Fichier trop volumineux (max 2MB)"
    return
  }

  imageError.value = ''
  localProduct.image = file
  localProduct.imagePreview = URL.createObjectURL(file)
}

const isSaving = ref(false)
const saveError = ref('')

const saveProduct = async () => {
  try {
    const token = localStorage.getItem('token')
    const payload_1 = {
      id: localProduct.id,
      name: localProduct.name,
      ref: localProduct.ref,
      price: localProduct.price,
      status: localProduct.status,
      category_id: localProduct.category_id,
      image: localProduct.image ? await convertFileToBase64(localProduct.image) : null
    }

    const response_1 = await axios.put(
      `http://127.0.0.1:8000/api/products/${localProduct.id}`,
      payload_1,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    )
    const payload_2 = {

      price: localProduct.price
    }
    try {
      const response_2 = await axios.put(
        `http://127.0.0.1:8000/api/pricings/${localProduct.id}`,
        payload_2,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prix:', error.response?.data || error);
    }
    const updatedProductData = {
      ...response_1.data.product,
      price: localProduct.price // Ajoutez le prix depuis le state local
    };
    emits('save', updatedProductData)
    emits('close')
  } catch (error) {
    console.error('Erreur:', error.response?.data || error)
    alert(error.response?.data?.message || 'Erreur de mise à jour')
  }
}

const convertFileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.replace(/^data:image\/[a-z]+;base64,/, ''))
    reader.readAsDataURL(file)
  })
}

const closeModal = () => emits('close')
</script>
<style scoped>
/* Import Bulma for core styling */
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';

/* * Modal container styling to center it perfectly on the screen.
 * This is the key part to fix the centering issue.
 */
.modal {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Modal background overlay */
.modal-background {
  background-color: rgba(10, 10, 10, 0.86);
}

/* Modal card layout */
.modal-card {
  margin: 0;
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  /* Added for a modern look */
}

/* Modal header */
.modal-header {
  background-color: #fff;
  padding: 1.5rem;
  border-bottom: 1px solid #dbdbdb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  color: #888;
  position: absolute;
  top: 1rem;
  right: 1.5rem;
}

/* Modal body (form content) */
.modal-body {
  flex-grow: 1;
  overflow-y: auto;
  background-color: #f5f5f5;
  padding: 1.5rem;
}

.field {
  margin-bottom: 1.5rem;
}

.label {
  font-weight: bold;
  color: #4a4a4a;
  margin-bottom: 0.5rem;
}

.input,
.select select {
  width: 100%;
  border-radius: 4px;
  border: 1px solid #dbdbdb;
  box-shadow: none;
  transition: border-color 0.2s;
}

.input:focus,
.select select:focus {
  border-color: #00d1b2;
  box-shadow: 0 0 0 0.125em rgba(0, 209, 178, 0.25);
}

.select {
  width: 100%;
}

.checkbox {
  font-weight: normal;
  color: #4a4a4a;
}

/* Image preview section */
.image-preview {
  margin-top: 1rem;
  text-align: center;
}

.product-image {
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  object-fit: contain;
}

.help.is-danger {
  color: #ff3860;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

/* Modal footer (buttons) */
.modal-footer {
  background-color: #fff;
  padding: 1rem 1.5rem;
  border-top: 1px solid #dbdbdb;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.button {
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-success {
  background-color: #00d1b2;
  color: white;
  border: none;
}

.button-success:hover {
  background-color: #00b89c;
}

.button-cancel {
  background-color: #f5f5f5;
  color: #4a4a4a;
  border: 1px solid #dbdbdb;
}

.button-cancel:hover {
  background-color: #e0e0e0;
}

/* Loading spinner animation */
.button.is-loading::after {
  animation: spinAround 0.5s infinite linear;
  border: 2px solid #fff;
  border-right-color: transparent;
  border-top-color: transparent;
  content: "";
  display: block;
  height: 1em;
  width: 1em;
  position: relative;
  top: 0;
  left: 0;
}

.save-error {
  color: #ff3860;
  text-align: center;
  margin-top: 1rem;
}

@keyframes spinAround {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
