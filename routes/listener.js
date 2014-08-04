//Please excuse my spellin.

/********************************************************
 *	Controlers for device listeners						*
 *		Listener::fire sets up fire-scenario listeners	*
 *		Listener::test sets up test-scenario listeners	*
 ********************************************************/

exports.fire=function(req, res){
	var fireListener = new DeviceListener("c.DO9loqF7AV9t1Pm4WgiNFtKGIDsPhnQrlXU3MjMO9PVhK85by0Pj1WNpPHvueUMiu23JbpPAEs6Z1iwXodlgG6CBIV5klpS4K898ln9hmTbevWutbt0eOCGteuAHUxPHZ5Jc6NLU2Zno6hST", "7IuDdtUG8YxzNn1JHtEW82stXYWgXYx0", "smoke_co_alarms")
	fireListener.onFire();
	res.redirect('/');
}

exports.test=function(req, res){
	var listener = new DeviceListener("c.DO9loqF7AV9t1Pm4WgiNFtKGIDsPhnQrlXU3MjMO9PVhK85by0Pj1WNpPHvueUMiu23JbpPAEs6Z1iwXodlgG6CBIV5klpS4K898ln9hmTbevWutbt0eOCGteuAHUxPHZ5Jc6NLU2Zno6hST", "yJfKse_UO_S8XJ3MQz3AQGstXYWgXYx0", "thermostats");
	listener.test();
	res.redirect('/');
}

exports.callForwarding=function(req, res){
	var listener = new DeviceListener("c.DO9loqF7AV9t1Pm4WgiNFtKGIDsPhnQrlXU3MjMO9PVhK85by0Pj1WNpPHvueUMiu23JbpPAEs6Z1iwXodlgG6CBIV5klpS4K898ln9hmTbevWutbt0eOCGteuAHUxPHZ5Jc6NLU2Zno6hST", "BiIlek5WGd7N48bVuCdoFCehp508sfE4UHC3ojwE4ps6qw9aratTGw", "structures");
	listener.forwarding();
	res.redirect('/');
}

exports.checkin=function(req, res){
	var listener = new DeviceListener("c.DO9loqF7AV9t1Pm4WgiNFtKGIDsPhnQrlXU3MjMO9PVhK85by0Pj1WNpPHvueUMiu23JbpPAEs6Z1iwXodlgG6CBIV5klpS4K898ln9hmTbevWutbt0eOCGteuAHUxPHZ5Jc6NLU2Zno6hST", "BiIlek5WGd7N48bVuCdoFCehp508sfE4UHC3ojwE4ps6qw9aratTGw", "structures");
	listener.monitor(new Date()+60000, new Date() + 60000);
	res.redirect('/');
}
//modules
var Firebase = require('firebase');
var CronJob = require('cron').CronJob;
var Time =require('time');

/************************************************************************
 *  Device Listener Declaration											*
 *		DeviceListener::onFire sets up device listeners for smoke		*
 *		alarms. If a smoke alarm state==emergency || warning, sends	 	*
 *		a text message alert to the home owner.							*
 *																		*
 *		DeviceListener::test sets up device listeners that listen for	*
 *		any status changes to the account and add it to log.			*
 *																		*
 *		DeviceListener::forwarding monitors home/away status and turns	*
 *		call forwarding on/off correspondingly.							*
 *		DeviceListener::
 ************************************************************************/

 // Constructor for the DeviceListener object
function DeviceListener (auth_token, device_id, device_type){
	this.token =auth_token;
	this.device_id =device_id;
	this.device_type =device_type;
	// When developing, will probably want to create a this.DataRef here.
	// Then you can use 1 dataRef monitor for all user's monitoring needs.
	// Also will make the error checks obsolete, but will also require .child("child's name").on("child_added", . . .);
}


// OnFire listens for a fire warning or emergency from a device.
DeviceListener.prototype.onFire = function() {
	if (this.device_type != "smoke_co_alarms") {	// Check that onFire is being called on a smoke detector.
		console.log("onFire can only be called on a device listener that has been initialized for a smoke_co_alarm.");
		return;
	}

	var url ='wss://developer-api.nest.com/devices/'+this.device_type+"/"+this.device_id;	
	var dataRef =new Firebase(url);
	dataRef.auth(this.token, function (error) {		// Authenticates the firebase connection.
		if (error) console.log("Firebase Authentication Error: " +error);
	});

	var alarmState;
	console.log('Setting up Device Listeners for fire.')
	dataRef.on('child_changed', function (snapshot) {
		checkFire(snapshot.val(), alarmState);		// Check if the change is due to fire
		alarmState = snapshot.val();				// Don't register duplicate statuses.
	});
}


// Test function that listens for any changes to user's account.
DeviceListener.prototype.test = function() {
	var url = 'wss://developer-api.nest.com/';
	var dataRef =new Firebase(url);
	dataRef.auth(this.token, function (error, result) {
		if (error) console.log("Firebase Authentication Error: " + error);
		else {
			console.log("Firebase authentication success");
			dataRef.on("child_changed", function(snapshot){
				var device_data = snapshot.val();
				console.log(JSON.stringify(device_data));
				console.log("Device Changed");
			});
		}
	});
}


// Monitors home's away status and turns on/off call forwarding.
DeviceListener.prototype.forwarding = function() {
	if (this.device_type != "structures") {		// Error check that the method is being called on the correct device.
		console.log('onAway: Invalid device type. May only be called on a structure.');
		return;
	}

	var url = 'wss://developer-api.nest.com/structures/'+this.device_id+'/away';
	var dataRef = new Firebase(url);
	dataRef.auth(this.token, function (error, result){
		if (error) console.log("Firebase authentication error: " + error);
		else {
			console.log("Firebase authentication success.");
			dataRef.on("value", callForwardingLogic);
		}
	});
}


// Monitor checks home's away status to determine presence during a given time.
DeviceListener.prototype.monitor = function(start, stop) {
	if (this.device_type != "structures") {		//error check to make sure device is a structure, not thermostat or smoke_co_alarm
		console.log('Monitor: Invalid device type. May only be called on a structure.');
		return;
	}

	var device = this;							//establishes context
	var url = 'wss://developer-api.nest.com/structures/'+device.device_id+'/away';
	var dataRef = new Firebase(url);
	device.dataRef = dataRef;
	var start_monitor = new CronJob('00 00 12 * * 1-5', function () {this.start_monitor();}, null, true, "America/Los_Angeles", device);		// Cron-job schedules monitoring.
	var stop_monitor  = new CronJob('00 05 12 * * 1-5', function () {this.stop_monitor(); }, null, true, "America/Los_Angeles", device);		// Cron-job schedules monitoring.
}

// Called by Cron-job to begin monitoring home for away status.
DeviceListener.prototype.start_monitor = function() {
	console.log("Listening Job started.");
	var device = this;
		device.home_yet = false;

	this.dataRef.auth(this.token, function (error, result) {
		if (error) console.log("Firebase authentication error: " + error);
		else {
			console.log("Firebase authentication success.");
			device.dataRef.on("value", function(snapshot){
				var data = snapshot.val();
				if (data == "home") {
					device.home_yet = true;
				}
				console.log("Data:: "+data);
			});
		}
	});
}

// Called by Cron-job to stop monitoring home and report findings.
DeviceListener.prototype.stop_monitor = function() {
	console.log("Stopping job started");
	this.dataRef.off();
	if (this.home_yet) sendTextNotification("Timmy came home today.", "+17576347081");
	else sendTextNotification("Timmy hasn't come home from school yet.", "+17576347081");
}


/********************************
 *	Helper Function Declaration	*
 ********************************/


// Checks data to see if it is a fire, and if so raises an alarm.
function checkFire(data, alarmState) {			// Setup listeners on the firebase connection for any child that changes
	switch (data) {								// Responds to a 'warning' or 'emergency' status, and calls sendTextNotification to send the appropriate message.
	case 'warning':
		if (alarmState !== 'warning') { 		// Only alert the first change
			console.log('WARNING: Smoke has been detected. Press 1 to call home, Press 2 to call 911 from your home phone.');
			sendTextNotification('WARNING: Smoke has been detected. Press 1 to call home, Press 2 to call 911 from your home phone number.', '+17576347081');
		}
		break;
	case 'emergency':
		if (alarmState !== 'emergency') { 		// Only alert the first change
			console.log('EMERGENCY: Smoke has been detected. Press 1 to call home, Press 2 to call 911 from your home phone number.');
			sendTextNotification('EMERGENCY: Smoke has been detected. Press 1 to call home, Press 2 to call 911 from your home phone number.', '+17576347081');
		}
		break;
	}
}


// Takes snapshot and determines call-forwarding mode.
function callForwardingLogic(snapshot) {
	console.log("FORWARDING SNAPSHOT VALUE: "+JSON.stringify(snapshot.val()));
	var device_data = snapshot.val(),
		device_name = snapshot.name();
	if (device_name == "away"){
		if (device_data == "home") callForwarding(false);
		if (device_data == "away") callForwarding(true);
		if (device_data == "auto-away") callForwarding(true);
	}
}


// Stub of implimentation for turning call forwarding on/off.
function callForwarding(on) {
	if (on)  console.log("Turning call forwarding on");
	if (!on) console.log("Turning call forwarding off");
}


// SendTextNotification uses Twilio to send a given SMS message given phone number
function sendTextNotification(message, phone_num) {
	var accountSid = "AC35fd5b6818d52e3f97d95a1f6c437a08",
		authToken = "2020f777c02282f892f1df7acf307af8";
	var client = require('twilio')(accountSid, authToken);
	client.messages.create({
		body: message,
		to: phone_num,
		from: "+16505674422"
	}, function (error, message) {
		if (error) console.log("Error: "+JSON.stringify(error));
		else process.stdout.write(message.sid);
	});
}