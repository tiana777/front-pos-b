<template>
  <div>
    <!-- Bouton burger -->
    <button class="menu-toggle" @click="toggleMenu">
      <FontAwesomeIcon :icon="faBars" />
    </button>

    <!-- Overlay -->
    <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>

    <!-- Menu latéral -->
    <div class="side-menu" :class="{ 'is-open': isOpen }">
      <div class="menu-header">
        <h3 class="title is-4">Menu</h3>
      </div>
      <div class="menu-content">
        <button class="menu-button" @click="navigateTo('direct')">Direct</button>
        <button class="menu-button" @click="navigateTo('table')">Table</button>
        <button class="menu-button" @click="navigateTo('product')">Produits</button>
        <button class="menu-button" @click="navigateTo('ventes')">Ventes</button>
        <button class="menu-button" @click="navigateTo('user-sales')">Mes ventes</button>
        <button class="menu-button" @click="navigateTo('retour')">Retour</button>

        <!-- Admin sections - only visible to admin users -->
        <template v-if="isAdmin">
          <hr class="menu-divider">

          <h4 class="admin-title">Administration</h4>
          <button class="menu-button admin-button" @click="navigateTo('roles')">
            Gestion des Rôles
          </button>
          <button class="menu-button admin-button" @click="navigateTo('permissions')">
            Gestion des Permissions
          </button>
          <button class="menu-button admin-button" @click="navigateTo('users')">
            Gestion des Utilisateurs
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/composables/useAuth'

const isOpen = ref(false)
const router = useRouter()
const { isAdmin, loadUserData } = useAuth()

// Load user data on component mount
onMounted(async () => {
  await loadUserData()
})

function toggleMenu() {
  isOpen.value = !isOpen.value
}

function closeMenu() {
  isOpen.value = false
}

function navigateTo(routeName) {
  closeMenu()
  router.push({ name: routeName })
}
</script>

<style scoped>
.menu-toggle {
  position: fixed;
  top: 1rem;
  left: 1rem;
  z-index: 1100;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.side-menu {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: #f5f5f5;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  color: black;
}

.side-menu.is-open {
  transform: translateX(280px);
}

.menu-header {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: black;
  padding: 1.5rem;
}

.menu-content {
  padding: 1rem;
  color: black;
}

.menu-button {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  font-weight: bold;
  background-color: #ddd;
  color: black;
}
</style>
