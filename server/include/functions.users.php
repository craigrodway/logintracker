<?php


/**
 * Get an ID of a user
 *
 * @param string Username of user to find
 * @return int UserID on success, FALSE on fail
 */
function username_to_id($username){
	global $db;
	$sql = "SELECT user_id FROM users WHERE username='%s' LIMIT 1";
	$sql = sprintf($sql, $db->escape($username));
	$row = $db->query_first($sql);
	$user_id = (isset($row['user_id'])) ? $row['user_id'] : FALSE;
	return $user_id;
}


/**
 * Add a user to database
 *
 * @param string Username to add
 * @return int UserID of added user
 */
function insert_user($username){
	global $db;
	$data['username'] = $username;
	$query = $db->query_insert('users', $data);
	return $query;
}


/**
 * Get a UserID - add if not already exists
 *
 * @param string Username to find or add
 * @return int UserID
 */
function magic_user($username){
	$user_id = username_to_id($username);
	return (is_numeric($user_id)) ? $user_id : insert_user($username);
}


?>