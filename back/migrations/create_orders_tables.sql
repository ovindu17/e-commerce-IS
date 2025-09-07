-- Orders System Tables

-- Main orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id VARCHAR(128) NOT NULL, -- Firebase UID, references users table
    status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    -- Order totals
    total_items INT NOT NULL DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    shipping_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Customer information (snapshot at time of order)
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    customer_country VARCHAR(100),
    
    -- Shipping address
    shipping_address_line1 VARCHAR(255) NOT NULL,
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100) NOT NULL,
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100) NOT NULL,
    
    -- Billing address (can be same as shipping)
    billing_address_line1 VARCHAR(255) NOT NULL,
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100) NOT NULL,
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100) NOT NULL,
    same_as_shipping BOOLEAN DEFAULT true,
    
    -- Payment information (basic - no sensitive data)
    payment_method ENUM('credit_card', 'debit_card', 'paypal', 'stripe', 'cash_on_delivery') DEFAULT 'cash_on_delivery',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_reference VARCHAR(255), -- External payment gateway reference
    
    -- Order notes and tracking
    customer_notes TEXT,
    admin_notes TEXT,
    tracking_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP NULL,
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- Indexes for performance
    INDEX idx_order_user_id (user_id),
    INDEX idx_order_status (status),
    INDEX idx_order_number (order_number),
    INDEX idx_order_created (created_at),
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(uid) ON DELETE CASCADE
);

-- Order items table (products in each order)
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    
    -- Product information (snapshot at time of order)
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    product_description TEXT,
    product_image VARCHAR(500),
    
    -- Pricing information
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL, -- unit_price * quantity
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_order_items_order_id (order_id),
    INDEX idx_order_items_product_id (product_id),
    
    -- Foreign key constraint
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Order status history table (track status changes)
CREATE TABLE IF NOT EXISTS order_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    old_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'),
    new_status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') NOT NULL,
    changed_by VARCHAR(128), -- user_id who made the change (admin or system)
    change_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_status_history_order_id (order_id),
    INDEX idx_status_history_created (created_at),
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Order sequence table for generating order numbers
CREATE TABLE IF NOT EXISTS order_sequence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    year INT NOT NULL,
    sequence_number INT NOT NULL DEFAULT 0,
    UNIQUE KEY unique_year (year)
);

-- Insert current year if not exists
INSERT IGNORE INTO order_sequence (year, sequence_number) 
VALUES (YEAR(CURDATE()), 0);

-- Function to generate order numbers (stored procedure)
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS GenerateOrderNumber(OUT order_number VARCHAR(20))
BEGIN
    DECLARE current_year INT;
    DECLARE sequence_num INT;
    
    SET current_year = YEAR(CURDATE());
    
    -- Insert year if not exists
    INSERT IGNORE INTO order_sequence (year, sequence_number) VALUES (current_year, 0);
    
    -- Get and increment sequence
    UPDATE order_sequence 
    SET sequence_number = sequence_number + 1 
    WHERE year = current_year;
    
    SELECT sequence_number INTO sequence_num 
    FROM order_sequence 
    WHERE year = current_year;
    
    -- Format: ORD-2024-000001
    SET order_number = CONCAT('ORD-', current_year, '-', LPAD(sequence_num, 6, '0'));
END //
DELIMITER ;