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
'image: 479,',
'bundle',
'animationpreview',
'version',
'introduced',
'anim'
];

function getScrolls(cb) {
	if (env === 'local') {
		if (cb) { cb(parseData(localCache).data); }
		return;
	}
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
		data = JSON.parse(data)
	}
	console.log(data.data.length);
	data.data.forEach(function(card,i){
		stripProps.forEach(function(prop){
			console.log('strip')
			delete card[prop];
			data.data[i] = card;
		});
	});

	return data;
}

function getPrices(cb) {
	var prices;
	var jsdom = require("jsdom");
	jsdom.env(
		"http://www.scrollspc.com", ["http://code.jquery.com/jquery.js"], function(errors, window) {
		var $ = window.$;
		(function() {
			var all = {};
			$('table tr').each(function() {
				//get each row
				var $cells = $(this).children('td');
				var name = $($cells[1]).find('a').html();
				//make sure there is a name and that the name field doesnt contain markup
				if (name) {
					var obj = {};
					//parse the prices into an obj with .low and .high
					if ($cells.length > 2) {
						var data = $($cells[2]).html().replace(' G', '');
						if (data.indexOf('-') !== -1) {
							data = data.split('-');
							obj.low = Number(data[0]);
							obj.high = Number(data[1]);
						} else {
							var price = Number(data);
							obj.low = price;
							obj.high = price;
						}
					}
					//make sure we parsed a price
					if (obj.low && obj.high) {
						all[name] = obj;
					}
				}
			});
			prices = all;
			if (cb) { cb(prices); }
		}());
	});
}

module.exports = {
	getScrolls: getScrolls,
	getPrices: getPrices
}