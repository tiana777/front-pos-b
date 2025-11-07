import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
const token = localStorage.getItem('token')

export default {
  async getAll() {
    try {
      const response = await axios.get(`${API_BASE_URL}/pointofsales`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des points de vente:', error)
      throw error
    }
  },

  async getById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/pointofsales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du point de vente:', error)
      throw error
    }
  },
}
