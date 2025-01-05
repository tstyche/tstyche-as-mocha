import * as console from "node:console";
import * as fs from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";
import * as util from "node:util";
import { type CommandLineOptions, Config, Runner, Select } from "tstyche/tstyche";

const {
  values: {
    asMochaReporterPath,
    config: configArg,
    grep,
    help,
    noGrepWarning,
    reporter: reporterArg,
    showConfig,
    verbose,
  },
  positionals,
} = util.parseArgs({
  allowPositionals: true,
  options: {
    /**
     * An option of last resort for very odd configurations.
     */
    asMochaReporterPath: {
      type: "string",
    },
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
    noGrepWarning: {
      type: "boolean",
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
     * From TSTyche.
     */
    showConfig: {
      type: "boolean",
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
    verbose: {
      type: "boolean",
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
  --asMochaReporterPath path
                     Absolute path to this package, if all other
                     configuration fails.
Flags:
  --showConfig       Print the resolved configuration and exit.
  --noGrepWarning    Hide the warning about the Mocha --grep option.
  --verbose          Enable additional logging, for debugging.
  `.trim(),
    "utf-8",
  );
  process.exit(1);
}

if (reporterArg == null) {
  process.stdout.write("--reporter|-R (path/to/js) is required\n", "utf-8");
  process.exit(1);
}

const ramble = (...messages: Array<string>) => {
  if (verbose) {
    for (const message of messages) {
      console.log(message);
    }
  }
};

const REPORTER_SUBPATH_SPECIFIER = "tstyche-as-mocha/reporter";

const getReporterSpecifier = async (): Promise<string> => {
  // If we're installed as a package, we can use the subpath specifier.
  try {
    ramble(`Attempting to import subpath: ${REPORTER_SUBPATH_SPECIFIER}`);
    const reporter = (await import(REPORTER_SUBPATH_SPECIFIER)).default;
    if (typeof reporter === "function") {
      return REPORTER_SUBPATH_SPECIFIER;
    }
  } catch (_err: unknown) {
    ramble("Nope.  Can't use the subpath.  Maybe the package is not installed?");
  }
  // Backup plan: The compiled reporter should be a sibling to this script.
  // The only trick is, we need that path.  We can't just use "./AsMochaReporter.js"
  // because that relative path won't be usable by the TSTyche Runner.
  ramble("Trying to find the path to the AsMochaReporter.");
  let scriptDir: string;
  if (asMochaReporterPath != null) {
    scriptDir = path.dirname(asMochaReporterPath);
    ramble(`Using the provided --asMochaReporterPath: ${scriptDir}`);
  } else if (typeof global.__dirname === "string") {
    scriptDir = global.__dirname;
    ramble(`Looks like a typical CommonJS context: __dirname=${scriptDir}`);
  } else if (typeof global.require?.main?.path === "string") {
    scriptDir = path.dirname(global.require.main.path);
    ramble(`Looks like an atypical CommonJS context: require.main.path=${scriptDir}`);
  } else if (typeof import.meta?.dirname === "string") {
    scriptDir = import.meta.dirname;
    ramble(`Looks like an ESM context on node.js >=v20: import.meta.dirname=${scriptDir}`);
  } else if (typeof import.meta?.url === "string") {
    scriptDir = path.dirname(fileURLToPath(import.meta.url));
    ramble(`Looks like an ESM context on node.js <v20: dirname(import.meta.url)=${scriptDir}`);
  } else {
    ramble("Context unclear.  Maybe a stack trace has a path?");

    // No clue.
    function pathFromStack(): string | undefined {
      const scriptPath = new Error("unnecessary").stack?.match(/\s+at\s+pathFromStack\s+\((.+?)(?::.+?)?\)/)?.[1];
      return scriptPath == null ? undefined : path.dirname(scriptPath);
    }

    const fromStack = pathFromStack();
    if (fromStack != null) {
      scriptDir = fromStack;
    } else {
      scriptDir = process.cwd();
      ramble(
        "Nope.  Couldn't find the path from a stack trace.",
        `Falling back to process.cwd: ${scriptDir}`,
        "This is unlikely to work.",
        "You may try fixing this by installing the package:",
        "   npm install -D tstyche-as-mocha",
      );
    }
  }
  let reporterScript = path.resolve(scriptDir, "AsMochaReporter.js");
  const tsReporter = path.resolve(scriptDir, "AsMochaReporter.ts");
  const stats =
    fs.statSync(reporterScript, { throwIfNoEntry: false }) || fs.statSync(tsReporter, { throwIfNoEntry: false });
  if (stats == null || !stats.isFile()) {
    console.error("[ERROR] Could not find a path to the AsMochaReporter.");
    process.exit(1);
  }
  reporterScript = pathToFileURL(reporterScript).toString();
  return reporterScript;
};

const run = async () => {
  const reporter = await getReporterSpecifier();
  ramble(`Reporter: ${reporter}`);
  const configOptions = await Config.parseConfigFile(configArg);
  const commandLineOptions: CommandLineOptions = {
    reporters: [reporter],
  };
  if (grep != null && grep !== "") {
    // TSTyche doesn't support patterns, which IJ tries to add by default.
    // Strip it down to support just a substring match.  Won't handle multiple
    // values!
    commandLineOptions.only = grep.replace(/^\^|\$$/g, "");
    if (noGrepWarning !== true) {
      console.warn(
        `[WARN] Provided with --grep=${JSON.stringify(grep)}\n[WARN] TSTyche does not support grep-style matchers.\n[WARN] Converted to TSTyche: --only ${JSON.stringify(commandLineOptions.only)}`,
      );
    }
  }
  let pathMatch: Array<string> | undefined;
  if (positionals != null && positionals.length > 0) {
    const cwd = process.cwd();
    // TSTyche matchers don't expand relative paths to absolute,
    // so we need to match.
    pathMatch = positionals.map((p) => path.relative(cwd, p));
    ramble(`TSTyche pathMatch: ${pathMatch}`);
  }
  const resolvedConfig = Config.resolve({
    ...configOptions,
    commandLineOptions,
    ...(pathMatch == null ? {} : { pathMatch }),
  });
  if (showConfig === true) {
    console.dir(resolvedConfig, { depth: 3 });
    process.exit(1);
  }
  const runner = new Runner(resolvedConfig);
  const testFiles = await Select.selectFiles(resolvedConfig);
  // Ready?  Go!!!!
  await runner.run(testFiles);
};

run().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
