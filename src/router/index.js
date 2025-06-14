import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Pos from '../views/Pos.vue'
import Direct from '../views/Direct.vue'
import Product from '../views/Product.vue'
import CashPrinter from '../views/CashPrinter.vue'
import UserSales from '../views/UserSales.vue'
import PointOfSaleManage from '../views/PointOfSaleManage.vue'

import Table from '../views/Table.vue'

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
      component: Direct,
    },
    {
      path: '/table',
      name: 'table',
      component: Table,
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
  ],
})

export default router
