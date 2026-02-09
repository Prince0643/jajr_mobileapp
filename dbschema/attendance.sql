-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 06, 2026 at 07:37 AM
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
  `status` enum('Present','Late','Absent','System') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
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
) ENGINE=MyISAM AUTO_INCREMENT=779 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `status`, `branch_name`, `attendance_date`, `time_in`, `time_out`, `created_at`, `updated_at`, `is_auto_absent`, `auto_absent_applied`, `absent_notes`, `is_overtime_running`, `is_time_running`, `total_ot_hrs`) VALUES
(773, 18, NULL, 'BCDA - CCA', '2026-02-06', '2026-02-06 12:59:32', '2026-02-06 12:59:49', '2026-02-06 04:59:32', NULL, 0, 0, NULL, 0, 0, ''),
(772, 18, 'Absent', 'BCDA - CCA', '2026-02-06', '2026-02-06 12:59:01', '2026-02-06 12:59:03', '2026-02-06 04:56:16', NULL, 0, 0, 'Napan tinmakki', 0, 0, ''),
(771, 14, NULL, 'BCDA - Admin', '2026-02-06', '2026-02-06 11:51:05', '2026-02-06 12:59:47', '2026-02-06 03:51:05', '2026-02-06 05:15:47', 0, 0, NULL, 0, 0, ''),
(770, 19, NULL, 'BCDA - Fence', '2026-02-06', '2026-02-06 11:50:53', '2026-02-06 11:50:58', '2026-02-06 03:50:53', '2026-02-06 03:51:04', 0, 0, NULL, 0, 0, ''),
(769, 14, NULL, 'BCDA - Admin', '2026-02-06', '2026-02-06 11:50:52', '2026-02-06 11:50:59', '2026-02-06 03:50:52', NULL, 0, 0, NULL, 0, 0, ''),
(768, 19, NULL, 'BCDA - Admin', '2026-02-06', '2026-02-06 11:50:39', '2026-02-06 11:50:46', '2026-02-06 03:50:39', NULL, 0, 0, NULL, 0, 0, ''),
(767, 17, NULL, 'BCDA - Admin', '2026-02-06', '2026-02-06 11:49:55', NULL, '2026-02-06 03:49:55', '2026-02-06 03:51:15', 0, 0, NULL, 0, 1, ''),
(766, 16, NULL, 'BCDA - CCA', '2026-02-06', '2026-02-06 11:49:50', NULL, '2026-02-06 03:49:50', '2026-02-06 05:19:36', 0, 0, NULL, 0, 1, '6'),
(765, 15, NULL, 'BCDA - Control Tower', '2026-02-06', '2026-02-06 11:47:26', '2026-02-06 11:47:30', '2026-02-06 03:47:26', '2026-02-06 03:47:40', 0, 0, NULL, 0, 0, ''),
(764, 14, NULL, 'BCDA - Admin', '2026-02-06', '2026-02-06 11:47:07', '2026-02-06 11:47:29', '2026-02-06 03:47:07', '2026-02-06 03:47:48', 0, 0, NULL, 0, 0, ''),
(774, 6, 'Present', 'Main Branch', '2026-02-06', NULL, NULL, '2026-02-06 05:24:08', NULL, 0, 0, NULL, 0, 0, ''),
(775, 61, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 13:44:02', NULL, '2026-02-06 05:44:02', NULL, 0, 0, NULL, 0, 1, ''),
(776, 62, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 14:01:48', '2026-02-06 14:21:10', '2026-02-06 06:01:48', NULL, 0, 0, NULL, 0, 0, ''),
(777, 64, 'Absent', 'Pias - Sundara', '2026-02-06', NULL, NULL, '2026-02-06 06:14:00', NULL, 0, 0, 'asdf', 0, 0, ''),
(778, 63, NULL, 'Pias - Sundara', '2026-02-06', '2026-02-06 14:21:06', NULL, '2026-02-06 06:21:06', NULL, 0, 0, NULL, 0, 1, '0');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
