const express = require('express')
const router = express.Router()
const Product = require('../models/Product')

// GET /api/products/categories - Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.getCategories()
    res.json({
      success: true,
      data: categories,
      count: categories.length
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    })
  }
})

// GET /api/products - Get all products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    let products
    
    if (category && category !== 'all') {
      products = await Product.getByCategoryName(category)
    } else {
      products = await Product.getAll()
    }
    
    res.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    })
  }
})

// GET /api/products/:id - Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const product = await Product.getById(id)
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      })
    }
    
    res.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    })
  }
})

// GET /api/products/category/:categoryId - Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params
    const products = await Product.getByCategory(categoryId)
    
    res.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching products by category',
      error: error.message
    })
  }
})

// GET /api/products/search/:term - Search products
router.get('/search/:term', async (req, res) => {
  try {
    const { term } = req.params
    const products = await Product.search(term)
    
    res.json({
      success: true,
      data: products,
      count: products.length
    })
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({
      success: false,
      message: 'Error searching products',
      error: error.message
    })
  }
})

module.exports = router