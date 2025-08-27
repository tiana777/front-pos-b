<template>
  <div v-if="isOpen" class="modal is-active">
    <div class="modal-background" @click="closeModal"></div>
    <div class="modal-card">
      <header class="modal-header">
        <h2 class="modal-title">Ajouter un produit</h2>
        <button class="modal-close" aria-label="Fermer" @click="closeModal">&times;</button>
      </header>
      <section class="modal-body">
        <form @submit.prevent="addProduct" class="form-container">
          <div class="field">
            <label class="label">Nom du produit</label>
            <div class="control">
              <input class="input" type="text" v-model="localProduct.name" maxlength="255" required
                placeholder="Nom du produit" />
            </div>
          </div>
          <div class="field">
            <label class="label">Réference du produit</label>
            <div class="control">
              <input class="input" type="text" v-model="localProduct.ref" maxlength="4" required
                placeholder="Référence du produit" />
            </div>
          </div>

          <div class="field">
            <label class="label">Prix</label>
            <div class="control">
              <input class="input" type="number" v-model.number="localProduct.price" min="0" step="0.01" required
                placeholder="Prix" />
            </div>
          </div>

          <div class="field checkbox-field">
            <label class="checkbox">
              <input type="checkbox" v-model="localProduct.status" />
              Actif
            </label>
          </div>

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

          <div class="field">
            <label class="label">Image</label>
            <div class="control">
              <input type="file" accept="image/*" @change="onImageChange" />
            </div>
            <p v-if="imageError" class="help is-danger">{{ imageError }}</p>
            <figure class="image-preview">
              <img :src="imageUrl" alt="Aperçu de l'image" class="product-image" loading="lazy" />
            </figure>
          </div>
        </form>
      </section>
      <footer class="modal-footer">
        <button class="button button-success" :class="{ 'is-loading': isSaving }" @click="addProduct"
          :disabled="isSaving">
          Ajouter
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
import { ref, reactive, onMounted, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  isOpen: Boolean
})

const emits = defineEmits(['close', 'added'])

const localProduct = reactive({
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
    const response = await axios.get('http://127.0.0.1:8000/api/categories', {
      headers: { Authorization: `Bearer ${token}` }
    })
    categories.value = response.data
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message)
  }
}

onMounted(fetchCategories)

const imageUrl = computed(() => {
  return localProduct.imagePreview || 'http://localhost:8000/storage/products/default-product-image.jpg'
})

const onImageChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  event.target.value = ''

  if (!file.type.startsWith('image/')) {
    imageError.value = 'Type de fichier invalide'
    return
  }
  if (file.size > 2048 * 1024) {
    imageError.value = 'Fichier trop volumineux (max 2MB)'
    return
  }

  imageError.value = ''
  localProduct.image = file
  localProduct.imagePreview = URL.createObjectURL(file)
}

const isSaving = ref(false)
const saveError = ref('')

const convertFileToBase64 = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.replace(/^data:image\/[a-z]+;base64,/, ''))
    reader.readAsDataURL(file)
  })
}

const addProduct = async () => {
  if (!localProduct.name || localProduct.price === null || localProduct.category_id === null) {
    saveError.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  saveError.value = ''
  isSaving.value = true
  try {
    const token = localStorage.getItem('token')
    const payload = {
      name: localProduct.name,
      ref: localProduct.ref,
      price: localProduct.price,
      status: localProduct.status,
      category_id: localProduct.category_id,
      image: localProduct.image ? await convertFileToBase64(localProduct.image) : null
    }
    const response = await axios.post('http://127.0.0.1:8000/api/products', payload, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    const updatedProductData = {
      ...response.data.product,
      price: localProduct.price // Ajoutez le prix depuis le state local
    };
    emits('added', updatedProductData)
    emits('close')
  } catch (error) {
    console.error('Erreur:', error.response?.data || error)
    saveError.value = error.response?.data?.message || 'Erreur lors de l\'ajout du produit'
  } finally {
    isSaving.value = false
  }
}

const closeModal = () => emits('close')
</script>

<style scoped>
.modal-card {
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(235, 229, 229, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem 2rem;
  background: #a83232;
  border-bottom: 1px solid #eee;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #ffb3b3;
}

.modal-body {
  padding: 1.5rem 2rem;
  flex: 1;
  overflow-y: auto;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
}

.label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.input,
.select select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.input:focus,
.select select:focus {
  outline: none;
  border-color: #a83232;
  box-shadow: 0 0 5px rgba(168, 50, 50, 0.5);
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.checkbox input[type='checkbox'] {
  margin: 0;
}

.image-preview {
  margin-top: 0.5rem;
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
}

.modal-footer {
  padding: 1rem 2rem;
  background: #f9f9f9;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.button-success {
  background-color: #a83232;
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-success:hover {
  background-color: #8a2929;
}

.button-cancel {
  background-color: #ccc;
  color: #333;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.button-cancel:hover {
  background-color: #b3b3b3;
}

.help.is-danger {
  color: #d9534f;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
</style>
