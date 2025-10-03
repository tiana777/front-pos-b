<template>

  <div>

    <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>

    <div class="side-menu" :class="{ 'is-open': isOpen }">

      <div class="menu-content">
        <div class="menu-header">
          <font-awesome-icon icon="fa-home" />
        </div>
        <button class="menu-button" @click="navigateTo('direct')">Direct</button>
        <button class="menu-button" @click="navigateTo('cashier-dashboard')">Tableau caissier</button>
        <button class="menu-button" @click="navigateTo('table')">Table</button>
        <button class="menu-button" @click="navigateTo('ventes')">Ventes</button>
        <button class="menu-button" @click="navigateTo('retour')">Retour</button>
        <button class="menu-button" @click="navigateTo('billetage')">Billetage</button>

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
        <button class="menu-toggle" @click="toggleMenu" aria-label="Ouvrir le menu">
          <font-awesome-icon icon="fa-bars" />
        </button>
      </div>
      <div class="navbar-end">
        <span class="icon avatar-icon">
          <font-awesome-icon :icon="['fas', 'user-circle']" />
        </span>
        <span class="user-name">{{ user.name }}</span>
        <span class="icon logout-icon" @click="logout" title="Déconnexion">
          <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
        </span>
      </div>
    </nav>

    <div class="breadcrumb-container">
      <nav aria-label="Fil d'Ariane" class="breadcrumb-nav">
        <ol>
          <li v-for="(crumb, index) in breadcrumbs" :key="`${crumb.label}-${index}`" class="breadcrumb-item">
            <router-link
              v-if="crumb.routeName && index !== breadcrumbs.length - 1"
              :to="{ name: crumb.routeName }"
            >
              {{ crumb.label }}
            </router-link>
            <span v-else class="breadcrumb-current">{{ crumb.label }}</span>
            <span v-if="index !== breadcrumbs.length - 1" class="breadcrumb-separator">
              <font-awesome-icon icon="fa-angle-right" />
            </span>
          </li>
        </ol>
      </nav>
    </div>
  </div>

</template>

<script setup>
defineOptions({ name: 'UserProfile' })
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuth } from '@/composables/useAuth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const router = useRouter()
const route = useRoute()
const { isAdmin, loadUserData } = useAuth()
const user = ref({ name: '', email: '', point_of_sale_name: '' })
const isOpen = ref(false)

const posOperationLinks = [
  { icon: 'fa-solid fa-chart-line', label: 'Tableau caissier', route: 'cashier-dashboard' },
  { icon: 'fa-solid fa-bolt', label: 'Vente directe', route: 'direct' },
  { icon: 'fa-solid fa-table', label: 'Service en salle', route: 'table' },
  { icon: 'fa-solid fa-cash-register', label: 'Gestion des caisses', route: 'cash-registers-machine-link' },
  { icon: 'fa-solid fa-receipt', label: 'Mes ventes', route: 'user-sales' }
]

const posCatalogueLinks = [
  { icon: 'fa-solid fa-box-open', label: 'Produits', route: 'product' },
  { icon: 'fa-solid fa-list', label: 'Historique des ventes', route: 'ventes' },
  { icon: 'fa-solid fa-undo', label: 'Retour caisse', route: 'retour' }
]

const posAdminLinks = [
  { icon: 'fa-solid fa-user-shield', label: 'Gestion des rôles', route: 'roles' },
  { icon: 'fa-solid fa-lock', label: 'Permissions', route: 'permissions' },
  { icon: 'fa-solid fa-users', label: 'Utilisateurs', route: 'users' },
  { icon: 'fa-solid fa-print', label: 'Imprimantes', route: 'printers' }
]

const greetingName = computed(() => user.value?.name || 'cher caissier')
const isPosRoute = computed(() => route.name === 'pos')
const sessionLabel = computed(() => {
  try {
    const raw = localStorage.getItem('cash_register_session')
    if (!raw) return 'à démarrer'
    const session = JSON.parse(raw)
    if (!session) return 'à démarrer'
    if (session.status) return session.status
    if (session.opened_at) {
      const openedDate = new Date(session.opened_at)
      if (!Number.isNaN(openedDate.getTime())) {
        return `depuis ${openedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
      }
    }
  } catch (error) {
    // Ignore parsing errors and fall through to default label
  }
  return 'active'
})

const breadcrumbLabels = {
  pos: 'Accueil',
  direct: 'Vente directe',
  table: 'Service à table',
  'table-sales': 'Ventes par table',
  'table-order': 'Commande table',
  'tables-manage': 'Gestion des tables',
  'tables-layout': 'Plan de salle',
  'tables-selector': 'Sélecteur de table',
  ventes: 'Historique des ventes',
  retour: 'Retour caisse',
  billetage: 'Billetage',
  'billetage-summary': 'Résumé billetage',
  roles: 'Gestion des rôles',
  'roles-create': 'Créer un rôle',
  'roles-edit': 'Modifier un rôle',
  permissions: 'Permissions',
  'permissions-create': 'Créer une permission',
  users: 'Utilisateurs',
  'users-create': 'Créer un utilisateur',
  'users-edit': 'Modifier un utilisateur',
  'users-roles': 'Rôles utilisateur',
  printers: 'Imprimantes',
  'printers-create': 'Ajouter une imprimante',
  categories: 'Catégories',
  product: 'Catalogue produits',
  'user-sales': 'Mes ventes',
  'cash-registers-machine-link': 'Lien caisse',
  'cash-register-sessions': 'Sessions caisse',
  'cash-transactions': 'Transactions caisse',
  'cashier-dashboard': 'Tableau caissier'
}

const formatLabel = (value) => {
  if (!value) return 'Page'
  if (breadcrumbLabels[value]) return breadcrumbLabels[value]
  if (typeof value === 'string') {
    return value
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }
  return 'Page'
}

const breadcrumbs = computed(() => {
  const matched = route.matched.filter((record) => record.name)

  if (!matched.length) {
    return [{ label: 'Accueil', routeName: null }]
  }

  const items = []

  if (matched[0].name !== 'pos') {
    items.push({ label: 'Accueil', routeName: 'pos' })
  }

  matched.forEach((record, index) => {
    const isLast = index === matched.length - 1
    const label = record.meta?.breadcrumb || record.meta?.title || formatLabel(record.name)
    items.push({ label, routeName: isLast ? null : record.name })
  })

  return items
})

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
    // Mettre à jour localStorage avec les données utilisateur complètes
    localStorage.setItem('user', JSON.stringify(response.data.user))
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
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-weight: 600;
  z-index: 1100;
}

.navbar-start,
.navbar-end {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.menu-toggle {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 0.9rem;
  cursor: pointer;
  border: 1px solid rgba(15, 23, 42, 0.12);
  color: #0f172a;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  transition: all 0.25s ease;
}

.menu-toggle:hover {
  background: rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.12);
}

.avatar-icon,
.logout-icon,
.menu-toggle {
  font-size: 1.125rem;
}

.user-name {
  font-weight: 700;
  color: #111827;
}

.icon {
  display: flex;
  align-items: center;
  color: inherit;
}

.logout-icon {
  margin-left: 0.5rem;
  cursor: pointer;
  color: #334155;
  transition: color 0.2s ease, transform 0.2s ease;
}

.logout-icon:hover {
  color: #b91c1c;
  transform: translateY(-1px);
}

.breadcrumb-container {
  position: fixed;
  top: 96px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 2rem;
  z-index: 1098;
  pointer-events: none;
}

.breadcrumb-nav {
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.12);
  border-radius: 9999px;
  padding: 0.5rem 1.5rem;
  backdrop-filter: blur(10px);
}

.breadcrumb-nav ol {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0;
  margin: 0;
  list-style: none;
  font-weight: 600;
  color: #0f172a;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.breadcrumb-nav a {
  color: #0f172a;
  text-decoration: none;
  transition: color 0.2s ease;
}

.breadcrumb-nav a:hover {
  color: #2563eb;
}

.breadcrumb-current {
  color: #2563eb;
  font-weight: 700;
}

.breadcrumb-separator {
  color: rgba(100, 116, 139, 0.75);
  display: flex;
  align-items: center;
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
  top: 156px;
  left: -280px;
  width: 280px;
  height: calc(100vh - 156px);
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
