var gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    watch = require('gulp-watch'),
    rename = require('gulp-rename'),
    uglify= require('gulp-uglify');


gulp.task('js', function(){
    return gulp.src( 'src/scripts/chartist-plugin-fill-donut.js' )
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('./'))
        .pipe( gulp.dest('dist/') );
});

gulp.task('js-min', function(){
    return gulp.src( 'src/scripts/chartist-plugin-fill-donut.js' )
        .pipe(sourcemaps.init())
        .pipe( uglify() ).on('error', function (error) {
            console.error('' + error);
            this.emit('end');
        })
        .pipe(rename({
            extname: ".min.js"
        }))
        .pipe(sourcemaps.write('./'))
        .pipe( gulp.dest('dist/') )
        .pipe( gulp.dest('examples/js/') );
});

//run default gulp tasks
gulp.task('default', ['js', 'js-min']);

gulp.task('watch', ['js', 'js-min'], function(){
    gulp.watch('./src/scripts/**', ['js', 'js-min']);
});