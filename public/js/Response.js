var Firebase = require('firebase');
var ref = new Firebase('wss://developer-api.nest.com');
var access_token = document.getElementById("access_token").innerHTML;
ref.auth(access_token);
ref.on("value", changeResponse)

function changeResponse(snapshot) {
	var elem = document.getElementById("response_div");
	if (elem != null) {elem.innherHTML = snapshot.val();}
	console.log("Value changed. " + snapshot.val())
}