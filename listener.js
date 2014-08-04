/********************************************************
 *	Javascript file for setting up device listeners.	*
 *		It isn't actually incorporated into anything,	*
 *		it's just a stub/backup copy. Next step is to 	*
 *		incorporate it into a sererate routing file.	*
 ********************************************************/
var Firebase = require('firebase');

function DeviceListener (auth_token, device_id, device_type){
	this.token =auth_token;
	this.device_id =device_id;
	this.device_type =device_type;
}

DeviceListener.prototype.on = function(event_type) {
	// var url = 'wss://developer-api.nest.com/devices/' +this.device_type +"/" +this.device_id;		//This URL only returns a snapshot of the property changed, not the overal device structure
	var url = 'wss://developer-api.nest.com/';															//Returns a snapshot of the entire device, but i don't know how to determine which proprety was changed
	var dataRef =new Firebase(url);
	dataRef.auth(this.token, function (error, result) {
		if (error) console.log("Firebase Authentication Error: " + error);
		else {
			console.log("Firebase authentication success");
			dataRef.on(event_type, function(snapshot){
				var device_data = snapshot.val();
				console.log(JSON.stringify(device_data));
				console.log("Device Changed");
			});
		}
	});
}