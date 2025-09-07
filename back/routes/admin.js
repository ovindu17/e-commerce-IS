const express = require('express')
const router = express.Router()
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const Order = require('../models/Order')
const db = require('../config/database')

router.use(authenticateToken)
router.use(requireAdmin)

router.get('/orders', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search
    } = req.query

    const offset = (page - 1) * limit
    
    let query = `
      SELECT 
        o.id, o.order_number, o.status, o.total_items, o.total_amount,
        o.customer_name, o.customer_email, o.customer_phone,
        o.created_at, o.updated_at, o.shipped_at, o.delivered_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `
    const params = []

    if (status) {
      query += ` AND o.status = ?`
      params.push(status)
    }

    if (startDate) {
      query += ` AND o.created_at >= ?`
      params.push(startDate)
    }

    if (endDate) {
      query += ` AND o.created_at <= ?`
      params.push(endDate)
    }

    if (search) {
      query += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += ` GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
    params.push(parseInt(limit), parseInt(offset))

    const [orders] = await db.execute(query, params)

    let countQuery = `SELECT COUNT(DISTINCT o.id) as total FROM orders o WHERE 1=1`
    const countParams = []

    if (status) {
      countQuery += ` AND o.status = ?`
      countParams.push(status)
    }
    if (startDate) {
      countQuery += ` AND o.created_at >= ?`
      countParams.push(startDate)
    }
    if (endDate) {
      countQuery += ` AND o.created_at <= ?`
      countParams.push(endDate)
    }
    if (search) {
      countQuery += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const [countResult] = await db.execute(countQuery, countParams)
    const total = countResult[0].total

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching admin orders:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    })
  }
})

router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    const order = await Order.getById(orderId)

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    res.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    })
  }
})

router.put('/orders/:id/status', async (req, res) => {
  try {
    const orderId = req.params.id
    const { status, reason } = req.body

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    const success = await Order.updateStatus(orderId, status, req.user.id, reason || `Status updated by admin: ${req.user.name}`)

    if (!success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to update order status'
      })
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
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

router.get('/dashboard/stats', async (req, res) => {
  try {
    const [orderStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    const [recentOrders] = await db.execute(`
      SELECT id, order_number, status, total_amount, customer_name, created_at
      FROM orders
      ORDER BY created_at DESC
      LIMIT 10
    `)

    const [dailyStats] = await db.execute(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as order_count,
        SUM(total_amount) as daily_revenue
      FROM orders
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    res.json({
      success: true,
      data: {
        overview: orderStats[0],
        recentOrders,
        dailyStats
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    })
  }
})

router.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute(`
      SELECT 
        u.id, u.name, u.email, u.contact_number, u.country, u.created_at,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 50
    `)

    res.json({
      success: true,
      data: users
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    })
  }
})

router.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id
    const { reason } = req.body

    const order = await Order.getById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      })
    }

    if (order.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Only cancelled orders can be deleted'
      })
    }

    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [orderId])
      
      await connection.execute('DELETE FROM order_status_history WHERE order_id = ?', [orderId])
      
      await connection.execute('DELETE FROM orders WHERE id = ?', [orderId])

      await connection.commit()

      res.json({
        success: true,
        message: 'Order deleted successfully'
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    })
  }
})

module.exports = router