<template>
  <div class="pavenum-overlay" @click.self="close">
    <div class="pavenum-container">
      <div class="display">{{ displayValue }}</div>
      <div class="buttons">
        <button v-for="n in numbers" :key="n" @click="appendNumber(n)" class="button is-medium is-primary">{{ n
        }}</button>
        <button @click="clear" class="button is-medium is-danger">C</button>
        <button @click="confirm" class="button is-medium is-success">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits, defineProps } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'close', 'confirm'])

const displayValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  displayValue.value = newVal
})

const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']

const appendNumber = (num) => {
  displayValue.value += num
  emit('update:modelValue', displayValue.value)
}

const clear = () => {
  displayValue.value = ''
  emit('update:modelValue', displayValue.value)
}

const confirm = () => {
  emit('confirm', displayValue.value)
  close()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.pavenum-overlay {
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

.pavenum-container {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  width: 300px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.display {
  width: 100%;
  height: 3rem;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  text-align: right;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  user-select: none;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  width: 100%;
}

.button {
  font-size: 1.25rem;
  user-select: none;
}
</style>
