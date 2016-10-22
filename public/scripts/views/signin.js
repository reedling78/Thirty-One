/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert, app*/

define(['hbs!templates/signin'], function (hbsSignin) {
    'use strict';

    app.$content.html(hbsSignin({}));

    $('form').on('submit', function (e) {
        console.log('started');

        app.socket.emit('signin', {
            screenname: $('[name="screenname"]').val()
        });

        e.preventDefault();
    });

});