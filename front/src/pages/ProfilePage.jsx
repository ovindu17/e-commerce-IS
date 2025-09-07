import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/auth'
import ProtectedRoute from '../components/ProtectedRoute'
import LoadingSpinner from '../components/LoadingSpinner'
import Button from '../components/Button'
import ProfileSetupModal from '../components/ProfileSetupModal'
import ProfileEditForm from '../components/ProfileEditForm'
import { User, Mail, Calendar, ArrowLeft, LogOut, ShoppingBag, Phone, Globe, Edit3, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const ProfilePage = () => {
  const { currentUser, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  const loadUserProfile = async () => {
    try {
      setProfileLoading(true)
      const response = await authAPI.getProfile()
      setUserProfile(response.data)
      
      // Check if user needs to complete profile setup
      if (!response.data.contact_number || !response.data.country) {
        setShowSetupModal(true)
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setShowSetupModal(false)
    loadUserProfile() // Reload profile after setup
  }

  const handleProfileSave = (updatedProfile) => {
    setUserProfile(updatedProfile)
    setIsEditMode(false)
  }

  const handleEditCancel = () => {
    setIsEditMode(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await authAPI.getOrders()
      setOrders(response.data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
    loadOrders()
  }, [])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4">
                <Link 
                  to="/"
                  className="flex items-center gap-1 sm:gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Back to Shop</span>
                </Link>
                <span className="text-gray-500 hidden sm:inline">/</span>
                <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">My Profile</h1>
              </div>
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="small"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
              >
                <LogOut size={16} className="sm:w-4 sm:h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 xl:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 xl:gap-8">
            
            {/* Profile Information */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 border border-gray-200">
                <div className="text-center">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User size={40} className="sm:w-12 sm:h-12 text-gray-500" />
                  </div>
                  
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {userProfile?.name || currentUser?.displayName || 'User'}
                    </h2>
                    <Button
                      onClick={() => setIsEditMode(!isEditMode)}
                      variant="outline"
                      size="small"
                      className="p-2"
                      title={isEditMode ? 'Cancel editing' : 'Edit profile'}
                    >
                      <Edit3 size={16} />
                    </Button>
                  </div>
                  
                  {profileLoading ? (
                    <div className="py-8">
                      <LoadingSpinner message="Loading profile..." />
                    </div>
                  ) : isEditMode ? (
                    <ProfileEditForm
                      userProfile={userProfile}
                      onSave={handleProfileSave}
                      onCancel={handleEditCancel}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Profile Completeness Check */}
                      {(!userProfile?.contact_number || !userProfile?.country) && !isEditMode && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
                          <div className="flex items-start gap-3">
                            <AlertCircle size={20} className="text-orange-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-orange-700">
                              <p className="font-medium mb-1">Complete Your Profile</p>
                              <p>Add missing information to enable checkout and improve your experience.</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-4 text-gray-600">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <Mail size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Email</span>
                          </div>
                          <span className="text-sm text-gray-900 font-medium truncate w-full text-center">
                            {userProfile?.email || currentUser?.email}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <Phone size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Contact Number</span>
                          </div>
                          <span className={`text-sm font-medium truncate w-full text-center ${
                            userProfile?.contact_number ? 'text-gray-900' : 'text-orange-600'
                          }`}>
                            {userProfile?.contact_number || 'Required for checkout'}
                          </span>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-3">
                            <Globe size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Country</span>
                          </div>
                          <span className={`text-sm font-medium truncate w-full text-center ${
                            userProfile?.country ? 'text-gray-900' : 'text-orange-600'
                          }`}>
                            {userProfile?.country || 'Recommended for checkout'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-3">
                            <Calendar size={18} className="text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium">Member Since</span>
                          </div>
                          <span className="text-sm text-gray-900 font-medium">
                            {currentUser?.metadata?.creationTime 
                              ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                              : 'Recently'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Orders Section */}
            <div className="lg:col-span-8 xl:col-span-9">
              <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 border border-gray-200">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    ORDER HISTORY
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Track your purchases and order status
                  </p>
                </div>
                
                {loading ? (
                  <div className="py-8 sm:py-12">
                    <LoadingSpinner message="Loading orders..." />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <ShoppingBag size={32} className="sm:w-10 sm:h-10 text-gray-500" />
                    </div>
                    <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">No orders yet</h4>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Start shopping to see your orders here!</p>
                    <Link to="/">
                      <Button
                        variant="primary"
                        size="small"
                        className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                      >
                        Start Shopping
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-sm transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              {order.order_number || `Order #${order.id}`}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {order.total_items} {order.total_items === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end gap-3 sm:gap-2">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">
                              ${parseFloat(order.total_amount).toFixed(2)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'processing' ? 'bg-orange-100 text-orange-800' :
                              order.status === 'confirmed' ? 'bg-purple-100 text-purple-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Order Actions */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => {/* TODO: Navigate to order details */}}
                            className="text-xs sm:text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            View Details
                          </button>
                          
                          {order.status === 'pending' && (
                            <button
                              onClick={() => {/* TODO: Cancel order */}}
                              className="text-xs sm:text-sm px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                            >
                              Cancel Order
                            </button>
                          )}
                          
                          {order.status === 'delivered' && (
                            <button
                              onClick={() => {/* TODO: Reorder functionality */}}
                              className="text-xs sm:text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                            >
                              Order Again
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Setup Modal */}
        <ProfileSetupModal
          isOpen={showSetupModal}
          onComplete={handleSetupComplete}
          userInfo={currentUser}
        />
      </div>
    </ProtectedRoute>
  )
}

export default ProfilePage 