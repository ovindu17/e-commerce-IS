import React, { useState } from 'react'
import { authAPI } from '../api/auth'
import Button from './Button'
import LoadingSpinner from './LoadingSpinner'
import { User, Phone, Globe, X } from 'lucide-react'

const ProfileSetupModal = ({ isOpen, onComplete, userInfo }) => {
  const [formData, setFormData] = useState({
    name: userInfo?.displayName || '',
    contact_number: '',
    country: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Common countries list
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany',
    'France', 'Japan', 'South Korea', 'Singapore', 'India', 'China',
    'Brazil', 'Mexico', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
    'Switzerland', 'New Zealand', 'South Africa', 'Other'
  ].sort()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    
    if (!formData.contact_number.trim()) {
      newErrors.contact_number = 'Contact number is required'
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.contact_number.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.contact_number = 'Please enter a valid contact number'
    }
    
    if (!formData.country) {
      newErrors.country = 'Please select your country'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)
      await authAPI.updateProfile({
        name: formData.name.trim(),
        contact_number: formData.contact_number.trim(),
        country: formData.country
      })
      onComplete()
    } catch (error) {
      console.error('Profile setup failed:', error)
      setErrors({ submit: 'Failed to save profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
          <p className="text-gray-600 text-sm">
            Help us personalize your experience by completing your profile information.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-2" />
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Contact Number Field */}
          <div>
            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} className="inline mr-2" />
              Contact Number
            </label>
            <input
              type="tel"
              id="contact_number"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.contact_number ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="+1 (555) 123-4567"
            />
            {errors.contact_number && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_number}</p>
            )}
          </div>

          {/* Country Field */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              <Globe size={16} className="inline mr-2" />
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              } appearance-none bg-white`}
            >
              <option value="">Select your country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors.country && (
              <p className="text-red-500 text-sm mt-1">{errors.country}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-xl">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-6"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner size="small" message="Saving..." />
            ) : (
              'Complete Setup'
            )}
          </Button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          This information helps us provide better service and support.
        </p>
      </div>
    </div>
  )
}

export default ProfileSetupModal