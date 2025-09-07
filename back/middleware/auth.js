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

    const token = authHeader.substring(7)
    
    const decodedToken = await verifyToken(token)
    
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
    next()
  }
}

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

const checkResourceOwnership = (req, res, next) => {
  req.resourceOwnership = {
    userId: req.user.id,
    isAdmin: req.user.isAdmin
  }
  next()
}

module.exports = { authenticateToken, optionalAuth, requireAdmin, checkResourceOwnership } 