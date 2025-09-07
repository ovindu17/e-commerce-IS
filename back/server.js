const express = require('express')
const cors = require('cors')
require('dotenv').config()

// Import security middleware
const { 
  securityHeaders, 
  apiLimiter, 
  corsOptions, 
  securityLogger, 
  forceHttps 
} = require('./middleware/security')

const productRoutes = require('./routes/products')
const userRoutes = require('./routes/users')
const cartRoutes = require('./routes/cart')
const orderRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware (OWASP compliance)
app.use(forceHttps) // Force HTTPS in production
app.use(securityHeaders) // Security headers
app.use(securityLogger) // Security logging
app.use(cors(corsOptions)) // Secure CORS
app.use(apiLimiter) // Rate limiting

// Body parsing middleware
app.use(express.json({ limit: '10mb' })) // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Disable x-powered-by header
app.disable('x-powered-by')

// Routes
app.use('/api/products', productRoutes)
app.use('/api/users', userRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// Test API route to debug routing issues
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API routes are working',
    timestamp: new Date().toISOString(),
    path: req.path,
    baseUrl: req.baseUrl,
    originalUrl: req.originalUrl
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  // Log security-relevant errors
  console.error('Server Error:', {
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent')
  })
  
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    })
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  })
})

// 404 handler
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔒 Security middleware enabled`)
  console.log(`🔑 Azure AD authentication configured`)
  
  // Test database connection
  try {
    const db = require('./config/database')
    await db.execute('SELECT 1 as test')
    console.log(`✅ Database connected successfully`)
  } catch (error) {
    console.error(`❌ Database connection failed:`, error.message)
    console.error(`   Check your database configuration in .env file`)
  }
})