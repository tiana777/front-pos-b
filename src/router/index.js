import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import DirectSale from '../views/DirectSale.vue'
import Pos from '../views/Pos.vue'

import Product from '../views/Product.vue'
import CashPrinter from '../views/CashPrinter.vue'
import UserSales from '../views/UserSales.vue'
import PointOfSaleManage from '../views/PointOfSaleManage.vue'
import CategoryManage from '../views/CategoryManage.vue'

import RoleList from '@/views/roles/RoleList.vue'
import RoleCreate from '@/views/roles/RoleCreate.vue'
import RoleEdit from '@/views/roles/RoleEdit.vue'
import PermissionList from '@/views/permissions/PermissionList.vue'
import PermissionCreate from '@/views/permissions/PermissionCreate.vue'
import UserList from '@/views/users/UserList.vue'
import UserRoleManagement from '@/views/users/UserRoleManagement.vue'
import Printer from '../views/Printer.vue'

// Fonction de vérification de l'expiration du token
function checkTokenExpiration() {
  const token = localStorage.getItem('token')
  const tokenExpiration = localStorage.getItem('token_expiration')

  if (token && tokenExpiration) {
    const currentTime = new Date().getTime()
    if (currentTime > parseInt(tokenExpiration)) {
      // Token expiré, nettoyer le localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('token_expiration')
      localStorage.removeItem('user')
      localStorage.removeItem('user_expiration')
      return false
    }
    return true
  }
  return false
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/pos',
      name: 'pos',
      component: Pos,
    },
    {
      path: '/direct',
      name: 'direct',
      component: DirectSale,
    },
    {
      path: '/table',
      name: 'table',
      component: () => import('../views/TableSales.vue'),
    },
    {
      path: '/table-sales',
      name: 'table-sales',
      component: () => import('../views/TableSales.vue'),
    },
    {
      path: '/table/order/:tableId?',
      name: 'table-order',
      component: () => import('../views/TableSale.vue'),
      props: route => ({ tableId: route.params.tableId })
    },

    {
      path: '/tables/manage',
      name: 'tables-manage',
      component: () => import('../views/TableManage.vue'),
    },
    {
      path: '/tables/layout',
      name: 'tables-layout',
      component: () => import('../views/TableLayout.vue'),
    },
    {
      path: '/tables/selector',
      name: 'tables-selector',
      component: () => import('../views/TableSelector.vue'),
    },
    {
      path: '/product',
      name: 'product',
      component: Product,
    },
    {
      path: '/cash-printer',
      name: 'cashprinter',
      component: CashPrinter,
    },
    {
      path: '/cashier-dashboard',
      name: 'cashier-dashboard',
      component: () => import('../views/CashierDashboard.vue'),
    },

    {
      path: '/user-sales',
      name: 'user-sales',
      component: UserSales,
    },
    {
      path: '/sales-list',
      name: 'ventes',
      component: () => import('../views/SalesList.vue'),
    },
    {
      path: '/retour',
      name: 'retour',
      component: () => import('../views/CashPrinter.vue'),
    },
    {
      path: '/point-of-sale',
      name: 'point-of-sale',
      component: PointOfSaleManage,
    },
    {
      path: '/cash-register-sessions',
      name: 'cash-register-sessions',
      component: () => import('../views/CashRegisterSessions.vue'),
    },
    {
      path: '/cash-registers/machine-link',
      name: 'cash-registers-machine-link',
      component: () => import('../views/CashRegisterMachineView.vue'),
    },
    { path: '/roles', name: 'roles', component: RoleList },
    { path: '/roles/create', name: 'roles-create', component: RoleCreate },
    { path: '/roles/:id/edit', name: 'roles-edit', component: RoleEdit, props: true },
    { path: '/permissions', name: 'permissions', component: PermissionList },
    { path: '/permissions/create', name: 'permissions-create', component: PermissionCreate },
    { path: '/users', name: 'users', component: UserList },
    {
      path: '/users/create',
      name: 'users-create',
      component: () => import('@/views/users/UserCreate.vue'),
    },
    {
      path: '/users/:id/edit',
      name: 'users-edit',
      component: () => import('@/views/users/UserEdit.vue'),
      props: true,
    },
    {
      path: '/users/:userId/roles',
      name: 'users-roles',
      component: UserRoleManagement,
      props: true,
    },
    {
      path: '/printers',
      name: 'printers',
      component: Printer,
    },
    {
      path: '/printers/create',
      name: 'printers-create',
      component: () => import('../views/PrinterCreateView.vue'),
    },
    {
      path: '/categories',
      name: 'categories',
      component: CategoryManage,
    },
    {
      path: '/cash-transactions',
      name: 'cash-transactions',
      component: () => import('../views/CashTransactions.vue'),
    },
    {
      path: '/billetage',
      name: 'billetage',
      component: () => import('../views/Billetage.vue'),
    },
    {
      path: '/billetage/:sessionId/resume',
      name: 'billetage-summary',
      component: () => import('../views/BilletageSummary.vue'),
    },
  ],
})

// Vérification de l'expiration du token avant chaque navigation
router.beforeEach((to, from, next) => {
  // Ne pas vérifier pour la page de login
  if (to.path === '/' || to.path === '/login') {
    next()
    return
  }

  // Vérifier l'expiration du token
  if (!checkTokenExpiration()) {
    // Token expiré, rediriger vers la page de login
    next('/')
    return
  }

  next()
})

export default router
