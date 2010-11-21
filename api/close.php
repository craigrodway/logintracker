<?php
/**
 * Close a session
 */

include_once('inc/init.php');


// Pick up POST param
$session_id = fRequest::get('session_id', 'integer');

if($session_id){
	
	$logout_time = date('Y-m-d H:i:s');
	
	$sql = 'UPDATE logins 
			SET logout_time = %s, active = 0 
			WHERE session_id = %i AND active = 1
			LIMIT 1';
	
	$sql = $db->escape($sql, array($logout_time, $session_id));
	$close = $db->query($sql);
	
	$result['affected_rows'] = $close->countAffectedRows();
	$result['error'] = 'No further information available.';
	
} else {
	
	$result['affected_rows'] = 0;
	$result['error'] = 'No session ID given.';
	
}

echo fJSON::encode($result);