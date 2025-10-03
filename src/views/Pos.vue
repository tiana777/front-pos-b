<template>
  <div class="pos-page">
    <button class="menu-toggle" type="button" @click="toggleMenu" aria-label="Ouvrir le menu">
      <i class="fas fa-bars"></i>
    </button>

    <Transition name="fade">
      <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>
    </Transition>

    <Transition name="slide">
      <aside class="side-menu" :class="{ 'is-open': isOpen }">
        <div class="menu-header">
          <div>
            <h3 class="menu-title">Point de vente</h3>
            <p class="menu-subtitle">Accès rapide aux écrans clés</p>
          </div>
          <button class="menu-close" type="button" @click="closeMenu">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <nav class="menu-content">
          <section class="menu-section">
            <h4 class="menu-section-title">Opérations</h4>
            <div class="menu-section-content">
              <button
                v-for="link in operationLinks"
                :key="link.route"
                type="button"
                class="menu-link"
                @click="navigateTo(link.route)"
              >
                <i :class="link.icon"></i>
                <span>{{ link.label }}</span>
              </button>
            </div>
          </section>

          <section class="menu-section">
            <h4 class="menu-section-title">Catalogue</h4>
            <div class="menu-section-content">
              <button
                v-for="link in catalogueLinks"
                :key="link.route"
                type="button"
                class="menu-link"
                @click="navigateTo(link.route)"
              >
                <i :class="link.icon"></i>
                <span>{{ link.label }}</span>
              </button>
            </div>
          </section>

          <section v-if="isAdmin" class="menu-section">
            <h4 class="menu-section-title">Administration</h4>
            <div class="menu-section-content">
              <button
                v-for="link in adminLinks"
                :key="link.route"
                type="button"
                class="menu-link"
                @click="navigateTo(link.route)"
              >
                <i :class="link.icon"></i>
                <span>{{ link.label }}</span>
              </button>
            </div>
          </section>
        </nav>

        <footer class="menu-footer">
          <p class="menu-footer-title">Besoin d'aide ?</p>
          <p class="menu-footer-text">
            Contactez le responsable pour obtenir de nouvelles autorisations ou assistance technique.
          </p>
        </footer>
      </aside>
    </Transition>

    <main class="pos-content">
      <section class="hero-card">
        <div class="hero-text">
          <p class="hero-eyebrow">POS Hub</p>
          <h1>Bonjour {{ user?.name || 'cher caissier' }} 👋</h1>
          <p class="hero-subtitle">
            Démarrez une vente, consultez vos performances ou gérez la salle en quelques clics. Toutes les actions
            essentielles pour votre service sont réunies ici.
          </p>
          <div class="hero-actions">
            <button type="button" class="hero-button primary" @click="navigateTo('direct')">
              <i class="fas fa-bolt"></i>
              Vente directe
            </button>
            <button type="button" class="hero-button" @click="toggleMenu">
              <i class="fas fa-compass"></i>
              Explorer le menu
            </button>
          </div>
        </div>
        <div class="hero-illustration">
          <div class="stats-tag">
            <span class="tag-label">Session active</span>
            <span class="tag-value">{{ sessionLabel }}</span>
          </div>
          <ul class="hero-list">
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

      <section class="links-section">
        <header class="section-header">
          <h2>Opérations clés</h2>
          <p>Retrouvez vos actions quotidiennes les plus utilisées.</p>
        </header>
        <div class="card-grid">
          <article
            v-for="link in operationLinks"
            :key="link.route"
            class="quick-card"
            @click="navigateTo(link.route)"
          >
            <div class="card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="card-action">Accéder <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>

      <section class="links-section">
        <header class="section-header">
          <h2>Catalogue &amp; historique</h2>
          <p>Gérez vos produits et analysez vos ventes passées.</p>
        </header>
        <div class="card-grid">
          <article
            v-for="link in catalogueLinks"
            :key="link.route"
            class="quick-card muted"
            @click="navigateTo(link.route)"
          >
            <div class="card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="card-action">Ouvrir <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>

      <section v-if="isAdmin" class="links-section admin">
        <header class="section-header">
          <h2>Espace administrateur</h2>
          <p>Outils avancés pour paramétrer le point de vente.</p>
        </header>
        <div class="card-grid">
          <article
            v-for="link in adminLinks"
            :key="link.route"
            class="quick-card admin-card"
            @click="navigateTo(link.route)"
          >
            <div class="card-icon">
              <i :class="link.icon"></i>
            </div>
            <h3>{{ link.label }}</h3>
            <span class="card-action">Configurer <i class="fas fa-arrow-right"></i></span>
          </article>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
defineOptions({ name: 'PosMenu' })
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'

const isOpen = ref(false)
const router = useRouter()
const { isAdmin, loadUserData } = useAuth()
const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

const operationLinks = [
  { icon: 'fa-solid fa-chart-line', label: 'Tableau caissier', route: 'cashier-dashboard' },
  { icon: 'fa-solid fa-bolt', label: 'Vente directe', route: 'direct' },
  { icon: 'fa-solid fa-table', label: 'Service en salle', route: 'table' },
  { icon: 'fa-solid fa-cash-register', label: 'Gestion des caisses', route: 'cash-registers-machine-link' },
  { icon: 'fa-solid fa-receipt', label: 'Mes ventes', route: 'user-sales' }
]

const catalogueLinks = [
  { icon: 'fa-solid fa-box-open', label: 'Produits', route: 'product' },
  { icon: 'fa-solid fa-list', label: 'Historique des ventes', route: 'ventes' },
  { icon: 'fa-solid fa-undo', label: 'Retour caisse', route: 'retour' }
]

const adminLinks = [
  { icon: 'fa-solid fa-user-shield', label: 'Gestion des rôles', route: 'roles' },
  { icon: 'fa-solid fa-lock', label: 'Permissions', route: 'permissions' },
  { icon: 'fa-solid fa-users', label: 'Utilisateurs', route: 'users' },
  { icon: 'fa-solid fa-print', label: 'Imprimantes', route: 'printers' }
]

onMounted(async () => {
  await loadUserData()
  user.value = JSON.parse(localStorage.getItem('user') || 'null')
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

const sessionLabel = computed(() => {
  const session = JSON.parse(localStorage.getItem('cash_register_session') || 'null')
  if (!session) return 'à démarrer'
  if (session.status) return session.status
  if (session.opened_at) {
    const date = new Date(session.opened_at)
    if (!Number.isNaN(date.getTime())) {
      return `depuis ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
    }
  }
  return 'active'
})
</script>

<style scoped>
.pos-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f1f5f9 0%, #e0e7ff 100%);
  padding-bottom: 48px;
}

.menu-toggle {
  position: fixed;
  top: 1.5rem;
  left: 1.5rem;
  z-index: 1100;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 28px rgba(37, 99, 235, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.3);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(2px);
  z-index: 1090;
}

.side-menu {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: min(340px, 90vw);
  transform: translateX(-100%);
  background: linear-gradient(180deg, #fff 0%, #f8fafc 60%, #eff6ff 100%);
  box-shadow: 12px 0 32px rgba(15, 23, 42, 0.12);
  transition: transform 0.35s ease;
  z-index: 1105;
  display: flex;
  flex-direction: column;
}

.side-menu.is-open {
  transform: translateX(0);
}

.menu-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.75rem 1.5rem 1.25rem;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 60%),
    linear-gradient(135deg, #2563eb 0%, #0f172a 100%);
  color: #fff;
}

.menu-title {
  font-size: 1.25rem;
  font-weight: 600;
}

.menu-subtitle {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.menu-close {
  border: none;
  background: rgba(255, 255, 255, 0.15);
  width: 2rem;
  height: 2rem;
  border-radius: 0.75rem;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.menu-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.menu-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem 1rem;
  color: #0f172a;
}

.menu-section {
  margin-bottom: 1.5rem;
}

.menu-section-title {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.65rem;
}

.menu-section-content {
  display: grid;
  gap: 0.6rem;
}

.menu-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.85rem;
  border: none;
  background: rgba(148, 163, 184, 0.15);
  color: #0f172a;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.15s ease, color 0.2s ease;
  text-align: left;
}

.menu-link i {
  font-size: 1rem;
  color: #2563eb;
}

.menu-link:hover {
  background: rgba(37, 99, 235, 0.18);
  transform: translateX(4px);
}

.menu-link:hover i {
  color: #1d4ed8;
}

.menu-footer {
  padding: 1.25rem 1.5rem;
  background: rgba(37, 99, 235, 0.08);
  border-top: 1px solid rgba(59, 130, 246, 0.2);
}

.menu-footer-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1d4ed8;
  margin-bottom: 0.35rem;
}

.menu-footer-text {
  font-size: 0.75rem;
  color: #475569;
}

.pos-content {
  max-width: 1200px;
  margin: 120px auto 0;
  padding: 0 24px;
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.hero-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 32px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(30, 64, 175, 0.9));
  color: #fff;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 32px 70px rgba(30, 64, 175, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.hero-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25rem;
  opacity: 0.7;
  font-size: 0.8rem;
  margin-bottom: 6px;
}

.hero-card h1 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 700;
}

.hero-subtitle {
  margin: 16px 0 24px;
  font-size: 1.05rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-button {
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

.hero-button.primary {
  background: #fff;
  color: #1d4ed8;
  border-color: transparent;
}

.hero-button:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.15);
}

.hero-button.primary:hover {
  background: #e2e8f0;
}

.hero-illustration {
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: rgba(15, 23, 42, 0.22);
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.stats-tag {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  background: rgba(255, 255, 255, 0.18);
  padding: 14px 20px;
  border-radius: 16px;
  font-weight: 600;
}

.tag-label {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.tag-value {
  font-size: 1.1rem;
}

.hero-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.12);
  padding: 12px 16px;
  border-radius: 14px;
}

.links-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.links-section.admin {
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
}

.section-header p {
  margin: 4px 0 0;
  color: #475569;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
}

.quick-card {
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

.quick-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 20px 42px rgba(37, 99, 235, 0.13);
}

.quick-card.muted {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.95), rgba(226, 232, 240, 0.9));
}

.admin-card {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 64, 175, 0.88));
  color: #fff;
  border-color: rgba(148, 163, 184, 0.4);
}

.admin-card .card-action {
  color: rgba(255, 255, 255, 0.8);
}

.card-icon {
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

.quick-card h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: inherit;
}

.card-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  font-weight: 600;
}

.admin-card .card-icon {
  background: rgba(255, 255, 255, 0.18);
}

.admin-card h3 {
  color: #fff;
}

.admin-card .card-action {
  color: rgba(255, 255, 255, 0.8);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}

@media (max-width: 768px) {
  .menu-toggle {
    top: 1rem;
    left: 1rem;
  }

  .pos-content {
    margin-top: 130px;
    padding: 0 16px;
  }

  .hero-card {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }

  .hero-card h1 {
    font-size: 1.8rem;
  }
}

@media (max-width: 640px) {
  .menu-section-content {
    grid-template-columns: 1fr;
  }
}
</style>
