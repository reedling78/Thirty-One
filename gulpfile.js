/*jslint nomen: true */
/*globals window, document, define, $, _, console, Modernizr, alert*/


var gulp = require('gulp'),
    nodemon = require('gulp-nodemon');

    


gulp.task('start', function () {
    'use strict';

    nodemon({
        script: 'app.js',
        ext: 'js html',
        env: {
            'NODE_ENV': 'development'
        }
    });

});
