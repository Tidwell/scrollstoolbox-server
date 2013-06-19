var express = require('express');
var app = express();

app.use(express.static('./../scrollstoolbox'));

app.listen(9000);
