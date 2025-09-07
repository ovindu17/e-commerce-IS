import { useNavigate } from 'react-router-dom'
import { useCallback } from 'react'

/**
 * Custom hook that provides a more reliable navigate function
 * Handles common navigation issues in React Router v6+
 */
export const useNavigationFix = () => {
  const navigate = useNavigate()

  const safeNavigate = useCallback((to, options = {}) => {
    // Ensure navigation happens after current execution stack
    const timeout = setTimeout(() => {
      try {
        navigate(to, options)
      } catch (error) {
        console.error('Navigation failed, using fallback:', error)
        
        // Fallback to window.location
        if (typeof to === 'string') {
          if (options.replace) {
            window.location.replace(to)
          } else {
            window.location.href = to
          }
        } else if (to === -1) {
          window.history.back()
        }
      }
      clearTimeout(timeout)
    }, 10)

    return () => clearTimeout(timeout)
  }, [navigate])

  return safeNavigate
}

/**
 * Hook for handling navigation with Redux state updates
 * Adds delay to ensure state changes don't interfere with navigation
 */
export const useNavigationWithState = () => {
  const navigate = useNavigate()

  const navigateWithState = useCallback((to, options = {}, delay = 100) => {
    const timeout = setTimeout(() => {
      try {
        navigate(to, options)
      } catch (error) {
        console.error('Navigation failed, using fallback:', error)
        if (typeof to === 'string') {
          window.location.href = to
        }
      }
      clearTimeout(timeout)
    }, delay)

    return () => clearTimeout(timeout)
  }, [navigate])

  return navigateWithState
}