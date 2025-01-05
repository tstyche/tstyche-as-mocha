# Development

For the smoothest development experience in this codebase, you'll need:

- [Node.js] — You'll need at least v18, which is the oldest supported version.
- [fnm] — Optional, but helpful.
- [yarn] — Not just npm.
- [hyperfine] — Optional for many basic tasks, but required for performance metrics.

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

- For `fnm` and `hyperfine`, `brew install` works for both.

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

Once you have v18, v20, and v22 installed, you can use them to run the tests:

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
[fnm]: https://github.com/Schniz/fnm
[nvm]: https://github.com/nvm-sh/nvm
[yarn]: https://yarnpkg.com/getting-started/install
[hyperfine]: https://github.com/sharkdp/hyperfine
[yarn setup instructions]: https://yarnpkg.com/getting-started/install
