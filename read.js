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
});