// @ts-check

const branch = require('git-branch');
const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

const currentBranch = process.env.BRANCH || branch.sync();
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Chartist',
  tagline: 'A simple responsive charting library built with SVG',
  url: 'https://chartist.js.org',
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

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/chartist-js/chartist/edit/master/website/'
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css')
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
            href: 'https://slack.cube.dev/?ref=eco-chartist',
            label: 'Slack',
            position: 'right'
          },
          {
            href: 'https://stackoverflow.com/questions/tagged/chartist.js',
            label: 'Stack Overflow',
            position: 'right'
          },
          {
            href: 'https://github.com/chartist-js/chartist',
            label: 'GitHub',
            position: 'right'
          }
        ]
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme
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
