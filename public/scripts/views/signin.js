/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert*/

define([], function () {
    'use strict';

    $('form').on('submit', function(e){
    	console.log('started');

    	app.socket.emit('signin', { 
    		screenname: $('[name="screenname"]').val()
    	});

    	e.preventDefault();
    });

});