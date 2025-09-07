import { msalInstance } from '../config/azureAd'
import { loginRequest } from '../config/azureAd'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Helper function to get auth token
const getAuthToken = async () => {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    try {
      const account = accounts[0]
      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      })
      return response.accessToken
    } catch (error) {
      console.error('Error getting auth token:', error)
      return null
    }
  }
  return null
}

// Helper function to make authenticated requests
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('User not authenticated')
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {})
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const cartAPI = {
  // Get user cart from server
  getCart: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart`)
  },

  // Add item to cart
  addItem: async (item) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart/items`, {
      method: 'POST',
      body: JSON.stringify(item)
    })
  },

  // Update item quantity
  updateItem: async (productId, quantity) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    })
  },

  // Remove item from cart
  removeItem: async (productId) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart/items/${productId}`, {
      method: 'DELETE'
    })
  },

  // Clear entire cart
  clearCart: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart`, {
      method: 'DELETE'
    })
  },

  // Sync local cart to server (for when user logs in)
  syncCart: async (localCart) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/cart/sync`, {
      method: 'POST',
      body: JSON.stringify({ localCart })
    })
  }
} 