import { ref } from 'vue'
import axios from 'axios'

const rawApiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const API_BASE_URL = rawApiBaseUrl.replace(/\/?$/, '')

export function useCategories() {
  const categories = ref([])
  const products = ref([])
  const filteredProducts = ref([])
  const activeCategory = ref(null)
  const categoryPrinterTypes = ref({})
  const productCatalog = ref({})

  const loadCategories = async () => {
    console.log('loadCategories: Starting function execution')

    try {
      const token = localStorage.getItem('token')
      console.log('loadCategories: Token retrieved:', token ? 'Present' : 'Missing')
      if (!token) {
        console.log('loadCategories: No token found, returning early')
        return
      }

      console.log('loadCategories: Making /me API call')
      const userResponse = await axios.get(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const user = userResponse.data.user
      console.log('loadCategories: User data received:', user)

      if (!user.point_of_sale_id) {
        console.log('loadCategories: No point_of_sale_id in user data, returning early')
        return
      }

      console.log('loadCategories: Making /categories API call with point_of_sale_id:', user.point_of_sale_id)
      const response = await axios.get(`${API_BASE_URL}/categories`, {
        params: {
          'with_products': 1,
          'point_of_sale_id': user.point_of_sale_id,
          'with_pricing': 1,
        },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const rawCategories = Array.isArray(response.data) ? response.data : response.data.data || []
      console.log('loadCategories: Raw categories received:', rawCategories.length, 'categories')

      const categoryPrinterMap = { ...categoryPrinterTypes.value }
      const aggregatedProducts = []

      console.log('loadCategories: Processing categories for printer types')
      rawCategories.forEach(category => {
        if (!category || !category.id) return
        const printerTypeId = resolveCategoryPrinterTypeId(category)
        if (printerTypeId) {
          categoryPrinterMap[category.id] = printerTypeId
        }
      })
      console.log('loadCategories: Category printer map after processing:', categoryPrinterMap)

      console.log('loadCategories: Normalizing products')
      rawCategories.forEach(category => {
        const fallbackPrinterTypeId = resolveCategoryPrinterTypeId(category) ?? (category?.id ? categoryPrinterMap[category.id] : null)
        if (Array.isArray(category?.products)) {
          category.products = category.products.map(product => {
            const normalized = normalizeProduct(product, category, fallbackPrinterTypeId)
            aggregatedProducts.push(normalized)
            return normalized
          })
        }
      })
      console.log('loadCategories: Aggregated products count:', aggregatedProducts.length)

      categories.value = rawCategories
      categoryPrinterTypes.value = categoryPrinterMap
      products.value = aggregatedProducts
      filteredProducts.value = aggregatedProducts

      console.log('loadCategories: Function completed successfully')
    } catch (error) {
      console.error('loadCategories: Error occurred:', error)
      console.error('loadCategories: Error response:', error.response?.data)
      console.error('loadCategories: Error status:', error.response?.status)
      console.error('loadCategories: Error message:', error.message)
    }
  }

  const loadProducts = (category) => {
    activeCategory.value = category
    const fallbackPrinterTypeId = resolveCategoryPrinterTypeId(category)
    const categoryProducts = category?.products || []

    filteredProducts.value = categoryProducts.map(product => {
      const categoryId = product.category_id ?? category?.id ?? null
      const printerTypeId = product.printer_type_id ?? resolveProductPrinterTypeId(product, category) ?? fallbackPrinterTypeId
      const price = Number(
        product.price ??
        (Array.isArray(product.pricing) && product.pricing.length ? parseFloat(product.pricing[0].price) : 0)
      ) || 0
      const stock = resolveProductStock(product)

      const normalized = {
        ...product,
        category_id: categoryId,
        printer_type_id: printerTypeId,
        price,
        stock,
      }

      normalized.isAvailable = checkProductAvailability(normalized)

      registerProduct(normalized, {
        category,
        category_id: categoryId,
        printer_type_id: printerTypeId,
        price
      })

      return normalized
    })
  }

  const resolveCategoryPrinterTypeId = (category) => {
    if (!category) return null
    if (category.printer_type_id) return category.printer_type_id
    if (typeof category.printer_type === 'number') return category.printer_type
    if (category.printer_type && typeof category.printer_type === 'object') {
      return category.printer_type.id ?? category.printer_type.printer_type_id ?? null
    }
    if (category.id && categoryPrinterTypes.value[category.id]) {
      return categoryPrinterTypes.value[category.id]
    }
    return null
  }

  const resolveProductPrinterTypeId = (product, fallbackCategory = null) => {
    if (!product) return null
    if (product.printer_type_id) return product.printer_type_id
    if (typeof product.printer_type === 'number') return product.printer_type
    if (product.printer_type && typeof product.printer_type === 'object') {
      return product.printer_type.id ?? product.printer_type.printer_type_id ?? null
    }
    const resolvedCategory = product.category || fallbackCategory || (product.category_id ? { id: product.category_id } : null)
    if (resolvedCategory && resolvedCategory.printer_type_id) {
      return resolvedCategory.printer_type_id
    }
    if (resolvedCategory && resolvedCategory.printer_type && typeof resolvedCategory.printer_type === 'object') {
      return resolvedCategory.printer_type.id ?? resolvedCategory.printer_type.printer_type_id ?? null
    }
    if (resolvedCategory && resolvedCategory.id && categoryPrinterTypes.value[resolvedCategory.id]) {
      return categoryPrinterTypes.value[resolvedCategory.id]
    }
    if (product.category_id && categoryPrinterTypes.value[product.category_id]) {
      return categoryPrinterTypes.value[product.category_id]
    }
    return null
  }

  const registerProduct = (product, overrides = {}) => {
    if (!product || !product.id) return

    const category = overrides.category || product.category || null
    const categoryId = overrides.category_id ?? product.category_id ?? category?.id ?? null
    const resolvedCategoryPrinterType = overrides.printer_type_id ?? resolveProductPrinterTypeId(product, category) ?? (categoryId ? categoryPrinterTypes.value[categoryId] : null)
    const price = Number(overrides.price ?? product.price ?? (product.pricing?.[0]?.price ? parseFloat(product.pricing[0].price) : 0)) || 0

    if (categoryId && resolvedCategoryPrinterType && categoryPrinterTypes.value[categoryId] !== resolvedCategoryPrinterType) {
      categoryPrinterTypes.value = {
        ...categoryPrinterTypes.value,
        [categoryId]: resolvedCategoryPrinterType
      }
    }

    productCatalog.value = {
      ...productCatalog.value,
      [product.id]: {
        id: product.id,
        name: product.name,
        category_id: categoryId,
        printer_type_id: resolvedCategoryPrinterType,
        price,
        product: { ...product }
      }
    }
  }

  const normalizeProduct = (product, category, fallbackPrinterTypeId = null) => {
    if (!product) return null

    const normalizedCategoryId = product.category_id ?? category?.id ?? null
    const normalizedPrice = Number(
      product.price ??
      (Array.isArray(product.pricing) && product.pricing.length ? parseFloat(product.pricing[0].price) : 0)
    ) || 0
    const normalizedPrinterTypeId = resolveProductPrinterTypeId(product, category) ?? fallbackPrinterTypeId ?? (normalizedCategoryId ? categoryPrinterTypes.value[normalizedCategoryId] : null)

    const baseProduct = {
      ...product,
      category_id: normalizedCategoryId,
      price: normalizedPrice,
      printer_type_id: normalizedPrinterTypeId
    }

    const stock = resolveProductStock(baseProduct)
    const normalizedProduct = {
      ...baseProduct,
      stock: stock,
    }

    normalizedProduct.isAvailable = checkProductAvailability(normalizedProduct)

    registerProduct(normalizedProduct, {
      category,
      category_id: normalizedCategoryId,
      printer_type_id: normalizedPrinterTypeId,
      price: normalizedPrice
    })

    return normalizedProduct
  }

  const resolveProductStock = (product) => {
    if (!product) return null

    const candidates = [
      product.stock,
      product.available_stock,
      product.quantity,
      product.available_quantity,
      product.inventory?.quantity,
      product.inventory?.stock
    ]

    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }

      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (trimmed !== '') {
          const parsed = Number(trimmed)
          if (Number.isFinite(parsed)) {
            return parsed
          }
        }
      }
    }

    return null
  }

  const checkProductAvailability = (product) => {
    if (!product) {
      return false
    }

    if (Object.prototype.hasOwnProperty.call(product, 'is_available')) {
      return Boolean(product.is_available)
    }

    if (Object.prototype.hasOwnProperty.call(product, 'isAvailable')) {
      return Boolean(product.isAvailable)
    }

    const stock = resolveProductStock(product)
    const hasStock = stock === null || stock === undefined ? true : Number(stock) > 0

    const rawPrice = product.price ?? (Array.isArray(product.pricing) && product.pricing.length ? product.pricing[0].price : 0)
    const numericPrice = Number(rawPrice)
    const hasValidPrice = !Number.isNaN(numericPrice) && numericPrice > 0

    return hasStock && hasValidPrice
  }

  return {
    categories,
    products,
    filteredProducts,
    activeCategory,
    categoryPrinterTypes,
    productCatalog,
    loadCategories,
    loadProducts,
    resolveCategoryPrinterTypeId,
    resolveProductPrinterTypeId,
    registerProduct,
    normalizeProduct,
    resolveProductStock,
    checkProductAvailability
  }
}
