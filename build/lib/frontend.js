import del from 'del';
import gutil from 'gulp-util';
import gulp from "gulp";
import mergeStream from "merge-stream";
import conf from "../conf";
import {multiDest} from "../multidest";
import path from 'path';
import util from './util';

export default {
  /**
   * Builds production ready frontend files (.js, .css, etc.).
   *
   * @param {string} destination Path to output directory
   * @param {string} tmp Path to temporary directory for temporary build artifacts
   */
  build(destination, tmp) {

    return cleanDirs([destination, tmp])
      .then(() => {
        return Promise.all([
          assets(tmp),
          icons(tmp),
          fonts(tmp),
          dependencyImages(tmp)
        ]);
      })
      .catch(console.error);

    /**
     * clean temp
     * create dir structure
     * fonts, icons, assets, dependency-images, index:prod
     * frontend-copies
     * localize
     * copy-locales-for-backend
     */
  }
};

const log = (msg) => {
  gutil.log(`[build:frontend] ${msg}`);
};

/**
 *
 * @param {Array} dirs
 * @returns {Promise}
 */
const cleanDirs = (dirs) => {
  log('Cleaning dirs...');
  return del(dirs)
};

/**
 * Copies the localized app.js files for each supported language in outputDir/<locale>/static
 * for each of the specified output dirs.
 * @param {string} destination - list of all arch directories
 * @return {stream}
 */
function localize(destination) {
  let streams = conf.translations.map((translation) => {
    let localizedOutputDirs = destination.map((outputDir) => {
      return path.join(outputDir, translation.key, 'static');
    });
    return gulp.src(path.join(conf.paths.i18nProd, translation.key, '*.js'))
      .pipe(multiDest(localizedOutputDirs));
  });

  return mergeStream.apply(null, streams);
}

/**
 * Copies the assets files to all dist directories per locale.
 * @param {string} destination
 * @return {Promise}
 */
const assets = (destination) => {
  log('Copying assets...');
  let localizedOutputDirs = localizedDestinations(destination);
  const stream = gulp.src(path.join(conf.paths.assets, '/**/*'), {base: conf.paths.app})
    .pipe(multiDest(localizedOutputDirs));
  return util.promisifyStream(stream);
};

/**
 * Copies the icons files to all dist directories per arch and locale.
 * @param {string} destination
 * @return {Promise}
 */
const icons = (destination) => {
  log('Copying icons...');
  let localizedOutputDirs = localizedDestinations(destination, 'static/');
  const stream = gulp.src(
      path.join(conf.paths.materialIcons, '/**/*.+(woff2|woff|eot|ttf)'),
      {base: conf.paths.materialIcons}
    )
    .pipe(multiDest(localizedOutputDirs));
  return util.promisifyStream(stream);
};

/**
 * Copies the font files to all dist directories per locale.
 * @param {string} destination
 * @return {promise}
 */
const fonts = (destination) => {
  log('Copying fonts...');
  let localizedOutputDirs = localizedDestinations(destination, 'static/');
  let roboto =
    gulp.src(path.join(conf.paths.robotoFonts, '/**/*.*'), {base: conf.paths.robotoFontsBase})
      .pipe(multiDest(localizedOutputDirs));

  let robotoMono = gulp.src(
    path.join(conf.paths.robotoMonoFonts, '/**/*.*'),
    {base: conf.paths.robotoMonoFontsBase})
    .pipe(multiDest(localizedOutputDirs));

  const stream = mergeStream.apply(null, [roboto, robotoMono]);
  return util.promisifyStream(stream);
};

/**
 * Copies the font files to all dist directories per locale.
 * @param {string} destination
 * @return {promise}
 */
const dependencyImages = (destination) => {
  let localizedOutputDirs = localizedDestinations(destination, 'static/img');
  const stream = gulp
    .src(path.join(conf.paths.jsoneditorImages, '*.png'), {base: conf.paths.jsoneditorImages})
    .pipe(multiDest(localizedOutputDirs));

  return util.promisifyStream(stream);
};

/**
 * Returns one subdirectory path for each supported locale inside all of the specified
 * outputDirs. Optionally, a subdirectory structure can be passed to append after each locale path.
 * @param {string} outputDir
 * @param {undefined|string} subDir - an optional sub directory inside each locale directory.
 * @return {!Array<string>} localized output directories
 */
const localizedDestinations = (outputDir, subDir) => {
  const keys = conf.translations.map((trans) => trans.key);
  return keys.reduce((memo, key) => {
    let destination = path.join(outputDir, key);
    destination = subDir ? path.join(destination, subDir) : destination;
    return memo.concat(destination);
  }, []);
};
