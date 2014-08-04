var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var models = require('../models.js');
var Firebase = require('firebase');


exports.auth = function(req, res){
	//variable declarations
	var code = req.query.code;			//URL param access code 
	var client_secret = "QldJXYQSfEc6tWj06SBY8kelC";		//static secret (client = ooma)
	var client_id = "990d3457-d066-46aa-af88-de6897912d85";	//static ID 
	var data = "code="+code+"&client_id="+client_id+"&client_secret="+client_secret+"&grant_type=authorization_code";		//data portion of the URL

	//xml request for auth token
	xmlhttp = new XMLHttpRequest();
	xmlhttp.open("POST", "https://api.home.nest.com/oauth2/access_token?code="+code+"&client_id="+client_id+"&client_secret="+client_secret+"&grant_type=authorization_code", false);
	xmlhttp.send();

	//handle response
	var temp_token = JSON.parse(xmlhttp.responseText);	//parse response text to JSON
	var token = new models.Token({						//create Token object using parsed JSON
		"access_token": temp_token.access_token,
		"expires_in": temp_token.expires_in
	});
	token.save(onSave);

	//after save function
	function onSave(err){
		if(err){console.log(err); res.send(500);}	//error handle
		else {
			apiListen(token);
			res.render("authenticate", token);			//render page with json obj.
	}};
}

// function apiListen(token) {
// 	var ref = new Firebase('wss://developer-api.nest.com');
// 	ref.auth(token.access_token);
// 	ref.on("value", changeResponse)
// }

function apiListen(token) {
	var thermostats = new Firebase("https://developer-api.nest.com/devices/thermostats/");
	thermostats.auth(token.access_token);
	thermostats.on('child_added', function(snapshot) {
		var thermostat = snapshot.val();
		alert(thermostat.device_id+' is '+thermostat.name);
		console.log("Thermostat Added. "+thermostat.device_id + " is " +thermostat.name);
	});
}
function changeResponse(snapshot) {
	snapshot.forEach(changeResponse(Snapshot));
	console.log(snapshot.val());
	console.log("Value changed. " + String(snapshot.toString()));
	console.log(snapshot);
}