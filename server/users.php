<?php
require "include/head.php";
require "include/gui/head.php";
?>

<div class="container">

	<!-- HEAD -->
	<div class="span-24">
		<a href="index.php">&#171; Back to main page</a>
		<h1>People</h1>
		<hr size="1" />
	</div>
	<!-- END HEAD -->

	<!-- MAIN -->
	<div class="span-24">	
	<?php
	switch($_GET['view']){

		// Show all logins for given user
		case 'all':
			$sql = "SELECT logins.session_id, logins.login_time, logins.logout_time, logins.active, logins.type,
							hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id
							FROM logins
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
							LEFT JOIN ous ON logins.ou_id = ous.ou_id
							LEFT JOIN users ON logins.user_id = users.user_id
							%s %s
							ORDER BY login_time DESC";

			// If username is supplied then we modify the query to filter for user ID or username			
			if(isset($_GET['user_id'])){
				$user_id = $db->escape($_GET['user_id']);
				$where = "WHERE users.user_id = $user_id";
			} elseif(isset($_GET['username'])){
				$username = $db->escape($_GET['username']);
				$where = "WHERE users.username LIKE '%$username%'";
			} else {
				die("No username or user ID supplied!");
			}

			// If date is supplied, we need to modify query again
			$and = '';
			if(isset($_GET['date'])){
				$lower = $_GET['date'];
				$upper = date("Y-m-d", strtotime("tomorrow", strtotime($_GET['date'])));
				$and = "AND login_time >= '{$lower}' AND login_time <= '{$upper}'";
				if(!isset($where)){ $where = $and; $and = ''; }
			}

			$sql = sprintf($sql, $where, $and);
			$rows = $db->fetch_all_array($sql);

			echo '<p>Showing all logons (including current) for the chosen user.</p>';
			echo '<table width="100%" cellpadding="2" cellspacing="0" border="1">';
			echo '<tr><th>&nbsp;</th><th>Username</th><th>Computer</th><th>OU</th><th>Login</th><th>Logout</th><th>Session length</th><th>Type</th><th>&nbsp;</th></tr>';
			foreach($rows as $row){
				$css = '';
				if($row['active'] == 1){ $css = ' class="active"'; }
				?>
				<tr<?php echo $css ?>>
					<td width="16"><?php echo ($row['active'] == 1) ? img('active') : '&nbsp;'; ?></td>
					<td><a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></a></td>
					<td><a href="computers.php?view=all&hostname_id=<?php echo $row['hostname_id'] ?>"><?php echo $row['hostname'] ?></a></td>
					<td><?php echo $row['ou'] ?></td>
					<td><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
					<td><?php echo ($row['active'] == 0) ? date("d/m/Y H:i", strtotime($row['logout_time'])) : '-'; ?></td>
					<td><?php echo ($row['active'] 
== 0) ? timespan(strtotime($row['login_time']), strtotime($row['logout_time'])) : timespan(strtotime($row['login_time']), @strtotime()); ?></td>
					<td><?php echo img("user_{$row['type']}") ?></td>
					<td><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
				</tr>
				<?php
			}
			echo '</table>';

		break;


		case 'active':
			$sql = "SELECT logins.session_id, logins.login_time, logins.active, logins.type,
							hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id
							FROM logins
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id
							LEFT JOIN ous ON logins.ou_id = ous.ou_id
							LEFT JOIN users ON logins.user_id = users.user_id
							WHERE logins.active = 1
							%s
							ORDER BY users.username ASC, logins.login_time DESC";

			$and = '';
			if(isset($_GET['type'])){
				switch(strtolower($_GET['type'])){
					case 'staff': $and = "AND logins.type='STAFF'"; break;
					case 'student': $and = "AND logins.type='STUDENT'"; break;
				}
			}

			$sql = sprintf($sql, $and);
			$rows = $db->fetch_all_array($sql);

			echo '<p>Showing all computers where a user is currently logged in, ordered by username.</p>';
			echo '<table width="100%" cellpadding="2" cellspacing="0" border="1" id="jsst-users">';
			echo '<thead>';
			echo '<tr class="heading"><th title="Computer">Computer</th><th title="OU">OU</th><th title="Username">Username</th><th title="Time">Login time</th><th title="Length">Session length so far</th><th title="Type">Type</th><th title="X">&nbsp;</th></tr>';
			echo '</thead><tbody>';
			foreach($rows as $row){
				?>
				<tr>
					<td><a href="computers.php?view=all&hostname_id=<?php echo $row['hostname_id'] ?>"><?php echo $row['hostname'] ?></a></td>
					<td><?php echo $row['ou'] ?></td>
					<td><a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></a></td>
					<td><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
					<td><?php echo timespan(strtotime($row['login_time']), strtotime(date("Y-m-d H:i:s"))) ?></td>
					<td><?php echo img("user_{$row['type']}") ?></td>
					<td><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
				</tr>
				<?php
			}
			?>
			</tbody></table>
			<script type="text/javascript">
			var st1 = new SortableTable(document.getElementById("jsst-users"), ["Computer","OU","Username","Time","Length","Type","None"]);
			</script>

			<?php
		break;



		case 'duplicate':
			$sql = "SELECT logins.session_id, logins.login_time, logins.active, logins.type, 
							hostnames.hostname, hostnames.hostname_id, ous.name AS ou, users.username, users.user_id,
							(SELECT count(logins.session_id) AS user_total 
								FROM logins 
								WHERE users.user_id = logins.user_id AND active = 1
							) AS user_total 
							FROM logins 
							LEFT JOIN hostnames ON logins.hostname_id = hostnames.hostname_id 
							LEFT JOIN ous ON logins.ou_id = ous.ou_id 
							LEFT JOIN users ON logins.user_id = users.user_id 
							WHERE logins.active = 1 
							%s
							HAVING user_total > 1
							ORDER BY users.username ASC, logins.login_time";

			if(isset($_GET['user_id'])){
				$and = "AND users.user_id = %d";
				$and = sprintf($and, $db->escape($_GET['user_id']));
			} else {
				$and = '';
			}

			$sql = sprintf($sql, $and);
			$rows = $db->fetch_all_array($sql);

			echo '<p>Showing users where they are logged in to more than one computer.</p>';
			echo '<table width="100%" cellpadding="2" cellspacing="0" border="0">';
			echo '<tr><th>Username</th><th>Computer</th><th>OU</th><th>Login time</th><th>Session length so far</th><th>Type</th><th>&nbsp;</th></tr>';
			$hexs = generateuniqueHexColors(count($rows));
			$i = 0;
			foreach($rows as $row){
				if(!isset($colours[$row['user_id']])){ $colours[$row['user_id']] = $hexs[$i]; }
				$bg = ' style="background:#'.$colours[$row['user_id']].'"';
				?>
				<tr>
					<td<?php echo $bg ?>><a href="users.php?view=all&user_id=<?php echo $row['user_id'] ?>"><?php echo $row['username'] ?></td>
					<td<?php echo $bg ?>><a href="computers.php?view=all&hostname_id=<?php echo $row['hostname_id'] ?>"><?php echo $row['hostname'] ?></td>
					<td<?php echo $bg ?>><?php echo $row['ou'] ?></td>
					<td<?php echo $bg ?>><?php echo date("d/m/Y H:i", strtotime($row['login_time'])) ?></td>
					<td<?php echo $bg ?>><?php echo timespan(strtotime($row['login_time']), strtotime(date("Y-m-d H:i:s"))) ?></td>
					<td<?php echo $bg ?>><?php echo img("user_{$row['type']}") ?></td>
					<td<?php echo $bg ?>><a href="reset.php?session_id=<?php echo $row['session_id'] ?>">Reset</a></td>
				</tr>
				<?php
				$i++;
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
