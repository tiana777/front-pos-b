import axios from 'axios'

const API_URL = 'http://localhost:8000/api/permissions'
const token = localStorage.getItem('token')

export default {
  getAll() {
    return axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  create(permission) {
    return axios.post(API_URL, permission, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
  delete(id) {
    return axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
