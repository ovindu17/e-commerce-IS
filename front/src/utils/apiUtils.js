/**
 * API utility functions for handling rate limits and retries
 */

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise}
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if it's not a rate limit or network error
      if (error.message && !error.message.includes('429') && !error.message.includes('Too many') && !error.message.includes('fetch')) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Calculate delay with exponential backoff + jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`)
      
      await sleep(delay)
    }
  }
  
  throw lastError
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

/**
 * Rate limit checker - prevents too many calls in a short period
 */
class RateLimitChecker {
  constructor(maxCalls = 10, timeWindow = 60000) { // 10 calls per minute
    this.maxCalls = maxCalls
    this.timeWindow = timeWindow
    this.calls = []
  }
  
  canMakeCall() {
    const now = Date.now()
    
    // Remove old calls outside the time window
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow)
    
    // Check if we're under the limit
    if (this.calls.length < this.maxCalls) {
      this.calls.push(now)
      return true
    }
    
    return false
  }
  
  getWaitTime() {
    if (this.calls.length === 0) return 0
    
    const oldestCall = Math.min(...this.calls)
    const waitTime = this.timeWindow - (Date.now() - oldestCall)
    return Math.max(0, waitTime)
  }
}

// Global rate limiter instance
export const globalRateLimit = new RateLimitChecker()

/**
 * Make API call with rate limiting and retry logic
 * @param {Function} apiCall - API function to call
 * @param {Object} options - Options for retry and rate limiting
 * @returns {Promise}
 */
export const safeApiCall = async (apiCall, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    respectRateLimit = true
  } = options
  
  // Check rate limit first
  if (respectRateLimit && !globalRateLimit.canMakeCall()) {
    const waitTime = globalRateLimit.getWaitTime()
    console.log(`Rate limit exceeded, waiting ${waitTime}ms...`)
    await sleep(waitTime)
  }
  
  // Make the call with retry logic
  return retryWithBackoff(apiCall, maxRetries, baseDelay)
}