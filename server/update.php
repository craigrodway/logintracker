<?php
require "include/head.php";


// Fix date to YYYY-MM-DD format
$date = explode("/", $_POST['date']);
krsort($date);
$date = implode("-", $date);


// Now carry out DB actions depending on login or logout
switch($_POST['action']){
	
	case 'logon':
		
		// Build data array
		$data['hostname_id'] = magic_hostname($_POST['workstation']);
		$data['ou_id'] = magic_ou($_POST['ou']);
		$data['user_id'] = magic_user($_POST['username']);
		$data['ipaddr'] = $_SERVER["REMOTE_ADDR"];
		$data['login_time'] = "$date {$_POST['time']}";
		$data['logout_time'] = NULL;
		$data['active'] = 1;
		$data['type'] = $_POST['type'];

		// End any currently-active sessions on this machine (eg. if logoff script doesn't run and close it properly)
		kill_unclosed($data['hostname_id']);
		
		// Run query to insert the new logon
		$query = $db->query_insert('logins', $data);
		
	break;
	
	case 'logoff':
		
		// Data array to update with
		$data['logout_time'] = "$date {$_POST['time']}";
		$data['active'] = 0;
		$where = "session_id='{$_POST['session_id']}' AND active='1' LIMIT 1";
		$query = $db->query_update('logins', $data, $where);
		
	break;
}


// Check the query was OK or not
if($query){
	echo $query;
} else {
	echo var_export($data, TRUE);
}

#print_r($data);

require "include/foot.php";

/*
					AND ipaddr='{$data['ipaddr']}' 
					AND hostname='{$data['hostname']}' 
					AND username='{$data['username']}'*/
?>
