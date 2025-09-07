import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { adminAPI } from '../api/admin'
import LoadingSpinner from './LoadingSpinner'
import { AlertTriangle, ShieldX, LogIn } from 'lucide-react'
import Button from './Button'

const AdminRoute = ({ children }) => {
  const { currentUser, login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasAdminAccess, setHasAdminAccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAdminAccess()
  }, [currentUser])

  const checkAdminAccess = async () => {
    if (!currentUser) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Try to access admin API to verify permissions
      await adminAPI.getDashboardStats()
      setHasAdminAccess(true)
    } catch (error) {
      console.error('Admin access check failed:', error)
      setError(error.message)
      setHasAdminAccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      await login()
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner message="Checking admin permissions..." />
      </div>
    )
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <LogIn size={48} className="text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be logged in with an admin account to access this area.
          </p>
          <Button onClick={handleLogin} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  // No admin permissions
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <ShieldX size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have admin permissions to access this area.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="text-sm text-gray-500">
            Logged in as: <strong>{currentUser?.displayName || currentUser?.email}</strong>
          </div>
          <Button 
            onClick={checkAdminAccess} 
            variant="outline" 
            className="w-full mt-4"
          >
            Retry Access Check
          </Button>
        </div>
      </div>
    )
  }

  // Has admin access - render children
  return children
}

export default AdminRoute