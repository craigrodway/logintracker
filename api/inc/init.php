<?php
include(dirname(__FILE__) . '/config.php');
include(dirname(__FILE__) . '/functions.php');

// Connect to database
$db = new fDatabase('mysql', DB_NAME, DB_USER, DB_PASS, DB_HOST);