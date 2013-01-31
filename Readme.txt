Server
======

Requirements

	* PHP
	* MySQL

Install

	1. Configure your MySQL server with a new database, username and password for Logintracker.
	2. Import ./server/logintracker.sql (using PhpMyAdmin?)
	3. Edit ./server/include/config.inc.php to reflect your new database settings
	4. Extract contents of ./server directory to a new folder on a web server (e.g. /logintracker)
		Do not upload the whole server folder - *just* the contents.


Client
======

Requirements

	* VBScript

Install

	1. Edit the .vbs files in ./client to reflect your network setup.
	2. Edit the strHTTPURL variable, line 18. It should be the URL to update.php from the installed logintracker script (above)
	3. Edit the user descriptions, line 23-24, to match the staff and student usertypes on your network
	3. Copy the .vbs files from ./client to your netlogon share (or similar location on your network)
	4. Set up your GPOs to run the scripts at logon and logoff.

