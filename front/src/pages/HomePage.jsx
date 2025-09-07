import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'
import Cart from '../components/Cart'
import AuthModal from '../components/AuthModal'
import Button from '../components/Button'
import { productAPI } from '../api/products'
import { ShoppingCart, User, LogOut, ChevronDown, Menu, X, Filter, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

function HomePage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalMode, setAuthModalMode] = useState('login')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  
  const cart = useSelector(state => state.cart)
  const { currentUser, logout } = useAuth()

  useEffect(() => {
    // Debounce initial data fetch to prevent multiple calls
    const timeoutId = setTimeout(() => {
      fetchInitialData()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [productsData, categoriesData] = await Promise.all([
        productAPI.getAllProducts(),
        productAPI.getCategories()
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (category = null) => {
    try {
      setLoading(true)
      setError(null)
      const productsData = await productAPI.getAllProducts(category)
      setProducts(productsData)
    } catch (err) {
      setError(err.message)
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const openCart = () => setCartOpen(true)
  const closeCart = () => setCartOpen(false)

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode)
    setAuthModalOpen(true)
  }
  const closeAuthModal = () => setAuthModalOpen(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCategorySelect = async (category) => {
    setSelectedCategory(category)
    setMobileFiltersOpen(false) // Close mobile filters after selection
    await fetchProducts(category === 'all' ? null : category)
  }

  const toggleMobileFilters = () => {
    setMobileFiltersOpen(!mobileFiltersOpen)
  }

  // Category Navigation Component
  const CategoryNavigation = ({ isMobile = false }) => (
    <nav className={`space-y-2 ${isMobile ? 'p-4' : ''}`}>
      {/* All Products Option */}
      <div className="relative">
        <button
          onClick={() => handleCategorySelect('all')}
          className={`w-full flex items-center justify-between px-3 py-3 text-left text-sm font-medium transition-colors rounded-md ${
            selectedCategory === 'all'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>ALL PRODUCTS</span>
        </button>
      </div>
      
      {/* Dynamic Categories */}
      {categories.map((category) => (
        <div key={category} className="relative">
          <button
            onClick={() => handleCategorySelect(category)}
            className={`w-full flex items-center justify-between px-3 py-3 text-left text-sm font-medium transition-colors rounded-md ${
              selectedCategory === category
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span>{category.toUpperCase()}</span>
          </button>
        </div>
      ))}
    </nav>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Error: {error}</div>
          <Button 
            onClick={fetchInitialData}
            variant="primary"
            size="small"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={toggleMobileFilters}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Filter size={20} />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>

            {/* Breadcrumb - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex items-center space-x-2 text-gray-500">
              <span>Home</span>
              <span>/</span>
              <span className="text-gray-900">Products</span>
            </div>
            
            {/* Right side buttons */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Authentication Section */}
              {currentUser ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <Link 
                    to="/profile"
                    className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <User size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-sm">
                      {currentUser.displayName || currentUser.email}
                    </span>
                  </Link>
                  
                  {/* Admin Link - Let AdminRoute handle permission check */}
                  <Link 
                    to="/admin"
                    className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    title="Admin Dashboard"
                  >
                    <Shield size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-sm">Admin</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <LogOut size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Button
                    onClick={() => openAuthModal('login')}
                    variant="outline"
                    size="small"
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    Login
                  </Button>
                  <Button
                    onClick={() => openAuthModal('register')}
                    variant="primary"
                    size="small"
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Cart Button */}
              <Button
                onClick={openCart}
                variant="primary"
                size="small"
                className="relative flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <ShoppingCart size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Cart</span>
                {cart.totalQuantity > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center">
                    {cart.totalQuantity}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Filters Overlay */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={toggleMobileFilters}>
          <div 
            className="absolute left-0 top-0 h-full w-80 max-w-sm bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Categories</h3>
              <button
                onClick={toggleMobileFilters}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="h-full overflow-y-auto pb-20">
              <CategoryNavigation isMobile={true} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8">
          {/* Desktop Left Sidebar - Categories (Hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-3 xl:col-span-2">
            <div className="sticky top-4 lg:pl-0">
              <CategoryNavigation />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 xl:col-span-10">
            {/* Large Products Heading */}
            <div className="mb-4 sm:mb-8">
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-gray-900 mb-2 sm:mb-4">
                PRODUCTS
              </h1>
              {/* Mobile Category Indicator */}
              <div className="lg:hidden">
                <p className="text-sm text-gray-600">
                  Showing: <span className="font-medium">{selectedCategory === 'all' ? 'All Products' : selectedCategory.toUpperCase()}</span>
                </p>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-500 text-base sm:text-lg">No products found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.product_id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Component */}
      <Cart isOpen={cartOpen} onClose={closeCart} />

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={closeAuthModal} 
        initialMode={authModalMode}
      />
    </div>
  )
}

export default HomePage