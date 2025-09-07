import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import cartReducer from './cartSlice'
import authReducer from './authSlice'

// Cart persistence configuration
const cartPersistConfig = {
  key: 'cart',
  storage,
  whitelist: ['items', 'totalQuantity', 'totalAmount'], // Only persist cart data
  blacklist: ['isLoading', 'error'] // Don't persist loading states
}

// Auth persistence configuration (optional - for user preferences)
const authPersistConfig = {
  key: 'auth',
  storage,
  whitelist: ['preferences'], // Only persist non-sensitive data
  blacklist: ['user', 'isLoading', 'error'] // Don't persist user data or states
}

const persistedCartReducer = persistReducer(cartPersistConfig, cartReducer)
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer)

// Middleware for hybrid cart synchronization
const cartSyncMiddleware = (store) => (next) => (action) => {
  const result = next(action)
  
  // Only sync cart operations when user is authenticated
  if (action.type.startsWith('cart/') && !action.type.includes('Server')) {
    const state = store.getState()
    const isAuthenticated = state.auth.user !== null
    
    if (isAuthenticated && !state.cart.isOffline) {
      // Debounced server sync for better performance
      const cartActions = ['cart/addToCart', 'cart/removeFromCart', 'cart/removeCompleteItem', 'cart/clearCart']
      
      if (cartActions.includes(action.type)) {
        // Import the async actions
        import('./cartSlice').then(({ 
          addToCartServer, 
          updateCartItemServer, 
          removeCartItemServer, 
          clearCartServer 
        }) => {
          setTimeout(() => {
            try {
              switch (action.type) {
                case 'cart/addToCart':
                  store.dispatch(addToCartServer(action.payload))
                  break
                case 'cart/removeFromCart':
                  const item = state.cart.items.find(item => item.id === action.payload)
                  if (item) {
                    store.dispatch(updateCartItemServer({ 
                      productId: action.payload, 
                      quantity: item.quantity 
                    }))
                  }
                  break
                case 'cart/removeCompleteItem':
                  store.dispatch(removeCartItemServer(action.payload))
                  break
                case 'cart/clearCart':
                  store.dispatch(clearCartServer())
                  break
              }
            } catch (error) {
              console.warn('Failed to sync cart to server:', error)
              store.dispatch({ type: 'cart/setOfflineMode', payload: true })
            }
          }, 500) // Debounce by 500ms
        })
      }
    }
  }
  
  return result
}

export const store = configureStore({
  reducer: {
    cart: persistedCartReducer,
    auth: persistedAuthReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(cartSyncMiddleware),
})

export const persistor = persistStore(store)