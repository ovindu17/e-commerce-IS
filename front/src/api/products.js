import { msalInstance } from '../config/azureAd'
import { loginRequest } from '../config/azureAd'
import { safeApiCall } from '../utils/apiUtils'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const headers = {
    'Content-Type': 'application/json'
  }

  // Add auth token if user is logged in
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    try {
      const account = accounts[0]
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      })
      headers.Authorization = `Bearer ${response.accessToken}`
    } catch (error) {
      console.error('Error getting auth token:', error)
      // Could try interactive token acquisition here if needed
    }
  }

  return headers
}

export const productAPI = {
  getAllProducts: async (category = null) => {
    return safeApiCall(async () => {
      const headers = await getAuthHeaders()
      const url = category && category !== 'all' 
        ? `${API_BASE_URL}/products?category=${encodeURIComponent(category)}`
        : `${API_BASE_URL}/products`
      
      const response = await fetch(url, {
        headers
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products')
      }
      
      return data.data
    })
  },

  getCategories: async () => {
    return safeApiCall(async () => {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/products/categories`, {
        headers
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch categories')
      }
      
      return data.data
    })
  },

  getProductById: async (id) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch product')
      }
      
      return data.data
    } catch (error) {
      console.error('Error fetching product:', error)
      throw error
    }
  },

  getProductsByCategory: async (categoryId) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/products/category/${categoryId}`, {
        headers
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch products')
      }
      
      return data.data
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  },

  searchProducts: async (searchTerm) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/products/search/${encodeURIComponent(searchTerm)}`, {
        headers
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to search products')
      }
      
      return data.data
    } catch (error) {
      console.error('Error searching products:', error)
      throw error
    }
  }
}