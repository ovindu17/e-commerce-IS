-- Cart Storage Tables

-- Table to store user carts
CREATE TABLE user_carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(128) NOT NULL, -- Firebase UID
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total_quantity INT DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_user_cart (user_id)
);

-- Table to store individual cart items
CREATE TABLE cart_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cart_id INT NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  product_image VARCHAR(500),
  quantity INT NOT NULL DEFAULT 1,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES user_carts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_product (cart_id, product_id)
);

-- Index for better performance
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_user_carts_user_id ON user_carts(user_id);

-- Table for guest cart sessions (optional - for guest users)
CREATE TABLE guest_carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id VARCHAR(128) NOT NULL,
  cart_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL 30 DAY),
  UNIQUE KEY unique_session (session_id)
);

-- Clean up expired guest carts (run this as a scheduled job)
-- DELETE FROM guest_carts WHERE expires_at < NOW(); 