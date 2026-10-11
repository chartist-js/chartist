# Chartist v2

Monorepo for Chartist v2, a simple, responsive SVG charting library (style with CSS, control with JS). Nx 23 + pnpm workspaces.

- Read `docs/v2-high-level-plan.md` first. It holds the vision, decisions, open questions and phases. Update it when a decision is made.
- Layout: `apps/*` (Astro docs site), `packages/*` (library + internal libs).
- `tmp/chartist-v0` (0.x, original 2014 site and library) and `tmp/chartist-v1` (1.x TypeScript + Docusaurus) are git-ignored reference clones. Read and copy from them, but never edit them.
- Spec-driven: non-trivial work starts as an OpenSpec change (`/opsx:propose`, then `/opsx:apply`, then `/opsx:archive`). Specs live in `openspec/`.
- Chartist must run without a bundler: ship ESM, CJS and UMD, and show plain ESM (`<script type="module">`) examples first in the docs.
- The docs should be playful and crafted like 0.x, not template-like. Brand and design come from a separate Claude Design handoff (`docs/design-handoff-prompt.md`).
- Git: this is the `chartist-js/chartist` repo, and v2 work happens on `next`. Keep file moves, deletions and content edits in separate commits so git detects renames. Never squash-merge. Don't mass-reformat (the 1.x `.prettierrc` stays). Details: "Repository and migration strategy" in the plan.
- Run tasks through Nx: `pnpm nx <target> <project>`.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
