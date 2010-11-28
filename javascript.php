<?php
/**
 * Return javascript dependencies as one file
 */

include_once('api/inc/init.php');

$interface = fRequest::getValid('interface', array('normal', 'mobile'));
$jspath = dirname(__FILE__) . "/$interface/js/";

// Required files for normal interface
$js['normal'] = array(
	'jquery-1.4.2.js'
	,'jquery.bar.custom.js'
	,'jqModal.js'
	#,'../3rdparty/datatables/js/jquery.dataTables.min.js'
	,'../3rdparty/flexigrid/flexigrid.js'
	,'../3rdparty/autocomplete/jquery.autocomplete.js'
	,'../3rdparty/glow/core/core.js'
	,'../3rdparty/glow/widgets/widget-timetable-small.js'
	,'sammy-0.6.2.js'
	,'sammy.template.js'
	,'sammy.title.js'
	,'app.js'
	);

// Required files for mobile interface
$js['mobile'] = array(
	'jquery-1.4.2.js'
	);

// Send output
header("Content-Type: application/x-javascript");

// Loop through all files and echo them
echo "/** LoginTracker Javascript. Interface: $interface **/\n\n";
foreach($js[$interface] as $filename){
	$realpath = realpath($jspath . $filename);
	if(!file_exists($realpath)){ echo "/** 404: $filename not found! **/"; continue; }
	$file = new fFile($realpath);
	$contents = $file->read();
	echo "/** File: $filename **/\n$contents\n\n";
}