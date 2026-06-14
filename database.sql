-- phpMyAdmin SQL Dump
-- Database: `wil_coffeeshopdb`
--

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- --------------------------------------------------------
-- CREATE DATABASE
-- --------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `wil_coffeeshopdb` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `wil_coffeeshopdb`;

-- --------------------------------------------------------
-- Table structure for table `Setting`
-- --------------------------------------------------------
CREATE TABLE `Setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cafeName` varchar(255) NOT NULL,
  `cafeAddress` text NOT NULL,
  `taxPercentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default settings
INSERT INTO `Setting` (`id`, `cafeName`, `cafeAddress`, `taxPercentage`) VALUES
(1, 'Wil''s Coffee Shop', 'Jl. Kopi Nikmat No. 123, Jakarta', 5.00);

-- --------------------------------------------------------
-- Table structure for table `Category`
-- --------------------------------------------------------
CREATE TABLE `Category` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert dummy categories
INSERT INTO `Category` (`name`) VALUES
('Coffee'),
('Non Coffee'),
('Tea'),
('Matcha'),
('Snack');

-- --------------------------------------------------------
-- Table structure for table `User`
-- --------------------------------------------------------
CREATE TABLE `User` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `role` varchar(50) DEFAULT 'Kasir',
  `pin` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default cashier
INSERT INTO `User` (`name`, `role`, `pin`) VALUES
('Kasir Utama', 'Kasir', '123456');

-- --------------------------------------------------------
-- Table structure for table `Product`
-- --------------------------------------------------------
CREATE TABLE `Product` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `categoryId` int(11) DEFAULT NULL,
  `image` longtext,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `Order`
-- --------------------------------------------------------
CREATE TABLE `Order` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customerName` varchar(255) DEFAULT 'Guest',
  `orderType` varchar(50) DEFAULT 'Dine In',
  `totalAmount` decimal(15,2) NOT NULL,
  `paymentMethod` varchar(50) DEFAULT 'Cash',
  `note` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table structure for table `OrderDetail`
-- --------------------------------------------------------
CREATE TABLE `OrderDetail` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT `fk_orderdetail_order` FOREIGN KEY (`orderId`) REFERENCES `Order` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orderdetail_product` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

COMMIT;