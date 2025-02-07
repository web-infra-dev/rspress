# Contributing guide

Thanks for that you are interested in contributing to Rspress. Before starting your contribution, please take a moment to read the following guidelines.

---

## Setup the dev environment

### Fork the repo

[Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local.

### Install Node.js

Use [fnm](https://github.com/Schniz/fnm) or [nvm](https://github.com/nvm-sh/nvm) to run the command below. This will switch to the Node.js version specified in the project's `.nvmrc` file.

```bash
# with fnm
fnm use

# with nvm
nvm use
```

### Install pnpm

Enable [pnpm](https://pnpm.io/) with corepack:

```bash
corepack enable
```

### Install dependencies

```sh
pnpm install
```

What this will do:

- Install all dependencies
- Create symlinks between packages in the monorepo
- Run the `build` script to build all packages (this will take some time, but is necessary to make ensure all packages are built)

### Set git email

Please make sure you have your email set up in `<https://github.com/settings/emails>`. This will be needed later when you want to submit a pull request.

Check that your git client is already configured the email:

```sh
git config --list | grep email
```

Set the email to global config:

```sh
git config --global user.email "SOME_EMAIL@example.com"
```

Set the email for local repo:

```sh
git config user.email "SOME_EMAIL@example.com"
```

---

## Making changes and building

Once you have set up the local development environment in your forked repo, we can start development.

### Checkout a new branch

It is recommended to develop on a new branch, as it will make things easier later when you submit a pull request:

```sh
git checkout -b MY_BRANCH_NAME
```

### Build the package

To build the package you want to change, first open the package directory, then run the `build` command:

```sh
# Replace some-path with the path of the package you want to work on
cd ./packages/some-path
pnpm run build
```

Alternatively, you can build the package from the root directory of the repository using the `--filter` option:

```sh
pnpm run --filter @rspress/some-package build
```

Build all packages:

```sh
pnpm run build
```

If you need to clean all `node_modules/*` in the project, run the `reset` command:

```sh
pnpm run reset
```

### Debug code

After `build`, we need to link this repo to the global, run the link command:

```sh
pnpm link --global
```

At debug repo, replace the version in node_modules with the local version:

```sh
pnpm link --global rspress
```

If you want to debug package, first open the package directory, then run the `build` command:

```sh
# Replace some-path with the path of the package you want to work on
cd ./packages/some-path
pnpm run dev
```

---

## Testing

### Run unit tests

Before submitting a pull request, it's important to make sure that the changes haven't introduced any regressions or bugs. You can run the unit tests for the project by executing the following command:

```sh
pnpm run test:unit
```

Alternatively, you can run the unit tests of single package using the `--filter` option:

```sh
pnpm run --filter rspress test
```

### Run E2E tests

In addition to the unit tests, the Rspress also includes end-to-end (E2E) tests, which checks the functionality of the application as a whole.

You can run the `test:e2e` command to run the E2E tests:

```sh
pnpm run test:e2e
```

---

## Linting

To help maintain consistency and readability of the codebase, we use a ESLint to lint the codes.

You can run the Linter by executing the following command:

```sh
pnpm run lint
```

---

## Submitting changes

### Committing your changes

Commit your changes to your forked repo, and [create a pull request](https://help.github.com/articles/creating-a-pull-request/).

### Format of PR titles

The format of PR titles follow Conventional Commits.

An example:

```
feat(plugin-swc): Add `myOption` config
^    ^    ^
|    |    |__ Subject
|    |_______ Scope
|____________ Type
```

---

## Releasing

Repository maintainers can publish a new version of changed packages to npm.

1. Run `pnpm generate-release-pr` to generate a release branch, the default bump type is `patch`, use `--type minor/major` to bump minor/major version.
2. Create a pull request, the title should be `Release: v1.2.0`, ensure the CI check passes.
3. Run the [release action](https://github.com/web-infra-dev/rspress/actions/workflows/release.yml) to publish packages to npm.
4. Merge the release pull request to `main`.
5. Generate the [release notes](https://github.com/web-infra-dev/rspress/releases) via GitHub, see [Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
