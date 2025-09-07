import React, { useState } from 'react'
import { authAPI } from '../api/auth'
import Button from './Button'
import LoadingSpinner from './LoadingSpinner'
import { User, Phone, Globe, Save, X } from 'lucide-react'

const ProfileEditForm = ({ userProfile, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    contact_number: userProfile?.contact_number || '',
    country: userProfile?.country || ''
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
    
    if (formData.contact_number && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.contact_number.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.contact_number = 'Please enter a valid contact number'
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
      const response = await authAPI.updateProfile({
        name: formData.name.trim(),
        contact_number: formData.contact_number.trim(),
        country: formData.country
      })
      onSave(response.data)
    } catch (error) {
      console.error('Profile update failed:', error)
      setErrors({ submit: 'Failed to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
            <User size={16} className="inline mr-2" />
            Full Name
          </label>
          <input
            type="text"
            id="edit-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        {/* Contact Number Field */}
        <div>
          <label htmlFor="edit-contact" className="block text-sm font-medium text-gray-700 mb-2">
            <Phone size={16} className="inline mr-2" />
            Contact Number
          </label>
          <input
            type="tel"
            id="edit-contact"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
              errors.contact_number ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.contact_number && (
            <p className="text-red-500 text-xs mt-1">{errors.contact_number}</p>
          )}
        </div>

        {/* Country Field */}
        <div>
          <label htmlFor="edit-country" className="block text-sm font-medium text-gray-700 mb-2">
            <Globe size={16} className="inline mr-2" />
            Country
          </label>
          <select
            id="edit-country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white"
          >
            <option value="">Select your country</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg">
            {errors.submit}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="small"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size="small" />
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <X size={16} />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfileEditForm