import React, { useState } from 'react'
import { X } from 'lucide-react'
import Login from './Login'
import Register from './Register'

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode)

  if (!isOpen) return null

  const switchToLogin = () => setMode('login')
  const switchToRegister = () => setMode('register')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>

        {/* Modal Content */}
        <div className="p-6 pt-12">
          {mode === 'login' ? (
            <Login 
              onClose={onClose} 
              onSwitchToRegister={switchToRegister}
            />
          ) : (
            <Register 
              onClose={onClose} 
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal 