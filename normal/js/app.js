(function($) {
	
	
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
			context.partial(TPL + "dashboard.html");
		});
		
		
		
		
		/**
		 * Current active login sessions
		 */
		this.get("#/current/:filter", function(context){
			var filter = this.params['filter'];
			this.t("Current logins by: " + filter);
			$("#content-body").text('');
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
		this.get("#/user/:username", function(context){
			var username = this.params['username'];
			this.t("Search results for user " + username);
			$("#content-body").text('');
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
					,{type: "computer", re: "^(computer|c|workstation|w):(.*)$"}
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
						uri = "#/" + regexs[i].type + "/" + m[2];
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
				this.redirect("#/" + type + "/" + q);
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
							res = eval("(" + data + ")");
							if(res.status == "err"){
								showError("An error occurred: " + res.text);
								return false;
							} else if(res.status == "warn"){
								showWarning("Note: " + res.text);
								return false;
							}
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