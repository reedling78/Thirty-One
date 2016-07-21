/*jslint nomen: true */
/*globals window, document, define, $, _, console, Modernizr, alert*/

var express = require('express'),
    exphbs  = require('express-handlebars'),
    redisapp = require('node-redis'),
    redis = redisapp.createClient(6379, '127.0.0.1'),
    app = require('express')(),
    server = require('http').Server(app),
    io = require('socket.io')(server);

app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs'
}));

app.use(express.static('public'));

app.set('view engine', '.hbs');

redis.on("error", function (err) {
    'use strict';
    console.log("Error " + err);
});

app.get('/', function (req, res) {
    'use strict';

    res.render('home', {});

    // redis.get('name', function (e, r) {
        
    // });

});

io.on('connection', function (socket) {
    'use strict';
    socket.emit('started');
    socket.on('signin', function (data) {
        console.log(data);
        redis.set('name', data.screenname);
    });
});

server.listen(3000);