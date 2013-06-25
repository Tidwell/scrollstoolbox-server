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
	data.data.forEach(function(card,i){
		stripProps.forEach(function(prop){
			delete card[prop];
			data.data[i] = card;
		});
	});

	return data;
}

function getPrices(cb) {
	var prices;
	http.get("http://scrollspc.com/api_all.php", function(res) {
		var data = '';
		res.on('data', function(chunk) {
			data += chunk;
		});
		//the whole response has been recieved
		res.on('end', function() {
			console.log(data,'done')
			if (typeof data === 'string') {
				data = JSON.parse(data)
			}
			var all = {};
			data.data.forEach(function(item,i) {
				var obj = {
					low: null,
					high: null
				};

				item.price = Number(item.price);
				item.priceMax = Number(item.price_max);

				if (item.priceMax) {
					obj.low = item.price;
					obj.high = item.priceMax;
				} else {
					obj.low = item.price;
					obj.high = item.price;
				}
				all[item.name] = obj;
			});
			prices = all;

			if (cb) { cb(prices); }
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});


}

module.exports = {
	getScrolls: getScrolls,
	getPrices: getPrices
}