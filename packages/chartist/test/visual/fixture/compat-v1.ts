/**
 * `chartist/compat` for CHARTIST_LIB=v1: chartist@1.5.0 emits 1.x events
 * natively, and runs a plain function as a (harmless) 1.x plugin.
 */
export function compat() {
  return undefined;
}

export function fromLegacyPlugin(plugin: unknown) {
  return plugin;
}
