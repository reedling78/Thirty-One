/*jslint nomen: true*/
/*globals window, document, define, $, _, localStorage, dataLayer, console, Modernizr, Fonts, alert*/

require.config({
    deps: ['scripts/main'],
    paths: {
        'jquery': 'bower_components/jquery/dist/jquery.min',
        'socket.io': 'bower_components/socket.io-client/socket.io',
    }

    // shim: {
    //     'modernizr': {
    //         exports: 'Modernizr'
    //     },
    //     'foundation.reveal': {
    //         deps: ['foundation']
    //     },
    //     'foundation.tab': {
    //         deps: ['foundation']
    //     },
    //     'foundation.offcanvas': {
    //         deps: ['foundation']
    //     },
    //     'underscore': {
    //         exports: '_'
    //     }
    // },


});