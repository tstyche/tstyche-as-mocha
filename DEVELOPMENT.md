# Development

For the smoothest development experience in this codebase, you'll need:

- [Node.js] — You'll need at least v18, which is the oldest supported version.
  Other [LTS versions] may be helpful.
- [yarn] — Not just npm.
- [fnm] — Optional, but helpful.

You'll do a typical setup sequence from there.

Update your local packages:

```shell
yarn install
```

Build the app:

```shell
yarn build
```

Run tests:

```shell
yarn test
```

You can then see everything as a user would, by running TSTyche against some example tests:

```shell
yarn test:tstyche
```

Which is just an alias for:

```shell
tstyche ./type-test
```

## Install notes for macos

- You can't just `brew install yarn`.
  It will install an ancient version, and won't work.
  Instead, see the [yarn setup instructions].

- For `fnm`, `brew install fnm` works.
  See below for additional guidance around multiple versions.

## Before you commit

Please make sure the CI tests will pass:

```shell
yarn lint
yarn check
yarn clean
yarn build
yarn test
```

If you want to be extra thorough, and have `fnm` installed, you can run those tests on various supported versions of Node.js.
Remember that you'll need to enable corepack (for yarn) for each version of node you install:

```shell
fnm install --corepack-enabled v18
fnm install --corepack-enabled v20
fnm install --corepack-enabled v22
```

And just to make sure you're up to date:

```shell
fnm install --corepack-enabled --lts
```

This will likely tell you the latest LTS version is already installed, at least until these docs are out of date.

Once you have multiple versions installed, you can use them to run the tests:

```shell
yarn test:v18
yarn test:v20
yarn test:v22
```

These are just aliases for commands like:

```shell
fnm exec --with v18 yarn test
```

You can also do this with [nvm], though `fnm` makes it a bit easier by working from within a `package.json` script, which `nvm` won't do without lots of extra setup.

[Node.js]: https://nodejs.org
[LTS versions]: https://nodejs.org/en/about/previous-releases
[fnm]: https://github.com/Schniz/fnm
[nvm]: https://github.com/nvm-sh/nvm
[yarn]: https://yarnpkg.com/getting-started/install
[hyperfine]: https://github.com/sharkdp/hyperfine
[yarn setup instructions]: https://yarnpkg.com/getting-started/install
