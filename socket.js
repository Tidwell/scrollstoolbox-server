/*
 * Serve content over a socket
 */
var loggedInUsers = [];

//require models
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/scrollstoolbox');

var User = require('./models/user').UserModel;

module.exports = function(socket, io) {
	socket.on('user:register', register);
	socket.on('user:login', login);
	socket.on('user:logout', logout);
	socket.on('disconnect', logout);
	socket.on('user:update', updateUser);
	socket.on('user:forgot-password', forgotPassword);
	socket.on('users:count',sendCountUser);

	function register(userData) {
		//make sure they sent a username & password
		if (!userData.username || !userData.password) {
			socket.emit('user:error', {
				error: 'No username or password'
			});
			return;
		}
		//see if it is in use
		User.find({
			username: userData.username
		}, function(err, data) {
			if (data.length) {
				socket.emit('user:error', {
					error: 'Username in use'
				});
				return;
			}
			//see if it is too short
			if (userData.username.length < 4) {
				socket.emit('user:error', {
					error: 'Username too short'
				});
				return;
			}
			//register
			var u = new User({
				username: userData.username,
				password: userData.password,
				authed: true,
				inGameName: ''
			});
			u.save(function(err, user) {
				if (err) {
					socket.emit('user:error', {
						error: 'Error during registration'
					});
					return;
				}
				sendLogin(user);
			});
		});
	}

	function updateUser(userData) {
		if (!socket.user) { authError(); return; }
		socket.user.inGameName = userData.inGameName;
		socket.user.email = userData.email;
		if (userData.newPassword) {
			socket.user.password = userData.newPassword;
		}
		socket.user.save(function(err,user){
			delete user.password;
			socket.emit('user:updated', user);
		});
	}

	function logout() {
		if (!socket.user) { authError(); return; }
		loggedInUsers.forEach(function(user,index){
			if (user.username === socket.user.username) {
				loggedInUsers.splice(index,1);
				socket.emit('user:logged-out', {});
				sendCount();
			}
		});
	}

	function sendCount() {
		io.sockets.emit('users:count', {count: loggedInUsers.length});
	}
	function sendCountUser() {
		socket.emit('users:count', {count: loggedInUsers.length});
	}

	function login(data) {
		//otherwise make sure they passed params
		if (!data || typeof data.username !== 'string' || typeof data.password !== 'string' ) {
			authError();
			return;
		}
		//check the db
		User.find({ username: data.username, password: data.password }, function(err,userData){
			if (!userData.length) {
				authError();
				return;
			}
			sendLogin(userData[0]);
		});
	}

	function sendLogin(data) {
		loggedInUsers.push(data);
		socket.user = data;
		delete data.password;
		socket.emit('user:login', data);
		sendCount();
	}

	function forgotPassword(email){
		//reset password to random
		//send email with new password
	}

	function authError() {
			socket.emit('user:error', {
			error: 'Error authenticating, please login again.'
		});
	}

	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/array/shuffle [v1.0]
	function shuffle(o) { //v1.0
		for (var j, x, i = o.length; i; j = parseInt(Math.random() * i,10), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	}
};