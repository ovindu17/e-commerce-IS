import { msalInstance } from '../config/azureAd'
import { loginRequest } from '../config/azureAd'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Helper function to get auth token
const getAuthToken = async () => {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length > 0) {
    try {
      const account = accounts[0]
      // Use access token for Microsoft Graph API validation
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
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
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

export const authAPI = {
  // Get user profile
  getProfile: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`)
  },

  // Update user profile
  updateProfile: async (profileData) => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    })
  },

  // Get user orders (when you add order functionality)
  getOrders: async () => {
    return makeAuthenticatedRequest(`${API_BASE_URL}/users/orders`)
  }
} 