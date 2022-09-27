// @ts-check

const { docs } = require('./docs/docs');
const { docs: api } = require('./docs/api/docs');
const { docs: examples } = require('./docs/examples/docs');

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docsSidebar: [
    {
      type: 'doc',
      id: 'index',
      label: 'Quickstart'
    },
    ...docs.map(({ slug, title }) => ({
      /** @type {'doc'} */
      type: 'doc',
      id: slug.replace('/docs/', ''),
      label: title
    }))
  ],
  apiSidebar: [
    ...api.map(({ slug, title }) => ({
      /** @type {'doc'} */
      type: 'doc',
      id: slug.replace('/', ''),
      label: title
    })),
    {
      type: 'doc',
      id: 'api/index'
    }
  ],
  examplesSidebar: [
    {
      type: 'doc',
      id: 'examples/index',
      label: 'Table of Contents'
    },
    ...examples.map(({ slug, title }) => ({
      /** @type {'doc'} */
      type: 'doc',
      id: slug.replace('/', ''),
      label: title
    }))
  ]
};

module.exports = sidebars;
