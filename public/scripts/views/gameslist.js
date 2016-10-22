/*jslint nomen: true*/
/*globals window, document, define, $, _, console, alert, app*/

define(['hbs!templates/gameslist'], function (hbsGamesList) {
    'use strict';

    app.$content.html(hbsGamesList({}));

});