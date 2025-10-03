<template>
  <div>
    <!-- Overlay -->
    <Transition name="fade">
      <div v-if="isOpen" class="menu-overlay" @click="closeMenu"></div>
    </Transition>



    <!-- Menu latéral -->
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
  </div>
</template>

<script setup>
defineOptions({ name: 'PosMenu' })
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useAuth } from '@/composables/useAuth'

const isOpen = ref(false)
const router = useRouter()
const { isAdmin, loadUserData } = useAuth()

const operationLinks = [
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
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px rgba(37, 99, 235, 0.25);
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

@media (max-width: 640px) {
  .menu-toggle {
    top: 0.75rem;
    left: 0.75rem;
  }

  .menu-section-content {
    grid-template-columns: 1fr;
  }
}
</style>
