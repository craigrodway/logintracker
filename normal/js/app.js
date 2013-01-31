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


(function($) {
	
	
	
	
	/**
	 * Functions that the grid relies on
	 */
	gridfuncs = {
		
		
		reset: function(com, grid){
		},
		
		
		filterAlpha: function(com){
		},
		
		
		/**
		 * Convert JSON from API into columns for flexigrid.
		 */
		convertJSON: function(data){
			
			console.log(data);
			// Create object that Flexigrid understands
			data2 = { total: data.total, page: data.page, rows: [] };
			// Iterate login sessions from source data
			$.each(data.sessions, function(i, session){
				// Create a row of data for this session
				var row = { id: session.session_id, cell: [] };
				// Iterate all of the columns in use
				$.each(gridconf._current_cols, function(j, col){
					row.cell.push(session[col.name]);
				});
				// Add row to data
				data2.rows.push(row);
			});
			console.log(data2);
			// Return processed data
			return data2;
			
		}
		

	}
	
	
	
	
	/**
	 * Various configuration options for grids
	 */
	gridconf = {
		
		_current_cols: '',
		
		cols_current: [
			{display: 'Username', name: 'username', width: 130, sortable: true, align: 'left'}
			,{display: 'Computer', name: 'computer', width: 130, sortable: true, align: 'left'}
			,{display: 'Location', name: 'ou', width: 120, sortable: true, align: 'left'}
			,{display: 'Login time', name: 'login_time', width: 140, sortable: true, align: 'left'}
			,{display: 'Session length', name: 'length', width: 150, sortable: true, align: 'left'}
			,{display: 'Type', name: 'usertype_img', width: 30, sortable: true, align: 'left'}
		],
		
		search_current: [
			{display: 'Username', name: 'username', isdefault: true}
			,{display: 'Computer', name: 'computer'}
			,{display: 'Location', name: 'location'}
		],
		
		tb_main: [
			{name: 'Reset session', bclass: 'delete', onpress: gridfuncs.reset}
			,{separator: true}
		],
		
		tb_alpha: [
			{name: 'Reset session', bclass: 'delete', onpress: gridfuncs.reset}
			,{separator: true}
			,{name: 'A', onpress: gridfuncs.filterAlpha}
			,{name: 'B', onpress: gridfuncs.filterAlpha}
			,{name: 'C', onpress: gridfuncs.filterAlpha}
			,{name: 'D', onpress: gridfuncs.filterAlpha}
			,{name: 'E', onpress: gridfuncs.filterAlpha}
			,{name: 'F', onpress: gridfuncs.filterAlpha}
			,{name: 'G', onpress: gridfuncs.filterAlpha}
			,{name: 'H', onpress: gridfuncs.filterAlpha}
			,{name: 'I', onpress: gridfuncs.filterAlpha}
			,{name: 'J', onpress: gridfuncs.filterAlpha}
			,{name: 'K', onpress: gridfuncs.filterAlpha}
			,{name: 'L', onpress: gridfuncs.filterAlpha}
			,{name: 'M', onpress: gridfuncs.filterAlpha}
			,{name: 'N', onpress: gridfuncs.filterAlpha}
			,{name: 'O', onpress: gridfuncs.filterAlpha}
			,{name: 'P', onpress: gridfuncs.filterAlpha}
			,{name: 'Q', onpress: gridfuncs.filterAlpha}
			,{name: 'R', onpress: gridfuncs.filterAlpha}
			,{name: 'S', onpress: gridfuncs.filterAlpha}
			,{name: 'T', onpress: gridfuncs.filterAlpha}
			,{name: 'U', onpress: gridfuncs.filterAlpha}
			,{name: 'V', onpress: gridfuncs.filterAlpha}
			,{name: 'W', onpress: gridfuncs.filterAlpha}
			,{name: 'X', onpress: gridfuncs.filterAlpha}
			,{name: 'Y', onpress: gridfuncs.filterAlpha}
			,{name: 'Z', onpress: gridfuncs.filterAlpha}
			,{name: '#', onpress: gridfuncs.filterAlpha}
		]
		
	}
	
	
	
	
	/**
	 * Main Sammy app
	 */
	var app = $.sammy("#content-body", function() {

		this.use("Template");
		this.use("Title");

		this.setTitle('LoginTracker: ');
		
		this.debug = true;
		this.raise_errors = true;
		
		$(document).ajaxStart(function(evt) { $("#throbber").show(); });
		$(document).ajaxStop(function(evt) { $("#throbber").hide(); });

		// API URL
		var API = document.location.pathname + "api/";
		var TPL = document.location.pathname + "normal/templates/";
		
		
		
		
		/** 
		 * Show dashboard
		 */
		this.get('#/dashboard', function(context) {
			this.t("Dashboard");
			context.render(TPL + "dashboard.template")
				.replace(context.$element())
				.then(function(){
					/*$("input[data-autocomplete]").each(function(){
						var el = $(this);
						el.autocomplete(el.attr("data-autocomplete"), {
							max: 30,
							autoFill: true,
							width: 130,
							dataType: "json",
							parse: function(json){
								var m = $.map(json.results, function(row) {
									return { data: row, key: row[json.keys.id], value: row[json.keys.name] }
								});
								console.log(m);
							}
						});
					});*/
				});
		});
		
		
		
		
		/**
		 * Current active login sessions
		 */
		this.get("#/current/:filter", function(context){
			
			var filter = (this.params['filter']) ? this.params['filter'] : 'all';
			var title = "All current logins";
			
			// Set query based on incoming filter
			if(filter == "students"){ title = "Current student logins"; }
			if(filter == "staff"){ title = "Current staff logins"; }
			
			this.t(title);
			
			context.render(TPL + "current.template")
				.replace(context.$element())
				.then(function(){
					
					// Set the 'current' column definition to whatever we're using here
					gridconf._current_cols = gridconf.cols_current;
					
					$("#table").flexigrid({
						url: API + "current.php?filter=" + filter,
						dataType: 'json',
						colModel: gridconf.cols_current,
						buttons : gridconf.tb_alpha,
						searchitems : gridconf.search_current,
						sortname: "login_time",
						sortorder: "desc",
						usepager: true,
						//title: title,
						useRp: true,
						rp: 15,
						rpOptions: [15, 30, 45, 60],
						showTableToggleBtn: false,
						showToggleBtn: false,
						height: "auto"	/*"" + ((20 * this.rp) + 50) + ""*/
					});		// end of flexigrid()
					
				});		// end of context.render().replace().then()
			
		});
		
		
		
		
		/**
		 * Configure notifications page
		 */
		this.get("#/notifications", function(){
			this.t("Configure notifications");
			$("#content-body").text('');
		});
		
		
		
		
		/** 
		 * Handle search query
		 */
		this.get("#/search/:q", function(context){
			this.t("Searching for " + this.params["q"]);
			$("#content-body").text('');
		});
		
		
		
		
		/**
		 * User page
		 */
		this.get("#/user/:username/:page", function(context){
			var username = this.params['username'];
			var page = (this.params['page']) ? this.params['page'] : 1;
			this.t("Search results for user " + username);
			$.getJSON(API + "search.php", {
					sortname: "login_time", 
					sortorder: "desc", 
					page: page,
					rp: 15,
					qtype: "username",
					query: username
				}, function(res){
				if(res.status == "ok"){
					context.partial(TPL + "search.template", { data: res });
				}
			});
		});
		
		
		
		
		/**
		 * Computer page
		 */
		this.get("#/computer/:computer", function(context){
			var computer = this.params['computer'];
			this.t("Search results for computer " + computer);
			$("#content-body").text('');
		});
		
		
		
		
		/**
		 * Location page
		 */
		this.get("#/location/:location", function(context){
			var location = this.params['location'];
			this.t("Search results for location " + location);
			$("#content-body").text('');
		});
		
		
		
		
		/**
		 * Search handler
		 */
		this.post('#/search', function(context) {
			
			var q = this.params['q'];
			var type = this.params['type'];
			
			// Type will be defined if searching from user/computer/location boxes
			
			if(type == undefined){
				
				// Define regular expressions for search query
				var regexs = [
					{type: "user", re: "^(user|u):(.*)$"}
					,{type: "computer", re: "^(computer|c|workstation|w|pc):(.*)$"}
					,{type: "location", re: "^(location|ou|o|l):(.*)$"}
				];
				
				// Default URI to redirect to (if not regex matches)
				var uri = "#/search/" + q;
				
				// Test if query matches any of our defined regexs
				for(i = 0; i < regexs.length; i++){
					var re = new RegExp(regexs[i].re);
					var m = re.exec(q);
					if(m != null){
						// Match - build URI
						uri = "#/" + regexs[i].type + "/" + m[2] + "/1"
						// Redirect to page with query
						this.redirect(uri);
						return;
					}
				}
				
				// Otherwise just send param to general search page
				this.redirect(uri);
				return;
				
			} else {
				
				// User/Computer/Location was searched for
				this.redirect("#/" + type + "/" + q + "/1");
				return;
				
			}
			
			
			/*$.post(api + "search.php", function(data) {
				console.log(data);
				//app.refresh()
			});*/
			
		});




		this.before(function(callback){
			// Always make sure info bar is removed
			$.removebar();
		});




		/**
		 * All helpers
		 */
		this.helpers({

			/**
			 * Change title in <title> and page heading
			 */
			t: function(title, cls){
				$('#title').text(title);
				this.title(title);
			}

		});



	});
	
	
	
	
	$(function() {

		// Include auth data in all requests
		$.ajaxSetup({ data: { }
					, cache: false
					, dataType: "json"
					, dataFilter: function(data, type){
						if(type == "json"){
							//res = eval("(" + data + ")");
							var res = $.parseJSON(data);
							if(res.status == "err"){
								showError("An error occurred: " + res.text);
								return false;
							} else if(res.status == "warn"){
								showWarning("Note: " + res.text);
								return false;
							}
							if(res.process){
								var fn = res.process;
								return gridfuncs[fn](res);
							}
							return res;
						}
						return data;
					}
		});

		// Links that use forms for various methods (i.e. post, delete).
		$("a[data-method]").live("click", function(e) {
			e.preventDefault();
			var link = $(this);
			if (link.attr("data-confirm") && !confirm(link.attr("data-confirm"))){
				return fasle;
			}
			var method = link.attr("data-method") || "get";
			var form = $("<form>", { style: "display: none", method: method, action: link.attr("href") });
			app.$element().append(form);
			form.submit();			
		});
		
		
		// Handle search queries from out-of-app search box, and send to main app
		$('#searchform').bind("submit", function(e){
			e.preventDefault();
			app.runRoute("post", "#/search", {q: $('#searchquery').val()});
		});
		
		// Key binding to focus search box (/ key)
		$(document).bind("keydown", function(e){
			if(e.which == 191 && e.target.id != "searchquery"){
				e.preventDefault();
				$("#searchquery").val("").focus();
			}
		});

		// Run app
		app.run("#/dashboard");
		
	});


})(jQuery);