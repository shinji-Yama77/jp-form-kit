# Release Process

This repo publishes to npm from Git tags that start with `v`.

## One-time setup

1. Create an npm access token with publish access for this package.
2. Add it to GitHub repository secrets as `NPM_TOKEN`.
3. Make sure the package name in [`package.json`](/Users/shinchan/src/hacks/japan/jp-form-kit/jp-form-kit/package.json) is available on npm.

## What CI does

GitHub Actions CI runs on pull requests and pushes to `main`:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm pack`

This catches broken formatting, type issues, test failures, build failures, and packaging mistakes before release.

## What the publish workflow does

When you push a tag like `v0.1.0`, GitHub Actions will:

- install dependencies
- run `npm run release:check`
- publish to npm with `npm publish --access public`

The workflow only runs for tags, so merges to `main` do not automatically publish.

## Local pre-release checklist

Before tagging a release, run:

```bash
npm run release:check
```

This runs the same checks used by CI and publish:

- formatting
- lint
- typecheck
- tests
- build
- `npm pack`

## Versioning guidance

Use semver with this repo's current conventions:

- patch:
  - add a new verified form
  - fix coordinates
  - update `lastVerifiedAt`
  - docs, tests, or contributor tooling that do not break consumers
- minor:
  - add new optional public API fields
  - add new `FormCategory` values
  - add new non-breaking engine capabilities
- major:
  - rename or remove public type fields
  - rename existing published field keys
  - make breaking API changes

## Release steps

1. Finish the changes you want to ship.
2. Update the version in [`package.json`](/Users/shinchan/src/hacks/japan/jp-form-kit/jp-form-kit/package.json).
3. Run `npm run release:check`.
4. Commit the version bump and release changes.
5. Create a tag that matches the package version:

```bash
git tag v0.1.0
git push origin main --tags
```

6. Watch the `Publish` GitHub Actions workflow.
7. Confirm the package appears on npm.

## Suggested first publish

Before your first public release, aim for:

- 5-8 verified forms
- at least one schema with a language variant
- passing CI
- a quick README pass from the consumer point of view

That is enough for a credible initial release without waiting for a huge catalog.
