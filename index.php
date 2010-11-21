<?php
require("api/inc/init.php");

$interface = fRequest::getValid('ui', array('normal', 'mobile'));
define('BASE_URL', preg_replace('/api\//', '', URL_ROOT) . $interface . '/');

require "$interface/layout.php";