import React from 'react'
import Toast from './Toast'

const ToastContainer = ({ toasts, removeToast, position = 'top-right' }) => {
  const positionStyles = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-center': 'top-6 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2'
  }

  if (toasts.length === 0) return null

  return (
    <div className={`fixed z-50 pointer-events-none ${positionStyles[position]}`}>
      <div className="flex flex-col space-y-3 pointer-events-auto">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="transform transition-all duration-300 ease-out"
            style={{
              animationDelay: `${index * 100}ms`,
              zIndex: 1000 - index
            }}
          >
            <Toast
              {...toast}
              onRemove={removeToast}
              position={position}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default ToastContainer 