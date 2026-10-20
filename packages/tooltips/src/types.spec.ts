import type { BarContext, PointContext } from 'chartist';
import type { TrendLineContext } from '@chartist-js/essentials';
import { tooltips } from './plugin.ts';

// A role of another package's layer, declared as such layers do.
declare module 'chartist' {
  interface NodeRoles {
    forecast: {
      ctx: { readonly low: number; readonly high: number };
      attrs: object;
    };
  }
}

describe('item types', () => {
  it('narrow the context by the listed roles', () => {
    tooltips({
      roles: ['trendLine'],
      format: item => {
        expectTypeOf(item.role).toEqualTypeOf<'trendLine'>();
        expectTypeOf(item.context).toEqualTypeOf<TrendLineContext>();
        return String(item.context.slope);
      }
    });
  });

  it('narrow a mixed list by checking the role', () => {
    tooltips({
      roles: ['point', 'trendLine', 'forecast'],
      format: item => {
        if (item.role === 'forecast') {
          expectTypeOf(item.context.high).toEqualTypeOf<number>();
          return `${item.context.low} to ${item.context.high}`;
        }
        if (item.role === 'point') {
          expectTypeOf(item.context).toEqualTypeOf<PointContext>();
        }
        return undefined;
      },
      render(content, item) {
        if (item.role === 'trendLine') {
          content.textContent = String(item.context.intercept);
        }
      }
    });
  });

  it('default to points, bars and slices', () => {
    tooltips({
      format: item => {
        expectTypeOf(item.role).toEqualTypeOf<'point' | 'bar' | 'slice'>();
        if (item.role === 'bar') {
          expectTypeOf(item.context).toEqualTypeOf<BarContext>();
        }
        return undefined;
      }
    });
  });

  it('reject roles nobody declared', () => {
    // @ts-expect-error: not a role
    tooltips({ roles: ['nope'] });
  });
});
