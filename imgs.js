var http = require('http');
var fs = require('fs')

var cards;


http.get("http://a.scrollsguide.com/scrolls", function(res) {
	var data = '';
	res.on('data', function(chunk) {
		data += chunk;
	});
	//the whole response has been recieved
	res.on('end', function() {
		cards = parseData(data).data;
		getImage();
	});
}).on('error', function(e) {
	console.log("Got error: " + e.message);
});


function parseData(data) {
	if (typeof data === 'string') {
		data = JSON.parse(data)
	}

	return data;
}

var i = 0;

function getImage() {
	if (i===cards.length) { console.log('done'); return; }
	var options = {
		host: 'a.scrollsguide.com',
		port: 80,
		path: '/image/screen?name='+cards[i].name.replace(/ /g, '+')
	}

	var request = http.get(options, function(res) {
		console.log('request to', '/image/screen?name='+cards[i].name)
		var imagedata = ''
		res.setEncoding('binary')

		res.on('data', function(chunk) {
			imagedata += chunk
		})

		res.on('end', function() {
			fs.writeFile('img/'+cards[i].name.toLowerCase().replace(/ /g,'')+'.png', imagedata, 'binary', function(err) {
				if (err) throw err
				console.log('File saved.')
				i++;
				getImage();
			})
		})

	});
}