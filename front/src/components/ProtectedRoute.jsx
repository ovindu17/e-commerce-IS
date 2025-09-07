import React from 'react'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, fallback = null }) => {
  const { currentUser } = useAuth()

  if (!currentUser) {
    return fallback || (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600">
            Please log in to access this page.
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute 