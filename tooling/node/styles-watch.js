#!/usr/bin/env node

const chokidar = require('chokidar');
const compileSass = require('./compile-sass');
const debounce = require('debounce');

const compileStyles = debounce(() => {
  console.log(`Compiling styles.`);
  compileSass('src/styles/chartist.scss', 'dist');
}, 200);

chokidar.watch('./src/**/*.scss')
  .on('all', (event, path) => {
    console.log(`Changes on path ${path}`);
    compileStyles();
  });
