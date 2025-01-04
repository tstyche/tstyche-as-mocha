import * as console from "node:console";
import * as process from "node:process";
import type * as M from "mocha";
import type { ResolvedConfig } from "tstyche/tstyche";
import type { ReporterEvent } from "tstyche/tstyche";
import { BaseReporter } from "tstyche/tstyche";

export type LoadReporterOptions = {
  reporter?: string;
  verbose?: boolean;
};

export type RunnerHandler = (runner: M.Runner) => void;

// noinspection JSUnusedGlobalSymbols
export default class AsMochaReporter extends BaseReporter {
  public static readonly CANNOT_FIND_ERROR: string = "Cannot find: --reporter or -R";

  /**
   * Find the path to the mocha (not TSTyche) reporter.  This may be a
   * filesystem path, or it may be a package name.  This is *not* the
   * path to `tstyche-as-mocha` — it is the path to the IDE's reporter
   * UI script.
   * @remarks
   * For now, TSTyche doesn't have a concept of "Reporter options", and
   * we don't really want to import all possible mocha CLI params into
   * TSTyche param space.  Thus, we do a simple argv extraction.
   * @privateRemarks
   * Long term, maybe we add a TSTyche CLI param like `--reporter-config`
   * or something.
   * @example
   * When configuring this in the IDE, this will look something like:
   * ```
   * --reporter /absolute/path/to/reporter.js
   * --reporter=/absolute/path/to/reporter.js
   * -R /absolute/path/to/reporter.js
   * ```
   */
  public static getReporterScriptPath(argv: Array<string> = process.argv.slice(2)): string {
    const reporterArgs = argv
      .map((arg, index) => {
        if ((index > 0 && argv[index - 1] === "--reporter") || argv[index - 1] === "-R") {
          return arg.trim();
        }
        if (arg.startsWith("--reporter=")) {
          return arg.substring(11).trim();
        }
        return undefined;
      })
      .filter((a) => a != null && a !== "");
    if (reporterArgs.length !== 1) {
      throw new ReferenceError(AsMochaReporter.CANNOT_FIND_ERROR);
    }
    return reporterArgs.at(0) as string;
  }

  /**
   * Load the specified reporter.  Reporter scripts (or packages) should
   * have a single default export, which is a function which accepts a
   * mocha Runner as its only param/arg.
   * @example
   * For modern JS:
   * ```javascript
   * /\*\* \@param {import("mocha").Runner} runner \*\/
   * const reporter = (runner) => { };
   * export default reporter;
   * ```
   * Using `module.exports`:
   * ```javascript
   * /\*\* \@param {import("mocha").Runner} runner \*\/
   * const reporter = (runner) => { };
   * module.exports = reporter;
   * ```
   */
  public static async loadReporter(options: LoadReporterOptions = {}): Promise<RunnerHandler> {
    const reporterName = options.reporter ?? AsMochaReporter.getReporterScriptPath();
    const reporterModule = (await import(reporterName)).default as unknown;
    if (options.verbose) {
      console.log(`Reporter loaded: ${reporterName}`);
    }
    if (typeof reporterModule !== "function") {
      throw new Error(`Imported reporter does not have a default export: ${reporterName}`);
    }
    return reporterModule as RunnerHandler;
  }

  constructor(config: ResolvedConfig) {
    super(config);
    AsMochaReporter.loadReporter().then(() => {
      console.log("Reporter loaded");
    });
  }

  public override on([event, _payload]: ReporterEvent): void {
    console.log(event);
    // TODO
  }
}
