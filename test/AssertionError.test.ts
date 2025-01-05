import { expect } from "chai";
import { describe, it } from "mocha";
import { AssertionError } from "../source/AssertionError.js";

describe("AssertionError", () => {
  it("has a reasonable stack trace", () => {
    const message = "some message";
    const actualType = "actualType";
    const matcher = "matcher";
    const expectedType = "expectedType";
    const sourceLocation: string = "path/to/source.ts:12:34";
    const error = new AssertionError(message, actualType, matcher, expectedType, [], sourceLocation);
    expect(error.stack, "stack").to.match(
      new RegExp(`^${error.name}: ${message}\\s+at ${matcher} \\(${sourceLocation}\\)\s*`),
    );
    expect(error.name, "name").eq("AssertionError");
    expect(error.matcher, "matcher").eq(matcher);
    expect(error.sourceLocation, "sourceLocation").eq(sourceLocation);
    expect(error.actualType, "actualType").eq(actualType);
    expect(error.expectedType, "expectedType").eq(expectedType);
  });
});
