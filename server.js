var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var path = require('path');
var routes = require('./routes/routes')


// Requiring Note and Article models
var db = require("./models");

// Set mongoose to leverage built-in ES6 Promise
mongoose.Promise = Promise;

var PORT = process.env.PORT || 3000;

var app = express();

// Use morgan and body parser middleware
app.use(logger("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://heroku_v9g6ht26:4gkmro3l9dmlkhf7ibaopljesg@ds045001.mlab.com:45001/heroku_v9g6ht26";

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main", partialsDir: path.join(__dirname, "/views/layouts/partials")}));
app.set('view engine', 'handlebars');

mongoose.connect(MONGODB_URI);
var conn = mongoose.connection;

conn.on('error', function(error) {
    console.log('Mongoose error: ', error);
});

conn.once('open', function() {
    console.log('Mongoose connection successful.');
});

app.use('/', routes)

// Start the server
app.listen(PORT, function() {
    console.log(`App running on port ${PORT}!`);
})