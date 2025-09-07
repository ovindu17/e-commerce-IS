import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { orderAPI } from '../api/orders'
import { authAPI } from '../api/auth'
import { clearCart } from '../redux/cartSlice'
import { useToast } from '../hooks/useToast'
import ProtectedRoute from '../components/ProtectedRoute'
import Button from '../components/Button'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Globe,
  ShoppingBag,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser } = useAuth()
  const { toast } = useToast()
  const cart = useSelector(state => state.cart)
  
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [orderPlaced, setOrderPlaced] = useState(false) // Track if order was successfully placed
  
  // Form data - removed redundant customer info fields
  const [formData, setFormData] = useState({
    shippingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    billingAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    sameAsShipping: true,
    paymentMethod: 'cash_on_delivery',
    customerNotes: ''
  })
  
  const [errors, setErrors] = useState({})

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile()
  }, [])

  // Redirect if cart is empty (but not if order was just placed)
  useEffect(() => {
    if (!profileLoading && !orderPlaced && (!cart.items || cart.items.length === 0)) {
      navigate('/')
      toast.error('Your cart is empty')
    }
  }, [cart.items, profileLoading, orderPlaced, navigate, toast])

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await authAPI.getProfile()
      const profile = response.data
      setUserProfile(profile)
      
      // Pre-fill shipping address with user profile country
      setFormData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          country: profile.country || ''
        }
      }))
    } catch (error) {
      console.error('Failed to load user profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    
    // Clear error when user starts typing
    if (errors[`${section}.${field}`]) {
      setErrors(prev => ({
        ...prev,
        [`${section}.${field}`]: ''
      }))
    }
  }

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate profile completeness (customer info from profile)
    if (!userProfile?.name?.trim()) {
      newErrors['profile.name'] = 'Please complete your profile name before checkout'
    }
    if (!userProfile?.contact_number?.trim()) {
      newErrors['profile.contact_number'] = 'Please add your contact number in your profile before checkout'
    }
    
    // Shipping address validation
    if (!formData.shippingAddress.line1.trim()) {
      newErrors['shippingAddress.line1'] = 'Address line 1 is required'
    }
    if (!formData.shippingAddress.city.trim()) {
      newErrors['shippingAddress.city'] = 'City is required'
    }
    if (!formData.shippingAddress.country.trim()) {
      newErrors['shippingAddress.country'] = 'Country is required'
    }
    
    // Billing address validation (if different from shipping)
    if (!formData.sameAsShipping) {
      if (!formData.billingAddress.line1.trim()) {
        newErrors['billingAddress.line1'] = 'Billing address line 1 is required'
      }
      if (!formData.billingAddress.city.trim()) {
        newErrors['billingAddress.city'] = 'Billing city is required'
      }
      if (!formData.billingAddress.country.trim()) {
        newErrors['billingAddress.country'] = 'Billing country is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateTotals = () => {
    const subtotal = cart.totalAmount || 0
    const taxRate = 0.1 // 10% tax
    const taxAmount = subtotal * taxRate
    const shippingAmount = subtotal > 100 ? 0 : 15 // Free shipping over $100
    const total = subtotal + taxAmount + shippingAmount
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      shippingAmount: parseFloat(shippingAmount.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    }
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        cartItems: cart.items,
        customerInfo: {
          name: userProfile.name,
          email: userProfile.email || currentUser?.email,
          phone: userProfile.contact_number,
          country: userProfile.country
        },
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.sameAsShipping ? formData.shippingAddress : formData.billingAddress,
        sameAsShipping: formData.sameAsShipping,
        paymentMethod: formData.paymentMethod,
        customerNotes: formData.customerNotes
      }
      
      const response = await orderAPI.createOrder(orderData)
      
      // Mark order as placed to prevent cart empty redirect
      setOrderPlaced(true)
      
      // Clear cart from Redux store
      dispatch(clearCart())
      
      // Show success message
      toast.success('Order placed successfully!')
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Navigate to order confirmation with proper field mapping
      navigate('/order-confirmation', {
        state: {
          orderNumber: response.data.orderNumber,
          orderId: response.data.orderId,
          totalAmount: response.data.totalAmount,
          status: response.data.status,
          createdAt: response.data.createdAt
        },
        replace: true // Use replace to prevent back button issues
      })
      
    } catch (error) {
      console.error('Order placement failed:', error)
      toast.error(error.message || 'Failed to place order. Please try again.')
      // Reset orderPlaced flag on error so cart empty check works again
      setOrderPlaced(false)
    } finally {
      setLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <LoadingSpinner size="lg" message="Loading checkout..." />
        </div>
      </ProtectedRoute>
    )
  }

  const totals = calculateTotals()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Continue Shopping</span>
                </button>
                <span className="text-gray-500">/</span>
                <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Checkout Form */}
            <div className="lg:col-span-8">
              <div className="space-y-8">
                
                {/* Profile Summary */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <User size={24} className="text-gray-600" />
                      <h2 className="text-xl font-semibold text-gray-900">Your Information</h2>
                    </div>
                    <Link to="/profile" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Edit Profile
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Name</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {userProfile?.name || 'Please add your name in profile'}
                      </p>
                      {errors['profile.name'] && (
                        <p className="text-red-500 text-sm">{errors['profile.name']}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Email</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {userProfile?.email || currentUser?.email}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Phone</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {userProfile?.contact_number || 'Please add your phone number in profile'}
                      </p>
                      {errors['profile.contact_number'] && (
                        <p className="text-red-500 text-sm">{errors['profile.contact_number']}</p>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-600">Country</span>
                      </div>
                      <p className="text-gray-900 font-medium">
                        {userProfile?.country || 'Not specified'}
                      </p>
                    </div>
                  </div>
                  
                  {(errors['profile.name'] || errors['profile.contact_number']) && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-orange-600 mt-0.5" />
                        <div className="text-sm text-orange-700">
                          <p className="font-medium mb-1">Profile Incomplete</p>
                          <p>Please complete your profile information before placing an order.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <Truck size={24} className="text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Shipping Address</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 1 *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.line1}
                        onChange={(e) => handleInputChange('shippingAddress', 'line1', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors['shippingAddress.line1'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Street address, P.O. box, company name, c/o"
                      />
                      {errors['shippingAddress.line1'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shippingAddress.line1']}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.line2}
                        onChange={(e) => handleInputChange('shippingAddress', 'line2', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Apartment, suite, unit, building, floor, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.city}
                          onChange={(e) => handleInputChange('shippingAddress', 'city', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors['shippingAddress.city'] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="City"
                        />
                        {errors['shippingAddress.city'] && (
                          <p className="text-red-500 text-sm mt-1">{errors['shippingAddress.city']}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State/Province
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.state}
                          onChange={(e) => handleInputChange('shippingAddress', 'state', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="State"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Postal Code
                        </label>
                        <input
                          type="text"
                          value={formData.shippingAddress.postalCode}
                          onChange={(e) => handleInputChange('shippingAddress', 'postalCode', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="ZIP/Postal Code"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={formData.shippingAddress.country}
                        onChange={(e) => handleInputChange('shippingAddress', 'country', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors['shippingAddress.country'] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Country"
                      />
                      {errors['shippingAddress.country'] && (
                        <p className="text-red-500 text-sm mt-1">{errors['shippingAddress.country']}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <CreditCard size={24} className="text-gray-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash_on_delivery"
                        checked={formData.paymentMethod === 'cash_on_delivery'}
                        onChange={(e) => handleCheckboxChange('paymentMethod', e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle size={16} className="text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Cash on Delivery</div>
                          <div className="text-sm text-gray-500">Pay when your order arrives</div>
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={20} className="text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Payment on Delivery</p>
                        <p>You can pay with cash or card when your order is delivered to your address. Please have the exact amount ready.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Notes */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Notes (Optional)</h2>
                  <textarea
                    value={formData.customerNotes}
                    onChange={(e) => handleCheckboxChange('customerNotes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows="4"
                    placeholder="Special instructions for your order..."
                  />
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <ShoppingBag size={24} className="text-gray-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                </div>
                
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                        <img
                          src={item.image || '/images/placeholder.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Totals */}
                <div className="border-t border-gray-200 pt-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.totalQuantity} items)</span>
                    <span>${totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${totals.taxAmount}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>{totals.shippingAmount === 0 ? 'Free' : `$${totals.shippingAmount}`}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>${totals.total}</span>
                    </div>
                  </div>
                </div>
                
                {/* Place Order Button */}
                <div className="mt-8">
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full py-4 text-lg font-semibold"
                  >
                    {loading ? (
                      <LoadingSpinner size="small" message="Placing Order..." />
                    ) : (
                      `Place Order - $${totals.total}`
                    )}
                  </Button>
                </div>
                
                <p className="text-sm text-gray-500 text-center mt-4">
                  By placing your order, you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default CheckoutPage