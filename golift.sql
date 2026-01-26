-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 26-Jan-2026 às 02:08
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `golift`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `exercicios`
--

CREATE TABLE `exercicios` (
  `id_exercicio` int(11) NOT NULL,
  `nome` varchar(20) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `video` varchar(20) DEFAULT NULL,
  `recorde_pessoal` float DEFAULT NULL,
  `grupo_tipo` varchar(10) DEFAULT NULL,
  `sub_tipo` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `exercicios`
--

INSERT INTO `exercicios` (`id_exercicio`, `nome`, `descricao`, `video`, `recorde_pessoal`, `grupo_tipo`, `sub_tipo`) VALUES
(1, 'supinio reto', 'um exercicio para o peito com foco nas fibras centrais do peito', 'supinoreto', 12, 'peito', 'Medio'),
(2, 'Leg Press', 'Um exercicio usado para treinar toda a perna porem focado na parte posterior da perna.', 'https://youtu.be/q4W', NULL, 'Pernas', 'Posterior'),
(3, 'Lat PullDown', 'Exercicio indicado para as Lats', 'https://www.youtube.', NULL, 'Costas', 'Lats'),
(5, 'Supino inclinado', 'Um exercicio que foca se nas fibras superiores do peitoral', NULL, NULL, 'Peito', 'Superior'),
(6, 'Stiff', 'Exercício com o foco no posterior ', NULL, NULL, 'Pernas', 'Posterior ');

-- --------------------------------------------------------

--
-- Estrutura da tabela `tipo_user`
--

CREATE TABLE `tipo_user` (
  `id_tipoUser` int(11) NOT NULL,
  `descricao` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `tipo_user`
--

INSERT INTO `tipo_user` (`id_tipoUser`, `descricao`) VALUES
(1, 'Admin'),
(2, 'Cliente');

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino`
--

CREATE TABLE `treino` (
  `id_treino` int(11) DEFAULT NULL,
  `nome` varchar(100) DEFAULT NULL,
  `id_users` int(11) DEFAULT NULL,
  `data_treino` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino`
--

INSERT INTO `treino` (`id_treino`, `nome`, `id_users`, `data_treino`) VALUES
(1, NULL, 1, '2025-12-04'),
(1, NULL, 1, '2025-12-04'),
(2, NULL, 1, '2025-12-05'),
(9, 'Pernas', 7, '2025-12-11'),
(10, 'Peito', 7, '2025-12-12'),
(11, 'Treino recomendado - costas', 7, '2025-12-12'),
(13, 'Treino recomendado - Peito', 7, '2026-01-04'),
(14, 'Costa', 7, '2026-01-23'),
(15, 'Peito e costas', 7, '2026-01-23'),
(16, 'Peito e perna', 7, '2026-01-23'),
(17, 'Costas', 18, '2026-01-23');

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino_admin`
--

CREATE TABLE `treino_admin` (
  `id_treino_admin` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino_admin`
--

INSERT INTO `treino_admin` (`id_treino_admin`, `nome`, `criado_em`, `atualizado_em`) VALUES
(5, 'Costas', '2025-12-12 19:05:01', '2025-12-12 19:35:03'),
(6, 'Pernas', '2025-12-12 19:13:49', '2025-12-12 19:13:49'),
(7, 'Peito', '2025-12-12 19:14:00', '2025-12-12 19:14:00'),
(10, 'Treino Full Body', '2026-01-23 14:00:09', '2026-01-23 14:00:09');

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino_admin_exercicio`
--

CREATE TABLE `treino_admin_exercicio` (
  `id_treino_admin_exercicio` int(11) NOT NULL,
  `id_treino_admin` int(11) NOT NULL,
  `id_exercicio` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino_admin_exercicio`
--

INSERT INTO `treino_admin_exercicio` (`id_treino_admin_exercicio`, `id_treino_admin`, `id_exercicio`) VALUES
(14, 5, 3),
(10, 6, 2),
(11, 7, 1),
(18, 10, 1),
(17, 10, 2),
(16, 10, 3);

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino_exercicio`
--

CREATE TABLE `treino_exercicio` (
  `id_treino` int(11) DEFAULT NULL,
  `id_exercicio` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino_exercicio`
--

INSERT INTO `treino_exercicio` (`id_treino`, `id_exercicio`) VALUES
(9, 2),
(10, 1),
(11, 3),
(13, 1),
(14, 3),
(15, 3),
(16, 2),
(16, 1),
(17, 3);

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino_serie`
--

CREATE TABLE `treino_serie` (
  `id_serie` int(11) NOT NULL,
  `id_sessao` int(11) DEFAULT NULL,
  `id_exercicio` int(11) DEFAULT NULL,
  `numero_serie` int(11) DEFAULT NULL,
  `repeticoes` int(11) DEFAULT NULL,
  `peso` float DEFAULT NULL,
  `data_serie` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino_serie`
--

INSERT INTO `treino_serie` (`id_serie`, `id_sessao`, `id_exercicio`, `numero_serie`, `repeticoes`, `peso`, `data_serie`) VALUES
(1, 42, 2, 1, 12, 18, '2025-12-10 17:29:46'),
(2, 42, 2, 2, 12, 20, '2025-12-10 17:30:03'),
(3, 42, 2, 3, 12, 25, '2025-12-10 17:30:04'),
(4, 45, 3, 1, 15, 12, '2025-12-10 17:38:14'),
(5, 45, 3, 2, 15, 13, '2025-12-10 17:38:15'),
(6, 45, 3, 3, 15, 13, '2025-12-10 17:38:16'),
(7, 45, 3, 4, 15, 13, '2025-12-10 17:38:17'),
(8, 47, 3, 1, 12, 1, '2025-12-10 18:42:22'),
(9, 47, 3, 2, 12, 12, '2025-12-10 18:42:42'),
(10, 47, 3, 3, 12, 12, '2025-12-10 18:42:44'),
(11, 47, 3, 4, 12, 12, '2025-12-10 18:42:45'),
(12, 50, 3, 1, 12, 2, '2025-12-10 18:58:51'),
(13, 52, 3, 1, 12, 40, '2025-12-10 21:49:04'),
(14, 52, 3, 2, 12, 50, '2025-12-10 21:49:05'),
(15, 52, 3, 3, 12, 60, '2025-12-10 21:49:05'),
(16, 52, 3, 4, 12, 70, '2025-12-10 21:49:06'),
(17, 54, 1, 1, 12, 30, '2025-12-10 23:05:47'),
(18, 54, 1, 2, 12, 35, '2025-12-10 23:05:48'),
(19, 54, 1, 3, 12, 40, '2025-12-10 23:05:48'),
(20, 54, 1, 4, 12, 45, '2025-12-10 23:05:48'),
(21, 54, 2, 1, 12, 100, '2025-12-10 23:06:02'),
(22, 54, 2, 2, 12, 120, '2025-12-10 23:06:02'),
(23, 54, 2, 3, 12, 150, '2025-12-10 23:06:02'),
(24, 54, 2, 4, 12, 180, '2025-12-10 23:06:10'),
(25, 54, 3, 1, 12, 50, '2025-12-10 23:06:25'),
(26, 54, 3, 2, 12, 12, '2025-12-10 23:06:25'),
(27, 54, 3, 3, 12, 12, '2025-12-10 23:06:26'),
(28, 56, 1, 1, 12, 30, '2025-12-11 16:17:26'),
(29, 56, 1, 2, 12, 35, '2025-12-11 16:17:26'),
(30, 56, 1, 3, 12, 40, '2025-12-11 16:17:26'),
(31, 56, 1, 4, 12, 45, '2025-12-11 16:17:27'),
(32, 56, 2, 1, 12, 100, '2025-12-11 16:17:28'),
(33, 56, 2, 2, 12, 120, '2025-12-11 16:17:29'),
(34, 56, 2, 3, 12, 150, '2025-12-11 16:17:29'),
(35, 56, 2, 4, 12, 180, '2025-12-11 16:17:29'),
(36, 56, 3, 1, 12, 50, '2025-12-11 16:17:33'),
(37, 56, 3, 2, 12, 12, '2025-12-11 16:17:33'),
(38, 56, 3, 3, 12, 12, '2025-12-11 16:17:34'),
(39, 58, 1, 1, 12, 15, '2025-12-12 16:44:02'),
(40, 58, 1, 2, 12, 20, '2025-12-12 16:44:02'),
(41, 58, 1, 3, 12, 25, '2025-12-12 16:44:03'),
(42, 58, 1, 4, 12, 30, '2025-12-12 16:44:03'),
(43, 59, 1, 1, 12, 15, '2025-12-12 17:10:25'),
(44, 59, 1, 2, 12, 20, '2025-12-12 17:10:25'),
(45, 59, 1, 3, 12, 25, '2025-12-12 17:10:25'),
(46, 59, 1, 4, 12, 30, '2025-12-12 17:10:26'),
(47, 59, 1, 5, 12, 12, '2025-12-12 17:10:37'),
(48, 61, 3, 1, 12, 12, '2025-12-12 19:12:44'),
(49, 61, 3, 2, 12, 12, '2025-12-12 19:12:44'),
(50, 61, 3, 3, 12, 12, '2025-12-12 19:12:44'),
(51, 61, 3, 4, 12, 12, '2025-12-12 19:12:45'),
(52, 62, 3, 1, 12, 12, '2025-12-12 19:13:02'),
(53, 62, 3, 2, 12, 12, '2025-12-12 19:13:03'),
(54, 62, 3, 3, 12, 12, '2025-12-12 19:13:03'),
(55, 62, 3, 4, 12, 12, '2025-12-12 19:13:04'),
(56, 69, 1, 1, 12, 12, '2025-12-12 19:50:56'),
(57, 69, 1, 2, 12, 12, '2025-12-12 19:50:56'),
(58, 69, 1, 3, 12, 12, '2025-12-12 19:50:57'),
(59, 69, 1, 4, 12, 12, '2025-12-12 19:50:57'),
(61, 72, 1, 1, 13, 13, '2026-01-04 10:12:32'),
(62, 72, 1, 2, 13, 13, '2026-01-04 10:12:32'),
(63, 72, 1, 3, 13, 13, '2026-01-04 10:12:33'),
(64, 72, 1, 4, 13, 31, '2026-01-04 10:12:33'),
(65, 73, 1, 1, 13, 13, '2026-01-04 10:12:43'),
(66, 73, 1, 2, 13, 13, '2026-01-04 10:12:43'),
(67, 73, 1, 3, 13, 13, '2026-01-04 10:12:44'),
(68, 73, 1, 4, 13, 31, '2026-01-04 10:12:44'),
(69, 75, 2, 1, 8, 100, '2026-01-23 14:06:29'),
(70, 75, 2, 2, 8, 120, '2026-01-23 14:06:29'),
(71, 75, 2, 3, 8, 140, '2026-01-23 14:06:29'),
(72, 75, 1, 1, 8, 30, '2026-01-23 14:06:29'),
(73, 75, 1, 2, 8, 40, '2026-01-23 14:06:29'),
(74, 75, 1, 3, 8, 50, '2026-01-23 14:06:29'),
(75, 77, 2, 1, 8, 120, '2026-01-23 17:53:31'),
(76, 77, 2, 2, 8, 140, '2026-01-23 17:53:31'),
(77, 77, 2, 3, NULL, 150, '2026-01-23 17:53:31'),
(78, 78, 3, 1, 8, 20, '2026-01-23 19:33:38'),
(79, 78, 3, 2, 8, 30, '2026-01-23 19:33:38'),
(80, 78, 3, 3, 8, 40, '2026-01-23 19:33:38'),
(81, 81, 2, 1, 8, 120, '2026-01-25 23:10:36'),
(82, 81, 2, 2, 8, 140, '2026-01-25 23:10:36'),
(83, 81, 2, 3, 8, 160, '2026-01-25 23:10:36'),
(84, 81, 2, 4, 8, 180, '2026-01-25 23:10:36'),
(85, 81, 1, 1, 8, 40, '2026-01-25 23:10:36'),
(86, 81, 1, 2, 8, 50, '2026-01-25 23:10:36');

-- --------------------------------------------------------

--
-- Estrutura da tabela `treino_sessao`
--

CREATE TABLE `treino_sessao` (
  `id_sessao` int(11) NOT NULL,
  `id_treino` int(11) DEFAULT NULL,
  `id_users` int(11) DEFAULT NULL,
  `data_inicio` datetime DEFAULT current_timestamp(),
  `data_fim` datetime DEFAULT NULL,
  `duracao_segundos` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `treino_sessao`
--

INSERT INTO `treino_sessao` (`id_sessao`, `id_treino`, `id_users`, `data_inicio`, `data_fim`, `duracao_segundos`) VALUES
(28, 8, 7, '2025-12-10 02:56:43', NULL, NULL),
(29, 8, 7, '2025-12-10 02:56:43', NULL, NULL),
(30, 8, 7, '2025-12-10 02:57:04', NULL, NULL),
(31, 8, 7, '2025-12-10 02:57:04', NULL, NULL),
(32, 8, 7, '2025-12-10 02:58:21', NULL, NULL),
(33, 8, 7, '2025-12-10 02:58:21', NULL, NULL),
(34, 8, 7, '2025-12-10 02:58:25', NULL, NULL),
(35, 8, 7, '2025-12-10 02:58:25', '2025-12-10 02:58:29', 2),
(36, 8, 7, '2025-12-10 02:58:49', NULL, NULL),
(37, 8, 7, '2025-12-10 02:58:49', NULL, NULL),
(38, 8, 7, '2025-12-10 02:59:41', NULL, NULL),
(39, 8, 7, '2025-12-10 02:59:41', NULL, NULL),
(40, 8, 7, '2025-12-10 03:12:16', NULL, NULL),
(41, 8, 7, '2025-12-10 03:12:16', NULL, NULL),
(42, 8, 7, '2025-12-10 17:29:36', '2025-12-10 17:30:15', 37),
(43, 8, 7, '2025-12-10 17:32:06', NULL, NULL),
(44, 8, 7, '2025-12-10 17:35:03', NULL, NULL),
(45, 8, 7, '2025-12-10 17:37:41', '2025-12-10 17:38:21', 38),
(46, 8, 7, '2025-12-10 17:38:25', NULL, NULL),
(47, 8, 7, '2025-12-10 18:42:14', '2025-12-10 18:42:50', 33),
(48, 8, 7, '2025-12-10 18:42:53', NULL, NULL),
(49, 8, 7, '2025-12-10 18:43:46', NULL, NULL),
(50, 8, 7, '2025-12-10 18:58:40', NULL, NULL),
(51, 8, 7, '2025-12-10 18:58:58', NULL, NULL),
(52, 8, 7, '2025-12-10 21:48:37', '2025-12-10 21:49:08', 29),
(53, 8, 7, '2025-12-10 21:49:19', '2025-12-10 21:49:31', 10),
(54, 8, 7, '2025-12-10 23:05:16', '2025-12-10 23:06:29', 72),
(56, 8, 7, '2025-12-11 16:17:24', '2025-12-11 16:17:45', 19),
(57, 9, 7, '2025-12-11 22:30:30', NULL, NULL),
(58, 10, 7, '2025-12-12 16:43:34', '2025-12-12 16:44:08', 32),
(59, 10, 7, '2025-12-12 17:10:23', '2025-12-12 17:10:41', 16),
(60, 10, 7, '2025-12-12 18:54:06', NULL, NULL),
(61, 11, 7, '2025-12-12 19:12:29', '2025-12-12 19:12:47', 14),
(62, 11, 7, '2025-12-12 19:13:00', '2025-12-12 19:13:06', 5),
(64, 13, 7, '2025-12-12 19:43:00', NULL, NULL),
(65, 13, 7, '2025-12-12 19:44:15', NULL, NULL),
(66, 13, 7, '2025-12-12 19:44:21', NULL, NULL),
(69, 12, 7, '2025-12-12 19:50:46', '2025-12-12 19:50:59', 11),
(70, 13, 7, '2025-12-12 19:51:03', '2025-12-12 19:51:10', 5),
(72, 13, 7, '2026-01-04 10:12:24', '2026-01-04 10:12:35', 9),
(73, 13, 7, '2026-01-04 10:12:41', '2026-01-04 10:12:46', 4),
(75, 16, 7, '2026-01-23 14:05:57', '2026-01-23 14:06:29', 30),
(76, 16, 7, '2026-01-23 14:14:10', NULL, NULL),
(77, 16, 7, '2026-01-23 17:52:58', '2026-01-23 17:53:31', 30),
(78, 17, 18, '2026-01-23 19:33:15', '2026-01-23 19:33:38', 20),
(79, 17, 18, '2026-01-23 19:45:38', NULL, NULL),
(80, 16, 7, '2026-01-25 22:55:55', NULL, NULL),
(81, 16, 7, '2026-01-25 23:09:41', '2026-01-25 23:10:36', 52);

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id_users` int(11) NOT NULL,
  `userName` varchar(10) DEFAULT NULL,
  `email` varchar(30) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `idade` int(2) DEFAULT NULL,
  `peso` float DEFAULT NULL,
  `altura` float DEFAULT NULL,
  `created_at` date NOT NULL DEFAULT current_timestamp(),
  `id_tipoUser` int(11) DEFAULT 2
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id_users`, `userName`, `email`, `password`, `idade`, `peso`, `altura`, `created_at`, `id_tipoUser`) VALUES
(7, 'admin', 'admin@gmail.com', '$2b$10$fvs9.xRKw.fGOZ7cgPTvseJOx1IW.fmnaIfdVQOgc7svSIFbgfD5G', 23, 80, 187, '2025-06-10', 1),
(8, 'tomas', 'raposopvptomas@gmail.com', '$2b$10$Bc2wqxEyPmjtOA6zVulWwuYPKlND4OV4CmsLDBiyAIEIuINxKI3yu', 0, 0, 0, '2025-12-09', 2),
(9, 'victor', 'victor@gmail.com', '$2b$10$XFxRRfLyKf5nquThalSsc.V20nATU7eEUQjgqtR4E.wOR5A3pSRFK', 0, 0, 0, '2025-12-09', 2),
(10, 'andre', 'andre@gmail.com', '$2b$10$XHKjm2xbWaGtUgpTi.iaPu1RVDKMpagh5TfpdPWRHTiV7Ls8XWP0i', 0, 0, 0, '2025-12-09', 2),
(11, 'fernando', 'fernando@gmail.com', '$2b$10$FOQ8bw1f1jjfFBfznsSTz.js5YHEZfOExj2Qo6JaL/56QUKOUVhO2', 18, 80, 165, '2025-12-09', 2),
(12, 'alfredo', 'alfredo@gmail.com', '$2b$10$wW79Jx9kPr0bD8KANWrXLugY81K./CU3aJgtomFmw5mBvOoULLhiy', 77, 80, 150, '2025-12-09', 2),
(13, 'helder', 'helder@gmail.com', '$2b$10$oo.mGsWUJwgqa1oaynJDDOMv.6NHQLEvcPrnJykqRDHIrgysyIgbW', 51, 65, 124, '2025-12-09', 2),
(15, 'ana', 'ana@gmail.com', '$2b$10$4XULsV2KcElj7rPk5I69QOxCEKcrmlJtLSCtbzfv3E3M4nts96srm', 21, 60, 160, '2025-12-09', 2),
(16, 'lamine', 'lamine@gmail.com', '$2b$10$YgEkJCbzTQf3Rl/NK6B3FOPdAhgtIwxpRdzRDrVt2m2n5lTkSOvr2', 19, 80, 180, '2025-12-09', 2),
(17, 'afam', 'afam@gmail.com', '$2b$10$bdahp0Chzm55G7OIE6aGfuXUC893skM2qJDhKWVrjmnROz8IZtwrG', 25, 45, 150, '2025-12-12', 2),
(18, 'Guppi', 'guppi@gmail.com', '$2b$10$7A0TcmwxS6HDRZmj1csrY.5rfF.e.L8Q2LjJXh25uky2.Gq/Dm2/q', 17, 70, 178, '2026-01-23', 2),
(19, 'Abial', 'abial@gmail.com', '$2b$10$Mh75KhGIFUL2B9m.07c5wu1Pmev0XsOJ83u4LeOYIJkfFWnnGEvM2', 30, 70, 189, '2026-01-26', 2),
(20, 'Raposo', 'Raposo@gmail.com', '$2b$10$N6r0IUd.hWohMh7QUXOz3uRl2gphiu.MZiTop8498vmnqjqv9WGCS', 17, 73, 189, '2026-01-26', 2);

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `exercicios`
--
ALTER TABLE `exercicios`
  ADD PRIMARY KEY (`id_exercicio`);

--
-- Índices para tabela `tipo_user`
--
ALTER TABLE `tipo_user`
  ADD PRIMARY KEY (`id_tipoUser`);

--
-- Índices para tabela `treino`
--
ALTER TABLE `treino`
  ADD KEY `id_users` (`id_users`),
  ADD KEY `id_treino` (`id_treino`);

--
-- Índices para tabela `treino_admin`
--
ALTER TABLE `treino_admin`
  ADD PRIMARY KEY (`id_treino_admin`);

--
-- Índices para tabela `treino_admin_exercicio`
--
ALTER TABLE `treino_admin_exercicio`
  ADD PRIMARY KEY (`id_treino_admin_exercicio`),
  ADD UNIQUE KEY `unique_treino_exercicio` (`id_treino_admin`,`id_exercicio`),
  ADD KEY `id_exercicio` (`id_exercicio`);

--
-- Índices para tabela `treino_exercicio`
--
ALTER TABLE `treino_exercicio`
  ADD KEY `id_treino` (`id_treino`),
  ADD KEY `id_exercicio` (`id_exercicio`);

--
-- Índices para tabela `treino_serie`
--
ALTER TABLE `treino_serie`
  ADD PRIMARY KEY (`id_serie`),
  ADD KEY `id_sessao` (`id_sessao`),
  ADD KEY `id_exercicio` (`id_exercicio`);

--
-- Índices para tabela `treino_sessao`
--
ALTER TABLE `treino_sessao`
  ADD PRIMARY KEY (`id_sessao`),
  ADD KEY `id_treino` (`id_treino`),
  ADD KEY `id_users` (`id_users`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_users`),
  ADD KEY `id_tipoUser` (`id_tipoUser`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `exercicios`
--
ALTER TABLE `exercicios`
  MODIFY `id_exercicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `treino_admin`
--
ALTER TABLE `treino_admin`
  MODIFY `id_treino_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `treino_admin_exercicio`
--
ALTER TABLE `treino_admin_exercicio`
  MODIFY `id_treino_admin_exercicio` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de tabela `treino_serie`
--
ALTER TABLE `treino_serie`
  MODIFY `id_serie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT de tabela `treino_sessao`
--
ALTER TABLE `treino_sessao`
  MODIFY `id_sessao` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id_users` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `treino_admin_exercicio`
--
ALTER TABLE `treino_admin_exercicio`
  ADD CONSTRAINT `treino_admin_exercicio_ibfk_1` FOREIGN KEY (`id_treino_admin`) REFERENCES `treino_admin` (`id_treino_admin`) ON DELETE CASCADE,
  ADD CONSTRAINT `treino_admin_exercicio_ibfk_2` FOREIGN KEY (`id_exercicio`) REFERENCES `exercicios` (`id_exercicio`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
