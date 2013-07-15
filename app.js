var env = require('./env.js');
var express = require('express');
var routes = require('./routes');
var socket = require('./socket');
var events = require('events');
var util = require('util');

var app = module.exports = express();
var server = require('http').createServer(app);

// Hook Socket.io into Express
var io = require('socket.io').listen(server);

app.set('view engine', 'html');

app.configure(function() {
	if (env === 'local') {
		app.use(express.static('./../scrollstoolbox/app'));
	} else if (env === 'stage') {
		app.use(express.static('./../scrollstoolbox/dist'));
	} else {
		app.use(express.static('./../scrollstoolbox'));
	}
	app.use(app.router);
});

function rawBody(req, res, next) {
  req.setEncoding('utf8');
  req.rawBody = '';
  req.on('data', function(chunk) {
    req.rawBody += chunk;
  });
  req.on('end', function(){
    next();
  });
}

//RESTful Routes
app.get('/collection/update', routes.saveCollection);
app.post('/collection/update', rawBody, routes.saveCollection);

app.get('/*', routes.index);
app.get('/*/*', routes.index);

io.sockets.on('connection', function(s) {
	socket.socket(s, io)
});

server.listen(9000, function() {
	console.log("Express server listening on port 9000");
});

//create teh communicator so http can talk to sockets
var Communicator = function(){ events.EventEmitter.call(this); };
util.inherits(Communicator, events.EventEmitter);
var communicator = new Communicator();
//pass it
socket.setIo(io);
socket.setCommunicator(communicator);
routes.setCommunicator(communicator);


// process.on('uncaughtException', function(err) {
// 	var fs = require('fs');
// 	console.log(err);
// 	fs.appendFile('error.log', err, function(err) {
// 		console.log('error writting error log');
// 	});
// })