<?php


/**
 * Get an ID of an OU
 *
 * @param string OU name to find
 * @return int ou_id on success, FALSE on fail
 */
function ou_to_id($ou){
	global $db;
	$sql = "SELECT ou_id FROM ous WHERE name='%s' LIMIT 1";
	$sql = sprintf($sql, $db->escape($ou));
	$row = $db->query_first($sql);
	$ou_id = (isset($row['ou_id'])) ? $row['ou_id'] : FALSE;
	return $ou_id;
}


/**
 * Add an OU to database
 *
 * @param string OU name to add
 * @return int ou_id of added OU
 */
function insert_ou($ou){
	global $db;
	$data['name'] = $ou;
	$query = $db->query_insert('ous', $data);
	return $query;
}


/**
 * Get an ou_id - add if not already exists
 *
 * @param string OU to find or add
 * @return int ou_id
 */
function magic_ou($ou){
	$ou_id = ou_to_id($ou);
	return (is_numeric($ou_id)) ? $ou_id : insert_ou($ou);
}


?>