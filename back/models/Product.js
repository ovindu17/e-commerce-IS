const db = require('../config/database')

class Product {
  static async getAll() {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM products '
      )
      return rows
    } catch (error) {
      throw error
    }
  }

  static async getById(id) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM products WHERE product_id = ? ',
        [id]
      )
      return rows[0]
    } catch (error) {
      throw error
    }
  }

  static async getByCategory(categoryId) {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, description, price, image_url, category_id, stock_quantity FROM products WHERE category_id = ? AND is_active = 1',
        [categoryId]
      )
      return rows
    } catch (error) {
      throw error
    }
  }

  static async search(searchTerm) {
    try {
      const [rows] = await db.execute(
        'SELECT id, name, description, price, image_url, category_id, stock_quantity FROM products WHERE (name LIKE ? OR description LIKE ?) AND is_active = 1',
        [`%${searchTerm}%`, `%${searchTerm}%`]
      )
      return rows
    } catch (error) {
      throw error
    }
  }

  static async getCategories() {
    try {
      const [rows] = await db.execute(
        'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != "" ORDER BY category'
      )
      return rows.map(row => row.category)
    } catch (error) {
      throw error
    }
  }

  static async getByCategoryName(categoryName) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM products WHERE category = ?',
        [categoryName]
      )
      return rows
    } catch (error) {
      throw error
    }
  }
}

module.exports = Product