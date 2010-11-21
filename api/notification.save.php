<?php
/**
 * Add new notification
 */

include_once('inc/init.php');


// Pick up POST params
$username = fRequest::get('username', 'string?');
$computer = fRequest::get('computer', 'string?');
$event['logon'] = fRequest::getValid('event-logon', array('', 'on'));
$event['logoff'] = fRequest::getValid('event-logoff', array('', 'on'));
$dupes = fRequest::getValid('dupes', array('', 'on'));
$email['to'] = fRequest::get('email-to', 'string');
$email['subject'] = fRequest::get('email-subject', 'string');
$email['body'] = fRequest::get('email-body', 'string');

