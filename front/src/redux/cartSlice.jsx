import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { cartAPI } from '../api/cart'

// Helper function to calculate totals
const calculateTotals = (items) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  return { totalQuantity, totalAmount: parseFloat(totalAmount.toFixed(2)) }
}

// Async thunks for server operations
export const loadCartFromServer = createAsyncThunk(
  'cart/loadFromServer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.getCart()
      return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const addToCartServer = createAsyncThunk(
  'cart/addToServer',
  async (item, { getState, rejectWithValue }) => {
    try {
      const response = await cartAPI.addItem(item)
      return { item, serverResponse: response.data }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const updateCartItemServer = createAsyncThunk(
  'cart/updateItemServer',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const response = await cartAPI.updateItem(productId, quantity)
      return { productId, quantity, serverResponse: response.data }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const removeCartItemServer = createAsyncThunk(
  'cart/removeItemServer',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await cartAPI.removeItem(productId)
      return { productId, serverResponse: response.data }
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const clearCartServer = createAsyncThunk(
  'cart/clearServer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await cartAPI.clearCart()
      return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

export const syncCartToServer = createAsyncThunk(
  'cart/syncToServer',
  async (_, { getState, rejectWithValue }) => {
    try {
      const localCart = getState().cart
      const response = await cartAPI.syncCart(localCart)
      return response.data
    } catch (error) {
      return rejectWithValue(error.message)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalQuantity: 0,
    totalAmount: 0,
    isLoading: false,
    error: null,
    lastSynced: null,
    isOffline: false
  },
  reducers: {
    // Local operations (immediate UI updates)
    addToCart: (state, action) => {
      const newItem = action.payload
      const existingItem = state.items.find(item => item.id === newItem.id)
      const price = parseFloat(newItem.price) || 0
      
      if (!existingItem) {
        state.items.push({
          id: newItem.id,
          name: newItem.name,
          price: price,
          quantity: 1,
          totalPrice: price,
          image: newItem.image
        })
      } else {
        existingItem.quantity++
        existingItem.totalPrice = parseFloat((existingItem.totalPrice + price).toFixed(2))
      }
      
      const totals = calculateTotals(state.items)
      state.totalQuantity = totals.totalQuantity
      state.totalAmount = totals.totalAmount
      state.lastModified = Date.now()
    },

    removeFromCart: (state, action) => {
      const id = action.payload
      const existingItem = state.items.find(item => item.id === id)
      
      if (existingItem) {
        const price = parseFloat(existingItem.price) || 0
        
        if (existingItem.quantity === 1) {
          state.items = state.items.filter(item => item.id !== id)
        } else {
          existingItem.quantity--
          existingItem.totalPrice = parseFloat((existingItem.totalPrice - price).toFixed(2))
        }
        
        const totals = calculateTotals(state.items)
        state.totalQuantity = totals.totalQuantity
        state.totalAmount = totals.totalAmount
        state.lastModified = Date.now()
      }
    },

    removeCompleteItem: (state, action) => {
      const id = action.payload
      state.items = state.items.filter(item => item.id !== id)
      
      const totals = calculateTotals(state.items)
      state.totalQuantity = totals.totalQuantity
      state.totalAmount = totals.totalAmount
      state.lastModified = Date.now()
    },

    clearCart: (state) => {
      state.items = []
      state.totalQuantity = 0
      state.totalAmount = 0
      state.lastModified = Date.now()
    },

    setOfflineMode: (state, action) => {
      state.isOffline = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    // Replace local cart with server cart (for login sync)
    replaceCart: (state, action) => {
      const { items, totalQuantity, totalAmount } = action.payload
      state.items = items || []
      state.totalQuantity = totalQuantity || 0
      state.totalAmount = totalAmount || 0
      state.lastSynced = Date.now()
    }
  },
  
  extraReducers: (builder) => {
    builder
      // Load cart from server
      .addCase(loadCartFromServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loadCartFromServer.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload.items || []
        state.totalQuantity = action.payload.totalQuantity || 0
        state.totalAmount = action.payload.totalAmount || 0
        state.lastSynced = Date.now()
      })
      .addCase(loadCartFromServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isOffline = true
      })

      // Add to cart server
      .addCase(addToCartServer.fulfilled, (state, action) => {
        state.lastSynced = Date.now()
        state.error = null
      })
      .addCase(addToCartServer.rejected, (state, action) => {
        state.error = action.payload
        state.isOffline = true
      })

      // Update cart item server
      .addCase(updateCartItemServer.fulfilled, (state, action) => {
        state.lastSynced = Date.now()
        state.error = null
      })
      .addCase(updateCartItemServer.rejected, (state, action) => {
        state.error = action.payload
        state.isOffline = true
      })

      // Remove cart item server
      .addCase(removeCartItemServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(removeCartItemServer.fulfilled, (state, action) => {
        const { productId } = action.payload
        state.items = state.items.filter(item => item.id !== productId)
        
        const totals = calculateTotals(state.items)
        state.totalQuantity = totals.totalQuantity
        state.totalAmount = totals.totalAmount
        state.lastSynced = Date.now()
        state.isLoading = false
        state.error = null
      })
      .addCase(removeCartItemServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isOffline = true
      })

      // Clear cart server
      .addCase(clearCartServer.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(clearCartServer.fulfilled, (state, action) => {
        state.items = []
        state.totalQuantity = 0
        state.totalAmount = 0
        state.lastSynced = Date.now()
        state.isLoading = false
        state.error = null
      })
      .addCase(clearCartServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isOffline = true
      })

      // Sync cart to server
      .addCase(syncCartToServer.pending, (state) => {
        state.isLoading = true
      })
      .addCase(syncCartToServer.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload.items || []
        state.totalQuantity = action.payload.totalQuantity || 0
        state.totalAmount = action.payload.totalAmount || 0
        state.lastSynced = Date.now()
        state.isOffline = false
        state.error = null
      })
      .addCase(syncCartToServer.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
        state.isOffline = true
      })
  }
})

export const { 
  addToCart, 
  removeFromCart, 
  removeCompleteItem, 
  clearCart, 
  setOfflineMode, 
  clearError,
  replaceCart 
} = cartSlice.actions

export default cartSlice.reducer