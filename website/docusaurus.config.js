// @ts-check

const branch = require('git-branch');
const codeTheme = require('./src/prism-theme');

const currentBranch = process.env.BRANCH || branch.sync();
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Chartist',
  tagline: 'A simple responsive charting library built with SVG',
  url: 'https://chartist.dev',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  trailingSlash: false,
  organizationName: 'chartist-js',
  projectName: 'chartist',
  noIndex: currentBranch !== 'main',

  customFields: {
    branch: currentBranch
  },

  scripts: [
    {
      src: 'https://cloud.umami.is/script.js',
      'data-website-id': '0e18d303-db3e-4159-ae76-55ac372b932b',
      defer: true,
    },
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/chartist-js/chartist/edit/main/website/'
        },
        theme: {
          customCss: [
            require.resolve('./src/css/custom.css'),
            require.resolve('./src/css/recoloring.css')
          ]
        }
      }
    ]
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    {
      navbar: {
        title: 'Chartist',
        logo: {
          alt: 'Chartist logo',
          src: 'img/logo.svg'
        },
        items: [
          {
            type: 'doc',
            docId: 'api/basics',
            position: 'left',
            label: 'API'
          },
          {
            type: 'doc',
            docId: 'examples/index',
            position: 'left',
            label: 'Examples'
          },
          {
            type: 'doc',
            docId: 'plugins',
            position: 'left',
            label: 'Plugins'
          },
          {
            href: 'https://stackoverflow.com/questions/tagged/chartist.js',
            label: 'Stack Overflow',
            position: 'right'
          },
          {
            href: 'https://gitter.im/gionkunz/chartist-js',
            label: 'Gitter',
            position: 'right'
          },
          {
            href: 'https://github.com/chartist-js/chartist/discussions',
            label: 'Discussions',
            position: 'right'
          },
          {
            href: 'https://github.com/chartist-js/chartist',
            label: 'GitHub',
            position: 'right'
          }
        ]
      },
      colorMode: {
        defaultMode: 'light',
        disableSwitch: true,
        respectPrefersColorScheme: false
      },
      prism: {
        theme: codeTheme
      }
      // algolia: {
      //   appId: '',
      //   apiKey: '',
      //   indexName: ''
      // }
    },

  plugins: [
    [
      'docusaurus-plugin-typedoc',

      // Plugin / TypeDoc options
      {
        entryPoints: ['../src/index.ts'],
        tsconfig: '../tsconfig.json',
        excludeExternals: true,
        readme: 'none',
        sort: ['source-order']
      }
    ]
  ]
};

module.exports = config;
