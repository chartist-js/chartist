import { skipable } from './utils/skipable';
import { initStoryshots } from './utils/storyshots';

const testTimeout = 60 * 1000 * 10;
const config = {
  url: 'http://localhost:6006',
  setupTimeout: testTimeout,
  testTimeout,
  getGotoOptions() {
    return {
      waitUntil: 'networkidle0',
      timeout: 0
    };
  }
};

const describeWhenLinux = skipable(
  describe,
  process.platform !== 'linux' || Boolean(process.env.STORYSHOTS_SKIP)
);

describeWhenLinux('Storyshots', () => {
  initStoryshots(config);
});
