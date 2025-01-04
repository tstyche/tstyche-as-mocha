# tstyche-as-mocha

This is a lightweight shim between a TSTyche Runner and a mocha Reporter.

## Installation

Typical npm/yarn/pnpm stuff:

```shell
npm install --save-dev tstyche-as-mocha
# or
yarn add -D tstyche-as-mocha
```

Note that you will need `tstyche` and `mocha` as peer dependencies.

## Usage

For your type unit tests' Run Configuration, set your IDE's unit test runner to point its "mocha installation" at this package folder instead.

In JetBrains products (IntelliJ, WebStorm, etc.), create a new Run Configuration, select Mocha as the type, and use its folder picker to find `tstyche-as-mocha` in your project's `node_modules` directory.

If your `tstyche.config.json` isn't proximal to your test files, edit the Run Configuration to add to the mocha CLI options:

```
--config path/to/tstyche.config.json
```

Run the configuration just as you would a normal mocha suite.
Your IDE should pass its own `--reporter` option to this shim, which will then handle running TSTyche and brokering the interchange.

## Development

If you want to step through this shim script with a debugger, you can also set up the same Run Configuration to use `tsx` instead of node.
You'll then need to edit this module's `package.json` to swap out the `bin`:

```json
{
  "bin": "./mocha.ts"
}
```
