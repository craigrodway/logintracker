<?php
/**
 * Get list of computers
 * Return as JSON data
 */

include_once('inc/init.php');

// Get the part of the computer to search for
$query = fRequest::get('query', 'string');

if($query){
	$query = $db->escape('string', '%' . $query . '%');
	$sql = "SELECT hostname_id, hostname FROM hostnames WHERE hostname LIKE $query";
} else {
	$sql = 'SELECT hostname_id, hostname FROM hostnames';
}

// Run the query
$computers = $db->query($sql)->FetchAllRows();

// Finally format array as JSON data
echo fJSON::encode(array(
	'total' => count($computers),
	'computers' => $computers
));