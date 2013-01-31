<?php
require "include/head.php";

#phpinfo();

if(isset($_GET['session_id']) && is_numeric($_GET['session_id'])){

	$session_id = (int)$db->escape($_GET['session_id']);

	// Data array to update with
	$data['logout_time'] = date("Y-m-d H:i:s");
	$data['active'] = 0;
	$where = "session_id='{$session_id}' AND active='1' LIMIT 1";
	$query = $db->query_update('logins', $data, $where);

}

header("Location: {$_SERVER["HTTP_REFERER"]}");

require "include/foot.php";

?>
