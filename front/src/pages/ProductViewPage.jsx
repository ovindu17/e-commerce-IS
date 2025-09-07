
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useSelector } from 'react-redux'
import ProductDetail from '../components/ProductView'
import Cart from '../components/Cart'
import Button from '../components/Button'
import { productAPI } from '../api/products'

const ProductViewPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  
  const cart = useSelector(state => state.cart)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)
      const productData = await productAPI.getProductById(id)
      setProduct(productData)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch product:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGoBack = () => {
    try {
      // Check if there's history to go back to
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Navigation failed:', error)
      // Fallback to home page
      window.location.href = '/'
    }
  }

  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <div className="space-x-4">
            <Button onClick={fetchProduct} variant="primary" size="small">
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="secondary" size="small">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <Button onClick={handleGoBack} variant="primary" size="small">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            
            {/* Cart Button */}
            <Button
              onClick={openCart}
              variant="primary"
              size="small"
              className="relative flex items-center gap-2"
            >
              <ShoppingCart size={20} />
              <span>Cart</span>
              {cart.totalQuantity > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                  {cart.totalQuantity}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Product Detail */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProductDetail product={product} />
      </main>

      {/* Cart Component */}
      <Cart isOpen={cartOpen} onClose={closeCart} />
    </div>
  )
}

export default ProductViewPage