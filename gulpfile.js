import gulp from 'gulp';
import del from 'del';
import sass from 'gulp-dart-sass';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import browserSync from 'browser-sync';
import imagemin from 'gulp-imagemin';
import changed from 'gulp-changed';
import pngquant from 'imagemin-pngquant';
import mozjpeg from 'imagemin-mozjpeg';
import pleeease from 'gulp-pleeease';
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import webpackConfig from './webpack.config.js';

// 入出力するフォルダを指定
const srcBase = 'src';
const distBase = 'dist';

// 入力するフォルダを指定
const srcPath = {
  scss: `${srcBase}/scss/**/*.scss`,
  html: `${srcBase}/*.html`,
  js: `${srcBase}/js/*.js`,
  images: `${srcBase}/images/*`,
  video: `${srcBase}/video/*`,
};

// 出力するフォルダを指定
const distPath = {
  css: `${distBase}/css/`,
  html: `${distBase}/`,
  js: `${distBase}/js/`,
  images: `${distBase}/images/`,
  video: `${distBase}/video/`,
};

const clean = () => {
  return del([`${distBase}/**`], {
    force: true,
  });
};

// sassタスクを実行
const cssSass = () => {
  return (
    gulp
      .src(srcPath.scss, {
        sourcemaps: true,
      })
      //エラーが出ても処理を止めない
      .pipe(plumber({ errorHandler: notify.onError('Error:<%= error.message %>') }))
      .pipe(sass({ outputStyle: 'compressed' })) //指定できるキー expanded compressed
      .pipe(
        pleeease({
          autoprefixer: {
            // ベンダープレフィックスの自動付与
            browsers: [
              // 対象ブラウザの指定
              'last 2 versions',
              'ie >= 11',
              'Android >= 4',
            ],
          },
          mqpacker: true, // メディアクエリをまとめる
          minifier: true, // cssの圧縮をする
        })
      )
      .pipe(gulp.dest(distPath.css, { sourcemaps: './' }))
      .pipe(
        notify({
          message: 'Sassをコンパイルしました',
          onLast: true,
        })
      )
  );
};

// htmlタスクを実行
const html = () => {
  return gulp.src(srcPath.html).pipe(gulp.dest(distPath.html));
};

// videoタスクを実行
const video = () => {
  return gulp.src(srcPath.video).pipe(gulp.dest(distPath.video));
};

// jsタスクを実行
const js = () => {
  return (
    gulp
      .src(srcPath.js)
      //エラーが出ても処理を止めない
      .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
      .pipe(webpackStream(webpackConfig, webpack))
      .pipe(gulp.dest(distPath.js))
      .pipe(
        notify({
          message: 'JSをコンパイルしました',
          onLast: true,
        })
      )
  );
};

// 画像圧縮
const minifyImage = () => {
  return (
    gulp
      // 圧縮前の画像を入れるフォルダを指定
      .src(srcPath.images)
      // 圧縮率などを設定
      .pipe(changed(distPath.images))
      .pipe(
        imagemin([
          mozjpeg({ quality: 80 }),
          pngquant({
            quality: [0.65, 0.8],
            speed: 1,
          }),
        ])
      )
      // 圧縮後の画像を出力するフォルダを指定
      .pipe(gulp.dest(distPath.images))
  );
};

// リロードするサーバーの階層
const browserSyncOption = {
  server: distBase,
};

// ローカルサーバー立ち上げ
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
};

// リロード
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
};

// watchタスクを実行
const watchFiles = () => {
  gulp.watch(srcPath.scss, gulp.series(cssSass, browserSyncReload));
  gulp.watch(srcPath.html, gulp.series(html, browserSyncReload));
  gulp.watch(srcPath.js, gulp.series(js, browserSyncReload));
  gulp.watch(srcPath.video, gulp.series(video, browserSyncReload));
  gulp.watch(srcPath.images, gulp.series(minifyImage, browserSyncReload));
};

export default gulp.series(clean, gulp.parallel(html, cssSass, js, video, minifyImage), gulp.parallel(watchFiles, browserSyncFunc));
