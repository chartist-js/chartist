/**
 * `chartist` for CHARTIST_LIB=v2: the local build, with `LineChart` replaced
 * by a test-only class around the v2 `lineChart` preset. It keeps the 1.x
 * deferred first render, so the examples settle like with 1.x. 1.x events
 * aren't supported here; examples that use them are skipped.
 */
import { lineChart } from '@chartist-visual/dist';

export * from '@chartist-visual/dist';

type Args = Parameters<typeof lineChart>;

export class LineChart {
  private handle?: ReturnType<typeof lineChart>;

  constructor(
    target: Args[0],
    data: Args[1],
    options?: Args[2],
    responsive?: Args[3]
  ) {
    setTimeout(() => {
      this.handle = lineChart(target, data, options, responsive);
    }, 0);
  }

  on() {
    return this;
  }

  off() {
    return this;
  }

  detach() {
    this.handle?.destroy();
  }
}
