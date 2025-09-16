import { ref } from 'vue'
import axios from 'axios'

const getPrinterTypeLabel = (type) => {
  const labels = { cash: 'Cash', kitchen: 'Cuisine', bar: 'Bar', invoice: 'Facture' }
  return labels[type] || type
}

export function usePrinterTypes() {
  const printerTypes = ref([])

  const fetchPrinterTypes = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://127.0.0.1:8000/api/printer-types', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = response.data.data ? response.data.data : response.data
      if (Array.isArray(data)) {
        printerTypes.value = data
      }
    } catch (error) {
      console.error('Failed to fetch printer types:', error)
      printerTypes.value = []
    }
  }

  return {
    printerTypes,
    fetchPrinterTypes,
    getPrinterTypeLabel,
  }
}
