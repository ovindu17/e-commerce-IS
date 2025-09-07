const axios = require('axios')

const verifyToken = async (token) => {
  try {
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    })
    
    let roles = []
    try {
      const rolesResponse = await axios.get('https://graph.microsoft.com/v1.0/me/memberOf', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      roles = rolesResponse.data.value
        .filter(group => group['@odata.type'] === '#microsoft.graph.directoryRole')
        .map(role => ({
          id: role.id,
          displayName: role.displayName,
          roleTemplateId: role.roleTemplateId
        }))
    } catch (rolesError) {
      console.warn('Could not fetch user roles:', rolesError.message)
    }
    
    const isAdmin = checkAdminAccess(userResponse.data, roles)
    
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

const checkAdminAccess = (userData, roles) => {
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
  
  const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : []
  const userEmail = userData.mail || userData.userPrincipalName
  
  if (adminEmails.includes(userEmail)) {
    return true
  }
  
  const adminDomains = process.env.ADMIN_DOMAINS ? process.env.ADMIN_DOMAINS.split(',') : []
  if (userEmail && adminDomains.some(domain => userEmail.endsWith(`@${domain}`))) {
    return true
  }
  
  
  return false
}

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