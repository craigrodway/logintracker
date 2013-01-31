<?php
# Name: database.class.php
# File Description: MySQL Class to allow easy and clean access to common mysql commands
# Author: ricocheting
# Web: http://www.ricocheting.com/perl/
# Update: 3/16/2008
# Version: 2.0.7
# Copyright 2003 ricocheting.com



/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/



//require("config.php");
//$db = new Database($config['server'],$config['user'],$config['pass'],$config['database'],$config['tablePrefix']);


###################################################################################################
###################################################################################################
###################################################################################################
class Database {


var $server		= ""; //database server
var $user		= ""; //database login name
var $pas		= ""; //database login password
var $database	= ""; //database name
var $pre		= ""; //table prefix


#######################
//internal info
var $record		= array();

var $error		= "";
var $errno		= 0;

//table name affected by SQL query
var $field_table= "";

//number of rows affected by SQL query
var $affected_rows= 0;

var $link_id	= 0;
var $query_id	= 0;


#-#############################################
# desc: constructor
function Database($server, $user, $pass, $database, $pre=''){
	$this->server=$server;
	$this->user=$user;
	$this->pass=$pass;
	$this->database=$database;
	$this->pre=$pre;
}#-#constructor()


#-#############################################
# desc: connect and select database using vars above
function connect() {
	$this->link_id=@mysql_connect($this->server,$this->user,$this->pass);

	if (!$this->link_id) {//open failed
		$this->oops("Could not connect to server: <b>$this->server</b>.");
		}

	if(!@mysql_select_db($this->database, $this->link_id)) {//no database
		$this->oops("Cannot open database: <b>".$this->database."</b>");
		}
}#-#connect()


#-#############################################
# desc: close the connection
function close() {
	if(!mysql_close()) {//open failed
		$this->oops("Connection close failed.");
	}
}#-#close()


#-#############################################
# Desc: escapes characters to be mysql ready
# Param: string
# returns: string
function escape($string) {
	if(version_compare(phpversion(),"4.3.0")=="-1") {
	return mysql_escape_string($string);
	} else {
    return mysql_real_escape_string($string);
	}
}#-#escape()


#-#############################################
# Desc: executes SQL query string to open connection
# Param: (MySQL query) to execute
# returns: (query_id) for fetching results etc
function query($query_string) {
	// do query
	$this->query_id = @mysql_query($query_string,$this->link_id);

	//if screwed up
	if (!$this->query_id) {
		$this->oops("<b>MySQL Query fail:</b> ".$query_string);
	}
	
	$this->affected_rows = @mysql_affected_rows();

	return $this->query_id;
}#-#query()


#-#############################################
# desc: fetches and returns results one line at a time
# param: query_id for mysql run. if none specified, last used
# return: (array) fetched record(s)
function fetch_array($query_id=-1) {
	// retrieve row
	if ($query_id!=-1) {
		$this->query_id=$query_id;
	}
	if ( isset($this->query_id) ) {
		$this->record = @mysql_fetch_array($this->query_id);
		$this->field_table = @mysql_field_table($this->query_id,0);//returns table used in query
	}else{
		$this->oops("Invalid query_id <b>".$this->query_id."</b>. Records could not be fetched.");
	}

	// unescape records
	if($this->record){
		foreach($this->record as $key=>$val) {
			$this->record[$key]=stripslashes($val);
		}
	}
	return $this->record;
}#-#fetch_array()


#-#############################################
# desc: returns all the results (not one row)
# param: (MySQL query) the query to run on server
# returns: assoc array of ALL fetched results
function fetch_all_array($query_string) {
	$query_id = $this->query($query_string);
	$out = array();

	while ($row = $this->fetch_array($query_id, $query_string)){
		$out[] = $row;
	}

	$this->free_result($query_id);
	return $out;
}#-#fetch_all_array()


#-#############################################
# desc: frees the resultset
# param: query_id for mysql run. if none specified, last used
function free_result($query_id=-1) {
	if ($query_id!=-1) {
		$this->query_id=$query_id;
	}
	if(!@mysql_free_result($this->query_id)) {
		$this->oops("Result set ID ".$this->query_id." not freed.");
	}
}#-#free_result()


#-#############################################
# desc: does a query, fetches the first row only, frees resultset
# param: (MySQL query) the query to run on server
# returns: array of fetched results
function query_first($query_string) {
	$query_id = $this->query($query_string);
	$out = $this->fetch_array($query_id);
	$this->free_result($query_id);
	return $out;
}#-#query_first()


#-#############################################
# desc: does an update query with an array
# param: table (no prefix), assoc array with data (doesn't need escaped), where condition
# returns: (query_id) for fetching results etc
function query_update($table, $data, $where='') {
	$q="UPDATE ".$this->pre.$table." SET ";

	foreach($data as $key=>$val) {
		if(strtolower($val)=='null') $q.= "`$key` = NULL, ";
		elseif(strtolower($val)=='now()') $q.= "`$key` = NOW(), ";
		else $q.= "`$key`='".$this->escape($val)."', ";
	}

	$q = rtrim($q, ', ') . ' WHERE '.$where.';';

	return $this->query($q);
}#-#query_update()


#-#############################################
# desc: does an insert query with an array
# param: table (no prefix), assoc array with data
# returns: id of inserted record
function query_insert($table, $data) {
	$q="INSERT INTO ".$this->pre.$table." ";
	$v=''; $n='';

	foreach($data as $key=>$val) {
		$n.="`$key`, ";
		if(strtolower($val)=='null') $v.="NULL, ";
		elseif(strtolower($val)=='now()') $v.="NOW(), ";
		else $v.= "'".$this->escape($val)."', ";
	}

	$q .= "(". rtrim($n, ', ') .") VALUES (". rtrim($v, ', ') .");";
	
	$this->query($q);
	return mysql_insert_id();
}#-#query_insert()




function oops($msg=''){
	if($this->link_id>0){
		$this->error=mysql_error($this->link_id);
		$this->errno=mysql_errno($this->link_id);
	}

	$this->error=mysql_error();
	$this->errno=mysql_errno();
	
	echo "Message: $msg\n\n";
	if(strlen($this->error)>0){ echo "MySQL Error: {$this->error}\n\n"; }
	echo "Date: " . date("l, F j, Y \a\\t g:i:s A") . "\n\n";
	echo "Script: " . @$_SERVER['REQUEST_URI'] . "\n\n";
}


#-#############################################
# desc: throw an error message
# param: [optional] any custom error to display
/* function oops($msg='') {
	if($this->link_id>0){
		$this->error=mysql_error($this->link_id);
		$this->errno=mysql_errno($this->link_id);
	}

	$this->error=mysql_error();
	$this->errno=mysql_errno();
	?>
		<table align=center border=1 cellspacing=0 width="80%" style="background:white;color:black;">
		<tr><th colspan=2>Database Error</th></tr>
		<tr><td align="right" valign="top">Message:</td><td><?php echo $msg; ?></tr></td>
		<?php if(strlen($this->error)>0) echo '<tr><td align="right" valign="top" nowrap>MySQL Error:</td><td>'.$this->error.'</tr></td>'; ?>
		<tr><td align="right">Date:</td><td><?php echo date("l, F j, Y \a\\t g:i:s A"); ?></tr></td>
		<tr><td align="right">Script:</td><td><a href="<?php echo @$_SERVER['REQUEST_URI']; ?>"><?php echo @$_SERVER['REQUEST_URI']; ?></a></tr></td>
		<?php if(strlen(@$_SERVER['HTTP_REFERER'])>0) echo '<tr><td align="right">Referer:</td><td><a href="'.@$_SERVER['HTTP_REFERER'].'">'.@$_SERVER['HTTP_REFERER'].'</a></tr></td>'; ?>
		</table>
	<?php
}#-#oops() */


}//CLASS Database
###################################################################################################

?>