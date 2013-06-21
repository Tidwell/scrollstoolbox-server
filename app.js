var env = require('env');
var express = require('express'),
    routes = require('./routes');
    //api = require('./routes/api');

var app = module.exports = express();

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.configure(function() {
    if (env === 'local') {
		app.use(express.static('./../scrollstoolbox/app'));
	} else {
		app.use(express.static('./../scrollstoolbox'));
	}
    app.use(app.router);
});

//RESTful Routes
// app.get('/api/posts', api.posts);
// app.get('/api/post/:post_id', api.post);
// app.post('/api/posts', api.postAdd);
// app.put('/api/post/:post_id', api.postEdit);
// app.delete('/api/post/:post_id', api.postDelete);

app.get('*', routes.index);

app.listen(9000, function() {
    console.log("Express server listening on port 9000");
});
