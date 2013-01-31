<?php
require "include/head.php";
require "include/gui/head.php";
?>

<div class="container">

	<!-- HEAD -->
	<div class="span-24">
		<a href="index.php">&#171; Back to main page</a>
		<h1>Computers</h1>
		<hr size="1" />
	</div>
	<!-- END HEAD -->

	<!-- MAIN -->
	<div class="span-24">	
	<?php
	switch($_GET['view']){
		case 'all':
			$hostname_id = $_GET['hostname_id'];
			if(!is_numeric($hostname_id)){ die("No hostname!"); }
			$sql = "SELECT logins.session_id, logins.login_time, logins.logout_time, logins.active, logins.type,
							hostnames.hostname, ous.name AS ou, users.username, users.user_id
							FROM logins
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
							LEFT JOIN ous ON logins.ou_id = ous.ou_id
							LEFT JOIN users ON logins.user_id = users.user_id
							WHERE hostnames.hostname_id = %d
							%s
							ORDER BY login_time DESC";
      // If date is supplied, we need to modify query again
      $and = '';
      if(isset($_GET['date'])){
        $lower = $_GET['date'];
        $upper = date("Y-m-d", strtotime("tomorrow", strtotime($_GET['date'])));
        $and = "AND login_time >= '{$lower}' AND login_time <= '{$upper}'";
      }

			// Run query
			$sql = sprintf($sql, $hostname_id, $and);
			$rows = $db->fetch_all_array($sql);

			echo '<p>Showing logons to the chosen computer.</p>';
			echo '<table width="100%" cellpadding="2" cellspacing="0" border="1">';
			echo '<tr><th>&nbsp;</th><th>Computer</th><th>OU</th><th>Username</th><th>Login</th><th>Logout</th><th>Session length</th><th>Type</th><th>&nbsp;</th></tr>';
			foreach($rows as $row){
				$css = '';
				if($row['active'] == 1){ $css = ' class="active"'; }
				#print_r($row);
				?>
				<tr<?php echo $css ?>>
					<td width="16"><?php echo ($row['active'] == 1) ? img('active') : '&nbsp;'; ?></td>
					<td><?php echo $row['hostname'] ?></td>
					<td><?php echo $row['ou'] ?></td>
					<td><a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></a></td>
					<td><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
					<td><?php echo ($row['active'] == 0) ? date("d/m/Y H:i", strtotime($row['logout_time'])) : '-'; ?></td>
					<td><?php echo ($row['active'] == 0) ? timespan(strtotime($row['login_time']), strtotime($row['logout_time'])) : '-'; ?></td>
					<td><?php echo img("user_{$row['type']}") ?></td>
					<td><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
				</tr>
				<?php
			}
			echo '</table>';

		break;


		case 'active':
			$sql = "SELECT logins.session_id, logins.login_time, logins.active, logins.type,
							hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id, 
							(SELECT count(session_id) AS total FROM logins WHERE users.user_id = logins.user_id AND logins.active = 1) AS user_total
							FROM logins
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
							LEFT JOIN ous ON logins.ou_id = ous.ou_id
							LEFT JOIN users ON logins.user_id = users.user_id
							WHERE logins.active = 1
							ORDER BY ous.name ASC, hostnames.hostname ASC, logins.login_time DESC";
			$rows = $db->fetch_all_array($sql);

			echo '<p>Showing all computers where a user is currently logged in, ordered by computer name.</p>';
			echo '<table width="100%" cellpadding="2" cellspacing="0" border="1">';
			echo '<tr><th>Computer</th><th>OU</th><th>Username</th><th>Login time</th><th>Session length so far</th><th>Type</th><th>&nbsp;</th></tr>';
			foreach($rows as $row){
				$css = '';
				if($row['user_total'] > 1){ $css = ' class="duplicate"'; }
				?>
				<tr<?php echo $css ?>>
					<td><a href="computers.php?view=all&hostname_id=<?php echo $row['hostname_id'] ?>"><?php echo $row['hostname'] ?></a></td>
					<td><?php echo $row['ou'] ?></td>
					<td>
						<a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></a>
						<?php echo ($row['user_total'] > 1) ? "(<a href=\"users.php?view=duplicate&user_id={$row['user_id']}\">{$row['user_total']}</a>)" : ''; ?></td>
					<td><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
					<td><?php echo timespan(strtotime($row['login_time']), strtotime(date("Y-m-d H:i:s"))) ?></td>
					<td><?php echo img("user_{$row['type']}") ?></td>
					<td><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
				</tr>
				<?php
			}
		break;


	}
	?>
	</div>
	<!-- END MAIN -->
	

</div>

<?php
require "include/gui/foot.php";
require "include/foot.php";
?>
