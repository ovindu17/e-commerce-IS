import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMsal, useAccount } from '@azure/msal-react'
import { loginRequest } from '../config/azureAd'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  loadCartFromServer, 
  syncCartToServer, 
  setOfflineMode,
  clearError 
} from '../redux/cartSlice'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const { instance, accounts, inProgress } = useMsal()
  const account = useAccount(accounts[0] || {})
  const [error, setError] = useState(null)
  const [previousUser, setPreviousUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const dispatch = useDispatch()
  const cart = useSelector(state => state.cart)
  
  const currentUser = account ? {
    uid: account.homeAccountId,
    email: account.username,
    displayName: account.name || account.username,
    name: account.name || account.username
  } : null

  // Handle cart synchronization when auth state changes
  const handleCartSync = useCallback(async (user) => {
    try {
      dispatch(clearError())
      
      if (user && !previousUser) {
        // User just logged in
        console.log('User logged in, syncing cart...')
        
        const hasLocalItems = cart.items && cart.items.length > 0
        
        if (hasLocalItems) {
          // User has local cart items, sync to server (merge)
          console.log('Syncing local cart to server...')
          await dispatch(syncCartToServer()).unwrap()
          console.log('Cart sync successful')
        } else {
          // No local items, load from server
          console.log('Loading cart from server...')
          await dispatch(loadCartFromServer()).unwrap()
          console.log('Cart loaded from server')
        }
        
        dispatch(setOfflineMode(false))
        
      } else if (!user && previousUser) {
        // User just logged out
        console.log('User logged out, cart will persist locally')
        // Cart remains in local storage, no server sync needed
      }
    } catch (error) {
      console.error('Cart sync failed:', error)
      dispatch(setOfflineMode(true))
    }
  }, [dispatch, previousUser, cart.items])

  // Register new user - Azure AD doesn't support direct registration
  // Users must be registered through Azure AD portal or admin APIs
  const register = async () => {
    setError('User registration must be done through Azure AD portal. Please contact your administrator.')
    throw new Error('Registration not supported with Azure AD')
  }

  // Login user with Azure AD
  const login = async () => {
    setError(null)
    try {
      const response = await instance.loginPopup(loginRequest)
      return response.account
    } catch (error) {
      setError(error.message || 'Login failed')
      throw error
    }
  }

  // Logout user
  const logout = async () => {
    setError(null)
    try {
      await instance.logoutPopup({
        postLogoutRedirectUri: window.location.origin
      })
    } catch (error) {
      setError(error.message || 'Logout failed')
      throw error
    }
  }

  // Get current user's access token
  const getToken = async () => {
    if (account) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: account
        })
        return response.accessToken
      } catch (error) {
        console.error('Error getting token:', error)
        try {
          // If silent token acquisition fails, try interactive
          const response = await instance.acquireTokenPopup(loginRequest)
          return response.accessToken
        } catch (interactiveError) {
          console.error('Interactive token acquisition failed:', interactiveError)
          return null
        }
      }
    }
    return null
  }

  // Manual cart sync function
  const syncCart = async () => {
    if (currentUser) {
      try {
        dispatch(clearError())
        await dispatch(syncCartToServer()).unwrap()
        dispatch(setOfflineMode(false))
        return { success: true }
      } catch (error) {
        dispatch(setOfflineMode(true))
        return { success: false, error: error.message }
      }
    }
    return { success: false, error: 'User not authenticated' }
  }

  // Handle loading state and auth changes
  useEffect(() => {
    if (inProgress === 'none') {
      setLoading(false)
    }
  }, [inProgress])

  // Handle cart sync when user state changes
  useEffect(() => {
    if (!loading && currentUser !== previousUser) {
      handleCartSync(currentUser)
      setPreviousUser(currentUser)
    }
  }, [loading, currentUser?.uid]) // Only depend on uid to prevent infinite re-renders

  const value = {
    currentUser,
    login,
    register,
    logout,
    getToken,
    error,
    setError,
    syncCart,
    isAuthenticated: !!account,
    isLoading: inProgress !== 'none',
    cartSyncStatus: {
      isOnline: !cart.isOffline,
      lastSynced: cart.lastSynced,
      isLoading: cart.isLoading,
      error: cart.error
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading..." />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
} 