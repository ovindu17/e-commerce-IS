-- Create users table to store extended profile information
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255),
    name VARCHAR(255),
    contact_number VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uid (uid),
    INDEX idx_email (email)
);

-- Insert some sample data (optional)
-- You can remove this section if you don't want sample data
-- INSERT INTO users (uid, email, name, contact_number, country) VALUES
-- ('sample-uid-1', 'john@example.com', 'John Doe', '+1234567890', 'United States'),
-- ('sample-uid-2', 'jane@example.com', 'Jane Smith', '+0987654321', 'Canada');