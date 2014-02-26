var http = require('http');
var env = require('./env.js');
var localCache = require('./models/localdata');

var stripProps = [
'description',
'kind',
'types',
'ap',
'ac',
'hp',
'flavor',
'targetarea',
'image',
'bundle',
'animationpreview',
'version',
'introduced',
'anim'
];

function getScrolls(cb) {
	// if (env === 'local') {
	// 	if (cb) { cb(parseData(localCache).data); }
	// 	return;
	// }
	http.get("http://a.scrollsguide.com/scrolls", function(res) {
		var data = '';
		res.on('data', function(chunk) {
			data += chunk;
		});
		//the whole response has been recieved
		var map = {};
		res.on('end', function() {
			data = parseData(data);
			if (cb) { cb(data.data); }
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
}

function parseData(data) {
	if (typeof data === 'string') {
		data = JSON.parse(data);
	}
	data.data.forEach(function(card,i){
		stripProps.forEach(function(prop){
			delete card[prop];
			data.data[i] = card;
		});
	});

	return data;
}

function getPrices(cb) {
	http.get("http://a.scrollsguide.com/prices", function(res) {
		var data = '';
		res.on('data', function(chunk) {
			data += chunk;
		});
		//the whole response has been recieved
		res.on('end', function() {
			if (typeof data === 'string') {
				data = JSON.parse(data)
			}
			parsePrices(data,cb);
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
}

function parsePrices(data,cb) {
	var all = {};
	data.data.forEach(function(item,i) {
		var obj = {
			low: Math.min(item.buy, item.sell),
			high: Math.max(item.buy, item.sell),
			//suggested: item.price.suggested
		};
		all[item.id] = obj;
	});
	if (cb) { cb(all); }
}

module.exports = {
	getScrolls: getScrolls,
	getPrices: getPrices
}