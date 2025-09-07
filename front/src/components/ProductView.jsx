import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { addToCart } from '../redux/cartSlice'
import { useToast } from '../hooks/useToast'
import { Check, ShoppingBag, Plus, Minus } from 'lucide-react'
import Button from './Button'

const ProductView = ({ product }) => {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()

  if (!product) return null

  // Mock additional images for thumbnails
  const images = [
    product.image_url,
    product.image_url,
    product.image_url,
    product.image_url,
  ].filter(Boolean)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      dispatch(addToCart({
        id: product.product_id,
        name: product.product_name,
        price: product.unit_price,
        image: product.image_url
      }))
    }
    
    // Show success toast
    const message = quantity === 1 
      ? `${product.product_name} added to cart!`
      : `${quantity}x ${product.product_name} added to cart!`
    
    toast.success(message, {
      duration: 3000
    })
  }

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  const handleGoHome = () => {
    try {
      navigate('/')
    } catch (error) {
      console.error('Navigation failed:', error)
      // Fallback to window.location if navigate fails
      window.location.href = '/'
    }
  }

  return (
    <div className="py-6">
      {/* Breadcrumb Navigation */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-gray-500">
          <button 
            onClick={handleGoHome}
            className="hover:text-gray-700 transition-colors"
          >
            Home
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {product.product_name}
          </span>
        </div>
      </nav>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side - Thumbnail Images */}
        {/* <div className="lg:col-span-2">
          <div className="space-y-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedImage === index 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                  <img
                    src={image || '/images/placeholder.jpg'}
                    alt={`${product.product_name} ${index + 1}`}
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </button>
            ))}
          </div>
        </div> */}

                 {/* Center - Main Product Image */}
         <div className="lg:col-span-6">
           <div className="h-auto rounded-3xl bg-gradient-to-br from-blue-100 to-blue-200 p-12 flex items-center justify-center">
             <img
               src={images[selectedImage] || '/images/placeholder.jpg'}
               alt={product.product_name}
               className="w-full h-full object-contain max-w-md max-h-md"
             />
           </div>
         </div>

        {/* Right Side - Product Information */}
        <div className="lg:col-span-4 space-y-8">
          {/* Product Title */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {product.product_name}
            </h1>
          </div>

          {/* Tasting Notes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Tasting notes:
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description || 'pure and strong, enveloping and soft, but at the same time delicate. Voluminous, sweet and fruity, with baked notes. Impact: leveling, relaxing-meditative, collecting.'}
            </p>
          </div>

                     {/* Quantity Selector */}
           <div>
             <h3 className="text-lg font-medium text-gray-900 mb-4">
               Quantity:
             </h3>
             <div className="flex items-center bg-gray-100 rounded-full w-fit">
               <button
                 onClick={decrementQuantity}
                 disabled={quantity <= 1}
                 className="p-3 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Minus size={20} className="text-gray-600" />
               </button>
               <span className="px-6 py-3 text-lg font-medium bg-white rounded-full mx-1 min-w-[60px] text-center">
                 {quantity}
               </span>
               <button
                 onClick={incrementQuantity}
                 className="p-3 hover:bg-gray-200 rounded-full transition-colors"
               >
                 <Plus size={20} className="text-gray-600" />
               </button>
             </div>
           </div>

          {/* Add to Cart Button */}
          <div className="space-y-4">
            <Button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-3 text-lg py-6"
              size="large"
            >
              <ShoppingBag size={24} />
              <span>ADD TO CART</span>
              <span className="ml-auto">${parseFloat(product.unit_price || 0).toFixed(0)}</span>
            </Button>

            {/* Stock Status */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Check size={16} className="text-green-600" />
              <span>in stock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductView