const axios = require('axios')

// Verify Azure AD token by validating with Microsoft Graph
const verifyToken = async (token) => {
  try {
    // Validate token by calling Microsoft Graph API
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    })
    
    // Get user's directory roles (admin permissions)
    let roles = []
    try {
      const rolesResponse = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      // Extract role information
      roles = rolesResponse.data.value
        .filter(group => group['@odata.type'] === '#microsoft.graph.directoryRole')
        .map(role => ({
          id: role.id,
          displayName: role.displayName,
          roleTemplateId: role.roleTemplateId
        }))
    } catch (rolesError) {
      console.warn('Could not fetch user roles:', rolesError.message)
      // Continue without roles if we can't fetch them
    }
    
    // Check if user is admin based on roles or email domain
    const isAdmin = checkAdminAccess(userResponse.data, roles)
    
    // If the request succeeds, the token is valid
    // Return user info from Graph API with role information
    return {
      sub: userResponse.data.id,
      oid: userResponse.data.id,
      email: userResponse.data.mail || userResponse.data.userPrincipalName,
      preferred_username: userResponse.data.userPrincipalName,
      name: userResponse.data.displayName,
      given_name: userResponse.data.givenName,
      family_name: userResponse.data.surname,
      roles: roles,
      isAdmin: isAdmin
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      throw new Error('Invalid or expired token')
    }
    throw new Error(`Token validation failed: ${error.message}`)
  }
}

// Helper function to determine admin access
const checkAdminAccess = (userData, roles) => {
  // Check for specific admin roles in Azure AD
  const adminRoleNames = [
    'Global Administrator', 
    'Application Administrator',
    'User Administrator'
  ]
  
  const hasAdminRole = roles.some(role => 
    adminRoleNames.some(adminRole => 
      role.displayName.includes(adminRole)
    )
  )
  
  if (hasAdminRole) {
    return true
  }
  
  // Alternative: Check by email domain or specific emails
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : []
  const userEmail = userData.mail || userData.userPrincipalName
  
  if (adminEmails.includes(userEmail)) {
    return true
  }
  
  // Check for admin domain
  const adminDomains = process.env.ADMIN_DOMAINS ? process.env.ADMIN_DOMAINS.split(',') : []
  if (userEmail && adminDomains.some(domain => userEmail.endsWith(`@${domain}`))) {
    return true
  }
  
  // TEMPORARY: Make all logged-in users admin for testing (REMOVE IN PRODUCTION)
  // return true
  
  return false
}

// Get user info from Microsoft Graph (optional)
const getUserInfo = async (accessToken) => {
  try {
    const axios = require('axios')
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching user info:', error.message)
    return null
  }
}

module.exports = { 
  verifyToken, 
  getUserInfo 
}