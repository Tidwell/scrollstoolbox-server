var env = require('./env.js');
var express = require('express');
var routes = require('./routes');
var socket = require('./socket');

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

//RESTful Routes
app.get('/collection/update', routes.saveCollection);
// app.get('/api/post/:post_id', api.post);
// app.post('/api/posts', api.postAdd);
// app.put('/api/post/:post_id', api.postEdit);
// app.delete('/api/post/:post_id', api.postDelete);

app.get('/*', routes.index);

io.sockets.on('connection', function(s) {
	socket(s, io)
});

server.listen(9000, function() {
	console.log("Express server listening on port 9000");
});

process.on('uncaughtException', function(err) {
	var fs = require('fs');
	fs.appendFile('error.log', err, function(err) {
		console.log('error writting error log');
	});
})