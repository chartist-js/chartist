#!/usr/bin/env node

const fsp = require('fs-promise');
const interpolate = require('interpolate');
const pkg = require('../../package.json');
let content = interpolate(pkg.config.banner, {
  pkg,
  year: new Date().getFullYear()
});

fsp.readFile(process.argv[2])
  .then((data) => fsp.writeFile(process.argv[3], content + data));
