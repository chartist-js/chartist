/**
 * The line interpolations: functions that turn a series' points into the
 * {@link SvgPath} of its line, for the `lineSmooth` option of line charts.
 * Each one is a factory: call it with its options, such as
 * `Interpolation.cardinal({ tension: 0.2 })`, and pass the result. Write
 * your own as a {@link LineInterpolation}.
 *
 * @module
 */
export * from './none';
export * from './simple';
export * from './step';
export * from './cardinal';
export * from './monotoneCubic';
