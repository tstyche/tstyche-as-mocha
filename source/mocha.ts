import * as path from "node:path";
import * as process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as util from "node:util";
import { type CommandLineOptions, Config, Runner, Select } from "tstyche/tstyche";

let scriptDir: string;
if (typeof global.__dirname === "string") {
  // Imported from CJS on node.
  scriptDir = global.__dirname;
} else if (typeof global.require?.main?.path === "string") {
  // Imported from CJS ... elsewhere?
  scriptDir = path.dirname(global.require.main.path);
} else if (typeof import.meta?.dirname === "string") {
  // Imported from ESM on node v20+
  scriptDir = import.meta.dirname;
} else if (typeof import.meta?.url === "string") {
  // Imported from ESM on node 18
  scriptDir = path.dirname(fileURLToPath(import.meta.url));
} else {
  // No clue.
  function pathFromStack(): string | undefined {
    const scriptPath = new Error("unnecessary").stack?.match(/\s+at\s+pathFromStack\s+\((.+?)(?::.+?)?\)/)?.[1];
    return scriptPath == null ? undefined : path.dirname(scriptPath);
  }
  scriptDir = pathFromStack() ?? process.cwd();
}

const {
  values: { config: configArg, grep, help, reporter: reporterArg },
  positionals,
} = util.parseArgs({
  allowPositionals: true,
  options: {
    /**
     * This is from mocha.  Matching in TSTyche doesn't use patterns,
     * it's just strings, but it will work for very simple "run this
     * describe block" use-cases.
     */
    grep: {
      type: "string",
    },
    /**
     * This is neither mocha, TSTyche, nor IJ.  It's just trying to be helpful.
     */
    help: {
      type: "boolean",
      short: "h",
    },
    /**
     * This is for TSTyche.  (Though it is also a standard mocha option.)
     */
    config: {
      type: "string",
    },
    /**
     * This is from mocha, but TSTyche has no equivalent.
     */
    recursive: {
      type: "boolean",
    },
    /**
     * This is standard for mocha.
     * See {@link https://mochajs.org/#command-line-usage | mochajs.org}.
     */
    reporter: {
      short: "R",
      type: "string",
    },
    /**
     * This is standard for mocha.
     * See {@link https://mochajs.org/#command-line-usage | mochajs.org}.
     */
    timeout: {
      short: "t",
      type: "string",
    },
    /**
     * This is standard for mocha.
     * See {@link https://mochajs.org/#command-line-usage | mochajs.org}.
     */
    ui: {
      default: "bdd",
      type: "string",
    },
  },
});

if (help) {
  process.stdout.write(
    `
This shim uses only a small subset of mocha CLI options.
Params:
  --reporter path    Path to the reporter JS used by the IDE.
  --config path      Path to tstyche.config.json (not mocha!)
  `.trim(),
    "utf-8",
  );
  process.exit(1);
}

if (reporterArg == null) {
  process.stdout.write("--reporter|-R (path/to/js) is required\n", "utf-8");
  process.exit(1);
}

const run = async () => {
  const configOptions = await Config.parseConfigFile(configArg);
  const commandLineOptions: CommandLineOptions = {};
  if (grep != null && grep !== "") {
    // TSTyche doesn't support patterns, which IJ tries to add by default.
    // Strip it down to support just a substring match.  Won't handle multiple
    // values!
    commandLineOptions.only = grep.replace(/^\^|\$$/g, "");
  }
  let pathMatch: Array<string> | undefined;
  if (positionals != null && positionals.length > 0) {
    const cwd = process.cwd();
    // TSTyche matchers don't expand relative paths to absolute,
    // so we need to match.
    pathMatch = positionals.map((p) => path.relative(cwd, p));
  }
  const resolvedConfig = Config.resolve({
    ...configOptions,
    commandLineOptions,
    ...(pathMatch == null ? {} : { pathMatch }),
  });
  let reporterScript = path.resolve(scriptDir, "AsMochaReporter.js");
  if (/^\w:/.test(reporterScript)) {
    // Because Windows drive letters foul up ESM dynamic imports
    // with ERR_UNSUPPORTED_ESM_URL_SCHEME errors.
    reporterScript = pathToFileURL(reporterScript).toString();
  }
  // Clear out the default Line and Summary reporters.
  resolvedConfig.reporters = [reporterScript];
  const testFiles = await Select.selectFiles(resolvedConfig);
  const runner = new Runner(resolvedConfig);
  // Ready?  Go!!!!
  await runner.run(testFiles);
};

run().catch((err: unknown) => {
  // biome-ignore lint/suspicious/noConsole : It's an error logger.  Why reinvent that?
  console.error(err);
  process.exit(1);
});
