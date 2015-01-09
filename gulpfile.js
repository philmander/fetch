var gulp = require('gulp');
var jshint = require('gulp-jshint');
var jasmine = require('gulp-jasmine');
var uglify = require('gulp-uglify');
var browserify = require('browserify');
var vinylStream = require('vinyl-source-stream');
var del = require('del');
var rename = require('gulp-rename');


gulp.task('clean', function () {
    return del('./dist/**/*.*');
});

//jshint
gulp.task('lint', function() {
    return gulp.src('fetch.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

//jasmine
gulp.task('test', [ 'lint' ], function () {
    return gulp.src('./spec/fetch-spec.js')
        .pipe(jasmine());
});

//package with browserify
gulp.task('package', [ 'test', 'clean' ], function() {
    return browserify({
        entries: './fetch-polyfill.js'
    })
    .bundle()
    .pipe(vinylStream('fetch.js'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('minify', [ 'package' ], function() {
    return gulp.src('./dist/fetch.js')
        .pipe(uglify())
        .pipe(rename('fetch.min.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['minify']);