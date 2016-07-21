/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert, app, location, localStorage*/

define(['socket.io', 'bootstrap'], function (io) {
    'use strict';

    window.app = {
        socket: io.connect('http://localhost:3000')
    };

    app.socket.on('started', function (data) {
        if (localStorage.getItem('ThirtyOne')) {
            console.log('has user');
        } else {
            console.log('no user');
        }
    });

});