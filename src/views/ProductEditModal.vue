<template>

  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/80" @click="closeModal"></div>
    <div class="relative z-10 flex max-h-[95vh] w-full max-w-xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
      <header class="flex items-center justify-between border-b px-6 py-4">
        <h2 class="text-xl font-bold text-gray-800">Éditer le produit</h2>
        <button class="text-2xl leading-none text-gray-500 hover:text-gray-700" aria-label="Fermer" @click="closeModal">&times;</button>
      </header>
      <section class="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        <!-- Nom du produit -->
        <div class="mb-6">
          <label class="mb-2 block font-semibold text-gray-700">Nom du produit</label>
          <input class="w-full rounded border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none" type="text" v-model="localProduct.name" maxlength="255" required placeholder="Nom du produit" />
        </div>
        <!-- Ref du produit -->
        <div class="mb-6">
          <label class="mb-2 block font-semibold text-gray-700">Réference du produit</label>
          <input class="w-full rounded border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none" type="text" v-model="localProduct.ref" maxlength="255" required placeholder="Nom du produit" />
        </div>

        <!-- Prix -->
        <div class="mb-6">
          <label class="mb-2 block font-semibold text-gray-700">Prix</label>
          <input class="w-full rounded border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none" type="number" v-model.number="localProduct.price" min="0" step="0.01" required placeholder="Prix" />
        </div>

        <!-- Statut actif -->
        <div class="mb-6">
          <label class="inline-flex items-center gap-2 text-gray-700">
            <input type="checkbox" v-model="localProduct.status" class="size-4 rounded border-gray-300 text-teal-600 focus:ring-0" />
            Actif
          </label>
        </div>

        <!-- Catégorie -->
        <div class="mb-6">
          <label class="mb-2 block font-semibold text-gray-700">Catégorie</label>
          <select v-model="localProduct.category_id" class="w-full rounded border border-gray-300 px-3 py-2 focus:border-teal-500 focus:outline-none">
            <option :value="null" disabled>Choisir une catégorie</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>

        <!-- Image -->
        <div class="mb-6">
          <label class="mb-2 block font-semibold text-gray-700">Image</label>
          <input type="file" accept="image/*" @change="onImageChange" class="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-white hover:file:bg-teal-700" />
          <p v-if="imageError" class="mt-1 text-sm text-rose-500">{{ imageError }}</p>
          <figure class="mt-4 text-center">
            <img :src="imageUrl" :alt="localProduct.name" class="mx-auto h-auto max-w-[200px] rounded-lg shadow" loading="lazy" />
          </figure>
        </div>
      </section>
      <footer class="flex items-center justify-end gap-2 border-t bg-gray-50 px-6 py-3">
        <button
          class="inline-flex items-center rounded-md bg-teal-600 px-4 py-2 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          :class="{ 'cursor-not-allowed': isSaving }"
          @click="saveProduct"
          :disabled="isSaving"
        >
          Enregistrer
        </button>
        <button
          class="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          @click="closeModal"
          :disabled="isSaving"
        >
          Annuler
        </button>
      </footer>
      <p v-if="saveError" class="px-6 pb-4 text-center text-rose-600">{{ saveError }}</p>
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
</style>
