const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/auth')
const User = require('../models/User')

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let dbUser = await User.getProfile(req.user.uid)
    
    if (!dbUser) {
      dbUser = await User.createUser({
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name,
        contact_number: null,
        country: null
      })
    }
    
    const user = {
      uid: req.user.uid,
      email: req.user.email || dbUser.email,
      name: req.user.name || dbUser.name,
      contact_number: dbUser.contact_number,
      country: dbUser.country
    }
    
    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    })
  }
})

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, contact_number, country } = req.body
    
    const updatedUser = await User.updateProfile(req.user.uid, {
      name: name || req.user.name,
      contact_number,
      country
    })
    
    const responseUser = {
      uid: req.user.uid,
      email: req.user.email,
      name: updatedUser.name,
      contact_number: updatedUser.contact_number,
      country: updatedUser.country
    }
    
    res.json({
      success: true,
      data: responseUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Error updating user profile:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating user profile',
      error: error.message
    })
  }
})

router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.uid || req.user.id
    const { limit = 10, offset = 0, status } = req.query
    
    const Order = require('../models/Order')
    
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
    console.error('Error fetching user orders:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user orders',
      error: error.message
    })
  }
})

module.exports = router 