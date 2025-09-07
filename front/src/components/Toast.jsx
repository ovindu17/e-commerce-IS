import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const Toast = ({ 
  id, 
  message, 
  type = 'success', 
  duration = 4000, 
  onRemove,
  position = 'top-right'
}) => {
  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    warning: <AlertCircle size={20} className="text-yellow-500" />,
    info: <Info size={20} className="text-blue-500" />
  }

  const typeStyles = {
    success: 'bg-white border-green-200 shadow-lg shadow-green-100',
    error: 'bg-white border-red-200 shadow-lg shadow-red-100',
    warning: 'bg-white border-yellow-200 shadow-lg shadow-yellow-100',
    info: 'bg-white border-blue-200 shadow-lg shadow-blue-100'
  }

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onRemove])

  return (
    <div className={`
      flex items-center gap-3 p-4 rounded-2xl border-2 backdrop-blur-sm
      ${typeStyles[type]}
      transform transition-all duration-300 ease-out
      hover:scale-105 cursor-pointer
      min-w-[320px] max-w-[480px]
      animate-slide-in
    `}>
      {/* Icon */}
      <div className="flex-shrink-0">
        {icons[type]}
      </div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium text-gray-900">
        {message}
      </div>

      {/* Close Button */}
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
        aria-label="Close notification"
      >
        <X size={16} className="text-gray-400" />
      </button>
    </div>
  )
}

export default Toast 