<template>
  <div class="z-[999] w-[600px] select-none rounded-2xl bg-neutral-900 p-4 text-white shadow-2xl"
    :style="{ position: 'fixed', bottom: '20px', right: '20px' }"
    @mousedown.stop.prevent="startDrag">
    <!-- Drag header -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center">
        <span class="mr-2 text-gray-400">
          <MoveIcon />
        </span>
        <strong>Clavier Virtuel</strong>
      </div>
      <div>
        <button class="rounded border border-gray-500 bg-gray-800 px-2 py-1 text-xs text-white hover:bg-gray-700" @click="toggleShift">
          {{ isUppercase ? 'MAJ' : 'min' }}
        </button>
      </div>
    </div>

    <!-- Chiffres -->
    <div class="mb-2 flex flex-wrap justify-center gap-2">
      <button v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']" :key="n" class="min-w-[45px] h-[45px] rounded-lg bg-gray-800 px-2 text-lg font-medium hover:bg-gray-700"
        @click.stop="pressKey(n)">
        {{ n }}
      </button>
    </div>

    <!-- Lettres -->
    <div v-for="(row, index) in layout" :key="index" class="mb-2 flex flex-wrap justify-center gap-2">
      <button v-for="key in row" :key="key" class="min-w-[45px] h-[45px] rounded-lg bg-gray-800 px-2 text-lg font-medium hover:bg-gray-700" @click.stop="pressKey(key)">
        {{ formatKey(key) }}
      </button>
    </div>

    <!-- Dernière ligne -->
    <div class="flex flex-wrap justify-center gap-2">
      <button class="min-w-[45px] h-[45px] rounded-lg bg-blue-600 px-2 text-lg font-medium hover:bg-blue-700" @click.stop="toggleShift">⇧ Shift</button>
      <button class="min-w-[45px] h-[45px] rounded-lg bg-yellow-500 px-2 text-lg font-medium text-black hover:bg-yellow-600" @click.stop="backspace">DELL</button>
      <button class="min-w-[100px] h-[45px] flex-grow rounded-lg bg-green-600 px-2 text-lg font-medium hover:bg-green-700" @click.stop="pressKey(' ')">Espace</button>
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
</style>
