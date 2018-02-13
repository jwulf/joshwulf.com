var gulp = require('gulp'),
    //awspublish = require('gulp-awspublish'),
    //fs = require('fs'),
   // awsCredentials = JSON.parse(fs.readFileSync('./aws.json')),
    publisher,
    browserSync = require('browser-sync').create(),
    connect = require('gulp-connect'),
    imageop = require('gulp-image-optimization'),
    header = require('gulp-header'),
    cssnano = require('gulp-cssnano'),
    preprocess = require('gulp-preprocess');

const outputDir = './docs' // for GitHub pages

    // Development
    gulp.task('browser-sync', function () {
       browserSync.init({
        server: {
            baseDir: outputDir,
        },
        port: 8082
    });
    });

gulp.task('dev', ['build','browser-sync'], function(){
      gulp.watch(['./src/**/*'], ['build', browserSync.reload]);
});

gulp.task('copy', function(){
       gulp.src('src/**/*')
        .pipe(gulp.dest(outputDir));
});

gulp.task('html', ['copy'], function() {
    gulp.src(['src/**/*.html', '!src/{fragments,fragments/**}'])
        .pipe(preprocess({context: { NODE_ENV: 'production', DEBUG: true}}))
        .pipe(header("<!-- This file is generated — do not edit by hand! -->\n"))
        .pipe(gulp.dest(outputDir));
});

// No index by robots, for the test staging site
gulp.task('html-test', function() {
    gulp.src(['src/**/*.html', '!src/{fragments,fragments/**}'])
        .pipe(preprocess({context: { NODE_ENV: 'production', DEBUG: true}}))
        .pipe(header('<!-- This file is generated — do not edit by hand! -->\n<meta name="robots" content="noindex">\n'))
        .pipe(gulp.dest(outputDir));
});

gulp.task('css', function() {
    return gulp.src('./src/assets/css/main.css')
        .pipe(cssnano())
        .pipe(gulp.dest('./www/assets/css/'));
});

gulp.task('images', function(cb) {
    gulp.src(['src/**/*.png','src/**/*.jpg','src/**/*.gif','src/**/*.jpeg']).pipe(imageop({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })).pipe(gulp.dest(outputDir)).on('end', cb).on('error', cb);
});

gulp.task('build', ['html','css', 'images']);
gulp.task('build-test', ['html-test', 'css', 'images']);

// Publish to test.atmayoga.com.au
gulp.task('publish-test', ['build-test'], function () {
    var aws = {
        "params": { "Bucket": "test.atmayoga.com.au" },
        "accessKeyId": awsCredentials.key,
        "secretAccessKey": awsCredentials.secret,
        "region": "us-east-1",
    };
    publisher = awspublish.create(aws);
    var headers = { 'Cache-Control': 'no-store, no-cache', 'Expires': 0 };

    return gulp.src(['www/**/*'])
        .pipe(awspublish.gzip({}))
        .pipe(publisher.publish(headers))
        .pipe(publisher.cache())
        .pipe(awspublish.reporter());
});

// Publish the production site to www.atmayoga.com.au
gulp.task('publish-prod', ['build'], function () {
    var aws = {
        "params": { "Bucket": "atmayoga.website" },
        "accessKeyId": awsCredentials.key,
        "secretAccessKey": awsCredentials.secret,
        "region": "us-east-1",
    };
    publisher = awspublish.create(aws);
    var headers = { 'Cache-Control': 'no-store, no-cache', 'Expires': 0 };

    return gulp.src(['www/**/*'])
        .pipe(awspublish.gzip({}))
        .pipe(publisher.publish(headers))
        .pipe(publisher.cache())
        .pipe(awspublish.reporter());
});


