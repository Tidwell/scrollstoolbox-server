/*
 * GET home page.
 */
var env = require('./env.js');
var path = require('path');
exports.index = function(req, res) {
	if (env === 'local') {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/app/index.html'));
	} else if (env ==='stage') {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/dist/index.html'));
	} else {
		res.sendfile(path.normalize(__dirname + '/../scrollstoolbox/index.html'));
	}
};

exports.partials = function(req, res) {
	var name = req.params.name;
	res.render('partials/' + name);
};
