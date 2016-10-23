module.exports = function(config) {
  config.set({
    basePath: './',
    frameworks: ['jasmine', 'jspm'],
    autoWatch: true,
    browsers: ['PhantomJS'],
    reporters: ['nyan'],
    files: [
      { pattern: 'src/**/*.+(js|html)', included: false },
      { pattern: 'tooling/**/*.js', included: false },
      { pattern: 'package.json', included: false },
      { pattern: 'jspm_packages/system-polyfills.js', included: false },
      'dist/chartist.min.css'
    ],
    jspm: {
      loadFiles: ['src/**/*.js'],
      stripExtension: false,
      config: 'jspm.config.js'
    },
    proxies: {
      '/jspm_packages/': '/base/jspm_packages/',
      '/src/': '/base/src/',
      '/tooling/': '/base/tooling/',
      '/package.json': '/base/package.json'
    }
  });
};
