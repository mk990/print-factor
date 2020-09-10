'use strict';
import {
    src,
    dest,
    watch,
    parallel,
    series
} from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const fastMode = true;
let final = false;

const $ = gulpLoadPlugins();

const dirs = {
    src: 'src',
    dist: 'dist'
};

const sassPaths = {
    src: `${dirs.src}/scss/*.scss`,
    fullSrc: `${dirs.src}/scss/**/*.scss`,
    dist: `${dirs.dist}/css/`
};

const jsPaths = {
    src: `${dirs.src}/js/**/*.js`,
    dist: `${dirs.dist}/js/`
};

const fontPaths = {
    src: `${dirs.src}/fonts/**/*`,
    dist: `${dirs.dist}/fonts/`
};

const assetsPaths = {
    src: `${dirs.src}/assets/**/*`,
    dist: `${dirs.dist}/`
};

const htmlPaths = {
    src: `${dirs.src}/templates/**/*.html`,
    dist: `${dirs.dist}/`
};

// css and sass files
function style() {
    return src([
            sassPaths.src,
        ])
        .pipe($.plumber())
        .pipe($.if(!fastMode, $.sourcemaps.init()))
        .pipe($.sass())
        .pipe($.concat(`style.css`))
        .pipe($.if(!fastMode || final, $.replace('/*!', '/*')))
        .pipe($.if(!fastMode || final, $.cleanCss()))
        .pipe($.if(!fastMode || final, $.autoprefixer('last 4 version')))
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe($.if(!fastMode, $.sourcemaps.write(`.`)))
        .pipe(dest(sassPaths.dist))
}

// js files
function script() {
    let condition = file => file.path.replace(__dirname, '').substr(1).startsWith(dirs.src);
    return src([
            './node_modules/vue/dist/vue.min.js',
            jsPaths.src
        ])
        .pipe($.plumber())
        .pipe($.if(!fastMode, $.sourcemaps.init()))
        .pipe($.if(condition, $.babel()))
        .pipe($.concat(`script.js`))
        .pipe($.if(!fastMode || final, $.uglify()))
        .pipe($.rename({
            suffix: '.min'
        }))
        .pipe($.if(!fastMode, $.sourcemaps.write(`.`)))
        .pipe(dest(jsPaths.dist))
}


// html files
function template() {
    return src(htmlPaths.src)
        .pipe($.if(final, $.htmlmin({
            collapseWhitespace: true,
            removeComments: true
        })))
        .pipe(dest(htmlPaths.dist))
}


// indent fonts
function font() {
    return src([
            './node_modules/font-awesome/fonts/*.woff2',
            fontPaths.src
        ])
        .pipe(dest(fontPaths.dist))
}


// indent assets
function assets() {
    return src([assetsPaths.src])
        .pipe(dest(assetsPaths.dist))
}


// clean project
function clean() {
    return del([dirs.dist]);
}


// browser-sync configs
function bs() {
    browserSync.init(null, {
        open: true,
        server: {
            baseDir: dirs.dist
        }
    });
}

// task for start build and watch project
function start(cb) {
    // build();
    // bs();
    watch([assetsPaths.src]).on('change', function(path, stats) {
        assets();
        console.log(`File ${path} was changed`);
        browserSync.reload();
    });
    watch([fontPaths.src]).on('change', function(path, stats) {
        font();
        console.log(`File ${path} was changed`);
        browserSync.reload();
    });
    watch([sassPaths.fullSrc]).on('change', function(path, stats) {
        style();
        console.log(`File ${path} was changed`);
        browserSync.reload();
    });
    watch([jsPaths.src]).on('change', function(path, stats) {
        script();
        console.log(`File ${path} was changed`);
        browserSync.reload();
    });
    watch([htmlPaths.src]).on('change', function(path, stats) {
        template();
        console.log(`File ${path} was changed`);
        browserSync.reload();
    });
    cb();
}

// final build  => npm start final
function finalProject(cb) {
    final = true;
    cb()
}

exports.clean = clean;
exports.font = font;
exports.assets = assets;
exports.script = script;
exports.style = style;
exports.template = template;

exports.finalProject = series(finalProject, clean, font, assets, script, style, template);
exports.build = parallel(font, assets, script, style, template);
exports.default = parallel(font, assets, script, style, template, bs, start);