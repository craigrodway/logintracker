<?php
// Include config and database object
require("config.inc.php");
require("database.class.php");

// Connect to database with config settings
$db = new Database(
	$config['server'],
	$config['user'],
	$config['pass'],
	$config['database'],
	$config['tablePrefix']
);
$db->connect();

require("functions.users.php");
require("functions.hostnames.php");
require("functions.ous.php");
require("functions.misc.php");

// Clear config array for security
unset($config);
?>