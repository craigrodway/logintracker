<!DOCTYPE html>
<html lang="en">
<head>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<title>LoginTracker</title>
<link rel="stylesheet" href="normal/css/reset.css" />
<link rel="stylesheet" href="normal/css/text.css" />
<link rel="stylesheet" href="normal/css/grid.css" />
<link rel="stylesheet" href="normal/3rdparty/glow/widgets/widget-timetable.css" />
<link rel="stylesheet" href="normal/css/logintracker.css" />
<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" /> 
<link rel="icon" href="favicon.ico" type="image/x-icon" /> 
<!--[if lt IE 9]>
<script src="http://html5shiv.googlecode.com/svn/trunk/html5.js"></script>
<style type="text/css">.clear{ zoom: 1; display: block; }</style>
<![endif]-->
<!--[if IE]>
<script language="javascript" type="text/javascript" src="normal/3rdparty/flot/excanvas.pack.js"></script>
<![endif]-->
</head>
<body>

	<div id="throbber" class="loading">Loading...</div>
	
	<div id="box" class="container_20">
		
		
		<div id="header" class="grid_10 alpha">
			<h1><a href="#/dashboard">LoginTracker</a></h1>
			<div id="search">
				<form method="post" action="#/search" id="searchform">
					<input id="searchquery" type="text" name="q" size="30" autocomplete="off" />
				</form>
			</div>
			
		</div>
		<div class="clear"></div>
		
		
		<div id="side" class="grid_4">
			
			<div class="grid_2 alpha"><span class="stat-number" id="stat-now">6</span><br />right now</div>
			<div class="grid_2 omega"><span class="stat-number" id="stat-today">80</span><br />today</div>
			<div class="clear"></div>
			<br />
			<h3>Live activity</h3>
			<div id="activity"></div>
			
		</div>
		
		
		<div id="content" class="grid_16">
			<h3 id="title"></h3>
			<div id="content-body"></div>
		</div>
		<div class="clear"></div>
		
	
	</div>
	
	
<script type="text/javascript" src="javascript.php?interface=normal"></script>


</body> 
</html>