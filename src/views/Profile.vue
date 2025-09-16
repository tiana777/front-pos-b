<template>
  <div>

    <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>

    <div class="side-menu" :class="{ 'is-open': isOpen }">

      <div class="menu-content">
        <div class="menu-header">
          <font-awesome-icon icon="fa-home" />
        </div>
        <button class="menu-button" @click="navigateTo('direct')">Direct</button>
        <button class="menu-button" @click="navigateTo('table')">Table</button>
        <button class="menu-button" @click="navigateTo('ventes')">Ventes</button>
        <button class="menu-button" @click="navigateTo('retour')">Retour</button>

        <div v-if="isAdmin">
          <hr class="menu-divider">

          <div class="admin-title">
            <font-awesome-icon icon="fa-cog" />
          </div>
          <button class="menu-button admin-button" @click="navigateTo('roles')">
            Gestion des Rôles
          </button>
          <button class="menu-button admin-button" @click="navigateTo('permissions')">
            Gestion des Permissions
          </button>
          <button class="menu-button admin-button" @click="navigateTo('users')">
            Gestion des Utilisateurs
          </button>
          <button class="menu-button admin-button" @click="navigateTo('printers')">
            Gestion des Imprimantes
          </button>
          <button class="menu-button admin-button" @click="navigateTo('categories')">
            Gestion des Catégories
          </button>
          <button class="menu-button" @click="navigateTo('product')">Gérer les produits</button>
          <button class="menu-button" @click="navigateTo('user-sales')">Gérer les  ventes</button>


        </div>
      </div>
    </div>

    <nav class="navbar">
      <div class="navbar-start">
        <button class="menu-toggle" @click="toggleMenu">
          <font-awesome-icon icon="fa-bars" />
        </button>
      </div>
      <div class="navbar-end">
        <span class="icon">

          <font-awesome-icon :icon="['fas', 'user-circle']" /> </span>
        {{ user.name }}
        <span class="icon logout-icon" @click="logout" title="Déconnexion">
          <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
        </span>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const { isAdmin, loadUserData } = useAuth()
const user = ref({ name: '', email: '', point_of_sale_name: '' })
const isOpen = ref(false)

onMounted(async () => {
  await loadUserData()
  await fetchUserProfile()
})

const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('token')

    const response = await axios.get('http://127.0.0.1:8000/api/me', {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    })
    user.value = response.data.user
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error)
  }
}

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const navigateTo = (routeName) => {
  closeMenu()
  router.push({ name: routeName })
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 1100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navbar-start {
  display: flex;
  align-items: center;
}

.menu-toggle {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.navbar-link {
  font-size: 1rem;
  font-weight: 600;
  padding: 0.75rem 1rem;
  color: white;
  border-radius: 0.5rem;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.navbar-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.icon {
  margin-right: 5px;
}

.logout-icon {
  margin-left: 10px;
  cursor: pointer;
  color: #dc2626;
}

.logout-icon:hover {
  color: #b91c1c;
}

.has-dropdown:hover .navbar-dropdown {
  display: block;
}

.navbar-item.has-text-danger {
  color: red;
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.side-menu {
  position: fixed;
  top: 100px;
  left: -280px;
  width: 280px;
  height: calc(100vh - 60px);
  background: #f5f5f5;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  color: black;
  z-index: 1100;
}

.side-menu.is-open {
  transform: translateX(280px);
}

.menu-header {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  padding: 1rem 1.5rem;
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
  text-align: center;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(67, 97, 238, 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
}

.menu-header:hover {
  background: linear-gradient(135deg, #3a0ca3, #4361ee);
  box-shadow: 0 6px 10px rgba(58, 12, 163, 0.6);
  cursor: pointer;
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
  border: none;
  cursor: pointer;
}

.menu-divider {
  margin: 1rem 0;
  border: 0;
  border-top: 1px solid #ccc;
}

.admin-title {
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  color: white;
  padding: 1rem 1.5rem;
  margin: 0;
  font-weight: 700;
  font-size: 1.25rem;
  text-align: center;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(67, 97, 238, 0.4);
  user-select: none;
  transition: background-color 0.3s ease;
}

.admin-title:hover {
  background: linear-gradient(135deg, #3a0ca3, #4361ee);
  box-shadow: 0 6px 10px rgba(58, 12, 163, 0.6);
  cursor: pointer;
}
</style>
