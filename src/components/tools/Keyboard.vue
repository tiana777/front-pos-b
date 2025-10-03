<template>
  <div class="keyboard box" :style="{ position: 'fixed', top: position.top + 'px', left: position.left + 'px' }"

    @mousedown.stop.prevent="startDrag">
    <!-- Drag header -->
    <div class="mb-3 flex items-center justify-between">
      <div class="flex items-center">
        <span class="mr-2 text-gray-400">
          <MoveIcon />
        </span>
        <strong>Clavier Virtuel</strong>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex items-center justify-center rounded border border-gray-500 bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
          @click="closeKeyboard"
          title="Fermer le clavier"
        >
          <CloseIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Chiffres -->
    <div class="mb-2 flex flex-wrap justify-center gap-2">
      <button v-for="n in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']" :key="n" class="min-w-[45px] h-[45px] rounded-lg bg-gray-100 px-2 text-lg font-medium hover:bg-gray-700"
        @click.stop="pressKey(n)">
        {{ n }}
      </button>
    </div>

    <!-- Lettres -->
    <div v-for="(row, index) in layout" :key="index" class="mb-2 flex flex-wrap justify-center gap-2">
      <button v-for="key in row" :key="key" class="min-w-[45px] h-[45px] rounded-lg bg-gray-100 px-2 text-lg font-medium hover:bg-gray-700" @click.stop="pressKey(key)">
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
defineOptions({ name: 'VirtualKeyboard' })
import { ref, onMounted, watch } from 'vue'
import { Move as MoveIcon, X as CloseIcon } from 'lucide-vue-next'

const props = defineProps({
  initialPosition: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['key-pressed', 'close'])

const isUppercase = ref(false)
const isDragging = ref(false)
const position = ref({ top: 600, left: 0 })

onMounted(() => {
  if (props.initialPosition && Number.isFinite(props.initialPosition.top) && Number.isFinite(props.initialPosition.left)) {
    position.value = {
      top: props.initialPosition.top,
      left: props.initialPosition.left
    }
    return
  }

  const width = 600
  const height = 400 // approximate height of keyboard
  position.value.left = window.innerWidth - width - 20
  position.value.top = window.innerHeight - height - 20
})

let offset = { x: 0, y: 0 }

watch(
  () => props.initialPosition,
  (nextPosition) => {
    if (!nextPosition || isDragging.value) return
    const { top, left } = nextPosition
    if (!Number.isFinite(top) || !Number.isFinite(left)) return
    position.value = { top, left }
  },
  { deep: true }
)

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

function closeKeyboard() {
  emit('close')
}
</script>
