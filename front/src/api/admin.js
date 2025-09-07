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

// Helper function to make authenticated admin requests
const makeAdminRequest = async (url, options = {}) => {
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
    if (response.status === 403) {
      throw new Error('Admin access required')
    }
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const adminAPI = {
  // Get all orders with pagination and filters
  getOrders: async (params = {}) => {
    return safeApiCall(async () => {
      const queryParams = new URLSearchParams()
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.status) queryParams.append('status', params.status)
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.search) queryParams.append('search', params.search)
      
      const url = queryParams.toString() 
        ? `${API_BASE_URL}/admin/orders?${queryParams.toString()}`
        : `${API_BASE_URL}/admin/orders`
      
      return makeAdminRequest(url)
    })
  },

  // Get specific order details
  getOrder: async (orderId) => {
    return safeApiCall(async () => {
      return makeAdminRequest(`${API_BASE_URL}/admin/orders/${orderId}`)
    })
  },

  // Update order status
  updateOrderStatus: async (orderId, status, reason = '') => {
    return safeApiCall(async () => {
      return makeAdminRequest(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, reason })
      })
    })
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    return safeApiCall(async () => {
      return makeAdminRequest(`${API_BASE_URL}/admin/dashboard/stats`)
    })
  },

  // Get users list
  getUsers: async () => {
    return safeApiCall(async () => {
      return makeAdminRequest(`${API_BASE_URL}/admin/users`)
    })
  },

  // Delete order (admin only)
  deleteOrder: async (orderId, reason = '') => {
    return safeApiCall(async () => {
      return makeAdminRequest(`${API_BASE_URL}/admin/orders/${orderId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason })
      })
    })
  }
}