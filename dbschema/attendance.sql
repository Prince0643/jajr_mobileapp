-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 06, 2026 at 02:31 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int NOT NULL,
  `status` enum('Present','Late','Absent','System') DEFAULT NULL,
  `branch_name` varchar(50) NOT NULL,
  `attendance_date` date NOT NULL,
  `time_in` datetime DEFAULT NULL,
  `time_out` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_auto_absent` tinyint(1) DEFAULT '0',
  `auto_absent_applied` tinyint(1) DEFAULT '0',
  `absent_notes` text,
  `is_overtime_running` tinyint(1) NOT NULL,
  `is_time_running` tinyint(1) NOT NULL,
  `total_ot_hrs` varchar(10) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=759 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `status`, `branch_name`, `attendance_date`, `time_in`, `time_out`, `created_at`, `updated_at`, `is_auto_absent`, `auto_absent_applied`, `absent_notes`, `is_overtime_running`, `is_time_running`, `total_ot_hrs`) VALUES
(758, 15, NULL, 'BCDA - CCA', '2026-02-06', '2026-02-06 10:29:27', NULL, '2026-02-06 02:29:27', NULL, 0, 0, NULL, 0, 1, ''),
(757, 14, NULL, 'BCDA - CCA', '2026-02-06', '2026-02-06 10:29:26', NULL, '2026-02-06 02:29:26', NULL, 0, 0, NULL, 0, 1, ''),
(756, 60, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 10:24:18', '2026-02-06 10:24:22', '2026-02-06 02:24:18', NULL, 0, 0, NULL, 0, 0, ''),
(755, 63, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 10:24:17', '2026-02-06 10:24:21', '2026-02-06 02:24:17', NULL, 0, 0, NULL, 0, 0, ''),
(754, 64, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 10:24:16', '2026-02-06 10:24:23', '2026-02-06 02:24:16', NULL, 0, 0, NULL, 0, 0, ''),
(753, 62, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 10:24:15', '2026-02-06 10:24:21', '2026-02-06 02:24:15', NULL, 0, 0, NULL, 0, 0, ''),
(752, 61, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 10:24:07', '2026-02-06 10:24:10', '2026-02-06 02:24:07', NULL, 0, 0, NULL, 0, 0, '');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
