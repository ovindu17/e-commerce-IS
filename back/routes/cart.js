const express = require('express')
const router = express.Router()
const { authenticateToken, optionalAuth } = require('../middleware/auth')
const { validateCartItem, handleValidationErrors, authLimiter } = require('../middleware/security')
const db = require('../config/database')

const calculateCartTotals = (items) => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = items.reduce((sum, item) => sum + (item.product_price * item.quantity), 0)
  return { totalQuantity, totalAmount: parseFloat(totalAmount.toFixed(2)) }
}

const getOrCreateUserCart = async (userId) => {
  try {
    const [existingCart] = await db.execute(
      'SELECT * FROM user_carts WHERE user_id = ? AND is_active = true',
      [userId]
    )

    if (existingCart.length > 0) {
      return existingCart[0]
    }

    const [result] = await db.execute(
      'INSERT INTO user_carts (user_id, total_quantity, total_amount) VALUES (?, 0, 0.00)',
      [userId]
    )

    const [newCart] = await db.execute(
      'SELECT * FROM user_carts WHERE id = ?',
      [result.insertId]
    )

    return newCart[0]
  } catch (error) {
    throw new Error('Failed to get or create cart: ' + error.message)
  }
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    
    const cart = await getOrCreateUserCart(userId)
    
    const [items] = await db.execute(`
      SELECT 
        product_id as id,
        product_name as name,
        product_price as price,
        product_image as image,
        quantity,
        (product_price * quantity) as totalPrice
      FROM cart_items 
      WHERE cart_id = ?
      ORDER BY added_at DESC
    `, [cart.id])

    res.json({
      success: true,
      data: {
        items: items || [],
        totalQuantity: cart.total_quantity || 0,
        totalAmount: parseFloat(cart.total_amount) || 0,
        lastUpdated: cart.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    })
  }
})

router.post('/items', authLimiter, authenticateToken, validateCartItem, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    const { productId, quantity, price } = req.body
    
    if (!productId || quantity < 1 || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product data'
      })
    }

    const cart = await getOrCreateUserCart(userId)

    await db.execute(
      `INSERT INTO cart_items (cart_id, product_id, product_name, product_price, product_image, quantity) 
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE 
       quantity = quantity + 1,
       product_name = VALUES(product_name),
       product_price = VALUES(product_price),
       product_image = VALUES(product_image),
       updated_at = CURRENT_TIMESTAMP`,
      [cart.id, id, name, parseFloat(price), image || null]
    )

    const [allItems] = await db.execute(
      'SELECT quantity, product_price FROM cart_items WHERE cart_id = ?',
      [cart.id]
    )
    
    const { totalQuantity, totalAmount } = calculateCartTotals(allItems)
    
    await db.execute(
      'UPDATE user_carts SET total_quantity = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalQuantity, totalAmount, cart.id]
    )

    res.json({
      success: true,
      message: 'Item added to cart',
      data: {
        productId: id,
        quantity: 1,
        totalQuantity,
        totalAmount
      }
    })
  } catch (error) {
    console.error('Error adding item to cart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    })
  }
})

router.put('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    const { productId } = req.params
    const { quantity } = req.body

    if (!quantity || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      })
    }

    const cart = await getOrCreateUserCart(userId)

    if (quantity === 0) {
      await db.execute(
        'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
        [cart.id, productId]
      )
    } else {
      await db.execute(
        'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
        [quantity, cart.id, productId]
      )
    }

    const [allItems] = await db.execute(
      'SELECT quantity, product_price FROM cart_items WHERE cart_id = ?',
      [cart.id]
    )
    
    const { totalQuantity, totalAmount } = calculateCartTotals(allItems)
    
    await db.execute(
      'UPDATE user_carts SET total_quantity = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalQuantity, totalAmount, cart.id]
    )

    res.json({
      success: true,
      message: 'Cart updated',
      data: {
        productId,
        quantity: quantity === 0 ? 0 : quantity,
        totalQuantity,
        totalAmount
      }
    })
  } catch (error) {
    console.error('Error updating cart item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    })
  }
})

router.delete('/items/:productId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    const { productId } = req.params

    const cart = await getOrCreateUserCart(userId)

    await db.execute(
      'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cart.id, productId]
    )

    const [allItems] = await db.execute(
      'SELECT quantity, product_price FROM cart_items WHERE cart_id = ?',
      [cart.id]
    )
    
    const { totalQuantity, totalAmount } = calculateCartTotals(allItems)
    
    await db.execute(
      'UPDATE user_carts SET total_quantity = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalQuantity, totalAmount, cart.id]
    )

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: {
        productId,
        totalQuantity,
        totalAmount
      }
    })
  } catch (error) {
    console.error('Error removing cart item:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to remove cart item',
      error: error.message
    })
  }
})

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    const cart = await getOrCreateUserCart(userId)

    await db.execute('DELETE FROM cart_items WHERE cart_id = ?', [cart.id])

    await db.execute(
      'UPDATE user_carts SET total_quantity = 0, total_amount = 0.00, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [cart.id]
    )

    res.json({
      success: true,
      message: 'Cart cleared',
      data: {
        totalQuantity: 0,
        totalAmount: 0
      }
    })
  } catch (error) {
    console.error('Error clearing cart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    })
  }
})

router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.uid
    const { localCart } = req.body

    if (!localCart || !localCart.items) {
      return res.status(400).json({
        success: false,
        message: 'Local cart data is required'
      })
    }

    const cart = await getOrCreateUserCart(userId)

    const [serverItems] = await db.execute(
      'SELECT * FROM cart_items WHERE cart_id = ?',
      [cart.id]
    )

    for (const localItem of localCart.items) {
      const existingServerItem = serverItems.find(item => item.product_id === localItem.id)
      
      if (existingServerItem) {
        const newQuantity = Math.max(existingServerItem.quantity, localItem.quantity)
        await db.execute(
          'UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ? AND product_id = ?',
          [newQuantity, cart.id, localItem.id]
        )
      } else {
        await db.execute(
          `INSERT INTO cart_items (cart_id, product_id, product_name, product_price, product_image, quantity) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           quantity = GREATEST(quantity, VALUES(quantity)),
           product_name = VALUES(product_name),
           product_price = VALUES(product_price),
           product_image = VALUES(product_image),
           updated_at = CURRENT_TIMESTAMP`,
          [cart.id, localItem.id, localItem.name, parseFloat(localItem.price), localItem.image || null, localItem.quantity]
        )
      }
    }

    const [allItems] = await db.execute(
      'SELECT quantity, product_price FROM cart_items WHERE cart_id = ?',
      [cart.id]
    )
    
    const { totalQuantity, totalAmount } = calculateCartTotals(allItems)
    
    await db.execute(
      'UPDATE user_carts SET total_quantity = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [totalQuantity, totalAmount, cart.id]
    )

    const [mergedItems] = await db.execute(`
      SELECT 
        product_id as id,
        product_name as name,
        product_price as price,
        product_image as image,
        quantity,
        (product_price * quantity) as totalPrice
      FROM cart_items 
      WHERE cart_id = ?
      ORDER BY added_at DESC
    `, [cart.id])

    res.json({
      success: true,
      message: 'Cart synced successfully',
      data: {
        items: mergedItems || [],
        totalQuantity,
        totalAmount
      }
    })
  } catch (error) {
    console.error('Error syncing cart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to sync cart',
      error: error.message
    })
  }
})

module.exports = router 