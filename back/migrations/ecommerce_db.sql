-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Sep 07, 2025 at 03:50 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ecommerce_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `GenerateOrderNumber` (OUT `order_number` VARCHAR(20))   BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_price` decimal(10,2) NOT NULL,
  `product_image` varchar(500) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart_items`
--

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `product_name`, `product_price`, `product_image`, `quantity`, `added_at`, `updated_at`) VALUES
(2, 1, '13', 'Smartphone Case', 19.99, NULL, 1, '2025-07-14 05:09:51', '2025-07-14 05:29:51'),
(3, 1, '12', 'Fiction Novel', 14.99, NULL, 1, '2025-07-14 05:09:51', '2025-07-14 05:29:51'),
(4, 1, '3', 'Bluetooth Headphones', 89.99, NULL, 1, '2025-07-14 05:09:51', '2025-07-14 05:29:51'),
(12, 1, '5', 'Jeans Premium', 79.99, NULL, 2, '2025-07-14 05:22:36', '2025-07-14 05:29:51'),
(16, 1, '2', 'Wireless Mouse', 29.99, NULL, 1, '2025-07-14 05:28:38', '2025-07-14 05:29:51'),
(19, 1, '1', 'Laptop Pro 15\"', 1299.99, NULL, 1, '2025-07-14 05:32:35', '2025-07-14 05:32:35');

-- --------------------------------------------------------

--
-- Table structure for table `guest_carts`
--

CREATE TABLE `guest_carts` (
  `id` int(11) NOT NULL,
  `session_id` varchar(128) NOT NULL,
  `cart_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`cart_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `expires_at` timestamp NOT NULL DEFAULT (current_timestamp() + interval 30 day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(20) NOT NULL,
  `user_id` varchar(128) NOT NULL,
  `status` enum('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT 'pending',
  `total_items` int(11) NOT NULL DEFAULT 0,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `shipping_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `customer_name` varchar(255) NOT NULL,
  `customer_email` varchar(255) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_country` varchar(100) DEFAULT NULL,
  `shipping_address_line1` varchar(255) NOT NULL,
  `shipping_address_line2` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_state` varchar(100) DEFAULT NULL,
  `shipping_postal_code` varchar(20) DEFAULT NULL,
  `shipping_country` varchar(100) NOT NULL,
  `billing_address_line1` varchar(255) NOT NULL,
  `billing_address_line2` varchar(255) DEFAULT NULL,
  `billing_city` varchar(100) NOT NULL,
  `billing_state` varchar(100) DEFAULT NULL,
  `billing_postal_code` varchar(20) DEFAULT NULL,
  `billing_country` varchar(100) NOT NULL,
  `same_as_shipping` tinyint(1) DEFAULT 1,
  `payment_method` enum('credit_card','debit_card','paypal','stripe','cash_on_delivery') DEFAULT 'cash_on_delivery',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending',
  `payment_reference` varchar(255) DEFAULT NULL,
  `customer_notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `tracking_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `shipped_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_items`, `subtotal`, `tax_amount`, `shipping_amount`, `total_amount`, `customer_name`, `customer_email`, `customer_phone`, `customer_country`, `shipping_address_line1`, `shipping_address_line2`, `shipping_city`, `shipping_state`, `shipping_postal_code`, `shipping_country`, `billing_address_line1`, `billing_address_line2`, `billing_city`, `billing_state`, `billing_postal_code`, `billing_country`, `same_as_shipping`, `payment_method`, `payment_status`, `payment_reference`, `customer_notes`, `admin_notes`, `tracking_number`, `created_at`, `updated_at`, `confirmed_at`, `shipped_at`, `delivered_at`) VALUES
(3, 'ORD-2025-000001', '6c39f0048299811f', 'pending', 4, 1449.96, 145.00, 0.00, 1594.96, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'colombo', 'colombo', 'colombo', 'colombo', '11000', 'China', 'colombo', 'colombo', 'colombo', 'colombo', '11000', 'China', 1, 'cash_on_delivery', 'pending', NULL, 'qwddwedw', NULL, NULL, '2025-09-07 11:06:04', '2025-09-07 11:06:04', NULL, NULL, NULL),
(4, 'ORD-2025-000002', '6c39f0048299811f', 'pending', 2, 1329.98, 133.00, 0.00, 1462.98, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'efrqf', 'frwfe', 'fre', 'fre', '111', 'China', 'efrqf', 'frwfe', 'fre', 'fre', '111', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:06:53', '2025-09-07 11:06:53', NULL, NULL, NULL),
(5, 'ORD-2025-000003', '6c39f0048299811f', 'pending', 1, 79.99, 8.00, 15.00, 102.99, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'ewddw', 'dwe', 'dwe', 'dew', '111', 'China', 'ewddw', 'dwe', 'dwe', 'dew', '111', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:07:50', '2025-09-07 11:07:50', NULL, NULL, NULL),
(6, 'ORD-2025-000004', '6c39f0048299811f', 'pending', 1, 89.99, 9.00, 15.00, 113.99, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'qwsdd', 'dwq', 'dwq', 'dw', '11', 'China', 'qwsdd', 'dwq', 'dwq', 'dw', '11', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:11:36', '2025-09-07 11:11:36', NULL, NULL, NULL),
(7, 'ORD-2025-000005', '6c39f0048299811f', 'pending', 1, 89.99, 9.00, 15.00, 113.99, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'sff', 'srg', 'xv', 'sfrf', '332', 'China', 'sff', 'srg', 'xv', 'sfrf', '332', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:13:59', '2025-09-07 11:13:59', NULL, NULL, NULL),
(8, 'ORD-2025-000006', '6c39f0048299811f', 'delivered', 1, 79.99, 8.00, 15.00, 102.99, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'daads', 'ds', 'sd', 'sd', '55', 'China', 'daads', 'ds', 'sd', 'sd', '55', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:14:50', '2025-09-07 11:58:00', NULL, NULL, '2025-09-07 11:58:00'),
(9, 'ORD-2025-000007', '6c39f0048299811f', 'pending', 1, 29.99, 3.00, 15.00, 47.99, 'Ovindu Pathirana', 'ovindupathirana554@gmail.com', '+94760148697', 'China', 'eds', 'das', 'adw', 'ad', '33', 'China', 'eds', 'das', 'adw', 'ad', '33', 'China', 1, 'cash_on_delivery', 'pending', NULL, '', NULL, NULL, '2025-09-07 11:18:56', '2025-09-07 11:18:56', NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_description` text DEFAULT NULL,
  `product_image` varchar(500) DEFAULT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `total_price` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_description`, `product_image`, `unit_price`, `quantity`, `total_price`, `created_at`) VALUES
(1, 3, '2', 'Wireless Mouse', NULL, NULL, 29.99, 2, 59.98, '2025-09-07 11:06:04'),
(2, 3, '3', 'Bluetooth Headphones', NULL, NULL, 89.99, 1, 89.99, '2025-09-07 11:06:04'),
(3, 3, '1', 'Laptop Pro 15\"', NULL, NULL, 1299.99, 1, 1299.99, '2025-09-07 11:06:04'),
(4, 4, '1', 'Laptop Pro 15\"', NULL, NULL, 1299.99, 1, 1299.99, '2025-09-07 11:06:53'),
(5, 4, '2', 'Wireless Mouse', NULL, NULL, 29.99, 1, 29.99, '2025-09-07 11:06:53'),
(6, 5, '5', 'Jeans Premium', NULL, NULL, 79.99, 1, 79.99, '2025-09-07 11:07:50'),
(7, 6, '3', 'Bluetooth Headphones', NULL, NULL, 89.99, 1, 89.99, '2025-09-07 11:11:36'),
(8, 7, '3', 'Bluetooth Headphones', NULL, NULL, 89.99, 1, 89.99, '2025-09-07 11:13:59'),
(9, 8, '5', 'Jeans Premium', NULL, NULL, 79.99, 1, 79.99, '2025-09-07 11:14:50'),
(10, 9, '2', 'Wireless Mouse', NULL, NULL, 29.99, 1, 29.99, '2025-09-07 11:18:56');

-- --------------------------------------------------------

--
-- Table structure for table `order_sequence`
--

CREATE TABLE `order_sequence` (
  `id` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `sequence_number` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_sequence`
--

INSERT INTO `order_sequence` (`id`, `year`, `sequence_number`) VALUES
(1, 2025, 7);

-- --------------------------------------------------------

--
-- Table structure for table `order_status_history`
--

CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `old_status` enum('pending','confirmed','processing','shipped','delivered','cancelled') DEFAULT NULL,
  `new_status` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL,
  `changed_by` varchar(128) DEFAULT NULL,
  `change_reason` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_status_history`
--

INSERT INTO `order_status_history` (`id`, `order_id`, `old_status`, `new_status`, `changed_by`, `change_reason`, `created_at`) VALUES
(1, 3, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:06:04'),
(2, 4, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:06:53'),
(3, 5, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:07:50'),
(4, 6, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:11:36'),
(5, 7, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:13:59'),
(6, 8, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:14:50'),
(7, 9, NULL, 'pending', '6c39f0048299811f', 'Order created', '2025-09-07 11:18:56'),
(8, 8, 'pending', 'delivered', '6c39f0048299811f', 'Status updated by admin: Ovindu Pathirana', '2025-09-07 11:58:00');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `stock_quantity` int(11) DEFAULT 0,
  `supplier_id` int(11) DEFAULT NULL,
  `created_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `product_name`, `category`, `unit_price`, `stock_quantity`, `supplier_id`, `created_date`) VALUES
(1, 'Laptop Pro 15\"', 'Electronics', 1299.99, 50, 1, '2024-01-15'),
(2, 'Wireless Mouse', 'Electronics', 29.99, 200, 1, '2024-01-20'),
(3, 'Bluetooth Headphones', 'Electronics', 89.99, 75, 1, '2024-02-01'),
(4, 'Designer T-Shirt', 'Clothing', 34.99, 100, 2, '2024-01-25'),
(5, 'Jeans Premium', 'Clothing', 79.99, 80, 2, '2024-02-10'),
(6, 'Running Shoes', 'Footwear', 129.99, 60, 4, '2024-01-30'),
(7, 'Coffee Maker', 'Home & Kitchen', 149.99, 40, 3, '2024-02-05'),
(8, 'Blender', 'Home & Kitchen', 79.99, 35, 3, '2024-02-15'),
(9, 'Yoga Mat', 'Sports', 24.99, 120, 4, '2024-01-10'),
(10, 'Dumbbell Set', 'Sports', 199.99, 25, 4, '2024-02-20'),
(11, 'Programming Book', 'Books', 49.99, 90, 5, '2024-01-05'),
(12, 'Fiction Novel', 'Books', 14.99, 150, 5, '2024-01-12'),
(13, 'Smartphone Case', 'Electronics', 19.99, 300, 1, '2024-02-25'),
(14, 'Winter Jacket', 'Clothing', 159.99, 45, 2, '2024-03-01'),
(15, 'Kitchen Knife Set', 'Home & Kitchen', 89.99, 55, 3, '2024-03-05');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `supplier_name`, `contact_person`, `email`, `phone`, `address`) VALUES
(1, 'Tech Solutions Inc', 'John Smith', 'john@techsolutions.com', '555-0101', '123 Tech St, Silicon Valley, CA'),
(2, 'Fashion Forward Ltd', 'Sarah Johnson', 'sarah@fashionforward.com', '555-0102', '456 Style Ave, New York, NY'),
(3, 'Home Essentials Co', 'Mike Brown', 'mike@homeessentials.com', '555-0103', '789 Home Blvd, Chicago, IL'),
(4, 'Sports Gear Pro', 'Lisa Davis', 'lisa@sportsgear.com', '555-0104', '321 Fitness St, Los Angeles, CA'),
(5, 'Book World Publishers', 'David Wilson', 'david@bookworld.com', '555-0105', '654 Literary Lane, Boston, MA');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `uid` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `uid`, `email`, `name`, `contact_number`, `country`, `created_at`, `updated_at`) VALUES
(1, '6c39f0048299811f', NULL, 'faef', '+94760148697', 'China', '2025-09-07 10:57:47', '2025-09-07 10:57:47'),
(2, '76bac20f97ac2573', 'outlook_76BAC20F97AC2573@outlook.com', 'mareen alex', '+941234567890', 'Brazil', '2025-09-07 12:10:58', '2025-09-07 12:11:15');

-- --------------------------------------------------------

--
-- Table structure for table `user_carts`
--

CREATE TABLE `user_carts` (
  `id` int(11) NOT NULL,
  `user_id` varchar(128) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `total_quantity` int(11) DEFAULT 0,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_carts`
--

INSERT INTO `user_carts` (`id`, `user_id`, `created_at`, `updated_at`, `total_quantity`, `total_amount`, `is_active`) VALUES
(1, 'RFCrxl9erZTVavMpvPzU0vrj7E53', '2025-07-11 16:24:52', '2025-07-14 05:32:35', 7, 1614.93, 1),
(2, '6c39f0048299811f', '2025-09-07 11:06:16', '2025-09-07 11:06:16', 0, 0.00, 1),
(3, '76bac20f97ac2573', '2025-09-07 12:32:18', '2025-09-07 12:32:18', 0, 0.00, 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart_product` (`cart_id`,`product_id`),
  ADD KEY `idx_cart_items_cart_id` (`cart_id`),
  ADD KEY `idx_cart_items_product_id` (`product_id`);

--
-- Indexes for table `guest_carts`
--
ALTER TABLE `guest_carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session` (`session_id`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `idx_order_user_id` (`user_id`),
  ADD KEY `idx_order_status` (`status`),
  ADD KEY `idx_order_number` (`order_number`),
  ADD KEY `idx_order_created` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_id` (`product_id`);

--
-- Indexes for table `order_sequence`
--
ALTER TABLE `order_sequence`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_year` (`year`);

--
-- Indexes for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status_history_order_id` (`order_id`),
  ADD KEY `idx_status_history_created` (`created_at`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD KEY `supplier_id` (`supplier_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uid` (`uid`),
  ADD KEY `idx_uid` (`uid`),
  ADD KEY `idx_email` (`email`);

--
-- Indexes for table `user_carts`
--
ALTER TABLE `user_carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_cart` (`user_id`),
  ADD KEY `idx_user_carts_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `guest_carts`
--
ALTER TABLE `guest_carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `order_sequence`
--
ALTER TABLE `order_sequence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `order_status_history`
--
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `user_carts`
--
ALTER TABLE `user_carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`cart_id`) REFERENCES `user_carts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`uid`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_status_history`
--
ALTER TABLE `order_status_history`
  ADD CONSTRAINT `order_status_history_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
