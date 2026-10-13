/** Framework wrappers, with the Chartist version they're built for (npm, checked 2026-10-13). */
export const ECOSYSTEM = [
  {
    name: 'React',
    pkg: 'react-chartist',
    href: 'https://www.npmjs.com/package/react-chartist',
    note: 'Components for React 18 and 19, built for Chartist 1.x.'
  },
  {
    name: 'Angular',
    pkg: 'ng-chartist',
    href: 'https://www.npmjs.com/package/ng-chartist',
    note: 'A component for Angular 18 to 21, built for Chartist 1.x.'
  },
  {
    name: 'Plain HTML',
    pkg: 'chartist',
    href: 'https://www.npmjs.com/package/chartist',
    note: 'No wrapper needed: one module import and a function call.'
  }
] as const;
