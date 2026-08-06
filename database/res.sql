-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Server version:               8.4.3 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Phiên bản:           12.8.0.6908
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for res
CREATE DATABASE IF NOT EXISTS `res` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `res`;

-- Dumping structure for table res.admins
CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `role` enum('super_admin','manager','support') DEFAULT 'manager',
  `status` enum('active','inactive') DEFAULT 'active',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.admins: ~2 rows (approximately)
INSERT INTO `admins` (`admin_id`, `full_name`, `username`, `email`, `password`, `phone`, `avatar`, `role`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
	(1, 'Administrator', 'admin', 'admin@foodapp.com', '123456', NULL, NULL, 'manager', 'active', NULL, '2026-07-08 03:09:06', '2026-07-10 00:12:47'),
	(2, 'Trọng Duy', 'Duy béo', 'Duybeo@gmail.com', '123456789', '1234567', NULL, 'super_admin', 'active', NULL, '2026-07-10 00:12:21', '2026-07-10 00:12:50');

-- Dumping structure for table res.admin_logs
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` varchar(255) NOT NULL,
  `target_type` enum('customer','restaurant','driver','order','food','system') DEFAULT NULL,
  `target_id` int DEFAULT NULL,
  `description` text,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `admin_id` (`admin_id`),
  CONSTRAINT `admin_logs_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`admin_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.admin_logs: ~0 rows (approximately)

-- Dumping structure for table res.customers
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `total_orders` int DEFAULT '0',
  `total_spent` decimal(12,2) DEFAULT '0.00',
  `status` enum('active','locked','banned') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.customers: ~3 rows (approximately)
INSERT INTO `customers` (`customer_id`, `full_name`, `phone`, `email`, `avatar`, `gender`, `birthday`, `total_orders`, `total_spent`, `status`, `created_at`, `updated_at`) VALUES
	(1, 'Thiện Hiền Lành', '4444', 'Thien@gmail.com', 'no need my dear~', 'male', '2006-07-04', 0, 0.00, 'active', '2026-07-10 00:15:11', '2026-07-10 00:15:13'),
	(2, 'Quốc đít Duy', '5555', 'DuybiQuoc@gmail.com', 'he not like show his face ', 'male', '2026-07-10', 0, 0.00, 'active', '2026-07-10 00:17:11', '2026-07-10 00:17:12'),
	(3, 'Trọng Duy béo', '6767', 'beoDuyTrong@gmail.com', 'he so fat and perverted', 'male', '2026-07-10', 0, 0.00, 'active', '2026-07-10 00:20:04', '2026-07-10 00:20:05');

-- Dumping structure for table res.employees
CREATE TABLE IF NOT EXISTS `employees` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `position` varchar(50) DEFAULT NULL,
  `salary` decimal(10,2) DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.employees: ~10 rows (approximately)
INSERT INTO `employees` (`employee_id`, `restaurant_id`, `full_name`, `phone`, `email`, `position`, `salary`, `hire_date`, `status`, `created_at`) VALUES
	(1, 1, 'Thiện nô lệ', '123', '123@', 'Chân chạy vặt', 10000.00, '2026-07-10', 'active', '2026-07-10 01:04:24'),
	(2, 2, 'Thiện nô lệ lần 2', '1234', '1234@', 'Chân chạy vặt và ship hàng', 20000.00, '2026-07-10', 'active', '2026-07-10 01:05:34'),
	(3, 3, 'Tại sao lại là Thiện', '12345', '12345@', 'Bếp trưởng ', 35000.00, '2026-07-10', 'active', '2026-07-10 01:06:22'),
	(4, 4, 'Quốc Duy', '321', '321@', 'Pha chế tà tưa', 20000.00, '2026-07-10', 'active', '2026-07-10 01:07:14'),
	(5, 5, 'Phong bạc', '4321', '4321@', 'Đầu bếp Phong phú', 50000.00, '2026-07-10', 'active', '2026-07-10 01:08:01'),
	(6, 6, 'Minh mặng mà', '4444', '4444@', 'Nhân viên của năm', 100000.00, '2026-07-10', 'active', '2026-07-10 01:09:16'),
	(7, 7, 'Thắng gấp', '5555', '555@', 'Nhân viên phục vụ ', 30000.00, '2026-07-10', 'active', '2026-07-10 01:10:11'),
	(8, 8, 'Trọng Duy là món heo quay', '6667', '6667@', 'Con heo đang bị quay', 0.00, '2026-07-10', 'active', '2026-07-10 01:11:06'),
	(9, 9, 'Chị chanh xã', '8888', '8888@', 'Nhân viên pha chế chanh xả', 40000.00, '2026-07-10', 'active', '2026-07-10 01:11:57'),
	(10, 10, 'Cô Mai ăn vặt trong lớp', '7777', '7777@', 'Kẻ ăn vặt bị truy nã', -80000.00, '2026-07-10', 'active', '2026-07-10 01:12:58');

-- Dumping structure for table res.foods
CREATE TABLE IF NOT EXISTS `foods` (
  `food_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `category_id` int DEFAULT NULL,
  `food_name` varchar(150) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `sold` int DEFAULT '0',
  `rating` decimal(2,1) DEFAULT '5.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`food_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `foods_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  CONSTRAINT `foods_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`category_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.foods: ~20 rows (approximately)
INSERT INTO `foods` (`food_id`, `restaurant_id`, `category_id`, `food_name`, `description`, `price`, `image`, `is_available`, `sold`, `rating`, `created_at`) VALUES
	(1, 1, 1, 'Bánh mì trứng ốp la', 'bánh mì bình dân rất rẽ', 20000.00, NULL, 20, 10, 3.5, '2026-07-10 00:28:21'),
	(2, 1, 1, 'Bánh mì xí mại', 'bánh mì xí mại thơm ngon mềm dai ', 25000.00, NULL, 30, 20, 4.5, '2026-07-10 00:30:00'),
	(3, 1, 1, 'Bánh mì Duy quay', 'Bánh mì thịt từ loài heo đặc biệt rất thơm ngon và nhiều mỡ giống tôi', 30000.00, NULL, 40, 25, 5.0, '2026-07-10 00:31:18'),
	(4, 1, 1, 'Bánh mì thập cẩm', 'bạn muốn có gì chúng tôi cho bạn cái đó ', 35000.00, NULL, 35, 20, 5.0, '2026-07-10 00:32:14'),
	(5, 2, 2, 'Cháo lồng ', 'cháo lồng nóng hổi thơm ngon tuyệt vời', 25000.00, NULL, 45, 30, 4.0, '2026-07-10 00:33:37'),
	(6, 2, 2, 'Cháo gà', 'bạn thích cháo ? bạn thích thịt gà ? chúng tôi có cháo gà !', 30000.00, NULL, 50, 30, 5.0, '2026-07-10 00:34:32'),
	(7, 2, 2, 'Cháo dinh dưỡng', 'dành cho con bạn chứ không phải cho bạn', 25000.00, NULL, 30, 15, 4.5, '2026-07-10 00:36:51'),
	(8, 3, 3, 'Mỳ cay hải sản (cấp 1-7)', 'Hải sản với mì cay ? tại sao không chứ ?', 49000.00, NULL, 100, 20, 5.0, '2026-07-10 00:39:21'),
	(9, 3, 3, 'Mỳ cay thịt bò+xúc xích', 'Dành cho những ai thích thịt', 55000.00, NULL, 100, 50, 5.0, '2026-07-10 00:40:25'),
	(10, 3, 3, 'Mỳ cay phô mai', 'Béo mềm thơm ngon và cay nồng', 50000.00, NULL, 100, 30, 5.0, '2026-07-10 00:40:28'),
	(11, 3, 3, 'Mỳ cay bừa bộ ', 'Chúng tôi có gì chúng tôi cho bạn hết', 55000.00, NULL, 100, 50, 5.0, '2026-07-10 00:42:34'),
	(12, 4, 4, 'Trà sửa machat ', 'Cái này Batman không uống được', 35000.00, NULL, 50, 12, 5.0, '2026-07-10 00:43:38'),
	(13, 4, 4, 'Sữa tươi trân châu đen', 'Không phải trà mà là sữa tươi ngon ngọt', 30000.00, NULL, 40, 20, 5.0, '2026-07-10 00:44:36'),
	(14, 4, 4, 'Trà đào', 'Loại trà mà nhiều người thích, tiếc là không có sữa', 35000.00, NULL, 50, 10, 5.0, '2026-07-10 00:45:40'),
	(15, 4, 4, 'Trà sữa truyền thống', 'Trà sữa cổ điển, đơn giản và hoài niệm', 25000.00, NULL, 40, 20, 5.0, '2026-07-10 00:46:42'),
	(16, 4, 4, 'Trà sữa cúc bạch', 'Trà này tôi chưa uống nên không biết nói gì', 30000.00, NULL, 30, 20, 5.0, '2026-07-10 00:47:43'),
	(17, 5, 5, 'Lẩu hải sản miền Tây ', 'ai dân miền Tây sẽ thích cái này lắm', 100000.00, NULL, 30, 5, 5.0, '2026-07-10 00:49:04'),
	(18, 5, 5, 'Lẩu riêu cua bắp bò sườn sụn', 'no comment vì chưa ăn lần nào', 200000.00, NULL, 40, 10, 5.0, '2026-07-10 00:53:39'),
	(19, 5, 5, 'Lẩu ếch măng cay', 'ugh...i don\'t like frog', 250000.00, NULL, 30, 19, 5.0, '2026-07-10 01:01:54'),
	(20, 5, 5, 'Lẩu cá trắm đen', 'ngon....that all i know', 300000.00, NULL, 20, 13, 5.0, '2026-07-10 01:02:58');

-- Dumping structure for table res.food_categories
CREATE TABLE IF NOT EXISTS `food_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `food_categories_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.food_categories: ~10 rows (approximately)
INSERT INTO `food_categories` (`category_id`, `restaurant_id`, `category_name`, `created_at`) VALUES
	(1, 1, 'bánh mì', '2026-07-10 00:23:18'),
	(2, 2, 'cháo ', '2026-07-10 00:23:36'),
	(3, 3, 'mỳ cay', '2026-07-10 00:23:57'),
	(4, 4, 'tà tưa', '2026-07-10 00:24:28'),
	(5, 5, 'lẩu hoài niệm', '2026-07-10 00:24:47'),
	(6, 6, 'bún đậu', '2026-07-10 00:24:50'),
	(7, 7, 'lẩu cù lao', '2026-07-10 00:25:18'),
	(8, 8, 'duy quay thơm phức', '2026-07-10 00:25:45'),
	(9, 9, 'nước giải khác', '2026-07-10 00:26:01'),
	(10, 10, 'đồ ăn vặt', '2026-07-10 00:26:23');

-- Dumping structure for table res.menu_items
CREATE TABLE IF NOT EXISTS `menu_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `category_id` int NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `restaurant_id` (`restaurant_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE,
  CONSTRAINT `menu_items_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `food_categories` (`category_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.menu_items: ~0 rows (approximately)

-- Dumping structure for table res.reports
CREATE TABLE IF NOT EXISTS `reports` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `reporter_type` enum('customer','restaurant','driver') DEFAULT NULL,
  `reporter_id` int DEFAULT NULL,
  `reported_type` enum('customer','restaurant','driver','food','order') DEFAULT NULL,
  `reported_id` int DEFAULT NULL,
  `reason` text,
  `status` enum('pending','processing','resolved','rejected') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.reports: ~0 rows (approximately)

-- Dumping structure for table res.restaurants
CREATE TABLE IF NOT EXISTS `restaurants` (
  `restaurant_id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int DEFAULT NULL,
  `restaurant_name` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `description` text,
  `open_time` time DEFAULT NULL,
  `close_time` time DEFAULT NULL,
  `status` enum('pending','approved','closed','blocked') DEFAULT 'pending',
  `rating` decimal(2,1) DEFAULT '5.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`restaurant_id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurants: ~10 rows (approximately)
INSERT INTO `restaurants` (`restaurant_id`, `owner_id`, `restaurant_name`, `phone`, `email`, `password`, `address`, `latitude`, `longitude`, `logo`, `cover_image`, `description`, `open_time`, `close_time`, `status`, `rating`, `created_at`) VALUES
	(1, 1, 'Bánh mì cô Huyền', '12345', '@1234', '1234@', 'Đại lộ Bình Dương', 12.00000000, 12.00000000, NULL, NULL, NULL, '06:00:00', '18:00:00', 'approved', 4.0, '2026-07-09 06:16:23'),
	(2, 2, 'Cháo bình Dân', '12356', '@1235', '1235@', 'Đại lộ Bình Dương', 14.00000000, 14.00000000, NULL, NULL, NULL, '07:00:00', '19:00:00', 'approved', 4.0, '2026-07-09 06:20:09'),
	(3, 3, 'Mỳ cay xé lưỡi', '3214', '4321@', '@3214', 'Đại lộ Bình Dương', 59.00000000, 54.00000000, NULL, NULL, NULL, '11:00:00', '21:00:00', 'approved', 5.0, '2026-07-09 06:22:41'),
	(4, 4, 'Trà sữa Quốc Duy', '2341', '@2341', '2341@', 'TP.Thủ Dầu Một', 80.00000000, 79.00000000, NULL, NULL, NULL, '09:00:00', '20:30:00', 'approved', 5.0, '2026-07-09 06:26:27'),
	(5, 5, 'Lẩu xưa như Thắng', '2133', '@2133', '2133@', 'Quận 8 TPHM', 30.00000000, 20.00000000, NULL, NULL, NULL, '17:00:00', '22:00:00', 'approved', 5.0, '2026-07-09 07:05:45'),
	(6, 6, 'Bún đậu mấm tôm 67', '6767', '@6767', '6767@', 'Quận 67 TPHM', 67.00000000, 67.00000000, NULL, NULL, NULL, '06:07:00', '18:07:00', 'approved', 4.5, '2026-07-09 07:11:07'),
	(7, 7, 'Lẩu cù lao Phong Bạc', '5747', '@5747', '5747@', 'Bình Dương', 56.00000000, 34.00000000, NULL, NULL, NULL, '12:00:00', '20:00:00', 'approved', 5.0, '2026-07-09 07:22:10'),
	(8, 8, 'Heo quay Trọng Duy', '2993', '@2993', '2993@', 'Đường Nguyễn Thị Minh Khai', 67.00000000, 36.00000000, NULL, NULL, NULL, '04:00:00', '10:00:00', 'approved', 5.0, '2026-07-09 07:23:49'),
	(9, 9, 'Nước trái cây chị Lam', '8998', '@8998', '8998@', 'Quận 1 TPHCM', 43.00000000, 67.00000000, NULL, NULL, NULL, '07:00:00', '15:00:00', 'approved', 5.0, '2026-07-10 00:08:32'),
	(10, 10, 'Mai ăn vặt', '5555', '@5555', '5555@', 'BDU', 42.00000000, 21.00000000, NULL, NULL, NULL, '08:00:00', '17:00:00', 'approved', 5.0, '2026-07-10 00:08:48');

-- Dumping structure for table res.restaurant_notifications
CREATE TABLE IF NOT EXISTS `restaurant_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `restaurant_notifications_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurant_notifications: ~0 rows (approximately)

-- Dumping structure for table res.restaurant_orders
CREATE TABLE IF NOT EXISTS `restaurant_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `driver_id` int DEFAULT NULL,
  `restaurant_id` int NOT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','accepted','preparing','ready','completed','cancelled') DEFAULT 'pending',
  `accepted_at` datetime DEFAULT NULL,
  `preparing_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `restaurant_orders_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurant_orders: ~0 rows (approximately)

-- Dumping structure for table res.restaurant_order_details
CREATE TABLE IF NOT EXISTS `restaurant_order_details` (
  `detail_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `food_id` int DEFAULT NULL,
  `food_name` varchar(150) DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `note` text,
  PRIMARY KEY (`detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurant_order_details: ~0 rows (approximately)

-- Dumping structure for table res.restaurant_wallet
CREATE TABLE IF NOT EXISTS `restaurant_wallet` (
  `wallet_id` int NOT NULL AUTO_INCREMENT,
  `restaurant_id` int NOT NULL,
  `balance` decimal(12,2) DEFAULT '0.00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`wallet_id`),
  UNIQUE KEY `restaurant_id` (`restaurant_id`),
  CONSTRAINT `restaurant_wallet_ibfk_1` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`restaurant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurant_wallet: ~0 rows (approximately)

-- Dumping structure for table res.restaurant_wallet_transactions
CREATE TABLE IF NOT EXISTS `restaurant_wallet_transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `wallet_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `type` enum('income','withdraw') NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `wallet_id` (`wallet_id`),
  CONSTRAINT `restaurant_wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `restaurant_wallet` (`wallet_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.restaurant_wallet_transactions: ~0 rows (approximately)

-- Dumping structure for table res.revenue_statistics
CREATE TABLE IF NOT EXISTS `revenue_statistics` (
  `statistic_id` int NOT NULL AUTO_INCREMENT,
  `statistic_date` date DEFAULT NULL,
  `total_orders` int DEFAULT '0',
  `total_revenue` decimal(12,2) DEFAULT '0.00',
  `total_customers` int DEFAULT '0',
  `total_restaurants` int DEFAULT '0',
  `total_drivers` int DEFAULT '0',
  PRIMARY KEY (`statistic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.revenue_statistics: ~0 rows (approximately)

-- Dumping structure for table res.system_notifications
CREATE TABLE IF NOT EXISTS `system_notifications` (
  `notification_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target` enum('customer','restaurant','driver','all') DEFAULT 'all',
  `is_sent` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.system_notifications: ~0 rows (approximately)

-- Dumping structure for table res.system_settings
CREATE TABLE IF NOT EXISTS `system_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) DEFAULT NULL,
  `setting_value` text,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table res.system_settings: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
