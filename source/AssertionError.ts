import type { Diagnostic } from "tstyche/tstyche";

/**
 * An Error subclass with the added extras a Mocha reporter can use
 * to enhance the developer experience.
 * @remarks
 * The IJ Mocha reporter looks for:
 * - `actual` and `expected`, which don't need to be strings, as
 *    the reporter will call `.toString()` on them either way.
 * - `stack` will be trimmed to eliminate the line with the
 *   `message`, and will try to find the first "(file.js:line:char)"
 *   to turn into a clickable source ref.
 * - `showDiff`, a Boolean not used here, can disable the diff UI.
 * - `expectedFilePath` and `actualFilePath`, if present, will cause
 *   the UI to display a diff of those files, not the `actual` and
 *   `expected` values.
 */
export class AssertionError extends Error {
  public override readonly stack: string;
  public readonly actualType: string;
  public readonly matcher: string;
  public readonly expectedType: string;
  public readonly diagnostics: ReadonlyArray<Diagnostic>;
  public readonly sourceLocation: string;

  constructor(
    message: string,
    actualType: string,
    matcher: string,
    expectedType: string,
    diagnostics: ReadonlyArray<Diagnostic>,
    sourceLocation: string,
  ) {
    super(message);
    this.actualType = actualType;
    this.matcher = matcher;
    this.expectedType = expectedType;
    this.diagnostics = diagnostics;
    this.sourceLocation = sourceLocation;
    this.stack = `AssertionError: ${message}\n    at ${matcher} (${sourceLocation})\n`;
  }
}
