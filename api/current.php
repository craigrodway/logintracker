<?php
/**
 * Get current login sessions
 * Return as JSON data
 */

include_once('inc/init.php');


// Pick up POST params
$start = fRequest::get('start', 'integer');
$limit = fRequest::get('limit', 'integer', 25);
$sort = fRequest::getValid(
	'sort', 
	array('login_time', 'username', 'computer', 'ou', 'usertype')
);
$dir = fRequest::getValid(
	'dir',
	array('ASC', 'DESC')
);
$duplicates = fRequest::get('duplicates', 'boolean');
$query = fRequest::get('query', 'string');


// Extra HAVING clause if we are filtering for duplicates
$having = ($duplicates == TRUE) ? 'HAVING user_total > 1' : '';

// Add extra bit to SQL if there is a search query
$search = '';
if($query){
	if(strpos($query, ':') === FALSE){
		$search = ($query) ? "AND (
			users.username LIKE '%$query%' OR 
			hostnames.hostname LIKE '%$query%' OR
			ous.name LIKE '%$query%')" : '';
	} else {
		// Got a colon, parse it for field:value
		list($field, $data) = explode(':', $query);
		switch($field){
			case 'u':
			case 'user':
			case 'username':
				$search = "AND users.username LIKE '%$data%'";
				break;
			case 'c':
			case 'pc':
			case 'comp':
			case 'computer':
				$search = "AND hostnames.hostname LIKE '%$data%'";
				break;
			case 'l':
			case 'ou':
				$search = "AND ous.name LIKE '%$data%'";
				break;
		}
	}
}

// Create query
$sql = "SELECT 
			logins.session_id, 
			UNIX_TIMESTAMP(logins.login_time) AS login_time, 
			UNIX_TIMESTAMP(logins.logout_time) AS logout_time,
			logins.type AS usertype,
			hostnames.hostname AS computer,
			hostnames.hostname_id,
			ous.name AS ou,
			users.username AS username,
			users.user_id,
			(
				SELECT count(logins.session_id) AS user_total
				FROM logins
				WHERE users.user_id = logins.user_id AND active = 1
			) AS user_total
		FROM logins
		LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
		LEFT JOIN ous ON logins.ou_id = ous.ou_id
		LEFT JOIN users ON logins.user_id = users.user_id
		WHERE logins.active = 1
		$search
		$having
		ORDER BY %r $dir
		LIMIT %i, %i";

// Escape data for query
$sql = $db->escape($sql, array($sort, $start, $limit));
$sql_no_limit = preg_replace('/LIMIT\s([0-9]+),\s([0-9]+)/', '', $sql);

// Remove LIMIT if loading duplicate login list
if($duplicates == TRUE){
	$sql = preg_replace('/LIMIT\s([0-9]+),\s([0-9]+)/', '', $sql);
}

// Run the query
$sessions = $db->query($sql)->FetchAllRows();

// Get session length for each row, update the array
foreach($sessions as &$row){
	$logout_time = ($row['logout_time'] = '0000-00-00 00:00:00') ? time() : $row['logout_time'];
	$row['length'] = Misc::timespan($row['login_time'], $row['logout_time']);
}

if($duplicates == TRUE){
	$total['total'] = count($sessions);
}

// If total was not set in previous query (only when doing duplicate logins) then get it now
if(!isset($total)){
	// Find out how many total rows there should be, without the limit
	$sql = "SELECT count(session_id) AS total 
			FROM logins
			LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
			LEFT JOIN ous ON logins.ou_id = ous.ou_id
			LEFT JOIN users ON logins.user_id = users.user_id
			 WHERE logins.active = 1 $search";
	$total = $db->query($sql)->fetchRow();
}

// Finally format array as JSON data
echo fJSON::encode(array(
	'dupes' => ($duplicates == TRUE) ? 'yes' : 'no',
	'total' => $total['total'],
	'sort' => $sort,
	'dir' => $dir,
	'sessions' => $sessions
));

/* End of file ./current.php */