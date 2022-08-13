const path = require('path');

const isCompatMode = process.env.CHARTIST_COMPAT === 'true';

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

    config.resolve.alias['chartist-dev/styles$'] = isCompatMode
      ? 'chartist/dist/chartist.css'
      : path.resolve(__dirname, '..', 'src', 'styles', 'chartist.scss');
    config.resolve.alias['chartist-dev$'] = isCompatMode
      ? path.resolve(__dirname, '..', 'test', 'mock', 'compat.ts')
      : path.resolve(__dirname, '..', 'src');

    return config;
  }
};
