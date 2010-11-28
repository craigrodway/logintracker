<?php
/*
	Copyright 2010 Craig A Rodway <craig.rodway@gmail.com>

	This file is part of LoginTracker.

	LoginTracker is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	LoginTracker is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with LoginTracker.  If not, see <http://www.gnu.org/licenses/>.
*/


/**
 * Get list of users/computers/locations for autocomplete
 * Return as JSON data
 */

include_once('inc/init.php');

// Get parameters
$what = fRequest::getValid('what', array('users', 'computers', 'locations'));
$query = fRequest::get('q', 'string?');

// Escape query if present
if(!empty($query)){ $query = $db->escape('string', "%$query%"); }


// Search for users
if($what == 'users'){

	$sql = 'SELECT * FROM users';
	if(!empty($query)){ $sql .= " WHERE username LIKE $query"; }
	$idkey = "user_id";
	$namekey = "username";
	
}


if($what == 'computers'){
	
	$sql = 'SELECT * FROM hostnames';
	if(!empty($query)){ $sql .= " WHERE hostname LIKE $query"; }
	$idkey = "hostname_id";
	$namekey = "hostname";
	
}


if($what == 'locations'){
	
	$sql = 'SELECT * FROM ous';
	if(!empty($query)){ $sql .= " WHERE name LIKE $query"; }
	$idkey = "ou_id";
	$namekey = "name";
	
}


try{

	// Run the query
	$rows = $db->query($sql)->FetchAllRows();
	
	$json['status'] = 'ok';
	$json['total'] = count($rows);
	$json['results'] = $rows;
	$json['keys'] = array('id' => $idkey, 'name' => $namekey);
	fJSON::output($json);
	exit;
	
} catch (fSQLException $e) {

	$json['status'] = 'err';
	$json['text'] = "Database error: " . $e->getMessage();
	fJSON::output($json);
	exit;
	
} catch (fException $e) {
	
	$json['status'] = 'err';
	$json['text'] = "Error: " . $e->getMessage();
	fJSON::output($json);
	exit;
	
}

/* End of file ./api/list.php */