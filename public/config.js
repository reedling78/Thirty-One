/*jslint nomen: true*/
/*globals window, document, define, $, _, localStorage, dataLayer, console, Modernizr, Fonts, alert*/

require.config({
    deps: ['main'],
    baseUrl: 'scripts',
    paths: {
        'jquery': '../bower_components/jquery/dist/jquery.min',
        'socket.io': '../bower_components/socket.io-client/socket.io',
        'bootstrap': '../bower_components/bootstrap/dist/js/bootstrap.min',
    },

    shim: {
        'bootstrap': {
            deps: ['jquery']
        }
    }

});