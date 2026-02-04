-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Feb 03, 2026 at 03:39 AM
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
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
CREATE TABLE IF NOT EXISTS `employees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `employee_code` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `position` varchar(50) DEFAULT 'Employee',
  `status` varchar(50) DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_image` varchar(255) DEFAULT NULL,
  `daily_rate` decimal(10,2) DEFAULT '600.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_code` (`employee_code`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `employee_code`, `first_name`, `middle_name`, `last_name`, `email`, `password_hash`, `position`, `status`, `created_at`, `updated_at`, `profile_image`, `daily_rate`) VALUES
(16, 'E0006', 'ALFREDO', NULL, 'BAGUIO', 'alfredo.baguio@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(17, 'E0007', 'ROLLY', NULL, 'BALTAZAR', 'rolly.baltazar@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(18, 'E0008', 'DONG', NULL, 'BAUTISTA', 'dong.bautista@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(14, 'E0004', 'NOEL', NULL, 'ARIZ', 'noel.ariz@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(6, 'SA001', 'Super', 'Duper', 'Adminesu', 'admin@jajrconstruction.com', '$2y$10$RSHOb3hskFZueMLlCycFuua/4EwcxGmAIzpcl8ixQpEXY3tfu9LYi', 'Admin', 'Active', '2026-01-16 02:26:58', '2026-02-03 03:00:21', 'profile_697d9f9a1f47a8.96968556.png', 600.00),
(15, 'E0005', 'DANIEL', NULL, 'BACHILLER', 'daniel.bachiller@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(11, 'E0001', 'AARIZ', NULL, 'MARLOU', 'aariz.marlou@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(12, 'E0002', 'CESAR', NULL, 'ABUBO', 'cesar.abubo@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', 'profile_697d962d450256.84780797.png', 600.00),
(13, 'E0003', 'MARLON', NULL, 'AGUILAR', 'marlon.aguilar@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(19, 'E0009', 'JANLY', NULL, 'BELINO', 'janly.belino@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(20, 'E0010', 'MENUEL', NULL, 'BENITEZ', 'menuel.benitez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(21, 'E0011', 'GELMAR', NULL, 'BERNACHEA', 'gelmar.bernachea@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(22, 'E0012', 'JOMAR', NULL, 'CABANBAN', 'jomar.cabanban@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(23, 'E0013', 'MARIO', NULL, 'CABANBAN', 'mario.cabanban@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(24, 'E0014', 'KELVIN', NULL, 'CALDERON', 'kelvin.calderon@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(25, 'E0015', 'FLORANTE', NULL, 'CALUZA', 'florante.caluza@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(26, 'E0016', 'MELVIN', NULL, 'CAMPOS', 'melvin.campos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(27, 'E0017', 'JERWIN', NULL, 'CAMPOS', 'jerwin.campos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(28, 'E0018', 'BENJIE', NULL, 'CARAS', 'benjie.caras@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 700.00),
(29, 'E0019', 'BONJO', NULL, 'DACUMOS', 'bonjo.dacumos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(30, 'E0020', 'RYAN', NULL, 'DEOCARIS', 'ryan.deocaris@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(31, 'E0021', 'BEN', NULL, 'ESTEPA', 'ben.estepa@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(32, 'E0022', 'MAR DAVE', NULL, 'FLORES', 'mardave.flores@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(33, 'E0023', 'ALBERT', NULL, 'FONTANILLA', 'albert.fontanilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(34, 'E0024', 'JOHN WILSON', NULL, 'FONTANILLA', 'johnwilson.fontanilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(35, 'E0025', 'LEO', NULL, 'GURTIZA', 'leo.gurtiza@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(36, 'E0026', 'JOSE', NULL, 'IGLECIAS', 'jose.iglecias@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(37, 'E0027', 'JEFFREY', NULL, 'JIMENEZ', 'jeffrey.jimenez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(38, 'E0028', 'WILSON', NULL, 'LICTAOA', 'wilson.lictaoa@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(39, 'E0029', 'LORETO', NULL, 'MABALO', 'loreto.mabalo@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(40, 'E0030', 'ROMEL', NULL, 'MALLARE', 'romel.mallare@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(41, 'E0031', 'SAMUEL SR.', NULL, 'MARQUEZ', 'samuel.marquez@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(42, 'E0032', 'ROLLY', NULL, 'MARZAN', 'rolly.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(43, 'E0033', 'RONALD', NULL, 'MARZAN', 'ronald.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(44, 'E0034', 'WILSON', NULL, 'MARZAN', 'wilson.marzan@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(45, 'E0035', 'MARVIN', NULL, 'MIRANDA', 'marvin.miranda@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(46, 'E0036', 'JOE', NULL, 'MONTERDE', 'joe.monterde@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 700.00),
(47, 'E0037', 'ALDRED', NULL, 'NATARTE', 'aldred.natarte@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(48, 'E0038', 'ARNOLD', NULL, 'NERIDO', 'arnold.nerido@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(49, 'E0039', 'RONEL', NULL, 'NOSES', 'ronel.noses@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(50, 'E0040', 'DANNY', NULL, 'PADILLA', 'danny.padilla@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(51, 'E0041', 'EDGAR', NULL, 'PANEDA', 'edgar.paneda@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(52, 'E0042', 'JEREMY', NULL, 'PIMENTEL', 'jeremy.pimentel@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 550.00),
(53, 'E0043', 'MIGUEL', NULL, 'PREPOSI', 'miguel.preposi@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(54, 'E0044', 'JUN', NULL, 'ROAQUIN', 'jun.roaquin@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(55, 'E0045', 'RICKMAR', NULL, 'SANTOS', 'rickmar.santos@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(56, 'E0046', 'RIO', NULL, 'SILOY', 'rio.siloy@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(57, 'E0047', 'NORMAN', NULL, 'TARAPE', 'norman.tarape@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(58, 'E0048', 'HILMAR', NULL, 'TATUNAY', 'hilmar.tatunay@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(59, 'E0049', 'KENNETH JOHN', NULL, 'UGAS', 'kennethjohn.ugas@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(60, 'E0050', 'CLYDE JUSTINE', NULL, 'VASADRE', 'clydejustine.vasadre@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 500.00),
(61, 'E0051', 'CARL JHUNELL', NULL, 'ACAS', 'carljhunell.acas@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', 'profile_697d9f9350dad3.88439854.png', 600.00),
(62, 'E0052', 'ELAINE MARICRIS T.', NULL, 'AGUILAR', 'elainemaricris.aguilar@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', 'profile_697c5e5a1459b9.21959357.png', 600.00),
(63, 'E0053', 'JOYLENE F.', NULL, 'BALANON', 'joylene.balanon@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(64, 'E0054', 'AVERIE L.', NULL, 'CABUSORA', 'averie.cabusora@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(65, 'E0055', 'JOHN JULIUS', NULL, 'ECHAGUE', 'johnjulius.echague@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(66, 'E0056', 'JOHN KENEDY', NULL, 'LUCAS', 'johnkenedy.lucas@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(67, 'E0057', 'RONALYN', NULL, 'MALLARE', 'ronalyn.mallare@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(68, 'ENG - 2026 - 0001', 'MICHELLE F.', NULL, 'NORIAL', 'michelle.norial@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(69, 'E0059', 'WINNIELYN KAYE M.', NULL, 'OLARTE', 'winnielynkaye.olarte@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(70, 'E0060', 'FLORIAN JANE', NULL, 'PERALTA', 'florianjane.peralta@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(71, 'E0061', 'DANIEL', NULL, 'RILLERA', 'daniel.rillera@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(72, 'E0062', 'JUNELL', NULL, 'TADINA', 'junell.tadina@example.com', '9f0c3c0c2aef2cfafc8e5ed4b1fed480', 'Employee', 'Active', '2026-01-22 07:58:04', '2026-02-03 00:48:29', NULL, 600.00),
(73, 'e10001', 'Marc', 'Espanto', 'Arzadon', 'you@gmail.com', 'e10adc3949ba59abbe56e057f20f883e', 'Employee', 'Active', '2026-01-27 03:08:02', '2026-02-03 00:48:29', NULL, 600.00);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
