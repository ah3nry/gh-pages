var fs = require('fs');
var path = require('path');

var gulp = require('gulp');

// Load all gulp plugins automatically
// and attach them to the `plugins` object
var plugins = require('gulp-load-plugins')();

// Temporary solution until gulp 4
// https://github.com/gulpjs/gulp/issues/355
var runSequence = require('run-sequence');

var pkg = require('./package.json');
var dirs = pkg['h5bp-configs'].directories;

var minifyCss = require('gulp-minify-css');

var minify = require('gulp-minify');

var replace = require('gulp-replace');
var clean = require('gulp-clean');
// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '_v' + pkg.version + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath).mode
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

// Clean Output Directory
gulp.task('clean', function (cb) {
    return gulp.src(['dist/*', '!dist/{.git,.git/**,README.md}'])
     .pipe(clean());
     });


gulp.task('copy', [
    'copy:index.html',
    'copy:jquery',
    'copy:main.css',
    'copy:misc',
    'copy:main.js',
    'copy:normalize',
    'copy:terminal.css'
]);

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
        .pipe(replace('main.js', 'main-min.js'))
        .pipe(replace('../node_modules/jquery/dist/jquery.min.js', 'js/vendor/jquery-1.12.0.min.js'))
        .pipe(replace('../node_modules/jquery.terminal/js/jquery.terminal-0.9.3.min.js', 'js/vendor/jquery.terminal-0.9.3.min.js'))
        .pipe(replace('../node_modules/jquery.terminal/js/jquery.mousewheel-min.js', 'js/vendor/jquery.mousewheel-min.js'))
        .pipe(replace('../node_modules/normalize.css/normalize.css', 'css/normalize.css'))
        .pipe(replace('../node_modules/jquery.terminal/css/jquery.terminal.css', 'css/jquery.terminal.css'))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
               .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
               .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:main.css', function () {

    return gulp.src(dirs.src + '/css/main.css')
               .pipe(plugins.autoprefixer({
                   browsers: ['last 2 versions', 'ie >= 8', '> 1%'],
                   cascade: false
               }))
                .pipe(minifyCss({compatibility: 'ie8'}))
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        dirs.src + '/**/*',

        // Exclude the following files
        // (other tasks will handle the copying of these files)
        '!' + dirs.src + '/css/main.css',
        '!' + dirs.src + '/index.html',
        '!' + dirs.src + '/js/main.js'


    ], {

        // Include hidden files by default
        dot: false

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:normalize', function () {
    return gulp.src('node_modules/normalize.css/normalize.css')
        .pipe(minifyCss({compatibility: 'ie8'}))
               .pipe(gulp.dest(dirs.dist + '/css'));
});

gulp.task('copy:main.js', function () {
    return gulp.src(dirs.src + '/js/main.js')
        .pipe(minify({
            exclude: ['tasks'],
            ignoreFiles: ['.combo.js', '-min.js']
        }))
        .pipe(gulp.dest(dirs.dist + '/js'));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/*.js',
        dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
      .pipe(plugins.jshint())
      .pipe(plugins.jshint.reporter('jshint-stylish'))
      .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('copy:terminal.css', function () {
    return gulp.src('node_modules/jquery.terminal//css/jquery.terminal.css')
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(gulp.dest(dirs.dist + '/css'));
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------

gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
    done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean'],
        'copy',
    done);
});

gulp.task('default', ['build']);
