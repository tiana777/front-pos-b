import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import DirectSale from '../views/DirectSale.vue'
import Product from '../views/Product.vue'
import CashPrinter from '../views/CashPrinter.vue'
import UserSales from '../views/UserSales.vue'
import PointOfSaleManage from '../views/PointOfSaleManage.vue'
import Dashboard from '../views/Dashboard.vue'
import DashboardOverview from '../views/DashboardOverview.vue'

import RoleList from '@/views/roles/RoleList.vue'
import RoleCreate from '@/views/roles/RoleCreate.vue'
import RoleEdit from '@/views/roles/RoleEdit.vue'
import PermissionList from '@/views/permissions/PermissionList.vue'
import PermissionCreate from '@/views/permissions/PermissionCreate.vue'
import UserList from '@/views/users/UserList.vue'
import UserRoleManagement from '@/views/users/UserRoleManagement.vue'
import Printer from '../views/Printer.vue'

import Table from '../views/Table.vue'

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
      path: '/direct',
      redirect: { name: 'dashboard-direct' },
    },
    {
      path: '/table',
      redirect: { name: 'dashboard-table' },
    },
    {
      path: '/product',
      redirect: { name: 'dashboard-product' },
    },
    // Dashboard with nested tabs
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      children: [
        {
          path: '',
          name: 'dashboard-overview',
          component: DashboardOverview,
        },
        {
          path: 'direct',
          name: 'dashboard-direct',
          component: DirectSale,
        },
        {
          path: 'table',
          name: 'dashboard-table',
          component: Table,
        },
        {
          path: 'product',
          name: 'dashboard-product',
          component: Product,
        },
        {
          path: 'ventes',
          name: 'dashboard-ventes',
          component: () => import('../views/SalesList.vue'),
          props: { embedded: true },
        },
        {
          path: 'user-sales',
          name: 'dashboard-user-sales',
          component: UserSales,
          props: { embedded: true },
        },
        {
          path: 'retour',
          name: 'dashboard-retour',
          component: () => import('../views/CashPrinter.vue'),
        },
        {
          path: 'point-of-sale',
          name: 'dashboard-point-of-sale',
          component: PointOfSaleManage,
        },
        {
          path: 'cash-register-sessions',
          name: 'dashboard-cash-register-sessions',
          component: () => import('../views/CashRegisterSessions.vue'),
        },
        {
          path: 'printers',
          name: 'dashboard-printers',
          component: Printer,
        },
        {
          path: 'roles',
          name: 'dashboard-roles',
          component: RoleList,
        },
        {
          path: 'roles/create',
          name: 'dashboard-roles-create',
          component: RoleCreate,
        },
        {
          path: 'roles/:id/edit',
          name: 'dashboard-roles-edit',
          component: RoleEdit,
          props: true,
        },
        {
          path: 'permissions',
          name: 'dashboard-permissions',
          component: PermissionList,
        },
        {
          path: 'permissions/create',
          name: 'dashboard-permissions-create',
          component: PermissionCreate,
        },
        {
          path: 'users',
          name: 'dashboard-users',
          component: UserList,
        },
        {
          path: 'users/create',
          name: 'dashboard-users-create',
          component: () => import('@/views/users/UserCreate.vue'),
        },
        {
          path: 'users/:id/edit',
          name: 'dashboard-users-edit',
          component: () => import('@/views/users/UserEdit.vue'),
          props: true,
        },
        {
          path: 'users/:userId/roles',
          name: 'dashboard-users-roles',
          component: UserRoleManagement,
          props: true,
        },
      ],
    },
    {
      path: '/cash-printer',
      name: 'cashprinter',
      component: CashPrinter,
    },
    {
      path: '/sales-list',
      redirect: { name: 'dashboard-ventes' },
    },
    {
      path: '/user-sales',
      redirect: { name: 'dashboard-user-sales' },
    },
    {
      path: '/retour',
      redirect: { name: 'dashboard-retour' },
    },
    {
      path: '/point-of-sale',
      redirect: { name: 'dashboard-point-of-sale' },
    },
    {
      path: '/cash-register-sessions',
      redirect: { name: 'dashboard-cash-register-sessions' },
    },
    { path: '/roles', redirect: { name: 'dashboard-roles' } },
    { path: '/roles/create', redirect: { name: 'dashboard-roles-create' } },
    {
      path: '/roles/:id/edit',
      redirect: (to) => ({ name: 'dashboard-roles-edit', params: to.params }),
    },
    { path: '/permissions', redirect: { name: 'dashboard-permissions' } },
    { path: '/permissions/create', redirect: { name: 'dashboard-permissions-create' } },
    {
      path: '/users',
      redirect: { name: 'dashboard-users' },
    },
    {
      path: '/users/create',
      redirect: { name: 'dashboard-users-create' },
    },
    {
      path: '/users/:id/edit',
      redirect: (to) => ({ name: 'dashboard-users-edit', params: to.params }),
    },
    {
      path: '/users/:userId/roles',
      redirect: (to) => ({ name: 'dashboard-users-roles', params: to.params }),
    },
    {
      path: '/printers',
      redirect: { name: 'dashboard-printers' },
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
