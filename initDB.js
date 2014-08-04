/*************************
 *	Module dependencies  *
 ************************/
var mongoose = require('mongoose'),				//Require the mongoose interface for MongoDB
	models = require('./models'),				//Require the schema
	users_json = require('./users.json');		//Require the initialization JSON file


/*************************
 *	Initialize Mongo DB  *
 *************************/
var local_database_name = 'user_DB';
var local_database_uri =  'mongodb://localhost/' + local_database_name;
var database_uri = process.env.MONGOLAB_URI || local_database_uri;
mongoose.connect(database_uri);
console.log(database_uri);


/*********************************
 *	Remove existing DB entries,  *
 *	then rewrite DB from JSON.   *
 *********************************/
models.User
	.find()
	.remove()
	.exec(AfterRemoveCallback);

function AfterRemoveCallback(err) {
	if (err){
		console.log("Failed to clear DB." +err);
	} else {
		var to_save_count = users_json.length;
		for (var i=0; i<users_json.length; i++){
			var json = users_json[i];
			var usr = new models.User(json);

			usr.save(function(err, usr) {
				if(err) console.log("Error saving new DB entries.  " + err);
				to_save_count--;
				console.log(to_save_count + " left to save");
				if (to_save_count <= 0) {
					console.log("Done rewriting DB");
					mongoose.connection.close();
				}
			});
		}
}}