/*************************************
 *	Declaration of the User schema.  *
 *	User schema has fields for: 	 *
 *	  First name, last name,		 *
 *	  username,						 *
 *	  and access token.				 *
 *************************************/
var Mongoose = require('mongoose');

var UserSchema = new Mongoose.Schema({
	"name": {
		"first_name": String,
		"last_name": String
	},
	"username": String,
	"access_token": String
});

exports.User = Mongoose.model("User", UserSchema);