import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addToCart, removeFromCart, clearCart, removeCompleteItem, removeCartItemServer, clearCartServer } from '../redux/cartSlice'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../hooks/useToast'
import { X, Plus, Minus, ShoppingCart, Trash2, Wifi, WifiOff, RefreshCw, Zap } from 'lucide-react'
import Button from './Button'

const Cart = ({ isOpen, onClose }) => {
  const cart = useSelector(state => state.cart)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { currentUser, syncCart, cartSyncStatus } = useAuth()
  const { toast } = useToast()
  const [syncing, setSyncing] = useState(false)

  const handleIncreaseQuantity = (item) => {
    dispatch(addToCart(item))
  }

  const handleDecreaseQuantity = (id) => {
    dispatch(removeFromCart(id))
  }

  const handleRemoveItem = (id) => {
    // Find the item name for the toast message
    const item = cart.items.find(item => item.id === id)
    const itemName = item ? item.name : 'Item'
    
    if (currentUser) {
      // For authenticated users, remove from server and local state
      dispatch(removeCartItemServer(id))
    } else {
      // For guest users, only remove from local state
      dispatch(removeCompleteItem(id))
    }
    
    // Show info toast
    toast.info(`${itemName} removed from cart`, {
      duration: 2500
    })
  }

  const handleClearCart = () => {
    if (currentUser) {
      // For authenticated users, clear from server and local state
      dispatch(clearCartServer())
    } else {
      // For guest users, only clear local state
      dispatch(clearCart())
    }
    
    // Show info toast
    toast.info('Cart cleared', {
      duration: 2500
    })
  }

  const handleManualSync = async () => {
    if (!currentUser) return
    
    setSyncing(true)
    try {
      const result = await syncCart()
      if (result.success) {
        console.log('Manual cart sync successful')
        toast.success('Cart synced successfully', {
          duration: 2500
        })
      } else {
        console.error('Manual cart sync failed:', result.error)
        toast.error('Failed to sync cart', {
          duration: 3000
        })
      }
    } catch (error) {
      console.error('Manual sync error:', error)
      toast.error('Failed to sync cart', {
        duration: 3000
      })
    } finally {
      setSyncing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop with transparent blur */}
      <div 
        className="absolute inset-0 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Cart Modal - Centered */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-3xl shadow-2xl w-full max-w-xl mx-auto max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              MY CART
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {cart.items.length === 0 ? (
              /* Empty Cart */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingCart size={64} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-500 mb-6">
                  Add some products to get started!
                </p>
                                 <Button
                   onClick={onClose}
                   variant="primary"
                   size="small"
                 >
                   Continue Shopping
                 </Button>
              </div>
            ) : (
              <>
                                                  {/* Cart Items */}
                 <div className="flex-1 overflow-y-auto px-8 min-h-0 pb-6">
                   <div className="space-y-8">
                     {cart.items.map((item) => (
                      <div key={item.id} className="flex items-start space-x-4">
                                                 {/* Product Image */}
                         <div className="flex-shrink-0">
                           <div className="w-24 h-24 bg-blue-100 rounded-2xl overflow-hidden">
                            <img
                              src={item.image || '/images/placeholder.jpg'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            Weight: 1.5 oz (43 G) TIN
                          </p>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                          >
                            remove
                          </button>
                        </div>

                        {/* Quantity and Price */}
                        <div className="flex flex-col items-end space-y-2">
                          {/* Quantity Selector */}
                                                     <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                             <button
                               onClick={() => handleDecreaseQuantity(item.id)}
                               className="p-3 hover:bg-gray-200 transition-colors"
                               disabled={item.quantity <= 1}
                             >
                               <Minus size={16} className="text-gray-600" />
                             </button>
                             <span className="px-5 py-3 text-sm font-medium bg-white min-w-[50px] text-center">
                               {item.quantity}
                             </span>
                             <button
                               onClick={() => handleIncreaseQuantity(item)}
                               className="p-3 hover:bg-gray-200 transition-colors"
                             >
                               <Plus size={16} className="text-gray-600" />
                             </button>
                           </div>
                          
                                                     {/* Price */}
                           <div className="text-lg font-semibold text-gray-900">
                             ${Number(item.totalPrice || (item.price * item.quantity) || 0).toFixed(0)}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                                                  {/* Cart Footer */}
                 <div className="flex-shrink-0 bg-white p-8 pt-6 space-y-6 border-t border-gray-100">
                   {/* Subtotal */}
                   <div className="flex justify-between text-lg font-semibold">
                     <span>Subtotal</span>
                     <span>{cart.totalQuantity} items ${cart.totalAmount.toFixed(0)}</span>
                   </div>

                   {/* Free Shipping Message */}
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                     <Zap size={16} className="text-yellow-500" />
                     <span>Receive Free Shipping when your cart total $49</span>
                   </div>

                   {/* Checkout Button */}
                   <Button 
                     className="w-full"
                     onClick={() => {
                       if (!currentUser) {
                         toast.error('Please sign in to proceed to checkout')
                         return
                       }
                       if (cart.items.length === 0) {
                         toast.error('Your cart is empty')
                         return
                       }
                       onClose() // Close cart
                       navigate('/checkout')
                     }}
                   >
                     CONTINUE TO CHECKOUT
                   </Button>
                 </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart