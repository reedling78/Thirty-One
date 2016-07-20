/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert*/

define(['socket.io', 'bootstrap'], function (io) {
    'use strict';

    window.app = {
    	socket: io.connect('http://localhost:3000')
    };

	app.socket.on('started', function (data) {
		console.log(data);
		switch (location.pathname) {
	    case '/':
	        require(['views/signin']);
	        break;
	    default:
	    	require(['views/signin']);
	    	break;
		}
	});

});