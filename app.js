/*************************
 *	Module dependencies  *
 ************************/
var express = require('express'),							// Use express framework
	session = require('express-session'),					// Use express-session module to manage session information
	handlebars = require('express3-handlebars'),			// Use handlebards templating
	cookieParser = require('cookie-parser'),				// Use the cookie-parser module to parse cookies
	passport = require('passport'),							// Use passport module for authentication
	bodyParser = require('body-parser'),					// Use the body-parser module to parse
	NestStrategy = require('passport-nest').Strategy		// Use passport to manage authentications
	http = require('http'),									// Use http module to create server
	path = require('path'),									// Use path module to manage/set directories
	mongoose = require('mongoose');							// Use mongoose module to interface with mongoDB

var app = express();										// Initialize express instance "app"


/****************************
 *	Required Routing Files  *
 ****************************/
var authenticate = require('./routes/authenticate');
var index = require('./routes/index');
var login = require('./routes/login');
var listener = require('./routes/listener');


/*****************************
 *	Initizializing Passport  *
 *****************************/
passport.use(new NestStrategy({
	clientID: "fd1d6cca-4ee0-45db-b4db-8b2f0004829a",		// Use client Ooma2 (sam.gussman@ooma.com) clientID
	clientSecret: "M3p7xSFeQLurgzteJa7dVfObu"				// Use client Ooma2 (sam.gussman@ooma.com) clientSecret
}));

// No user data is available in OAuth, so return empty
passport.serializeUser(function(user, done) {
	done(null, user);
});

// No user data is available in OAuth, so return empty
passport.deserializeUser(function(user, done) {
	done(null, user);
});


/*************************
 *	Initialize Mongo DB  *
 *************************/
var local_database_name = 'user_DB';
var local_database_uri =  'mongodb://localhost/' + local_database_name;
var database_uri = process.env.MONGOLAB_URI || local_database_uri;
mongoose.connect(database_uri);


/************************
 *	Set-up Environment  *
 ************************/
app.set('port', process.env.PORT || 3000);				// Set port
app.use(bodyParser());									// Sets body parser
app.use(passport.initialize());							// Initialize passport
app.use(passport.session());

// Set-up Handlebars View Engine
app.engine('handlebars', handlebars());					// Set the template engine
app.set('view engine', 'handlebars');					// Set default template view engine

// Set Directories
app.set('views', path.join(__dirname, 'views'));								// Set view directory path
app.use(express.static(path.join(__dirname, 'public')));						// Sets the directory for static resources
app.use('/bower_components', express.static(__dirname + '/bower_components'));	// Sets bower components directory to /bower_components

// Setup Sessions & Cookies
app.use(session({secret: 'Sammy_whammy'}));				// CHANGE IN PRODUCTION
app.use(cookieParser('Sammy_whammy'));					// CHANGE IN PRODUCTION


/********************
 *	Declare Routes  *
 ********************/
app.get('/', index.view);
app.get('/login', login.view);
app.get('/login/validate', login.validate);
app.get('/listener/test', listener.test);
app.get('/listener/fire', listener.fire);
app.get('/listener/forward', listener.callForwarding);
app.get('/listener/monitor', listener.checkin);

// Listen for requests and redirect the user to the Nest OAuth URL with the correct parameters.
app.get('/auth/nest', passport.authenticate('nest'));

// Upon return from the Nest OAuth endpoint, grab the user's accessToken and set a cookie, then redirect to the root app.
app.get('/auth/nest/callback',
	passport.authenticate('nest',{}),
	function(req, res) {
		res.cookie('nest_token', req.user.accessToken);
		res.cookie('new_token', true);
		res.redirect('/');
	}
);

/***********************
 *	Set-up the server  *
 ***********************/
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listneing on port ' + app.get('port'));
});