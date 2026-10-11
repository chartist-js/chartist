import baseInitStoryshots from '@storybook/addon-storyshots';

import { imageSnapshotWithStoryParameters } from './imageSnapshotWithStoryParameters';
import { startStorybook } from './storybook';

/**
 * Default page customizer.
 * @param page - Puppeteer's page instance.
 * @returns Task promise.
 */
export function defaultCustomizePage(page) {
  return page.setViewport({
    width: 1920,
    height: 1080
  });
}

/**
 * Prepare identifier for use in filename.
 * @param indentifierPart - Identifier string part.
 * @returns Sanitized identifier ready for use in filename.
 */
export function sanitizeSnapshotIdentifierPart(indentifierPart) {
  return indentifierPart.replace(/[\s/]|%20/g, '-').replace(/"|%22/g, '');
}

/**
 * Default match options creator.
 * @param storyOptions - Story info.
 * @param storyOptions.context - Story context.
 * @param storyOptions.context.kind - Story kind.
 * @param storyOptions.context.story - Story name.
 * @param storyOptions.context.storyshots - Storyshots metadata.
 * @returns Match options.
 */
export function defaultGetMatchOptions({
  context: { kind, story, storyshots }
}) {
  const currentViewport = storyshots?.currentViewport;
  const sanitizedKind = sanitizeSnapshotIdentifierPart(kind);
  const sanitizedStory = sanitizeSnapshotIdentifierPart(story);
  const sanitizedParams = currentViewport
    ? `__${sanitizeSnapshotIdentifierPart(currentViewport)}`
    : '';

  process.stdout.write(`📷  ${kind} ${story} ${currentViewport || ''}\n`);

  return {
    customSnapshotIdentifier: `${sanitizedKind}__${sanitizedStory}${sanitizedParams}`
  };
}

/**
 * Initialize and run storyshots.
 * @param config - Storyshots config.
 */
export function initStoryshots(config) {
  process.env.STORYBOOK_STORYSHOTS = JSON.stringify(true);

  const finalOptions = {
    getMatchOptions: defaultGetMatchOptions,
    customizePage: defaultCustomizePage,
    ...config
  };
  const storybook = startStorybook(config);
  const test = imageSnapshotWithStoryParameters({
    storybookUrl: config.url,
    ...finalOptions
  });
  const { beforeAll, afterAll } = test;
  const { warn } = console;

  test.beforeAll = async () => {
    await storybook.start();
    await beforeAll();
  };
  test.beforeAll.timeout = beforeAll.timeout;

  test.afterAll = async () => {
    await storybook.stop();
    await afterAll();
  };

  console.warn = () => undefined;
  baseInitStoryshots({
    framework: 'html',
    suite: 'Storyshots',
    test
  });
  console.warn = warn;
}
