<?php
/**
 * Handles storing and retrieving login sessions.
 * Based on the class from the Flourish lib demo project.
 *        
 * @copyright  Copyright (c) 2009 Will Bond
 * @author     Will Bond [wb] <will@flourishlib.com>
 */
class Session extends fActiveRecord{
    
	
	/**
     * Returns all current sessions
     * 
     * @param  string  $sort_column  The column to sort by
     * @param  string  $sort_dir     The direction to sort the column
     * @return fRecordSet  An object containing all meetups
     */
    static function findCurrent($sort_column = '', $sort_dir = '', $start = 0, $limit = 10, $duplicates = FALSE){	
		
		if(!in_array($sort_column, array('users.username', 'hostnames.hostname', 
			'ous.name', 'logins.type', 'logins.login_time'))) {
            $sort_column = 'users.username';
        }
		
        if (!in_array($sort_dir, array('ASC', 'DESC'))) {
            $sort_dir = 'asc';
        }
	
		$sql = 'SELECT 
					logins.session_id, logins.login_time, logins.active, logins.type,
					hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id
				FROM logins
				LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
				LEFT JOIN ous ON logins.ou_id = ous.ou_id
				LEFT JOIN users ON logins.user_id = users.user_id
				WHERE logins.active = 1
				LIMIT %i, %i
				ORDER BY %s %s';
		
		$sessions = fRecordSet::buildFromSQL(
			'Session',
			$sql,
			'SELECT COUNT(session_id) FROM logins'
		);
        
        return fRecordSet::build(
            __CLASS__,
            array(),	/*'active', '1'),*/
            array()	/*$sort_column => $sort_dir)*/
        );
		
    }
	
	
    /**
     * Set features for the class. Only called once per page load for each class.
     * 
     * @return void
     */
    protected function configure(){
		fORM::mapClassToTable($this, 'logins');
    }
    
	
}