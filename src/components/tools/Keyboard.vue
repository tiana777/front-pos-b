<template>
  <div class="keyboard box" :style="{ position: 'fixed', bottom: '20px', right: '20px' }"
    @mousedown.stop.prevent="startDrag">
    <!-- Drag header -->
    <div class="level mb-3">
      <div class="level-left">
        <span class="icon has-text-grey-light mr-2">
          <MoveIcon />
        </span>
        <strong>Clavier Virtuel</strong>
      </div>
      <div class="level-right">
        <button class="button is-small" @click="toggleShift">
          {{ isUppercase ? 'MAJ' : 'min' }}
        </button>
      </div>
    </div>

    <!-- Chiffres -->
    <div class="key-row mb-2">
      <button v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']" :key="n" class="key-button"
        @click.stop="pressKey(n)">
        {{ n }}
      </button>
    </div>

    <!-- Lettres -->
    <div v-for="(row, index) in layout" :key="index" class="key-row mb-2">
      <button v-for="key in row" :key="key" class="key-button" @click.stop="pressKey(key)">
        {{ formatKey(key) }}
      </button>
    </div>

    <!-- Dernière ligne -->
    <div class="key-row">
      <button class="key-button is-info" @click.stop="toggleShift">⇧ Shift</button>
      <button class="key-button is-warning" @click.stop="backspace">DELL</button>
      <button class="key-button is-primary space-key" @click.stop="pressKey(' ')">Espace</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Move as MoveIcon } from 'lucide-vue-next'

const emit = defineEmits(['key-pressed'])

const isUppercase = ref(false)
const isDragging = ref(false)
const position = ref({ top: 600, left: 0 })

onMounted(() => {
  const width = 600
  position.value.left = (window.innerWidth - width) / 2
})

let offset = { x: 0, y: 0 }

const layout = [
  ['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
  ['w', 'x', 'c', 'v', 'b', 'n', '.', '@']
]

function formatKey(key) {
  return isUppercase.value ? key.toUpperCase() : key
}

function pressKey(key) {
  emit('key-pressed', formatKey(key))
}

function toggleShift() {
  isUppercase.value = !isUppercase.value
}

function backspace() {
  emit('key-pressed', 'BACKSPACE')
}

function startDrag(e) {
  if (!e.clientX) return
  isDragging.value = true
  offset = {
    x: e.clientX - position.value.left,
    y: e.clientY - position.value.top
  }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

function onDrag(e) {
  if (isDragging.value) {
    position.value.left = e.clientX - offset.x
    position.value.top = e.clientY - offset.y
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}
</script>

<style scoped>
.keyboard {
  z-index: 999;
  width: 600px;
  background: #252323;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  user-select: none;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.key-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.key-button {
  flex: 0 0 auto;
  min-width: 45px;
  height: 45px;
  font-size: 1.1rem;
  border-radius: 8px;
  font-weight: 500;
  padding: 0.5rem;
}

.space-key {
  flex-grow: 1;
  min-width: 100px;
}
</style>
