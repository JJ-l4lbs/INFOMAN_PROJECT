CREATE DATABASE  IF NOT EXISTS `csc_exam_system` /*!40100 DEFAULT CHARACTER SET utf8mb3 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `csc_exam_system`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: csc_exam_system
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agencies`
--

DROP TABLE IF EXISTS `agencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agencies` (
  `agency_code` varchar(20) NOT NULL,
  `agency_name` varchar(45) NOT NULL,
  `agency_address` varchar(100) NOT NULL,
  PRIMARY KEY (`agency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `applicants`
--

DROP TABLE IF EXISTS `applicants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applicants` (
  `applicant_id` varchar(20) NOT NULL,
  `name` varchar(45) NOT NULL,
  `birthdate` date NOT NULL,
  `sex` varchar(45) NOT NULL,
  `birthplace` varchar(50) NOT NULL,
  `citizenship` varchar(45) NOT NULL,
  `mother_maiden_name` varchar(45) NOT NULL,
  `permanent_address` varchar(100) NOT NULL,
  `zip_code` varchar(45) NOT NULL,
  `mobile_number` varchar(45) NOT NULL,
  `telephone_number` varchar(45) DEFAULT NULL,
  `email` varchar(45) NOT NULL,
  `civil_status` varchar(45) NOT NULL,
  `priority_group` varchar(45) DEFAULT NULL,
  `employment_status` varchar(45) NOT NULL,
  `educational_record_id` varchar(20) NOT NULL,
  `employment_record_id` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`applicant_id`),
  KEY `fk_Applicants_Education_Records1_idx` (`educational_record_id`),
  KEY `fk_Applicants_Employment_Records1_idx` (`employment_record_id`),
  CONSTRAINT `fk_Applicants_Education_Records1` FOREIGN KEY (`educational_record_id`) REFERENCES `education_records` (`educational_record_id`),
  CONSTRAINT `fk_Applicants_Employment_Records1` FOREIGN KEY (`employment_record_id`) REFERENCES `employment_records` (`employment_record_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `applications`
--

DROP TABLE IF EXISTS `applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `applications` (
  `application_no` varchar(20) NOT NULL,
  `forms_date` varchar(45) NOT NULL,
  `exam_applied_for` varchar(45) NOT NULL,
  `last_exam_date` date DEFAULT NULL,
  `csr_regional_office` varchar(45) NOT NULL,
  `exam_date` varchar(45) NOT NULL,
  `exam_place` varchar(45) NOT NULL,
  `applicant_id` varchar(20) NOT NULL,
  PRIMARY KEY (`application_no`),
  KEY `fk_Applications_Applicants1_idx` (`applicant_id`),
  CONSTRAINT `fk_Applications_Applicants1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `disabilities`
--

DROP TABLE IF EXISTS `disabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disabilities` (
  `disability_id` varchar(20) NOT NULL,
  `disability` varchar(45) NOT NULL,
  `applicant_id` varchar(20) NOT NULL,
  PRIMARY KEY (`disability_id`),
  KEY `fk_Disabilities_Applicants1_idx` (`applicant_id`),
  CONSTRAINT `fk_Disabilities_Applicants1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `education_records`
--

DROP TABLE IF EXISTS `education_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_records` (
  `educational_record_id` varchar(20) NOT NULL,
  `highest_education` varchar(45) NOT NULL,
  `completion` varchar(45) NOT NULL,
  `highest_level` varchar(45) DEFAULT NULL,
  `graduation_date` date DEFAULT NULL,
  `honors_received` varchar(45) DEFAULT NULL,
  `program_title` varchar(45) NOT NULL,
  `major` varchar(45) NOT NULL,
  `inclusive_years` varchar(45) NOT NULL,
  `school_code` varchar(20) NOT NULL,
  PRIMARY KEY (`educational_record_id`),
  KEY `fk_Education_Records_Schools1_idx` (`school_code`),
  CONSTRAINT `fk_Education_Records_Schools1` FOREIGN KEY (`school_code`) REFERENCES `schools` (`school_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `eligibility_proofs`
--

DROP TABLE IF EXISTS `eligibility_proofs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eligibility_proofs` (
  `eligibility_proof_id` varchar(20) NOT NULL,
  `eligibility_proof_title` varchar(45) NOT NULL,
  `rating_obtained` varchar(45) NOT NULL,
  `date_granted` varchar(45) NOT NULL,
  `eligibility_place_taken` varchar(45) NOT NULL,
  `applicant_id` varchar(20) NOT NULL,
  PRIMARY KEY (`eligibility_proof_id`),
  KEY `fk_Eligibility_Proofs_Applicants1_idx` (`applicant_id`),
  CONSTRAINT `fk_Eligibility_Proofs_Applicants1` FOREIGN KEY (`applicant_id`) REFERENCES `applicants` (`applicant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employment_records`
--

DROP TABLE IF EXISTS `employment_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employment_records` (
  `employment_record_id` varchar(20) NOT NULL,
  `job_title` varchar(45) NOT NULL,
  `years_in_agency` int NOT NULL,
  `appointment_status` varchar(45) NOT NULL,
  `agency_code` varchar(20) NOT NULL,
  PRIMARY KEY (`employment_record_id`),
  KEY `fk_Employment_Records_Agencies_idx` (`agency_code`),
  CONSTRAINT `fk_Employment_Records_Agencies` FOREIGN KEY (`agency_code`) REFERENCES `agencies` (`agency_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `school_code` varchar(20) NOT NULL,
  `school_name` varchar(45) NOT NULL,
  `school_address` varchar(100) NOT NULL,
  PRIMARY KEY (`school_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-19  6:35:21
