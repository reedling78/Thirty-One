/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert*/

define(['jquery', 'socket.io'], function ($, io) {
    'use strict';

    var socket = io.connect('http://localhost:3000');

	socket.on('news', function (data) {
		console.log(data);
		socket.emit('my other event', { my: 'data' });
	});

	$('body').css('background-color', 'green');

});