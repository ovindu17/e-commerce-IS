const { verifyToken } = require('../config/azureAd')

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided or invalid format'
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    // Verify the Azure AD access token
    const decodedToken = await verifyToken(token)
    
    // Add user info to request object
    req.user = {
      id: decodedToken.sub || decodedToken.oid,
      uid: decodedToken.sub || decodedToken.oid,
      email: decodedToken.email || decodedToken.preferred_username,
      name: decodedToken.name || decodedToken.given_name || decodedToken.email,
      roles: decodedToken.roles || [],
      groups: decodedToken.groups || [],
      tenant: decodedToken.tid,
      isAdmin: decodedToken.isAdmin || false
    }
    
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
}

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decodedToken = await verifyToken(token)
      
      req.user = {
        id: decodedToken.sub || decodedToken.oid,
        uid: decodedToken.sub || decodedToken.oid,
        email: decodedToken.email || decodedToken.preferred_username,
        name: decodedToken.name || decodedToken.given_name || decodedToken.email,
        roles: decodedToken.roles || [],
        groups: decodedToken.groups || [],
        tenant: decodedToken.tid
      }
    }
    
    next()
  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

// Admin-only authentication middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    })
  }
  
  next()
}

// Resource ownership check middleware
const checkResourceOwnership = (req, res, next) => {
  // This will be used by order routes to ensure users can only access their own orders
  req.resourceOwnership = {
    userId: req.user.id,
    isAdmin: req.user.isAdmin
  }
  next()
}

module.exports = { authenticateToken, optionalAuth, requireAdmin, checkResourceOwnership } 