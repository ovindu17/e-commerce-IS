const db = require('../config/database')

class User {
  static async getProfile(uid) {
    try {
      const [rows] = await db.execute(
        'SELECT uid, email, name, contact_number, country FROM users WHERE uid = ?',
        [uid]
      )
      return rows[0]
    } catch (error) {
      throw error
    }
  }

  static async updateProfile(uid, profileData) {
    try {
      const { name, contact_number, country } = profileData
      
      const existingUser = await this.getProfile(uid)
      
      if (existingUser) {
        await db.execute(
          'UPDATE users SET name = ?, contact_number = ?, country = ?, updated_at = NOW() WHERE uid = ?',
          [name, contact_number, country, uid]
        )
      } else {
        await db.execute(
          'INSERT INTO users (uid, name, contact_number, country, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
          [uid, name, contact_number, country]
        )
      }
      
      return await this.getProfile(uid)
    } catch (error) {
      throw error
    }
  }

  static async createUser(userData) {
    try {
      const { uid, email, name, contact_number, country } = userData
      
      await db.execute(
        'INSERT INTO users (uid, email, name, contact_number, country, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [uid, email, name, contact_number, country]
      )
      
      return await this.getProfile(uid)
    } catch (error) {
      throw error
    }
  }
}

module.exports = User