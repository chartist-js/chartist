module.exports = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-actions',
  ],
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.scss$/,
      sideEffects: true,
      use: [
        'style-loader',
        'css-loader',
        'postcss-loader',
        'sass-loader'
      ].map(require.resolve)
    });

    return config;
  },
};
