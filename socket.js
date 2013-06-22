/*
 * Serve content over a socket
 */
var loggedInUsers = [];

//require models
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/scrollstoolbox');
var User = require('./models/user').UserModel;

//data
var allData;
var cardData;
var prices;

var DataSource = require('./data-sources');
//get the scrolls data from http://a.scrollsguide.com/scrolls
DataSource.getScrolls(gotScrolls);
//get the pricing data from scrollspc
DataSource.getPrices(gotPrices);
//get the pricing data from scrolls trading bulletin

function gotScrolls(data) {
	cardData = data;
	console.log('card data found',data);
	checkDone();
}

function gotPrices(data) {
	prices = data;
	//setup to refresh prices in an hr -- TODO
	console.log('price data found',prices);
	checkDone();
}

function checkDone(cb) {
	if (!cardData || !prices) {
		return;
	}
	updatePrices(cb);
}

function updatePrices(cb) {
	var allCards = {};
	cardData.forEach(function(card) {
		allCards[card.name] = {
			price: prices[card.name],
			card: card
		}
	});
	allData = allCards;
	if (cb) {
		cb();
	}
}

module.exports = function(socket, io) {
	socket.on('user:register', register);
	socket.on('user:login', login);
	socket.on('user:logout', logout);
	socket.on('disconnect', logout);
	socket.on('user:update', updateUser);
	socket.on('user:forgot-password', forgotPassword);
	socket.on('users:count',sendCountUser);

	socket.on('cards:all', allCards);

	socket.on('card:save', saveCard);

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

	function saveCard(card) {
		if (!socket.user) { authError(); return; }

		if (card.owned) {
			card.owned = Number(card.owned);
		}
		if (card.buyOverride) {
			card.buyOverride = Number(card.buyOverride);
		}
		if (card.sellOverride) {
			card.sellOverride = Number(card.sellOverride);
		}

		var found = false;
		socket.user.owned.forEach(function(ownedCard, i){
			if (ownedCard.name === card.name) {
				console.log('updating owned card', card)
				if (card.owned) {
					socket.user.owned[i].owned = card.owned;
				}
				if (card.buyOverride) {
					socket.user.owned[i].buyOverride = card.buyOverride;
				}
				if (card.sellOverride) {
					socket.user.owned[i].sellOverride = card.sellOverride;
				}
				found = true;
			}
		});
		if (!found) {
			socket.user.owned.push(card);
		}

		socket.user.save(function(err,user){
			socket.emit('card:saved', {card: card.name});
			delete user.password;
			socket.emit('user:updated',user)
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

	function allCards() {
		console.log('request recieved, sending', allData);
		socket.emit('all-cards', allData);
	}

	function authError() {
			socket.emit('user:error', {
			error: 'Error authenticating, please login again.'
		});
	}
};