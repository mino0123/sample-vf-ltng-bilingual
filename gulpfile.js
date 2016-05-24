const fs = require('fs');
const gulp = require('gulp');
const zip = require('gulp-zip');
const file = require('gulp-file');
const deploy = require('gulp-jsforce-deploy');
const metadata = require('salesforce-metadata-xml-builder');
const merge = require('merge-stream');
const rename = require('gulp-rename');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');


const API_VERSION = '35.0';
const SF_USERNAME = process.env.SF_USERNAME;
const SF_PASSWORD = process.env.SF_PASSWORD;


gulp.task('deploy', (cb) => {

  const jsStream = browserify({ entries: 'src/js/app.js', debug: true })
    .transform(babelify.configure({
      presets: ['react', 'es2015', 'stage-1'],
    }))
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    // .pipe(gulp.dest('tmp'))
    .pipe(zip('src/staticresources/BilingualSample.resource'))
    .pipe(
      file(
        'src/staticresources/BilingualSample.resource-meta.xml',
        metadata.StaticResource({cacheCOntrol: 'Public', contentType: 'application/zip' })
    ));

  const classStream = gulp.src('./src/apex/BilingualSample.cls')
    .pipe(rename({ dirname: 'src/classes' }))
    .pipe(
      file('src/classes/BilingualSample.cls-meta.xml',
        metadata.ApexClass({ apiVersion: API_VERSION, status: 'Active' })));

  const vfStream = gulp.src('./src/visualforce/BilingualSample.page')
    .pipe(rename({ dirname: 'src/pages' }))
    .pipe(file('src/pages/BilingualSample.page-meta.xml', metadata.ApexPage({
      apiVersion: API_VERSION,
      availableInTouch: true,
      label: 'BilingualSamplePage' })));

  const componentBody = fs.readFileSync('./src/lightning/BilingualSample.cmp', 'utf8')
    .replace('${timestamp}', Date.now());
  const auraMeta = metadata.AuraDefinitionBundle({
    apiVersion: '36.0'
  });
  const auraStream = gulp.src('./src/lightning/BilingualSampleController.js')
    .pipe(file('./src/lightning/BilingualSample.cmp', componentBody))
    .pipe(file('./src/lightning/BilingualSample.cmp-meta.xml', auraMeta))
    .pipe(rename({ dirname: 'src/aura/BilingualSample' }))

  const packagexml = metadata.Package({ version: API_VERSION, types: [
    { name: 'StaticResource', members: ['*'] },
    { name: 'ApexClass', members: ['*'] },
    { name: 'ApexPage', members: ['*'] },
    { name: 'AuraDefinitionBundle', members: ['*'] },
  ]});

  merge(jsStream, classStream, vfStream, auraStream)
    .pipe(file('src/package.xml', packagexml))
    // .pipe(gulp.dest('./tmp'))
    .pipe(zip('pkg.zip'))
    .pipe(deploy({
      username: SF_USERNAME,
      password: SF_PASSWORD,
      deploy: { rollbackOnError: true }
    }));

});
