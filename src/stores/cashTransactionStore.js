import { defineStore } from 'pinia'
import axios from 'axios'

export const useCashTransactionStore = defineStore('cashTransaction', {
  state: () => ({
    transactions: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchTransactions() {
      this.loading = true
      this.error = null
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get('http://127.0.0.1:8000/api/cash-transactions', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.transactions = Array.isArray(response.data) ? response.data : []
      } catch (error) {
        console.error('Erreur chargement transactions:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des transactions'
      } finally {
        this.loading = false
      }
    },
    async createTransaction(transactionData) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post('http://127.0.0.1:8000/api/cash-transactions', transactionData, {
          headers: { Authorization: `Bearer ${token}` },
        })
        // After creating, refresh the list
        await this.fetchTransactions()
        return response.data
      } catch (error) {
        console.error('Erreur création transaction:', error)
        throw error
      }
    },
  },
})
