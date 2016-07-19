/*jslint nomen: true */
/*globals window, document, define, $, _, console, Modernizr, alert*/


var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    child_process = require('child_process');


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


gulp.task('redis-start', function() {
  child_process.exec('redis-server', function(err, stdout, stderr) {
    console.log(stdout);
    if (err !== null) {
      console.log('exec error: ' + err);
    }
  });
});
