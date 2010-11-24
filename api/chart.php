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
 * Get current login sessions
 * Return as JSON data
 */

include_once('inc/init.php');


$chart = fRequest::getValid('chart', array(NULL, 'last6hrs'));


if($chart == 'last6hrs'){
	
	$now = time();
	$earlier = strtotime("-6 hours", time());
	
}


/* End of file: ./api/chart.php */