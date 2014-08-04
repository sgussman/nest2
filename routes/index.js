/****************************************************************************
 *	Renders home page.														*
 *		Checks if the auth token is new, and if so writes it to the DB.		*
 *		If no cookie::username, redirect::login, otherwise render::index	*
 ****************************************************************************/
var models = require('../models.js');

exports.view = function (req, res){
	console.log("Cookie: "+JSON.stringify(req.cookies));
	if (req.cookies.new_token) {		// If the auth token is new, lookup the User and update the auth_token field.
		console.log("New auth token");
		models.User.update({"username": req.cookies.username}, {"access_token": req.cookies.nest_token}, afterUpdate);
	} else {							// If there is not a username stored in the cookie redirect::login, otherwise render::index.
		console.log("No new auth token")
		console.log("username: "+req.cookies.username);
		if (req.cookies.username == null) res.redirect("/login");
		else res.render("index");
	}

	function afterUpdate(err){
		if(err) console.log("Error finding user to update. "+err);
		res.render("index");
	}
}