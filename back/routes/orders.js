const express = require('express')
const router = express.Router()
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth')
const { body, validationResult } = require('express-validator')
const Order = require('../models/Order')
const db = require('../config/database')

const validateOrderCreation = [
  body('customerInfo.name')
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ max: 255 })
    .withMessage('Name too long'),
  
  body('customerInfo.email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('customerInfo.phone')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Phone number too long'),
  
  body('shippingAddress.line1')
    .notEmpty()
    .withMessage('Shipping address line 1 is required')
    .isLength({ max: 255 })
    .withMessage('Address line 1 too long'),
  
  body('shippingAddress.city')
    .notEmpty()
    .withMessage('Shipping city is required')
    .isLength({ max: 100 })
    .withMessage('City name too long'),
  
  body('shippingAddress.country')
    .notEmpty()
    .withMessage('Shipping country is required')
    .isLength({ max: 100 })
    .withMessage('Country name too long'),
  
  body('paymentMethod')
    .optional()
    .isIn(['credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery'])
    .withMessage('Invalid payment method'),
  
  body('cartItems')
    .isArray({ min: 1 })
    .withMessage('Cart must contain at least one item'),
  
  body('cartItems.*.id')
    .notEmpty()
    .withMessage('Product ID is required'),
  
  body('cartItems.*.name')
    .notEmpty()
    .withMessage('Product name is required'),
  
  body('cartItems.*.price')
    .isFloat({ min: 0 })
    .withMessage('Valid product price is required'),
  
  body('cartItems.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Valid quantity is required')
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

router.post('/', authenticateToken, validateOrderCreation, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const {
      cartItems,
      customerInfo,
      shippingAddress,
      billingAddress,
      sameAsShipping = true,
      paymentMethod = 'cash_on_delivery',
      customerNotes = ''
    } = req.body
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart cannot be empty'
      })
    }
    
    const order = await Order.create({
      userId,
      cartItems,
      customerInfo: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        country: customerInfo.country
      },
      shippingAddress,
      billingAddress: sameAsShipping ? shippingAddress : billingAddress,
      sameAsShipping,
      paymentMethod,
      customerNotes
    })
    
    try {
      await db.execute('DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM user_carts WHERE user_id = ?)', [userId])
      await db.execute('UPDATE user_carts SET total_quantity = 0, total_amount = 0.00 WHERE user_id = ?', [userId])
    } catch (cartError) {
      console.error('Warning: Failed to clear cart after order creation:', cartError)
    }
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: order.status,
        totalAmount: order.total_amount,
        createdAt: order.created_at
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    })
  }
})

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const { limit = 20, offset = 0, status } = req.query
    
    const orders = await Order.getByUserId(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    })
    
    res.json({
      success: true,
      data: orders,
      count: orders.length
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    })
  }
})

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const { id } = req.params
    
    const order = await Order.getById(id)
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    if (order.user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    })
  }
})

router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const { id } = req.params
    const { reason = 'Cancelled by customer' } = req.body
    
    const order = await Order.getById(id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const success = await Order.cancel(id, userId, reason)
    
    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled or is already cancelled'
      })
    }
    
    res.json({
      success: true,
      message: 'Order cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    })
  }
})

router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const stats = await Order.getUserStats(userId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error fetching order stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    })
  }
})

router.put('/:id/status', authenticateToken, [
  body('status')
    .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid status'),
  body('reason')
    .optional()
    .isString()
    .withMessage('Reason must be a string')
], handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const { id } = req.params
    const { status, reason = '' } = req.body
    
    if (status !== 'cancelled') {
      return res.status(403).json({
        success: false,
        message: 'Only order cancellation is allowed for customers'
      })
    }
    
    const order = await Order.getById(id)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }
    
    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }
    
    const success = await Order.updateStatus(id, status, userId, reason)
    
    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { status, updated: success }
    })
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    })
  }
})

module.exports = router