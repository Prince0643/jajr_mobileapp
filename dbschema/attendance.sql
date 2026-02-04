-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 03, 2026 at 06:42 AM
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
  `is_time_running` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=671 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `employee_id`, `status`, `branch_name`, `attendance_date`, `time_in`, `time_out`, `created_at`, `updated_at`, `is_auto_absent`, `auto_absent_applied`, `is_time_running`) VALUES
(633, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:05', '2026-02-03 11:32:07', '2026-02-03 03:32:05', NULL, 0, 0, 0),
(634, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:08', '2026-02-03 11:32:28', '2026-02-03 03:32:08', NULL, 0, 0, 0),
(635, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:30', '2026-02-03 11:32:31', '2026-02-03 03:32:30', NULL, 0, 0, 0),
(636, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:32', '2026-02-03 11:32:33', '2026-02-03 03:32:32', NULL, 0, 0, 0),
(662, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:49', '2026-02-03 14:42:04', '2026-02-03 06:41:49', NULL, 0, 0, 0),
(651, 18, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:20:41', '2026-02-03 14:40:38', '2026-02-03 06:20:41', NULL, 0, 0, 0),
(650, 17, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:20:28', '2026-02-03 14:40:37', '2026-02-03 06:20:28', NULL, 0, 0, 0),
(649, 63, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:00:08', '2026-02-03 14:40:36', '2026-02-03 06:00:08', NULL, 0, 0, 0),
(648, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:51:32', '2026-02-03 14:40:35', '2026-02-03 05:51:32', NULL, 0, 0, 0),
(647, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:51:17', '2026-02-03 13:51:25', '2026-02-03 05:51:17', NULL, 0, 0, 0),
(646, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:51:04', '2026-02-03 13:51:14', '2026-02-03 05:51:04', NULL, 0, 0, 0),
(645, 16, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:38:52', '2026-02-03 14:40:36', '2026-02-03 05:38:52', NULL, 0, 0, 0),
(644, 15, NULL, 'Testing', '2026-02-03', '2026-02-03 13:37:10', NULL, '2026-02-03 05:37:10', NULL, 0, 0, 0),
(643, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:37:08', '2026-02-03 13:50:56', '2026-02-03 05:37:08', NULL, 0, 0, 0),
(642, 14, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 13:37:00', '2026-02-03 14:40:32', '2026-02-03 05:37:00', NULL, 0, 0, 0),
(641, 13, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:41:09', '2026-02-03 13:01:10', '2026-02-03 03:41:09', NULL, 0, 0, 0),
(640, 13, NULL, 'Testing', '2026-02-03', '2026-02-03 11:36:20', '2026-02-03 11:36:26', '2026-02-03 03:36:20', NULL, 0, 0, 0),
(639, 62, NULL, 'Testing', '2026-02-03', '2026-02-03 11:36:10', NULL, '2026-02-03 03:36:10', NULL, 0, 0, 0),
(638, 12, NULL, 'Testing', '2026-02-03', '2026-02-03 11:36:00', '2026-02-03 14:20:57', '2026-02-03 03:36:00', '2026-02-03 06:26:44', 0, 0, 0),
(637, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:35', '2026-02-03 11:32:43', '2026-02-03 03:32:35', NULL, 0, 0, 0),
(632, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:32:00', '2026-02-03 11:32:03', '2026-02-03 03:32:00', NULL, 0, 0, 0),
(631, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:29:23', '2026-02-03 11:29:32', '2026-02-03 03:29:23', NULL, 0, 0, 0),
(630, 6, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:29:04', '2026-02-03 13:01:09', '2026-02-03 03:29:04', NULL, 0, 0, 0),
(629, 61, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:29:01', '2026-02-03 13:01:09', '2026-02-03 03:29:01', NULL, 0, 0, 0),
(628, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 11:28:58', '2026-02-03 11:29:15', '2026-02-03 03:28:58', NULL, 0, 0, 0),
(654, 61, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:10', '2026-02-03 14:42:05', '2026-02-03 06:41:10', NULL, 0, 0, 0),
(653, 13, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:40:44', '2026-02-03 14:42:06', '2026-02-03 06:40:44', NULL, 0, 0, 0),
(655, 6, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:11', '2026-02-03 14:42:06', '2026-02-03 06:41:11', NULL, 0, 0, 0),
(656, 14, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:13', '2026-02-03 14:42:07', '2026-02-03 06:41:13', NULL, 0, 0, 0),
(657, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:13', '2026-02-03 14:42:07', '2026-02-03 06:41:13', NULL, 0, 0, 0),
(658, 16, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:14', NULL, '2026-02-03 06:41:14', NULL, 0, 0, 1),
(659, 63, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:14', '2026-02-03 14:42:16', '2026-02-03 06:41:14', NULL, 0, 0, 0),
(660, 18, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:15', NULL, '2026-02-03 06:41:15', NULL, 0, 0, 1),
(661, 17, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:41:16', NULL, '2026-02-03 06:41:16', NULL, 0, 0, 1),
(663, 12, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:08', NULL, '2026-02-03 06:42:08', NULL, 0, 0, 1),
(664, 61, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:09', NULL, '2026-02-03 06:42:09', NULL, 0, 0, 1),
(665, 13, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:10', '2026-02-03 14:42:11', '2026-02-03 06:42:10', NULL, 0, 0, 0),
(666, 6, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:12', NULL, '2026-02-03 06:42:12', NULL, 0, 0, 1),
(667, 13, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:12', NULL, '2026-02-03 06:42:12', NULL, 0, 0, 1),
(668, 14, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:14', NULL, '2026-02-03 06:42:14', NULL, 0, 0, 1),
(669, 73, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:15', NULL, '2026-02-03 06:42:15', NULL, 0, 0, 1),
(670, 63, NULL, 'Sto. Rosario', '2026-02-03', '2026-02-03 14:42:18', NULL, '2026-02-03 06:42:18', NULL, 0, 0, 1);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
