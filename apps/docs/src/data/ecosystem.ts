/**
 * Community wrappers for frameworks and other stacks, shown on the landing
 * page and in the frameworks guide. Checked 2026-10-19: wrappers with at
 * least about 20 GitHub stars or 500 npm downloads a month, whose repository
 * isn't archived. Most of the stars, downloads and installs date from 0.x.
 * The ones built for 1.x come first, then the rest by GitHub stars.
 */
export interface Wrapper {
  /** The framework or platform, as its users call it. */
  readonly stack: string;
  /** What you install: the package, gem, plugin or repository name. */
  readonly pkg: string;
  /** Where `pkg` comes from. */
  readonly registry:
    | 'npm'
    | 'NuGet'
    | 'Maven'
    | 'RubyGems'
    | 'Atmosphere'
    | 'WordPress'
    | 'GitHub';
  /** The source repository. */
  readonly href: string;
  /** The Chartist version it's built for: 1.x wrappers run on v2 as they are. */
  readonly chartist: '0.x' | '1.x';
  /** One short sentence. */
  readonly note: string;
}

export const WRAPPERS: readonly Wrapper[] = [
  {
    stack: 'React',
    pkg: 'react-chartist',
    registry: 'npm',
    href: 'https://github.com/fraserxu/react-chartist',
    chartist: '1.x',
    note: 'A component for React 18 and 19.'
  },
  {
    stack: 'Angular',
    pkg: 'ng-chartist',
    registry: 'npm',
    href: 'https://github.com/willsoto/ng-chartist',
    chartist: '1.x',
    note: 'A component for Angular 18 to 21.'
  },
  {
    stack: 'Vue',
    pkg: 'vue-chartist',
    registry: 'npm',
    href: 'https://github.com/Yopadd/vue-chartist',
    chartist: '0.x',
    note: 'A component for Vue 3, and Vue 2 in older versions.'
  },
  {
    stack: 'Node.js',
    pkg: 'node-chartist',
    registry: 'npm',
    href: 'https://github.com/panosoft/node-chartist',
    chartist: '0.x',
    note: 'Renders charts to SVG strings on the server.'
  },
  {
    stack: 'Ember',
    pkg: 'ember-cli-chartist',
    registry: 'npm',
    href: 'https://github.com/jherdman/ember-cli-chartist',
    chartist: '0.x',
    note: 'A component, installed as an Ember CLI addon.'
  },
  {
    stack: 'Java (JSF)',
    pkg: 'org.chartistjsf:ChartistJSF',
    registry: 'Maven',
    href: 'https://github.com/hatemalimam/ChartistJSF',
    chartist: '0.x',
    note: 'Charts as JSF components.'
  },
  {
    stack: 'Vue 2',
    pkg: 'v-chartist',
    registry: 'npm',
    href: 'https://github.com/lakb248/vue-chartist',
    chartist: '0.x',
    note: 'A component for Vue 2.'
  },
  {
    stack: 'R',
    pkg: 'yutannihilation/chartist',
    registry: 'GitHub',
    href: 'https://github.com/yutannihilation/chartist',
    chartist: '0.x',
    note: 'An htmlwidget for R.'
  },
  {
    stack: 'Meteor',
    pkg: 'mfpierre:chartist-js',
    registry: 'Atmosphere',
    href: 'https://github.com/mfpierre/meteor-chartist-js',
    chartist: '0.x',
    note: 'Chartist as a Meteor package.'
  },
  {
    stack: 'WordPress',
    pkg: 'charts-for-tablepress-chartist',
    registry: 'WordPress',
    href: 'https://github.com/silsha/tablepress_chartist',
    chartist: '0.x',
    note: 'Draws TablePress tables as charts.'
  },
  {
    stack: 'Blazor',
    pkg: 'UnlockedData.Chartist.Blazor',
    registry: 'NuGet',
    href: 'https://github.com/unlockeddataltd/UnlockedData.Chartist.Blazor',
    chartist: '0.x',
    note: 'Components for client-side and server-side Blazor.'
  },
  {
    stack: 'Angular',
    pkg: 'ngx-chartist',
    registry: 'npm',
    href: 'https://github.com/affilnost/ngx-chartist',
    chartist: '0.x',
    note: 'A component for Angular 6.'
  },
  {
    stack: 'Ruby on Rails',
    pkg: 'chartist-rails',
    registry: 'RubyGems',
    href: 'https://github.com/AnthonyBobsin/chartist-rails',
    chartist: '0.x',
    note: "Chartist's script and styles for the asset pipeline."
  }
];
