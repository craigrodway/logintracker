<?php


function form_dropdown($table){

	global $db;
	$tables = array("hostnames", "ous", "users");
	$data = array();
	
	if(!in_array($table, $tables)){ return FALSE; }
	

	
	switch($table){
	
		case 'hostnames':
		
			$sql = 'SELECT * FROM hostnames ORDER BY hostname ASC';
			$rows = $db->fetch_all_array($sql);
			foreach($rows as $k => $v){
				$data[$v['hostname_id']] = $v['hostname'];
			}
			$select_name = "hostname_id";
		
		break;
		
		case 'users':
		
			$sql = 'SELECT * FROM users ORDER BY username ASC';
			$rows = $db->fetch_all_array($sql);
			foreach($rows as $k => $v){
				$data[$v['user_id']] = $v['username'];
			}
			$select_name = "user_id";
			
		break;
		
		case 'ous':
		
			$sql = 'SELECT * FROM ous ORDER BY name ASC';
			$rows = $db->fetch_all_array($sql);
			foreach($rows as $k => $v){
				$data[$v['ou_id']] = $v['name'];
			}
			$select_name = "ou_id";
		
		break;
		
	}

	$html = '<select name="'.$select_name.'">';
	foreach($data as $id => $name){
		$html .= '<option value="'.$id.'">'.$name.'</option>';
	}
	$html .= '</select>';
	return $html;

}




function img($icon){
	$file = 'web/img/'.strtolower($icon).'.gif';
	$html = '<img src="%s" width="16" height="16" alt="%s" />';
	return sprintf($html, $file, $icon);
}




/**
 * Get totals from DB
 */
function get_total($filter = NULL){
	global $db;
	
	switch($filter){
	
		// Total today (active and non-active)
		case 'today':
			$date1 = date("Y-m-d");
			$date2 = date("Y-m-d", strtotime("tomorrow"));
			$sql = "SELECT count(session_id) FROM logins WHERE login_time >= '$date1' AND login_time <= '$date2' LIMIT 1";
		break;
		
		// Current staff
		case 'staff':
			$sql = "SELECT count(session_id) FROM logins WHERE active=1 AND type='STAFF' LIMIT 1";
		break;
		
		// Current students
		case 'student':
			$sql = "SELECT count(session_id) FROM logins WHERE active=1 AND type='STUDENT' LIMIT 1";
		break;
		
		// Total of all current logins
		default:
			$sql = "SELECT count(session_id) FROM logins WHERE active=1 LIMIT 1";
		break;
		
	}
	
	$row = $db->query_first($sql);
	return $row[0];
}




function mostactive($type){
	global $db;

	$today = date("Y-m-d");
	$tomorrow = date("Y-m-d", strtotime("tomorrow"));

	switch($type){

		case 'user':
			$sql = "SELECT logins.session_id, 
							users.username, users.user_id,
							(
								SELECT count(session_id) 
								FROM logins 
								WHERE users.user_id = logins.user_id 
								AND login_time >= '%1\$s' AND login_time <= '%2\$s' LIMIT 1
							) AS user_total,
							(
								SELECT count(distinct hostname_id) 
								FROM logins 
								WHERE logins.user_id = users.user_id 
								AND login_time >= '%1\$s' AND login_time <= '%2\$s' LIMIT 1
							) AS host_total
							FROM logins 
							LEFT JOIN users ON logins.user_id = users.user_id 
							WHERE login_time >= '%1\$s' AND login_time <= '%2\$s'
							GROUP BY user_total DESC, host_total DESC
							LIMIT 1";
			$sql = sprintf($sql, $today, $tomorrow);
			#echo $sql;
			$row = $db->query_first($sql);
			$logins = ($row['user_total'] == 1) ? 'login' : 'logins';
			$computers = ($row['host_total'] == 1) ? 'computer' : 'computers';
			$html = "<a href=\"users.php?view=all&user_id={$row['user_id']}&date=$today\">{$row['username']}</a> with {$row['user_total']} $logins on {$row['host_total']} {$computers}.";
		break;

		case 'host':
			$sql = "SELECT logins.session_id, 
							hostnames.hostname, hostnames.hostname_id,
							(
								SELECT count(session_id) 
								FROM logins 
								WHERE hostnames.hostname_id = logins.hostname_id
								AND login_time >= '%1\$s' AND login_time <= '%2\$s' LIMIT 1
							) AS host_total,
							(
								SELECT count(distinct user_id) 
								FROM logins 
								WHERE logins.hostname_id = hostnames.hostname_id
								AND login_time >= '%1\$s' AND Login_time <= '%2\$s' LIMIT 1
							) AS user_total
							FROM logins 
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
							WHERE login_time >= '%1\$s' AND login_time <= '%2\$s'
							GROUP BY host_total DESC, user_total DESC
							LIMIT 1";
			$sql = sprintf($sql, $today, $tomorrow);
			$row = $db->query_first($sql);
			$logins = ($row['host_total'] == 1) ? 'login' : 'logins';
			$users = ($row['user_total'] == 1) ? 'user' : 'users';
			$html = "<a href=\"computers.php?view=all&hostname_id={$row['hostname_id']}&date=$today\">{$row['hostname']}</a> with {$row['host_total']} $logins by {$row['user_total']} $users.";
		break;

	}

	return $html;

}




/**
 * Timespan
 *
 * Returns a span of seconds in this format:
 *	10 days 14 hours 36 minutes 47 seconds
 *
 * @access	public
 * @param	integer	a number of seconds
 * @param	integer	Unix timestamp
 * @return	integer
 */	
function timespan($seconds = 1, $time = ''){
	if ( ! is_numeric($seconds)){
		$seconds = 1;
	}
	
	if ( ! is_numeric($time)){
		$time = time();
	}
	
	if ($time <= $seconds){
		$seconds = 1;
	} else {
		$seconds = $time - $seconds;
	}

	$str = '';
	$years = floor($seconds / 31536000);
	
	if ($years > 0){	
		$str .= $years.' '.(($years	> 1) ? 'years' : 'year').', ';
	}	
	
	$seconds -= $years * 31536000;
	$months = floor($seconds / 2628000);
	
	if ($years > 0 OR $months > 0){
		if ($months > 0){	
			$str .= $months.' '.(($months	> 1) ? 'months' : 'month').', ';
		}
		$seconds -= $months * 2628000;
	}

	$weeks = floor($seconds / 604800);
	
	if ($years > 0 OR $months > 0 OR $weeks > 0){
		if ($weeks > 0){	
			$str .= $weeks.' '.(($weeks	> 1) ? 'weeks' : 'week').', ';
		}
		$seconds -= $weeks * 604800;
	}

	$days = floor($seconds / 86400);
	
	if ($months > 0 OR $weeks > 0 OR $days > 0){
		if ($days > 0){	
			$str .= $days.' '.(($days	> 1) ? 'days' : 'day').', ';
		}
		$seconds -= $days * 86400;
	}
	
	$hours = floor($seconds / 3600);
	
	if ($days > 0 OR $hours > 0){
		if ($hours > 0){
			$str .= $hours.' '.(($hours	> 1) ? 'hours' : 'hour').', ';
		}
		$seconds -= $hours * 3600;
	}
	
	$minutes = floor($seconds / 60);
	
	if ($days > 0 OR $hours > 0 OR $minutes > 0){
		if ($minutes > 0){	
			$str .= $minutes.' '.(($minutes	> 1) ? 'minutes' : 'minute').', ';
		}
		$seconds -= $minutes * 60;
	}
	
	if ($str == ''){
		$str .= $seconds.' '.(($seconds	> 1) ? 'seconds' : 'second').', ';
	}

	return substr(trim($str), 0, -1);
}




/**
 * Generate unique hex colours
 * Used to highlight duplicate logins
 */
function generateuniqueHexColors($quantity = 10){
	if($quantity >= (254*254*254)){ // Don't try to generate the full set of hex colors this way.
		return false;
	}
	
	$min = 150;
	$max = 255;
	$colors = array();
	$quantity = (intval($quantity) == 0)? 1 : intval($quantity);
	for($i=0; $i<$quantity; $i++){
		$color = sprintf("%02X%02X%02X", mt_rand($min, $max), mt_rand($min, $max), mt_rand($min, $max));
		while( in_array($color, $colors) ){
			$color = sprintf("%02X%02X%02X", mt_rand($min, $max), mt_rand($min, $max), mt_rand($min, $max));
		}
		$colors[] = $color;
	}
	return $colors;
}




/**
 * Kill any unclosed sessions on given hostname (when a new user logs in)
 * 
 * @param int Hostname ID
 * @return bool
 */
function kill_unclosed($hostname_id){
	global $db;
	$sql = "UPDATE logins SET active = 0, logout_time = '%s' WHERE hostname_id = %d AND active = 1 LIMIT 1";
	$sql = sprintf($sql, date("Y-m-d H:i:s"), (int)$db->escape($hostname_id));
	$query = $db->query($sql);
}
