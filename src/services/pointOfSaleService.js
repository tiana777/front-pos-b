import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const token = localStorage.getItem('token')

export default {
  async getAll() {
    try {
      const response = await axios.get(`${API_URL}/pointofsales`, {
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
      const response = await axios.get(`${API_URL}/pointofsales/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération du point de vente:', error)
      throw error
    }
  },
}
