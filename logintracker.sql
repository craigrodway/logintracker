-- phpMyAdmin SQL Dump
-- version 2.11.3deb1ubuntu1.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jan 22, 2010 at 08:50 AM
-- Server version: 5.0.51
-- PHP Version: 5.2.4-2ubuntu5.7

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

SET AUTOCOMMIT=0;
START TRANSACTION;

--
-- Database: `logintracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `hostnames`
--

CREATE TABLE IF NOT EXISTS `hostnames` (
  `hostname_id` int(10) unsigned NOT NULL auto_increment,
  `hostname` varchar(50) NOT NULL,
  PRIMARY KEY  (`hostname_id`),
  UNIQUE KEY `hostname` (`hostname`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `logins`
--

CREATE TABLE IF NOT EXISTS `logins` (
  `session_id` int(10) unsigned NOT NULL auto_increment,
  `hostname_id` int(10) unsigned NOT NULL,
  `ou_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `ipaddr` varchar(15) NOT NULL default '',
  `login_time` datetime default NULL,
  `logout_time` datetime default NULL,
  `active` tinyint(1) unsigned default NULL,
  `type` enum('STAFF','STUDENT') default NULL,
  PRIMARY KEY  (`session_id`),
  KEY `in_time` (`login_time`),
  KEY `out_time` (`logout_time`),
  KEY `hostname_id` (`hostname_id`),
  KEY `user_id` (`user_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `ous`
--

CREATE TABLE IF NOT EXISTS `ous` (
  `ou_id` int(10) unsigned NOT NULL auto_increment,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY  (`ou_id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `user_id` int(10) unsigned NOT NULL auto_increment,
  `username` varchar(50) NOT NULL,
  PRIMARY KEY  (`user_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

COMMIT;
