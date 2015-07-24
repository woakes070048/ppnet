'use strict';

var gulp = require('gulp'),
    gutil = require('gulp-util'),
    del = require('del'),
    vinylPaths = require('vinyl-paths'),
    compass = require('gulp-compass'),
    connect = require('gulp-connect'),
    uglify = require('gulp-uglify'),
    wiredep = require('wiredep').stream,
    minifyCss = require('gulp-minify-css'),
    imagemin = require('gulp-imagemin'),
    concat = require('gulp-concat'),
    cache = require('gulp-cache'),
    flatten = require('gulp-flatten'),
    minifyHtml = require('gulp-minify-html'),
    useref = require('gulp-useref'),
    gulpif = require('gulp-if'),
    revReplace = require('gulp-rev-replace'),
    insert = require('gulp-insert'),
    rev = require('gulp-rev');
    
gulp.task('init', ['bower', 'clean'], function() {
  return true;
});

gulp.task('scripts', function() {
  gulp.src('./app/scripts/*.js')

  .pipe(connect.reload());
});

gulp.task('html', function() {
  gulp.src('./app/views/*')
    .pipe(connect.reload());
});

gulp.task('compass', function () {
  gutil.log(gutil.colors.green('Compile Compass/Sass'));

  gulp.src('app/styles/*.scss')
  .pipe(compass({
    config_file: './config.rb',
    css: 'app/styles',
    sass: 'app/styles'
  }))
  .pipe(gulp.dest('app/styles'))
  .pipe(connect.reload());

  gutil.log('stuff happened', 'Really it did', gutil.colors.cyan('123'));
});

gulp.task('webserver', function() {
  connect.server({
    root: 'app',
    port: 8000,
    livereload: true
  });
});

gulp.task('clean', ['clearcache'], function() {
  return gulp.src('./www', { read: false })
    .pipe(vinylPaths(del));
});

gulp.task('clearcache', function (done) {
  return cache.clearAll(done);
});

gulp.task('bower', function() {
  gulp.src('./app/index.html')
    .pipe(wiredep({}))
    .pipe(gulp.dest('./app'));

  return gulp.src('./app/styles/main.scss')
    .pipe(wiredep({}))
    .pipe(gulp.dest('./app/styles/'));
});

// Images
gulp.task('images', ['init'], function() {
  gulp.src(['./app/bower_components/mapbox.js/images/**'])
    .pipe(gulp.dest('./www/styles/images'));
  gulp.src(['./app/bower_components/chap-links-timeline/img/**'])
    .pipe(gulp.dest('./www/styles/img'));

  return gulp.src('./app/images/**/*')
    .pipe(cache(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true
    })))
    .pipe(gulp.dest('./www/images'));
});

// Images
gulp.task('copy', ['init'], function() {
  gulp.src(['./app/redirect.html', 'app/config.xml', 'app/config.json'])
    .pipe(gulp.dest('./www'));

  gulp.src('./app/views/**')
    .pipe(gulp.dest('./www/views/'));

  gulp.src(['./app/vendor/**/*'])
    .pipe(gulp.dest('./www/vendor/'));

  var assets = useref.assets();

  gulp.src('./app/index.html')
    .pipe(assets)
    .pipe(gulpif('*.js', insert.transform(function(contents) {
      // UGLY HACK to repair concatenated mapbox
      return contents.replace('//# sourceMappingURL', '; //# sourceMappingURL');
    })))
    .pipe(rev())
    .pipe(gulpif('*.css', minifyCss()))
    .pipe(gulpif('*.html', minifyHtml({ empty: true })))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(revReplace()) 
    .pipe(gulp.dest('./www/'));

  return gulp.src(['./app/bower_components/**/fonts/**'])
    .pipe(flatten())
    .pipe(gulp.dest('./www/fonts/'));
});

gulp.task('watch', function() {
  gutil.log(gutil.colors.green('Watcher started for ./app/styles/**/*.scss'));
  gulp.watch('./app/styles/**/*.scss', ['compass']);
  gulp.watch('./app/scripts/**/*.js', ['scripts']);
  gulp.watch('./app/views/*', ['html']);
});

gulp.task('build', ['init', 'copy', 'images']);
gulp.task('default', ['clean', 'bower', 'compass', 'webserver', 'watch']);
