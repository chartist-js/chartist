/**
 * `chartist/compat` for test:api:v1: chartist@1.5.0 has no compat plugin and
 * emits 1.x events natively. A plain function is a harmless 1.x plugin.
 */
export function compat() {
  return undefined;
}

export function fromLegacyPlugin(plugin: unknown) {
  return plugin;
}
