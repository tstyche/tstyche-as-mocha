import { describe, expect, it } from "tstyche";
import type { AssertionError } from "../source/AssertionError.js";

describe("AssertionError", () => {
  it("is an Error", () => {
    expect<AssertionError>().type.toBeAssignableTo<Error>();
  });
});
