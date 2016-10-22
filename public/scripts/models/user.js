/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert*/

define([], function () {
    'use strict';

    var User = function (args) {
        this.defaults = {
            screenname: 'unknown'
        };

        $.extend(this.data, this.defaults);
        $.extend(this.data, args);

        console.log('new user');
    };

    return User;

});