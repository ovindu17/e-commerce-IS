const checkRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (allowedRoles.length === 0) {
      return next()
    }
    
    const userRoles = req.user.roles || []
    const hasRole = allowedRoles.some(role => 
      userRoles.includes(role) || 
      userRoles.includes(role.toLowerCase()) ||
      userRoles.includes(role.toUpperCase())
    )
    
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRoles: userRoles
      })
    }
    
    next()
  }
}

const checkGroup = (allowedGroups = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    if (allowedGroups.length === 0) {
      return next()
    }
    
    const userGroups = req.user.groups || []
    const hasGroup = allowedGroups.some(group => userGroups.includes(group))
    
    if (!hasGroup) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - group membership required',
        requiredGroups: allowedGroups
      })
    }
    
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
  
  const userRoles = req.user.roles || []
  const userGroups = req.user.groups || []
  
  const isAdmin = 
    userRoles.includes('admin') ||
    userRoles.includes('Admin') ||
    userRoles.includes('ADMIN') ||
    userRoles.includes('administrator') ||
    userRoles.includes('Administrator') ||
    userGroups.some(group => 
      group.toLowerCase().includes('admin') ||
      group.toLowerCase().includes('administrator')
    )
  
  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Administrator access required'
    })
  }
  
  next()
}

const checkOwnershipOrAdmin = (getUserIdFromParams = (req) => req.params.id) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }
    
    const requestedUserId = getUserIdFromParams(req)
    const currentUserId = req.user.id || req.user.uid
    
    if (requestedUserId === currentUserId) {
      return next()
    }
    
    const userRoles = req.user.roles || []
    const isAdmin = 
      userRoles.includes('admin') ||
      userRoles.includes('Admin') ||
      userRoles.includes('ADMIN') ||
      userRoles.includes('administrator') ||
      userRoles.includes('Administrator')
    
    if (isAdmin) {
      return next()
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied - can only access your own resources or need admin privileges'
    })
  }
}

module.exports = {
  checkRole,
  checkGroup,
  requireAdmin,
  checkOwnershipOrAdmin
}