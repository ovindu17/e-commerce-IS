const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { body, validationResult } = require('express-validator')

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://login.microsoftonline.com", "https://graph.microsoft.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'same-origin' }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`)
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    })
  }
})

const apiLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    message: 'Too many API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === 'true'
  }
})

const validateCartItem = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID format')
    .escape(),
  body('quantity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
    .toInt(),
  body('price')
    .isFloat({ min: 0, max: 10000 })
    .withMessage('Price must be a positive number less than 10000')
    .toFloat()
]

const validateUserId = [
  body('userId')
    .isLength({ min: 1, max: 255 })
    .withMessage('User ID is required')
    .escape()
]

const validateEmail = [
  body('email')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long')
]

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    })
  }
  next()
}

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS || '').split(',')
      : ['http://localhost:5173', 'http://localhost:3000']
    
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}

const securityLogger = (req, res, next) => {
  const startTime = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous'
    }
    
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn('Security Event:', JSON.stringify(logData))
    } else if (res.statusCode >= 400) {
      console.error('Error Event:', JSON.stringify(logData))
    } else {
      console.log('Access Log:', JSON.stringify(logData))
    }
  })
  
  next()
}

const forceHttps = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(`https://${req.get('host')}${req.url}`)
  }
  next()
}

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  validateCartItem,
  validateUserId,
  validateEmail,
  handleValidationErrors,
  corsOptions,
  securityLogger,
  forceHttps
}