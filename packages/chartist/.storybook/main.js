const path = require('path');

module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
    '@storybook/addon-viewport'
  ],
  webpackFinal: async config => {
    config.module.rules[0].use = [require.resolve('swc-loader')];
    config.module.rules.push({
      test: /\.scss$/,
      use: ['style-loader', 'css-loader', 'postcss-loader', 'sass-loader'].map(
        require.resolve
      )
    });

    config.resolve.alias['chartist-dev/styles$'] = path.resolve(
      __dirname,
      '..',
      'src',
      'styles',
      'index.scss'
    );
    config.resolve.alias['chartist-dev$'] = path.resolve(
      __dirname,
      '..',
      'src'
    );

    return config;
  }
};
