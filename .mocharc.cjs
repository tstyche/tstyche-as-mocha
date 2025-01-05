const console = require("node:console");
const process = require("node:process");

let showSpec = false;
const args = process.argv.slice(2);
/** @type {string[]} */
const positionals = [];
while (args.length > 0) {
  const arg = args.shift() ?? "";
  if (arg.startsWith("--")) {
    if (arg.startsWith("--show-spec")) {
      showSpec = true;
    }
    if (!arg.includes("=")) {
      args.shift();
    }
  } else if (!arg.startsWith("-") && arg !== ".") {
    positionals.push(arg);
  }
}
let spec = [
  // "**/*.test.js",
  // "**/*.test.mjs",
  // "**/*.test.cjs",
  "**/*.test.ts",
];
if (positionals.length > 0) {
  spec = positionals;
}

if (showSpec) {
  console.log(`spec: ${JSON.stringify(spec)}`);
}

/**
 * @type {{checkLeaks:boolean,ignore:string,loader?:string,"node-option"?:string[],recursive:boolean,spec:string[]}}
 */
const config = {
  checkLeaks: true,
  ignore: "node_modules/**/*",
  "node-option": ["import=tsx", "import=source-map-support"],
  recursive: true,
  spec,
};

module.exports = config;
