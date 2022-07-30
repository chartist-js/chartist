import { spawn } from 'child_process';

import { createServer } from 'http-server';
import del from 'del';

const STORYBOOK_STATIC = 'storybook-static';
const errorMatcher = /ERR!|Error:|ERROR in|UnhandledPromiseRejectionWarning/;

/**
 * Run storybook static build.
 * @param options - Build options.
 * @param [options.env] - Environment variables.
 * @param [options.verbose] - Print verbose messages.
 * @returns Build process promise.
 */
export async function buildStorybook({ env = {}, verbose = false }) {
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('build-storybook', [], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'production',
        ...env
      },
      detached: true
    });
    const onData = data => {
      const message = data.toString('utf8');

      if (verbose) {
        process.stdout.write(message);
      }

      if (errorMatcher.test(message)) {
        reject(new Error(message));
      }
    };

    buildProcess.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Exit code: ${code || signal || 'unknown'}`));
    });
    buildProcess.stdout.on('data', onData);
    buildProcess.stderr.on('data', onData);
  });
}

/**
 * Build static and start storybook server.
 * @param options - Storybook build and start options.
 * @returns Server controls.
 */
export function startStorybook(options) {
  const { url, skipBuild } = options;
  const parsedUrl = new URL(url);
  const server = createServer({
    root: STORYBOOK_STATIC
  });

  return {
    async start() {
      if (!skipBuild) {
        await buildStorybook(options);
      }

      await new Promise(resolve => {
        server.listen(
          parseInt(parsedUrl.port, 10),
          parsedUrl.hostname,
          resolve
        );
      });
    },
    async stop() {
      server.close();

      if (!skipBuild) {
        await del(STORYBOOK_STATIC);
      }
    }
  };
}
