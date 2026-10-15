# Spec Delta

## Purpose

Defines `ct-cli`, the command of `@chartist-js/terminal` that draws Chartist line, bar and pie charts in the terminal from arguments, files or stdin.

## ADDED Requirements

### Requirement: Command and chart types

The package SHALL install the command `ct-cli`, which also runs with `npx @chartist-js/terminal`. Its first argument SHALL be the chart type: `line`, `bar` or `pie`; `demo` SHALL draw one example of each.

#### Scenario: Run without installing

- **WHEN** a user runs `npx @chartist-js/terminal line 1,3,2`
- **THEN** a line chart of the three values is printed

#### Scenario: Demo

- **WHEN** a user runs `ct-cli demo`
- **THEN** a line, a bar and a donut chart are printed, each with a title

### Requirement: Series as arguments

Each argument after the chart type SHALL be one series of comma-separated numbers. An empty value SHALL be a hole in the series.

#### Scenario: Two series

- **WHEN** a user runs `ct-cli line 1,3,2 2,,4`
- **THEN** the chart has two lines, and the second has no value at the second label

### Requirement: Data from files and stdin

Without series arguments, the data SHALL come from the file given with `--data`, or else from stdin. JSON SHALL be read as `{ labels, series }` or as an array of values or series. Other text SHALL be read as rows of values separated by commas, tabs, semicolons or spaces, one series per row; a first row that isn't numeric SHALL be the labels, and a first column that isn't numeric the series names.

#### Scenario: JSON from stdin

- **WHEN** `{"labels":["A","B"],"series":[3,2]}` is piped into `ct-cli pie`
- **THEN** a pie with the slices `A` and `B` is printed

#### Scenario: CSV with a header

- **WHEN** a file with the rows `,Mon,Tue`, `Visitors,3,5` and `Sign-ups,1,2` is passed with `--data`
- **THEN** the chart has the labels `Mon` and `Tue`, and a legend with `Visitors` and `Sign-ups`

#### Scenario: Nothing to draw

- **WHEN** `ct-cli bar` runs in a terminal without series, `--data` or piped input
- **THEN** it prints that data is missing and the usage to stderr, and exits with code 1

### Requirement: Chart options as flags

The command SHALL take flags for the labels, series names, size (`--width` in columns, `--height` in rows), the value range (`--low`, `--high`), line options (`--smooth`, `--area`, `--no-points`), bar options (`--stack`, `--horizontal`), pie options (`--donut`, `--no-labels`), the palette and the legend (`--no-legend`). The width SHALL default to the terminal's width, the height to 20 rows.

#### Scenario: Size

- **WHEN** a user runs `ct-cli bar 3,1,2 --width 40 --height 10`
- **THEN** the chart is at most 40 columns wide and 10 rows high

#### Scenario: Stacked horizontal bars

- **WHEN** a user runs `ct-cli bar 3,1 2,2 --stack --horizontal`
- **THEN** the bars are horizontal and stacked

### Requirement: Legend for named series

When series have names, the command SHALL print a legend below the chart unless `--no-legend` is given.

#### Scenario: Names given

- **WHEN** a user runs `ct-cli line 1,2 2,1 --names Visitors,Sign-ups`
- **THEN** a legend with `Visitors` and `Sign-ups` in their series colors follows the chart

### Requirement: Colors follow the terminal

The command SHALL pick colors with the package's color detection from stdout and the environment; `--color` with `auto`, `truecolor`, `256`, `16` or `none` SHALL override it.

#### Scenario: Piped into a file

- **WHEN** the output of `ct-cli line 1,2,3` is redirected to a file
- **THEN** the file contains no escape codes

### Requirement: HTML output

With `--html`, the command SHALL print the chart as HTML instead of text, and with `--html --standalone` a complete HTML page that includes the stylesheet.

#### Scenario: A page to open

- **WHEN** a user runs `ct-cli pie 3,2,1 --html --standalone > pie.html` and opens the file in a browser
- **THEN** the page shows the pie in its series colors

### Requirement: Help, version and errors

`--help` SHALL print the usage and `--version` the package version, both exiting with code 0. An unknown chart type, unknown flag or value that isn't a number SHALL print what is wrong and the usage to stderr and exit with code 1. When the reader of the output goes away (as with `head`), the command SHALL stop without an error.

#### Scenario: Not a number

- **WHEN** a user runs `ct-cli line 1,two,3`
- **THEN** stderr says that `two` is not a number, and the exit code is 1

#### Scenario: Piped into head

- **WHEN** the output of `ct-cli demo` is piped into `head -n 3`
- **THEN** three lines are printed and no error appears

### Requirement: Runs from the published build

The command SHALL run from the package's built JavaScript on the Node.js versions the package supports, without TypeScript or a build step on the user's side.

#### Scenario: Global install

- **WHEN** a user installs `@chartist-js/terminal` globally with npm and runs `ct-cli --version`
- **THEN** the version is printed
