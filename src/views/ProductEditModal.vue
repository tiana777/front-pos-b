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
    emits('save', response_1.data.product)
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
:root {
  --primary-red: #d32f2f;
  --primary-gray: #757575;
  --primary-white: #ffffff;
  --background-light: #a83232;
  --border-color: #e0e0e0;
}

.modal-card {
  max-width: 600px;
  width: 100%;
  background-color: var(--primary-white);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(235, 229, 229, 0.2);
}

.modal-header {
  padding: 2rem;
  background: var(--background-light);
  border-bottom: 1px solid #eee;
}

.button-success {
  background-color: var(--primary-red);
  color: var(--primary-white);
}
</style>
