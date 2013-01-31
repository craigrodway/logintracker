<?php


/**
 * Get an ID of a hostname
 *
 * @param string Hostname to find
 * @return int hostname_id on success, FALSE on fail
 */
function hostname_to_id($hostname){
	global $db;
	$sql = "SELECT hostname_id FROM hostnames WHERE hostname='%s' LIMIT 1";
	$sql = sprintf($sql, $db->escape($hostname));
	$row = $db->query_first($sql);
	$hostname_id = (isset($row['hostname_id'])) ? $row['hostname_id'] : FALSE;
	return $hostname_id;
}


/**
 * Add a hostname to database
 *
 * @param string Hostname to add
 * @return int hostname_id of added hostname
 */
function insert_hostname($hostname){
	global $db;
	$data['hostname'] = $hostname;
	$query = $db->query_insert('hostnames', $data);
	return $query;
}


/**
 * Get a hostname_id - add if not already exists
 *
 * @param string Hostname to find or add
 * @return int hostname_id
 */
function magic_hostname($hostname){
	$hostname_id = hostname_to_id($hostname);
	return (is_numeric($hostname_id)) ? $hostname_id : insert_hostname($hostname);
}


?>