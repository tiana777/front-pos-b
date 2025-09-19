<template>
  <div v-if="isOpen" class="modal is-active">
    <div class="modal-background" @click="close"></div>
    <div class="modal-card">
      <header class="modal-card-head">
        <p class="modal-card-title">Modifier la catégorie</p>
        <button class="delete" @click="close"></button>
      </header>
      <section class="modal-card-body">
        <div class="field">
          <label class="label">Nom</label>
          <div class="control">
            <input v-model="category.name" class="input" type="text" placeholder="Nom de la catégorie" required />
          </div>
        </div>
        <div v-if="printerTypes.length > 0" class="field">
          <label class="label">Type d'imprimante</label>
          <div class="control">
            <div class="select">
              <select v-model="category.printer_type_id">

                <option v-for="type in printerTypes" :key="type" :value="type.id">{{ type.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      <footer class="modal-card-foot">
        <button class="button is-success" @click="submit" :disabled="!category.name.trim()">Sauvegarder</button>
        <button class="button" @click="close">Annuler</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits, defineProps } from 'vue'
import { usePrinterTypes } from '../composables/usePrinterTypes.js'

const props = defineProps({
  isOpen: Boolean,
  categoryData: Object,
})

const emit = defineEmits(['close', 'updated'])

const { printerTypes, fetchPrinterTypes } = usePrinterTypes()

const category = ref({ id: null, name: '', printer_type: '' })

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.categoryData) {
    fetchPrinterTypes().then(() => {
      category.value = { ...props.categoryData }
      if (category.value.printer_type) {
        category.value.printer_type = category.value.printer_type_id
      }
    })
  }
})

const close = () => {
  emit('close')
}

const submit = () => {
  if (!category.value.name.trim()) return
  const { ...updatePayload } = category.value
  emit('updated', { ...updatePayload }


  )
  close()
}
</script>

<style scoped>
@import 'https://cdn.jsdelivr.net/npm/bulma@0.9.3/css/bulma.min.css';
</style>
