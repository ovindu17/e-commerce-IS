import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addToCart } from '../redux/cartSlice'
import { useToast } from '../hooks/useToast'
import { navigateWithDelay } from '../utils/navigationHelper'
import Button from './Button'

const ProductCard = ({ product }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleAddToCart = (e) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      dispatch(addToCart({
        id: product.product_id,
        name: product.product_name,
        price: product.unit_price,
        image: product.image_url
      }))
      
      // Show success toast
      toast.success(`${product.product_name} added to cart!`, {
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to add to cart:', error)
    }
  }

  const handleViewProduct = (e) => {
    // Prevent navigation if clicking on the add to cart button
    if (e?.target?.closest('button')) {
      return
    }
    
    // Use safe navigation with delay to allow any state updates to complete
    navigateWithDelay(navigate, `/product/${product.product_id}`, 100)
  }

  // Generate background colors based on product ID for variety
  const getBackgroundColor = (id) => {
    const colors = [
      'bg-blue-200',
      'bg-yellow-200', 
      'bg-green-200',
      'bg-purple-200',
      'bg-pink-200',
      'bg-indigo-200'
    ]
    return colors[id % colors.length]
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Main Card Container */}
      <div 
        className={`${getBackgroundColor(product.product_id)} rounded-3xl p-3 sm:p-6 lg:p-8 mb-3 sm:mb-4 lg:mb-6 relative group cursor-pointer transition-transform duration-300 hover:scale-105`}
        onClick={handleViewProduct}
      >
        {/* Product Image Container */}
        <div className="flex justify-center items-center h-32 sm:h-40 lg:h-48 mb-2 sm:mb-3 lg:mb-4">
          <img 
            src={product.image_url || '/images/placeholder.jpg'} 
            alt={product.product_name}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Add to Cart Button - Shows on Hover */}
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={handleAddToCart}
            className="w-full rounded-t-none rounded-b-3xl text-sm sm:text-base lg:text-lg"
            size="default"
          >
            ADD TO CART
          </Button>
        </div>
      </div>

      {/* Product Information */}
      <div className="text-center px-2 sm:px-3 lg:px-4">
        <h3 
          className="text-base sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1 sm:mb-2 lg:mb-3 cursor-pointer hover:text-gray-700 transition-colors line-clamp-2"
          onClick={handleViewProduct}
        >
          {product.product_name}
        </h3>
        
        <p className="text-gray-600 text-xs sm:text-sm lg:text-base mb-2 sm:mb-3 lg:mb-4 leading-relaxed line-clamp-2">
          Flavor: {product.description || 'Premium quality tea'}
        </p>
        
        <div className="text-lg sm:text-xl lg:text-2xl font-normal text-gray-500">
          $ {parseFloat(product.unit_price).toFixed(0)}
        </div>
      </div>
    </div>
  )
}

export default ProductCard