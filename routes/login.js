/****************************************************************
 *	Renders/Controls login pages								*
 *		Login::view renders the login screen.					*
 *		Login::validate looks up the User in the DB.			*
 *		If lookup returns no entries, then redirect::login.		*
 *		If there is no User::access_token, redirect::auth/nest	*
 *		Otherwise continue render::index						*
 ****************************************************************/
var models = require('../models.js');
var Firebase = require('firebase');

exports.view=function(req, res){
	res.render("login");
}

exports.validate=function(req, res){
	var username= req.query.username;
	console.log("Username: "+username);
	models.User
		.find({"username": username})
		.exec(afterUserQuery);

	function afterUserQuery(err, users){
		if(err) console.log("Error looking up user in DB. "+err);
		var user = users[0];
		if (user == null) res.redirect("/login");		//If user doesn't exist, redirect to login
		else if (user["access_token"] == null) {		//If user doesn't have an acces token, get one
			res.cookie('username', username);
			res.redirect('/auth/nest');
		} else {										// If everything's fine, add username and auth_token to cookie and redirect::index
			res.cookie('username', username);
			res.cookie('nest_token', user["access_token"]);
			res.redirect("/");
		}
	}
}