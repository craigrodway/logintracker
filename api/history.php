<?php
/**
 * Get historic session data for user and/or computer
 * Return as JSON data
 */

include_once('inc/init.php');

// Pick up POST params
$start = fRequest::get('start', 'integer');
$limit = fRequest::get('limit', 'integer', 50);
$sort = fRequest::getValid('sort', array('login_time', 'logout_time', 'username', 'computer', 'ou', 'usertype'));
$dir = fRequest::getValid('dir', array('ASC', 'DESC'));

// Search data
$user_id = fRequest::get('user_id', 'integer', NULL);
$hostname_id = fRequest::get('hostname_id', 'integer', NULL);
$search = '';
// Any search params? Add to query
if($user_id){
	$search .= $db->escape(' AND users.user_id = %i ', $user_id);
}
if($hostname_id){
	$search .= $db->escape(' AND hostnames.hostname_id = %i ', $hostname_id);
}

// Create query
$sql = "SELECT 
			logins.session_id, 
			UNIX_TIMESTAMP(logins.login_time) AS login_time, 
			UNIX_TIMESTAMP(logins.logout_time) AS logout_time,
			logins.active AS active,
			logins.type AS usertype,
			hostnames.hostname AS computer,
			ous.name AS ou,
			users.username AS username
		FROM logins
		LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
		LEFT JOIN ous ON logins.ou_id = ous.ou_id
		LEFT JOIN users ON logins.user_id = users.user_id
		WHERE logins.active IN (0, 1)
		$search
		ORDER BY %r $dir
		LIMIT %i, %i";

// Escape data for query
$sql = $db->escape($sql, array($sort, $start, $limit));
$sql_no_limit = preg_replace('/LIMIT\s([0-9]+),\s([0-9]+)/', '', $sql);

// Run the query
$sessions = $db->query($sql)->FetchAllRows();

// Get session length for each row, update the array
foreach($sessions as &$row){
	$logout_time = ($row['logout_time'] == NULL) ? time() : $row['logout_time'];
	$row['length'] = Misc::timespan($row['login_time'], $row['logout_time']);
}

// Find out how many total rows there should be, without the limit
$sql_total = "SELECT count(session_id) AS total 
		FROM logins
		LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
		LEFT JOIN ous ON logins.ou_id = ous.ou_id
		LEFT JOIN users ON logins.user_id = users.user_id
		WHERE logins.active IN (0, 1) $search";
$total = $db->query($sql_total)->fetchRow();

// Finally format array as JSON data
echo fJSON::encode(array(
	'search' => array('user_id' => $user_id, 'hostname_id' => $hostname_id),
	'total' => $total['total'],
	'sort' => $sort,
	'dir' => $dir,
	'sessions' => $sessions
));


/* End of file ./history.php */