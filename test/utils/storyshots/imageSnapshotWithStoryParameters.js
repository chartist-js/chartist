import { devices } from 'puppeteer';
import { imageSnapshot } from '@storybook/addon-storyshots-puppeteer';

import { Viewport } from './viewport';

const captureRoot = true;
const offset = '40';

/**
 * Handle story parameters.
 * @param page - Page instance.
 * @param options - Story options.
 * @returns Promise.
 */
async function beforeScreenshotHook(page, options) {
  const {
    storyshots: { currentViewport } = {},
    parameters: { storyshots: { beforeScreenshot } = {} }
  } = options.context;

  if (currentViewport && currentViewport !== Viewport.Default) {
    await page.emulate(devices[currentViewport]);
  }

  if (beforeScreenshot) {
    await beforeScreenshot(page, options);
  }

  if (captureRoot) {
    await page.$eval(
      '#root',
      (root, offset) => {
        root.style.padding = `${offset}px`;
      },
      offset
    );

    return page.$('#root');
  }

  return null;
}

function getCaptureRootScreenshotOptions() {
  return {
    encoding: 'base64', // encoding: 'base64' is a property required by puppeteer
    fullPage: !captureRoot
  };
}

/**
 * Create snapshot tests function with story parameters.
 * @param config - Snapshots config.
 * @returns Snapshot tests function.
 */
export function imageSnapshotWithStoryParameters(config) {
  const { beforeScreenshot, getScreenshotOptions } = config;
  const configWithBeforeScreenshot = {
    ...config,
    getScreenshotOptions: getScreenshotOptions
      ? options => ({
          ...getCaptureRootScreenshotOptions(options),
          ...getScreenshotOptions(options)
        })
      : getCaptureRootScreenshotOptions,
    beforeScreenshot: beforeScreenshot
      ? async (page, options) => {
          const captureTarget = await beforeScreenshotHook(page, options);

          await beforeScreenshot(page, options);

          return captureTarget;
        }
      : beforeScreenshotHook
  };
  const test = imageSnapshot(configWithBeforeScreenshot);
  const testFn = async options => {
    const { context } = options;
    const { storyshots: { viewports = [] } = {} } = context.parameters;

    if (!viewports.length) {
      await test(options);
      return;
    }

    for (const viewport of viewports) {
      const currentViewport =
        viewport === Viewport.Default ? undefined : viewport;
      const originalId = context.id;

      context.storyshots = {
        currentViewport
      };

      await test(options);

      context.id = originalId;
    }

    expect.assertions(viewports.length);
  };

  testFn.timeout = test.timeout;
  testFn.beforeAll = test.beforeAll;
  testFn.afterAll = test.afterAll;

  return testFn;
}
