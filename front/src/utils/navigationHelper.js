/**
 * Navigation helper utility to handle React Router navigation with fallbacks
 */

/**
 * Safe navigation function that provides fallback for when React Router fails
 * @param {Function} navigate - React Router navigate function
 * @param {string|number} destination - Path to navigate to or -1 for back
 * @param {Object} options - Navigation options
 */
export const safeNavigate = (navigate, destination, options = {}) => {
  try {
    // Add small delay to ensure any ongoing operations complete
    setTimeout(() => {
      navigate(destination, options)
    }, 10)
  } catch (error) {
    console.error('React Router navigation failed:', error)
    
    // Fallback to window.location
    if (typeof destination === 'string') {
      if (options.replace) {
        window.location.replace(destination)
      } else {
        window.location.href = destination
      }
    } else if (destination === -1) {
      window.history.back()
    }
  }
}

/**
 * Navigate with state management consideration
 * Adds a small delay to allow Redux state updates to complete
 */
export const navigateWithDelay = (navigate, destination, delay = 50) => {
  setTimeout(() => {
    safeNavigate(navigate, destination)
  }, delay)
}

/**
 * Handle click events with navigation
 * Prevents event bubbling and default actions before navigation
 */
export const handleNavigationClick = (e, navigate, destination) => {
  if (e) {
    e.preventDefault()
    e.stopPropagation()
  }
  
  safeNavigate(navigate, destination)
}