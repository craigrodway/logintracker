<?php
require "include/head.php";
require "include/gui/head.php";
?>

<div class="container">

	<!-- HEAD -->
	<div class="span-24">
		<a href="index.php">&#171; Back to main page</a>
		<h1>Locations/Rooms</h1>
		<hr size="1" />
	</div>
	<!-- END HEAD -->

	<!-- MAIN -->
	<div class="span-24">	
	<?php
		$ou_id = $_GET['ou_id'];
		if(!is_numeric($ou_id)){ die("No OU!"); }
		$today = date("Y-m-d");
		$tomorrow = date("Y-m-d", strtotime("tomorrow"));
		$submit = strtolower($_GET['submit']);
		$sql = "SELECT logins.session_id, logins.login_time, logins.logout_time, logins.active, logins.type,
						hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id
						FROM logins
						LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
						LEFT JOIN ous ON logins.ou_id = ous.ou_id
						LEFT JOIN users ON logins.user_id = users.user_id
						WHERE logins.ou_id = %d
						%s
						ORDER BY hostnames.hostname ASC LIMIT 100";
		switch($submit){
			case 'history': $and = "AND logins.active = 0"; break;
			case 'current': $and = "AND logins.active = 1"; break;
		}
		$sql = sprintf($sql, $ou_id, $and);
		$rows = $db->fetch_all_array($sql);

		echo '<table width="100%" cellpadding="2" cellspacing="0" border="1">';
		echo '<tr><th>&nbsp;</th><th>OU</th><th>Computer</th><th>Username</th><th>Login</th><th>Logout</th><th>Session length</th><th>Type</th><th>&nbsp;</th></tr>';
		foreach($rows as $row){
			?>
			<tr>
				<td width="16"><?php echo ($row['active'] == 1) ? img('active') : '&nbsp;'; ?></td>
				<td><?php echo $row['ou'] ?></td>
				<td><a href="computers.php?view=all&hostname_id=<?php echo $row['hostname_id'] ?>"><?php echo $row['hostname'] ?></a></td>
				<td><a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></a></td>
				<td><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
				<td><?php echo ($row['active'] == 0) ? date("d/m/Y H:i", strtotime($row['logout_time'])) : '-'; ?></td>
				<td><?php echo ($row['active'] == 0) ? timespan(strtotime($row['login_time']), strtotime($row['logout_time'])) : timespan(strtotime($row['login_time']), @strtotime()); ?></td>
				<td><?php echo img("user_{$row['type']}") ?></td>
				<td><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
			</tr>
			<?php
		}
		echo '</table>';
	?>
	</div>
	<!-- END MAIN -->
	

</div>

<?php
require "include/gui/foot.php";
require "include/foot.php";
?>
