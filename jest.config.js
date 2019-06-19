const path = require("path");

module.exports = {
  moduleDirectories: [
    "node_modules",

    /*
     * Allow Jest to resolve modules in tests/config without the full path
     *
     * e.g. import {myModule} from 'utils/my-module'
     */
    path.resolve(__dirname, "test")
  ],

  testMatch: ["<rootDir>/test/spec/**/spec-*.js"],

  setupFilesAfterEnv: ["<rootDir>/test/config/setup-after-env/index.js"],

  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname"
  ]
};
