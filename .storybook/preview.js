import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { configureActions } from '@storybook/addon-actions';
import faker from 'faker';

const SEED_VALUE = 584;

if (process.env.STORYBOOK_STORYSHOTS) {
  // Make faker values reproducible.
  faker.seed(SEED_VALUE);
}

configureActions({
  depth: 5
});

export const parameters = {
  viewport: {
    viewports: INITIAL_VIEWPORTS
  }
};
