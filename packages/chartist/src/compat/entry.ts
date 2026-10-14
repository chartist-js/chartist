/**
 * The published entry of `chartist/compat`, in every build. Next to the
 * compat API, importing it sets up the global `Chartist` for plugin
 * scripts of the 0.x and 1.x era (see ./global.ts). That's why
 * package.json lists the compat files under `sideEffects`.
 */
import * as compat from './index';
import { installGlobal } from './global';

export * from './index';

installGlobal(compat);
