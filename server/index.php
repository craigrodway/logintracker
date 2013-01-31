<?php
require "include/head.php";
require "include/gui/head.php";
?>

<div class="container">

	<!-- HEAD -->
	<div class="span-24">
		<h1>Login Tracker</h1>
		<hr size="1" />
	</div>
	<!-- END HEAD -->
	
	<!-- LEFT COL -->
	<div class="span-10">
		<h2>Users</h2>
		<p>
			<ul>
				<li><a href="users.php?view=active">View currently logged-in users</a></li>
				<li><a href="users.php?view=active&type=staff">View currently logged-in staff users</a></li>
				<li><a href="users.php?view=active&type=student">View currently logged-in student users</a></li>
				<li><a href="users.php?view=duplicate">Show current duplicate logins</a></li>
			</ul>
			
			<form action="users.php" method="GET">
				<input type="hidden" name="view" value="all" />
				<?php echo form_dropdown("users"); ?>
				<input type="submit" name="submit" value="Show" />
			</form>

			<form action="users.php" method="GET">
				<input type="hidden" name="view" value="all" />
				<input type="text" name="username" value="" size="20" />
				<input type="submit" name="submit" value="Search" />
			</form>
		</p>
		
		<br />
		
		<h2>Computers</h2>
		<p>
			<ul>
				<li><a href="computers.php?view=active">View currently logged-in computers</a></li>
			</ul>
			
			<form action="computers.php" method="GET">
				<input type="hidden" name="view" value="all" />
				<?php echo form_dropdown("hostnames"); ?>
				<input type="submit" name="submit" value="Show" />
			</form>
		</p>
		
		<br />
		
		<h2>Locations/Rooms</h2>
		<p>
			<form action="locations.php" method="GET">
				<?php echo form_dropdown("ous"); ?>
				<input type="submit" name="submit" value="Current" />
				<input type="submit" name="submit" value="History" />
			</form>
		</p>
	</div>
	<!-- END LEFT COL -->
	
	
	<!-- RIGHT COL -->
	<div class="span-14 last">
		<h2>Statistics</h2>
		
		<p><strong>Total current logged-in users:</strong> <?php echo get_total(); ?></p>
		<p><strong>Total current staff logins:</strong> <?php echo get_total('staff'); ?></p>
		<p><strong>Total current student logins:</strong> <?php echo get_total('student'); ?></p>
		<p><strong>Total logins today so far:</strong> <?php echo get_total('today'); ?></p>
		<!-- <p><strong>Most active user today:</strong> <?php #echo mostactive('user'); ?></p>
		<p><strong>Most active computer today:</strong> <?php #echo mostactive('host'); ?></p> -->
		
		<!-- <h2>Maintenance</h2>
		<p>
			<ul>
				<li><a href="maintenance.php?action=resetactive">Close all active sessions</a></li>
			</ul>
		</p>
	</div> -->
	<!-- END RIGHT COL -->
	
	
</div>

<?php
require "include/gui/foot.php";
require "include/foot.php";
?>
