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

    <div v-if="isPosRoute" class="pos-landing">
      <section class="pos-hero">
        <div class="pos-hero-text">
          <p class="pos-hero-eyebrow">POS Hub</p>
          <h1>Bonjour {{ greetingName }} 👋</h1>
          <p class="pos-hero-subtitle">
            Démarrez une vente, consultez vos performances ou gérez la salle en quelques clics. Toutes les actions
            essentielles pour votre service sont réunies ici.
          </p>
          <div class="pos-hero-actions">
            <button type="button" class="pos-hero-button primary" @click="navigateTo('direct')">
              <i class="fas fa-bolt"></i>
              Vente directe
            </button>
            <button type="button" class="pos-hero-button" @click="toggleMenu">
              <i class="fas fa-compass"></i>
              Explorer le menu
            </button>
          </div>
        </div>

        <div class="pos-hero-panel">
          <div class="pos-hero-tag">
            <span class="tag-label">Session active</span>
            <span class="tag-value">{{ sessionLabel }}</span>
          </div>
          <ul class="pos-hero-list">
            <li>
              <i class="fas fa-check"></i>
              Accès caisse &amp; ventes centralisés
            </li>
            <li>
              <i class="fas fa-users"></i>
              Coordination salle simplifiée
            </li>
            <li>
              <i class="fas fa-chart-line"></i>
              Suivi en temps réel avec le tableau caissier
            </li>
          </ul>
        </div>
      </section>

      <section class="pos-section">
        <header class="pos-section-header">
          <h2>Opérations clés</h2>
          <p>Retrouvez vos actions quotidiennes les plus utilisées.</p>
        </header>
        <div class="pos-card-grid">
          <article
            v-for="link in posOperationLinks"
            :key="link.route"
            class="pos-card"
            @click="navigateTo(link.route)"
          >
            <div class="pos-card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="pos-card-action">Accéder <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>

      <section class="pos-section">
        <header class="pos-section-header">
          <h2>Catalogue &amp; historique</h2>
          <p>Gérez vos produits et analysez vos ventes passées.</p>
        </header>
        <div class="pos-card-grid">
          <article
            v-for="link in posCatalogueLinks"
            :key="link.route"
            class="pos-card muted"
            @click="navigateTo(link.route)"
          >
            <div class="pos-card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="pos-card-action">Ouvrir <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>

      <section v-if="isAdmin" class="pos-section">
        <header class="pos-section-header">
          <h2>Espace administrateur</h2>
          <p>Outils avancés pour paramétrer le point de vente.</p>
        </header>
        <div class="pos-card-grid">
          <article
            v-for="link in posAdminLinks"
            :key="link.route"
            class="pos-card admin"
            @click="navigateTo(link.route)"
          >
            <div class="pos-card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="pos-card-action">Configurer <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>
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


.pos-landing {
  max-width: 1200px;
  margin: 140px auto 48px;
  padding: 0 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.pos-hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.96), rgba(30, 64, 175, 0.9));
  color: #fff;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 32px 70px rgba(30, 64, 175, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pos-hero-text {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.pos-hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25rem;
  opacity: 0.7;
  font-size: 0.8rem;
}

.pos-hero-text h1 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
}

.pos-hero-subtitle {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.pos-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.pos-hero-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0.75rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease;
}

.pos-hero-button.primary {
  background: #fff;
  color: #1d4ed8;
  border-color: transparent;
}

.pos-hero-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.15);
}

.pos-hero-button.primary:hover {
  background: #e2e8f0;
}

.pos-hero-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: rgba(15, 23, 42, 0.22);
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.pos-hero-tag {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: rgba(255, 255, 255, 0.18);
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 600;
}

.pos-hero-tag .tag-label {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pos-hero-tag .tag-value {
  font-size: 1.1rem;
}

.pos-hero-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pos-hero-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.12);
  padding: 12px 16px;
  border-radius: 14px;
}

.pos-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.pos-section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.pos-section-header p {
  margin: 4px 0 0;
  color: #475569;
}

.pos-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.pos-card {
  background: #fff;
  border-radius: 22px;
  padding: 22px;
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
  border: 1px solid rgba(226, 232, 240, 0.8);
  display: flex;
  flex-direction: column;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pos-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 42px rgba(37, 99, 235, 0.13);
}

.pos-card.muted {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
}

.pos-card.admin {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.88));
  color: #fff;
  border-color: rgba(148, 163, 184, 0.4);
}

.pos-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.pos-card.admin .pos-card-icon {
  background: rgba(255, 255, 255, 0.18);
}

.pos-card h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: inherit;
}

.pos-card-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-weight: 600;
}

.pos-card.admin .pos-card-action {
  color: rgba(255, 255, 255, 0.85);
}

@media (max-width: 768px) {
  .pos-landing {
    margin-top: 150px;
    padding: 0 16px 32px;
  }

  .pos-hero {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }

  .pos-hero-text h1 {
    font-size: 1.8rem;
  }
}


</style>
