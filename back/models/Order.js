const db = require('../config/database')

class Order {
  /**
   * Create a new order from cart
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} Created order
   */
  static async create(orderData) {
    const connection = await db.getConnection()
    
    try {
      await connection.beginTransaction()
      
      const {
        userId,
        cartItems,
        customerInfo,
        shippingAddress,
        billingAddress,
        sameAsShipping = true,
        paymentMethod = 'cash_on_delivery',
        customerNotes = ''
      } = orderData
      
      // Generate order number
      const [orderNumberResult] = await connection.execute('CALL GenerateOrderNumber(@order_number)')
      const [orderNumberRow] = await connection.execute('SELECT @order_number as order_number')
      const orderNumber = orderNumberRow[0].order_number
      
      // Calculate totals
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxAmount = subtotal * 0.1 // 10% tax (configurable)
      const shippingAmount = subtotal > 100 ? 0 : 15 // Free shipping over $100
      const totalAmount = subtotal + taxAmount + shippingAmount
      
      // Create order with null checks for undefined values
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (
          order_number, user_id, status, total_items, subtotal, tax_amount, 
          shipping_amount, total_amount, customer_name, customer_email, 
          customer_phone, customer_country, shipping_address_line1, 
          shipping_address_line2, shipping_city, shipping_state, 
          shipping_postal_code, shipping_country, billing_address_line1, 
          billing_address_line2, billing_city, billing_state, 
          billing_postal_code, billing_country, same_as_shipping, 
          payment_method, customer_notes
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        orderNumber, userId, totalItems, subtotal, taxAmount, shippingAmount, 
        totalAmount, 
        customerInfo?.name || null, 
        customerInfo?.email || null, 
        customerInfo?.phone || null, 
        customerInfo?.country || null, 
        shippingAddress?.line1 || null, 
        shippingAddress?.line2 || null, 
        shippingAddress?.city || null, 
        shippingAddress?.state || null, 
        shippingAddress?.postalCode || null, 
        shippingAddress?.country || null, 
        sameAsShipping ? (shippingAddress?.line1 || null) : (billingAddress?.line1 || null),
        sameAsShipping ? (shippingAddress?.line2 || null) : (billingAddress?.line2 || null),
        sameAsShipping ? (shippingAddress?.city || null) : (billingAddress?.city || null),
        sameAsShipping ? (shippingAddress?.state || null) : (billingAddress?.state || null),
        sameAsShipping ? (shippingAddress?.postalCode || null) : (billingAddress?.postalCode || null),
        sameAsShipping ? (shippingAddress?.country || null) : (billingAddress?.country || null),
        sameAsShipping, paymentMethod || 'cash_on_delivery', customerNotes || ''
      ])
      
      const orderId = orderResult.insertId
      
      // Create order items
      for (const item of cartItems) {
        await connection.execute(`
          INSERT INTO order_items (
            order_id, product_id, product_name, product_description, 
            product_image, unit_price, quantity, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId, 
          item?.id || null, 
          item?.name || null, 
          item?.description || null, 
          item?.image || null, 
          item?.price || 0, 
          item?.quantity || 1, 
          (item?.price || 0) * (item?.quantity || 1)
        ])
      }
      
      // Create initial status history entry
      await connection.execute(`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, change_reason)
        VALUES (?, NULL, 'pending', ?, 'Order created')
      `, [orderId, userId])
      
      await connection.commit()
      
      // Return created order
      return await this.getById(orderId)
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
  
  /**
   * Get order by ID
   * @param {number} orderId - Order ID
   * @returns {Promise<Object|null>} Order details
   */
  static async getById(orderId) {
    try {
      const [orderRows] = await db.execute(`
        SELECT * FROM orders WHERE id = ?
      `, [orderId])
      
      if (orderRows.length === 0) {
        return null
      }
      
      const order = orderRows[0]
      
      // Get order items
      const [itemRows] = await db.execute(`
        SELECT * FROM order_items WHERE order_id = ? ORDER BY id
      `, [orderId])
      
      // Get status history
      const [historyRows] = await db.execute(`
        SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at DESC
      `, [orderId])
      
      return {
        ...order,
        items: itemRows,
        statusHistory: historyRows
      }
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Get orders by user ID
   * @param {string} userId - User ID
   * @param {Object} options - Query options (limit, offset, status)
   * @returns {Promise<Array>} Orders list
   */
  static async getByUserId(userId, options = {}) {
    try {
      const { limit = 20, offset = 0, status } = options
      
      let query = `
        SELECT 
          id, order_number, status, total_items, total_amount, 
          created_at, updated_at, shipped_at, delivered_at
        FROM orders 
        WHERE user_id = ?
      `
      const params = [userId]
      
      if (status) {
        query += ` AND status = ?`
        params.push(status)
      }
      
      query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
      params.push(limit, offset)
      
      const [rows] = await db.execute(query, params)
      return rows
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} newStatus - New status
   * @param {string} changedBy - User ID who made the change
   * @param {string} reason - Reason for change
   * @returns {Promise<boolean>} Success
   */
  static async updateStatus(orderId, newStatus, changedBy, reason = '') {
    const connection = await db.getConnection()
    
    try {
      await connection.beginTransaction()
      
      // Get current status
      const [currentOrder] = await connection.execute(
        'SELECT status FROM orders WHERE id = ?', 
        [orderId]
      )
      
      if (currentOrder.length === 0) {
        throw new Error('Order not found')
      }
      
      const oldStatus = currentOrder[0].status
      
      if (oldStatus === newStatus) {
        await connection.rollback()
        return false // No change needed
      }
      
      // Update order status
      let updateQuery = 'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP'
      const updateParams = [newStatus, orderId]
      
      // Set special timestamps for certain statuses
      if (newStatus === 'confirmed') {
        updateQuery += ', confirmed_at = CURRENT_TIMESTAMP'
      } else if (newStatus === 'shipped') {
        updateQuery += ', shipped_at = CURRENT_TIMESTAMP'
      } else if (newStatus === 'delivered') {
        updateQuery += ', delivered_at = CURRENT_TIMESTAMP'
      }
      
      updateQuery += ' WHERE id = ?'
      
      await connection.execute(updateQuery, updateParams)
      
      // Create status history entry
      await connection.execute(`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, change_reason)
        VALUES (?, ?, ?, ?, ?)
      `, [orderId, oldStatus, newStatus, changedBy, reason])
      
      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
  
  /**
   * Get order statistics for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Order statistics
   */
  static async getUserStats(userId) {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
          COALESCE(SUM(total_amount), 0) as total_spent,
          COALESCE(AVG(total_amount), 0) as average_order_value,
          MAX(created_at) as last_order_date
        FROM orders 
        WHERE user_id = ?
      `, [userId])
      
      return stats[0]
    } catch (error) {
      throw error
    }
  }
  
  /**
   * Cancel order
   * @param {number} orderId - Order ID
   * @param {string} cancelledBy - User ID who cancelled
   * @param {string} reason - Cancellation reason
   * @returns {Promise<boolean>} Success
   */
  static async cancel(orderId, cancelledBy, reason = 'Cancelled by customer') {
    try {
      // Only allow cancellation for pending or confirmed orders
      const [orderRows] = await db.execute(
        'SELECT status FROM orders WHERE id = ?', 
        [orderId]
      )
      
      if (orderRows.length === 0) {
        throw new Error('Order not found')
      }
      
      const currentStatus = orderRows[0].status
      if (!['pending', 'confirmed'].includes(currentStatus)) {
        throw new Error(`Cannot cancel order with status: ${currentStatus}`)
      }
      
      return await this.updateStatus(orderId, 'cancelled', cancelledBy, reason)
    } catch (error) {
      throw error
    }
  }
}

module.exports = Order