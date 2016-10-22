/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert, app, location, localStorage*/

define(['socket.io', 'bootstrap'], function (io) {
    'use strict';

    window.app = {
        socket: io.connect('http://localhost:3000'),
        $content: $('[data-context="content"]')
    };

    app.socket.on('started', function (data) {
        if (localStorage.getItem('ThirtyOne')) {
            require(['views/gameslist']);
        } else {
            require(['views/signin']);
        }
    });

});