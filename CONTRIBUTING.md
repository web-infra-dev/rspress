# Contributing Guide

Thanks for that you are interested in contributing to Rspress. Before starting your contribution, please take a moment to read the following guidelines.

---

## Setup the Dev Environment

### Fork the Repo

[Fork](https://help.github.com/articles/fork-a-repo/) this repository to your
own GitHub account and then [clone](https://help.github.com/articles/cloning-a-repository/) it to your local.

### Install Node.js

We recommend using Node.js 18. You can check your currently used Node.js version with the following command:

```bash
node -v
```

If you do not have Node.js installed in your current environment, you can use [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to install it.

Here is an example of how to install the Node.js 18 LTS version via nvm:

```bash
# Install the LTS version of Node.js 18
nvm install 18 --lts

# Make the newly installed Node.js 18 as the default version
nvm alias default 18

# Switch to the newly installed Node.js 18
nvm use 18
```

### Install pnpm

```sh
# Enable pnpm with corepack, only available on Node.js >= `v14.19.0`
corepack enable
```

### Install Dependencies

```sh
pnpm install
```

What this will do:

- Install all dependencies
- Create symlinks between packages in the monorepo
- Run the `build` script to build all packages (this will take some time, but is necessary to make ensure all packages are built)

### Set Git Email

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

## Making Changes and Building

Once you have set up the local development environment in your forked repo, we can start development.

### Checkout A New Branch

It is recommended to develop on a new branch, as it will make things easier later when you submit a pull request:

```sh
git checkout -b MY_BRANCH_NAME
```

### Build the Package

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

### Debug Code

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

### Run Unit Tests

Before submitting a pull request, it's important to make sure that the changes haven't introduced any regressions or bugs. You can run the unit tests for the project by executing the following command:

```sh
pnpm run test:unit
```

Alternatively, you can run the unit tests of single package using the `--filter` option:

```sh
pnpm run --filter rspress test
```

### Run E2E Tests

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

## Submitting Changes

### Committing your Changes

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

## Benchmarking

You can input `!bench` in the comment area of ​​the PR to do benchmarking on `rspress` (you need to have Collaborator and above permissions).

You can focus on metrics related to build time and bundle size based on the comparison table output by comments to assist you in making relevant performance judgments and decisions.

Dependencies installation-related metrics base on publishing process, so the data is relatively lagging and is for reference only.

---

## Versioning

We use [changesets](https://github.com/changesets/changesets) to manage version. Currently, all rspress packages will use a fixed unified version.

The release notes are automatically generated by [GitHub releases](https://github.com/web-infra-dev/rspress/releases).

## Releasing

Repository maintainers can publish a new version of all packages to npm.

Here are the steps to publish (we generally use CI for releases and avoid publishing npm packages locally):

1. [Create release pull request](https://github.com/web-infra-dev/rspress/actions/workflows/release-pull-request.yml).
2. [Run the release action](https://github.com/web-infra-dev/rspress/actions/workflows/release.yml).
3. [Generate the release notes](https://github.com/web-infra-dev/rspress/releases).
4. Merge the release pull request.
