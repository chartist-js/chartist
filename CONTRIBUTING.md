# Contributing to Chartist

- [Issues and Bugs](#issue)
- [Submission Guidelines](#submit)

## <a name="issue"></a> Found an Issue?

If you find a bug in the source code or a mistake in the documentation, you can help us by
submitting an issue to our [GitHub Repository][github]. Even better you can submit a Pull Request
with a fix.

## Pre-requisites

You will need the following to run a local development enviroment.

- Node.js & npm
- pnpm (`npm install -g pnpm`)
- Text editor of your choice

## How to Run a Local Distribution

1. `cd` into your local copy of the repository.
2. Run `pnpm i` to install dependencies located in `package.json`.
5. Run `pnpm start:storybook` to start Storybook, or run `pnpm jest --watch` to run tests in watch mode. Congrats, you should now be able to see your local copy of the Chartist testbed.

## <a name="submit"></a> Submission Guidelines

If you are creating a Pull Request, fork the repository and make any changes on the `develop` branch.
