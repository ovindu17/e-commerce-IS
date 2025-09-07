import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LogIn } from 'lucide-react'
import Button from './Button'

const Login = ({ onClose, onSwitchToRegister }) => {
  const [loading, setLoading] = useState(false)
  
  const { login, error, setError, isLoading } = useAuth()

  const handleAzureLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      await login()
      onClose()
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
        <p className="text-gray-600 mt-2">Sign in with your Microsoft account</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Azure AD Login Button */}
        <Button
          onClick={handleAzureLogin}
          disabled={loading || isLoading}
          variant="primary"
          className="w-full flex items-center justify-center gap-2"
        >
          <LogIn className="h-5 w-5" />
          {loading || isLoading ? 'Signing In...' : 'Sign in with Microsoft'}
        </Button>

        {/* Info Text */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Use your organization's Microsoft account to sign in securely.
          </p>
        </div>

        {/* Register Notice */}
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have access?{' '}
            <span className="text-gray-500">
              Contact your administrator for account access.
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login 