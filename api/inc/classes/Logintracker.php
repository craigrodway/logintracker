<?php

class Logintracker{
	
	
	
	
	/**
	 * Timespan
	 *
	 * Returns a span of seconds in this format:
	 *	10 days 14 hours 36 minutes 47 seconds
	 *
	 * @access	public
	 * @param	integer	a number of seconds
	 * @param	integer	Unix timestamp
	 * @return	integer
	 */	
	function timespan($seconds = 1, $time = ''){
		if ( ! is_numeric($seconds)){
			$seconds = 1;
		}
		
		if ( ! is_numeric($time)){
			$time = time();
		}
		
		if ($time <= $seconds){
			$seconds = 1;
		} else {
			$seconds = $time - $seconds;
		}

		$str = '';
		$years = floor($seconds / 31536000);
		
		if ($years > 0){	
			$str .= $years.' '.(($years	> 1) ? 'years' : 'year').', ';
		}	
		
		$seconds -= $years * 31536000;
		$months = floor($seconds / 2628000);
		
		if ($years > 0 OR $months > 0){
			if ($months > 0){	
				$str .= $months.' '.(($months	> 1) ? 'months' : 'month').', ';
			}
			$seconds -= $months * 2628000;
		}

		$weeks = floor($seconds / 604800);
		
		if ($years > 0 OR $months > 0 OR $weeks > 0){
			if ($weeks > 0){	
				$str .= $weeks.' '.(($weeks	> 1) ? 'weeks' : 'week').', ';
			}
			$seconds -= $weeks * 604800;
		}

		$days = floor($seconds / 86400);
		
		if ($months > 0 OR $weeks > 0 OR $days > 0){
			if ($days > 0){	
				$str .= $days.' '.(($days	> 1) ? 'days' : 'day').', ';
			}
			$seconds -= $days * 86400;
		}
		
		$hours = floor($seconds / 3600);
		
		if ($days > 0 OR $hours > 0){
			if ($hours > 0){
				$str .= $hours.' '.(($hours	> 1) ? 'hours' : 'hour').', ';
			}
			$seconds -= $hours * 3600;
		}
		
		$minutes = floor($seconds / 60);
		
		if ($days > 0 OR $hours > 0 OR $minutes > 0){
			if ($minutes > 0){	
				$str .= $minutes.' '.(($minutes	> 1) ? 'minutes' : 'minute').', ';
			}
			$seconds -= $minutes * 60;
		}
		
		if ($str == ''){
			$str .= $seconds.' '.(($seconds	> 1) ? 'seconds' : 'second').', ';
		}

		return substr(trim($str), 0, -1);
	}
	
	
	
	
	/**
	 * Send output as JSON with correct headers
	 */
	function out($json){
		header("Content-Type: application/json");
		echo fJSON::encode($json);
		exit;
	}
	
	
	
	
}