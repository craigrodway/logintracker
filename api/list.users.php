<?php
/**
 * Get list of users
 * Return as JSON data
 */

include_once('inc/init.php');

// Get the part of the username to search for
$query = fRequest::get('query', 'string');

if($query){
	$query = $db->escape('string', '%' . $query . '%');
	$sql = "SELECT user_id, username FROM users WHERE username LIKE $query";
} else {
	$sql = 'SELECT user_id, username FROM users';
}

// Run the query
$users = $db->query($sql)->FetchAllRows();

// Finally format array as JSON data
echo fJSON::encode(array(
	'total' => count($users),
	'users' => $users
));