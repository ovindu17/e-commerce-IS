import { msalInstance } from '../config/azureAd'
import { loginRequest } from '../config/azureAd'
import { safeApiCall } from '../utils/apiUtils'

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

export const orderAPI = {
  // Create new order
  createOrder: async (orderData) => {
    return safeApiCall(async () => {
      return makeAuthenticatedRequest(`${API_BASE_URL}/orders`, {
        method: 'POST',
        body: JSON.stringify(orderData)
      })
    })
  },

  // Get user orders
  getOrders: async (params = {}) => {
    return safeApiCall(async () => {
      const queryParams = new URLSearchParams()
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.offset) queryParams.append('offset', params.offset)
      if (params.status) queryParams.append('status', params.status)
      
      const url = queryParams.toString() 
        ? `${API_BASE_URL}/orders?${queryParams.toString()}`
        : `${API_BASE_URL}/orders`
      
      return makeAuthenticatedRequest(url)
    })
  },

  // Get specific order
  getOrder: async (orderId) => {
    return safeApiCall(async () => {
      return makeAuthenticatedRequest(`${API_BASE_URL}/orders/${orderId}`)
    })
  },

  // Cancel order
  cancelOrder: async (orderId, reason = 'Cancelled by customer') => {
    return safeApiCall(async () => {
      return makeAuthenticatedRequest(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      })
    })
  },

  // Get order statistics
  getOrderStats: async () => {
    return safeApiCall(async () => {
      return makeAuthenticatedRequest(`${API_BASE_URL}/orders/stats/summary`)
    })
  },

  // Update order status (for future admin functionality)
  updateOrderStatus: async (orderId, status, reason = '') => {
    return safeApiCall(async () => {
      return makeAuthenticatedRequest(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      })
    })
  }
}