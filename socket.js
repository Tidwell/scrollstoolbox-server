/*
 * Serve content over a socket
 */
var loggedInUsers = [];

//require models
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/scrollstoolbox');
var User = require('./models/user').UserModel;

var io; //the socketio main obj
var communicator; //to talk between the socket and http

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
	checkDone();
}

function gotPrices(data) {
	prices = data;
	checkDone();

	//setup to refresh prices in 6 hrs
	setTimeout(function() {
		DataSource.getPrices(gotPrices);
	}, 3600000*6);
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
		if (!prices[card.id]) {
			prices[card.id] = {
				low: null,
				high: null
			};
		}
		allCards[card.name] = {
			price: prices[card.id],
			card: card
		}
	});
	allData = allCards;
	if (cb) {
		cb();
	}
}

module.exports = {
		socket: function(socket, io) {
		socket.on('user:register', register);
		socket.on('user:login', login);
		socket.on('user:logout', logout);
		socket.on('disconnect', logout);
		socket.on('user:update', updateUser);
		socket.on('user:forgot-password', forgotPassword);
		socket.on('users:count', sendCountUser);

		socket.on('settings:update', updateSettings);

		socket.on('cards:all', allCards);

		socket.on('card:save', saveCard);

		socket.on('game:get', sendGame);

		socket.on('collection:list', userCollection);

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

		function updateSettings(userData) {
			if (!socket.user) {
				socket.emit('settings:error', {});
				return;
			}
			if (userData.settings) {
				socket.user.settings = userData.settings;
			}
			socket.user.save(function(err, user) {
				delete user.password;
				socket.emit('settings:updated', user);
			});
		}

		function updateUser(userData) {
			if (!socket.user) {
				authError();
				return;
			}
			socket.user.inGameName = userData.inGameName;
			socket.user.email = userData.email;
			if (userData.newPassword) {
				socket.user.password = userData.newPassword;
			}
			socket.user.save(function(err, user) {
				delete user.password;
				socket.emit('user:updated', user);
			});
		}

		function saveCard(card) {
			if (!socket.user) {
				authError();
				return;
			}

			if (card.owned) {
				card.owned = Number(card.owned);
			}
			if (card.buyOverride) {
				card.buyOverride = Number(card.buyOverride);
			}
			if (card.sellOverride) {
				card.sellOverride = Number(card.sellOverride);
			}
			if (card.alwaysBuy) {
				card.alwaysBuy = Number(card.alwaysBuy);
			}
			if (card.alwaysSell) {
				card.alwaysSell = Number(card.alwaysSell);
			}
			if (card.tier1) {
				card.tier1 = Number(card.tier1);
			}
			if (card.tier2) {
				card.tier2 = Number(card.tier2);
			}

			if (card.tier3) {
				card.tier3 = Number(card.tier3);
			}

			var found = false;
			socket.user.owned.forEach(function(ownedCard, i) {
				if (ownedCard.name === card.name) {
					for (var prop in card) {
						if (card.hasOwnProperty(prop) && typeof card[prop] !== 'undefined') {
							socket.user.owned[i][prop] = card[prop];
						}
					}
					found = true;
				}
			});
			if (!found) {
				socket.user.owned.push(card);
			}

			socket.user.save(function(err, user) {
				socket.emit('card:saved', {
					card: card.name
				});
			});
		}

		function logout() {
			if (!socket.user || !socket.user.username) {
				authError();
				return;
			}
			var toRemove;
			loggedInUsers.forEach(function(user, index) {
				if (!socket.user) { return; }
				if (user.username === socket.user.username) {
					toRemove = index;
				}
			});

			if (typeof toRemove !== 'undefined') {
				loggedInUsers.splice(toRemove, 1);
				delete socket.user;
				process.nextTick(function() {
					socket.emit('user:logged-out', {});
					sendCount();
				});
			}
		}

		function sendCount() {
			io.sockets.emit('users:count', {
				count: loggedInUsers.length
			});
		}

		function sendCountUser() {
			socket.emit('users:count', {
				count: loggedInUsers.length
			});
		}

		function login(data) {
			//otherwise make sure they passed params
			if (!data || typeof data.username !== 'string' || typeof data.password !== 'string') {
				authError();
				return;
			}

			//check the db
			User.find({
				username: data.username,
				password: data.password
			}, function(err, userData) {
				if (!userData.length) {
					authError();
					return;
				}
				//see if they are already logged in and remove from array if they are
				var toRemove = [];
				loggedInUsers.forEach(function(user,index){
					if (user.username === data.username) {
						toRemove.push(index);
					}
				});
				toRemove.forEach(function(removeIndex){
					loggedInUsers.splice(removeIndex,1);
				});
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

		function forgotPassword(email) {
			//reset password to random
			//send email with new password
		}

		function allCards() {
			socket.emit('cards:all', allData);
		}

		function authError() {
			socket.emit('user:error', {
				error: 'Error authenticating, please login.'
			});
		}

		function sendGame() {
			fs = require('fs')
			fs.readFile('./game', 'utf8', function(err, data) {
				if (err) {
					return console.log(err);
				}
				var events = [];
				data = data.split("\n");

				data.forEach(function(line){
					if (line) {
						events.push(JSON.parse(line));
					}
				});

				socket.emit('game:data', events);
			});
		}

		function userCollection(data) {
			User.find({
				username: data.username
			}, function(err, userData) {
				if (!userData.length) {
					socket.emit('collection:list', {error: true, msg: 'No user found'});
					return;
				}
				socket.emit('collection:list', {collection: userData[0].owned});
			});
		}
	},
	setCommunicator: function(e) {
		communicator = e;
		communicator.on('collection:synced', sendSyncedMessage);
	},
	setIo: function(i) {
		io = i;
	}
};

function sendSyncedMessage(data) {
	User.find({
		inGameName: data.inGameName
	}, function(err, userData) {
		if (!userData.length) {
			return;
		}
		io.sockets.clients().forEach(function (socket) {
			if (socket.user && socket.user.inGameName === data.inGameName) {
				//update the data
				socket.user = userData[0];
				//tell the user
				delete userData[0].password;
				socket.emit('user:login',userData[0]);
				socket.emit('collection:synced',{msg: data.msg});
			}
		});
	});
}