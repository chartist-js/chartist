## ADDED Requirements

### Requirement: Classic scripts by bare name

A classic `<script src>` in an example's `index.html` MAY name a bare specifier that the sandbox's import map defines. The preview SHALL load that script from the import map's URL for the name, in document order, before the example's modules run. A script whose `src` is not a bare specifier of the import map SHALL stay as it is. The same example SHALL run the same way in a live example, in the full playground and from a shared link.

#### Scenario: A plugin script by name

- **WHEN** an example's `index.html` has `<script src="chartist-plugin-axistitle"></script>` and the host's import map maps that name to a URL
- **THEN** the preview loads the script from that URL before the example's `main.ts` runs

#### Scenario: Other scripts unchanged

- **WHEN** an example's `index.html` has `<script src="https://example.com/x.js"></script>`
- **THEN** the preview keeps that `src` unchanged

### Requirement: Stylesheets by bare name

A `<link rel="stylesheet" href>` in an example's `index.html` MAY name a bare specifier that the sandbox's import map defines; the preview SHALL apply the stylesheet from the name's URL. A link whose `href` is not such a name SHALL stay as it is.

#### Scenario: A plugin stylesheet by name

- **WHEN** an example's `index.html` has `<link rel="stylesheet" href="chartist-plugin-tooltips/style">` and the import map defines that name
- **THEN** the preview applies the stylesheet from the name's URL
