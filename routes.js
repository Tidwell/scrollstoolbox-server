/*
 * GET home page.
 */
var env = require('./env.js');
var path = require('path');
var url = require('url');

var User = require('./models/user').UserModel;
var communicator;

exports.index = function(req, res) {
	if (env === 'local') {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/app/index.html'));
	} else if (env ==='stage') {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/dist/index.html'));
	} else {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/index.html'));
	}
};

var cardData;
var DataSource = require('./data-sources');
//get the scrolls data from http://a.scrollsguide.com/scrolls
DataSource.getScrolls(gotScrolls);

function gotScrolls(data) {
	var dataMap = {};
	data.forEach(function(card,i){
		dataMap[card.id] = card;
	})
	cardData = dataMap;
}

exports.saveCollection = function(req,res) {
	var urlParts = url.parse(req.url, true);
 	if (!urlParts.query) { res.end({error: "true", msg: "No data sent."}); return; };
	var collection = JSON.parse(urlParts.query.data);
	var inGameName = urlParts.query.inGameName;

	//get the user
	User.find({
		inGameName: inGameName
	}, function(err, userData) {
		res.contentType('application/json');
		if (!userData.length) {
			res.send({error: "true", msg: 'No user found with your Name, have you set your In-Game Name on scrollstoolbox.com/account'});
			return;
		}
		userData = userData[0];

		var cards = {};
		var found;
		for (var mojangCardId in collection) {
			var cardName = cardData[collection[mojangCardId].typeId].name;
			found = false;

			for (var prop in cards) {
				if (cards[prop].name === cardName) {
					cards[prop].owned++;
					found = true;
				}
			};
			if (!found) {
				cards[cardName] = {
					name: cardName,
					owned: 1,
					buyOverride: 0,
					sellOverride: 0,
					alwaysBuy: 0,
					alwaysSell: 0
				}
			}
		}

		var updated = [];
		var totalCards = 0;
		//update the existing data
		userData.owned.forEach(function(ownedCard,i){
			if (cards[ownedCard.name]) {
				userData.owned[i].owned = cards[ownedCard.name].owned;
				totalCards += cards[ownedCard.name].owned;
				updated.push(ownedCard.name);
			} else {
				updated.push(ownedCard.name);
				userData.owned[i].owned = 0;
			}
		});
		//update new stuff
		for (var cardName in cards) {
			if (updated.indexOf(cardName) === -1) {
				userData.owned.push({
					name: cardName,
					owned: cards[cardName].owned
				});
				totalCards += cards[cardName].owned
			}
		}


		userData.save(function() {
			var data = {okay: "true", msg: 'Data for your '+totalCards+' scrolls has been synced with scrollstoolbox.com'};
			res.send(data);
			data.inGameNae = inGameName;
			communicator.emit('collection:synced', data);
		})

	});
};

exports.partials = function(req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
};

exports.setCommunicator = function(e) {
	communicator = e;
}
