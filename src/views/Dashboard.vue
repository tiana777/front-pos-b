<template>
  <div class="flex min-h-screen bg-slate-100 text-slate-900">
    <div
      class="fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 lg:hidden"
      :class="sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="closeSidebar"
    ></div>

    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white shadow-sm transition-all duration-200 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
      ]"
    >
      <div class="flex items-center gap-3 px-6 pt-6" :class="isSidebarCollapsed ? 'lg:px-4 lg:justify-center' : ''">
        <img
          src="../assets/logo.png"
          alt="Logo"
          class="h-11 w-auto object-contain"
          :class="isSidebarCollapsed ? 'lg:h-10' : ''"
        />
        <div v-if="!isSidebarCollapsed">
          <p class="text-lg font-semibold text-slate-900">TailAdmin</p>
          <p class="text-xs text-slate-400">POS Dashboard</p>
        </div>
      </div>

      <nav :class="['mt-8 flex-1 overflow-y-auto pb-8', isSidebarCollapsed ? 'px-2' : 'px-4']">
        <div v-for="section in navigationSections" :key="section.title" class="mb-8">
          <p
            class="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
            :class="isSidebarCollapsed ? 'lg:hidden' : ''"
          >
            {{ section.title }}
          </p>
          <ul class="mt-4 space-y-1">
            <li v-for="item in section.items" :key="item.label">
              <button
                type="button"
                :class="[
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isActive(item) ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100',
                  isSidebarCollapsed ? 'lg:justify-center lg:gap-0 lg:px-0 lg:py-3' : ''
                ]"
                @click="handleNavigation(item)"
              >
                <span
                  class="flex h-10 w-10 items-center justify-center rounded-lg"
                  :class="isActive(item) ? 'bg-white text-indigo-600 shadow-sm' : 'bg-slate-100 text-slate-500'"
                >
                  <FontAwesomeIcon :icon="item.icon" class="text-base" />
                </span>
                <span :class="['flex-1 text-left', isSidebarCollapsed ? 'lg:hidden' : '']">{{ item.label }}</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div v-if="!isSidebarCollapsed" class="border-t border-slate-200 px-6 py-6">
        <div class="rounded-2xl bg-slate-50 px-4 py-4">
          <p class="text-sm font-semibold text-slate-700">Upgrade to Pro</p>
          <p class="mt-1 text-xs text-slate-500">Unlock advanced analytics and automation features.</p>
          <button
            type="button"
            class="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Upgrade
          </button>
        </div>
      </div>
    </aside>

    <div :class="['flex min-h-screen flex-1 flex-col', contentPaddingClass]">
      <header :class="['fixed top-0 right-0 left-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur', headerOffsetClass]">
        <div class="flex w-full flex-wrap items-center gap-3 px-4 py-0.5 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              @click="toggleSidebar"
              aria-label="Basculer le menu"
            >
              <FontAwesomeIcon :icon="faBars" />
            </button>
          </div>

          <div class="flex flex-1 items-center justify-end ">
            <button
              type="button"
              class="relative flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
              aria-label="Notifications"
            >
              <FontAwesomeIcon :icon="faBell" />
              <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-400"></span>
            </button>
            <div ref="userMenuRef" class="relative flex items-center">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-left text-sm font-medium text-slate-600 shadow-sm transition hover:border-indigo-200 hover:text-indigo-600 sm:px-2.5"
                @click="toggleUserMenu"
                aria-haspopup="true"
                :aria-expanded="userMenuOpen"
              >
                <img src="../assets/avatar.png" alt="User avatar" class="h-8 w-8 rounded-full object-cover" />
                <span class="hidden sm:inline text-sm font-semibold text-slate-700">{{ userDisplayName }}</span>
                <FontAwesomeIcon :icon="faChevronDown" class="hidden text-xs text-slate-400 sm:inline" />
              </button>

              <transition name="fade">
                <div
                  v-if="userMenuOpen"
                  class="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div class="border-b border-slate-100 px-4 py-3">
                    <p class="text-sm font-semibold text-slate-800">{{ userDisplayName }}</p>
                    <p class="text-xs text-slate-400">{{ userEmail }}</p>
                  </div>
                  <nav class="py-2 text-sm text-slate-600">
                    <button
                      type="button"
                      class="flex w-full items-center px-4 py-2 transition hover:bg-slate-50"
                      @click="navigateTo('dashboard-overview')"
                    >
                      Dashboard
                    </button>
                    <button type="button" class="flex w-full items-center px-4 py-2 text-slate-400" disabled>
                      Paramètres
                    </button>
                    <button type="button" class="flex w-full items-center px-4 py-2 text-slate-400" disabled>
                      Revenus
                    </button>
                    <button
                      type="button"
                      class="flex w-full items-center px-4 py-2 text-rose-600 transition hover:bg-rose-50"
                      @click="logout"
                    >
                      Déconnexion
                    </button>
                  </nav>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 px-3 pb-6 pt-[3rem] sm:px-4 lg:px-5 lg:pt-[3.5rem]">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faArrowRotateLeft,
  faBars,
  faBell,
  faBoxesStacked,
  faCashRegister,
  faClipboardList,
  faChevronDown,
  faGear,
  faGaugeHigh,
  faMagnifyingGlass,
  faMoon,
  faPrint,
  faReceipt,
  faStore,
  faTableCellsLarge,
  faUsersGear,
  faKey,
  faUserGroup,
  faChartLine,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/composables/useAuth'

defineOptions({ name: 'DashboardLayout' })

const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)
const sidebarCollapsed = ref(false)
const searchQuery = ref('')
const userMenuOpen = ref(false)
const userMenuRef = ref(null)

const isDesktop = ref(false)

const { user, isAdmin, loadUserData } = useAuth()

const isSidebarCollapsed = computed(() => sidebarCollapsed.value && isDesktop.value)

const headerOffsetClass = computed(() => {
  if (!isDesktop.value) return ''
  return sidebarCollapsed.value ? 'lg:left-20' : 'lg:left-72'
})

const contentPaddingClass = computed(() => {
  if (!isDesktop.value) return ''
  return sidebarCollapsed.value ? 'lg:pl-20' : 'lg:pl-72'
})

const setInitialSidebarState = () => {
  if (typeof window === 'undefined') return
  isDesktop.value = window.innerWidth >= 1024
  sidebarOpen.value = isDesktop.value
}

const handleDocumentClick = (event) => {
  if (!userMenuRef.value) return
  if (userMenuRef.value.contains(event.target)) return
  userMenuOpen.value = false
}

const handleResize = () => {
  if (typeof window === 'undefined') return
  const width = window.innerWidth
  isDesktop.value = width >= 1024
  sidebarOpen.value = isDesktop.value
}

onMounted(async () => {
  setInitialSidebarState()
  await loadUserData()
  document.addEventListener('click', handleDocumentClick)
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})

const navigationSections = computed(() => {
  const base = [
    {
      title: 'Menu',
      items: [
        { label: 'Dashboard', name: 'dashboard-overview', icon: faGaugeHigh },
        { label: 'Vente directe', name: 'dashboard-direct', icon: faCashRegister },
        { label: 'Service à table', name: 'dashboard-table', icon: faTableCellsLarge },
        { label: 'Produits', name: 'dashboard-product', icon: faBoxesStacked },
        { label: 'Catégories', name: 'dashboard-categories', icon: faLayerGroup },
        { label: 'Ventes', name: 'dashboard-ventes', icon: faChartLine },
        { label: 'Mes ventes', name: 'dashboard-user-sales', icon: faReceipt },
        { label: 'Retour', name: 'dashboard-retour', icon: faArrowRotateLeft },
      ],
    },
    {
      title: 'Outils',
      items: [
        { label: 'Point de vente', name: 'dashboard-point-of-sale', icon: faStore },
        { label: 'Imprimantes', name: 'dashboard-printers', icon: faPrint },
        { label: 'Sessions caisse', name: 'dashboard-cash-register-sessions', icon: faClipboardList },
      ],
    },
    {
      title: 'Administration',
      items: isAdmin.value
        ? [
            {
              label: 'Rôles',
              name: 'dashboard-roles',
              icon: faUsersGear,
              names: ['dashboard-roles', 'dashboard-roles-create', 'dashboard-roles-edit'],
            },
            {
              label: 'Permissions',
              name: 'dashboard-permissions',
              icon: faKey,
              names: ['dashboard-permissions', 'dashboard-permissions-create'],
            },
            {
              label: 'Utilisateurs',
              name: 'dashboard-users',
              icon: faUserGroup,
              names: ['dashboard-users', 'dashboard-users-create', 'dashboard-users-edit', 'dashboard-users-roles'],
            },
          ]
        : [],
    },
  ]

  return base.filter((section) => section.items.length > 0)
})

const toggleSidebar = () => {
  if (!isDesktop.value) {
    sidebarOpen.value = !sidebarOpen.value
    return
  }
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const closeSidebar = () => {
  if (isDesktop.value) return
  sidebarOpen.value = false
}

const closeUserMenu = () => {
  userMenuOpen.value = false
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const navigateTo = (name) => {
  closeSidebar()
  closeUserMenu()
  router.push({ name })
}

const handleNavigation = (item) => {
  closeSidebar()
  closeUserMenu()
  if (item?.name) {
    router.push({ name: item.name })
  }
}

const logout = () => {
  closeUserMenu()
  localStorage.removeItem('token')
  localStorage.removeItem('token_expiration')
  localStorage.removeItem('user')
  localStorage.removeItem('user_expiration')
  localStorage.removeItem('cashRegisterSession')
  router.push({ name: 'login' })
}

const isActive = (item) => {
  const currentName = route.name ? route.name.toString() : ''
  if (item.matchPrefix) {
    return currentName.startsWith(item.matchPrefix)
  }
  if (Array.isArray(item.names)) {
    return item.names.includes(currentName)
  }
  if (item.name) {
    return currentName === item.name
  }
  return false
}

const currentPageTitle = computed(() => {
  const currentName = route.name ? route.name.toString() : ''
  const titles = {
    'dashboard-overview': 'Dashboard',
    'dashboard-direct': 'Vente directe',
    'dashboard-table': 'Service à table',
    'dashboard-product': 'Produits',
    'dashboard-ventes': 'Ventes',
    'dashboard-user-sales': 'Mes ventes',
    'dashboard-retour': 'Retour',
    'dashboard-printers': 'Imprimantes',
    'dashboard-cash-register-sessions': 'Sessions caisse',
    'dashboard-point-of-sale': 'Point de vente',
    'dashboard-roles': 'Gestion des rôles',
    'dashboard-roles-create': 'Créer un rôle',
    'dashboard-roles-edit': 'Modifier un rôle',
    'dashboard-permissions': 'Permissions',
    'dashboard-permissions-create': 'Créer une permission',
    'dashboard-users': 'Utilisateurs',
    'dashboard-users-create': 'Créer un utilisateur',
    'dashboard-users-edit': 'Modifier un utilisateur',
    'dashboard-users-roles': 'Rôles utilisateur',
  }
  return titles[currentName] || 'Dashboard'
})

const userDisplayName = computed(() => user.value?.name || 'Utilisateur')
const userEmail = computed(() => user.value?.email || 'user@example.com')
</script>

<style scoped>
aside::-webkit-scrollbar {
  width: 6px;
}

aside::-webkit-scrollbar-thumb {
  border-radius: 9999px;
  background-color: rgba(148, 163, 184, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
