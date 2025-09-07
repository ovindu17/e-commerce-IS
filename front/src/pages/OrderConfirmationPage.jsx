import React, { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Button from '../components/Button'
import { CheckCircle, Package, ArrowLeft, Eye } from 'lucide-react'

const OrderConfirmationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const orderData = location.state
  
  // Add a delay before redirecting to avoid immediate redirect during navigation
  useEffect(() => {
    if (!orderData) {
      const timer = setTimeout(() => {
        navigate('/', { replace: true })
      }, 1000) // Wait 1 second before redirecting
      
      return () => clearTimeout(timer)
    }
  }, [orderData, navigate])

  // Show loading state briefly if no order data
  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
          <p className="text-gray-600 mb-4">Loading order information...</p>
          <p className="text-sm text-gray-500">If this persists, you'll be redirected to the home page.</p>
        </div>
      </div>
    )
  }

  const { orderNumber, orderId, totalAmount, status, createdAt } = orderData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Continue Shopping</span>
              </Link>
              <span className="text-gray-500">/</span>
              <h1 className="text-2xl font-bold text-gray-900">Order Confirmation</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-2">
            Thank you for your order. We've received your order and will start processing it soon.
          </p>
          
          <div className="bg-white rounded-2xl p-8 border border-gray-200 max-w-md mx-auto mt-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-bold text-gray-900 text-lg">{orderNumber}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-bold text-gray-900 text-lg">${totalAmount}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900">Cash on Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What happens next?</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order Confirmation</h3>
                <p className="text-gray-600">
                  We'll send you an email confirmation with your order details shortly.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Order Processing</h3>
                <p className="text-gray-600">
                  Our team will prepare your order for shipment. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-blue-600">3</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Shipping & Delivery</h3>
                <p className="text-gray-600">
                  Your order will be shipped and delivered to your address. You'll receive tracking information once it's on the way.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-bold text-blue-600">4</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Payment on Delivery</h3>
                <p className="text-gray-600">
                  Pay ${totalAmount} when your order arrives. You can pay with cash or card to our delivery partner.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/profile">
            <Button variant="primary" className="flex items-center gap-2">
              <Eye size={20} />
              View Order History
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Package size={20} />
              Continue Shopping
            </Button>
          </Link>
        </div>

        {/* Support Information */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-4">
              If you have any questions about your order, don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
              <span className="text-gray-600">📧 support@yourstore.com</span>
              <span className="text-gray-600">📞 +1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmationPage