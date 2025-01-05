import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { describe, it } from "mocha";
import AsMochaReporter from "../source/AsMochaReporter.js";

const reporterPath = "path/to/reporter.js";
const metaUrl = import.meta.url;
const dirName = global.__dirname ?? path.dirname(fileURLToPath(metaUrl));

describe("AsMochaReporter", () => {
  describe("getReporterScriptPath", () => {
    it("finds -R", () => {
      expect(AsMochaReporter.getReporterScriptPath(["--ignored", "-R", reporterPath, "*.test.ts"])).eq(reporterPath);
    });
    it("finds --reporter", () => {
      expect(AsMochaReporter.getReporterScriptPath(["--ignored", "--reporter", reporterPath, "*.test.ts"])).eq(
        reporterPath,
      );
    });
    it("finds --reporter=path", () => {
      expect(AsMochaReporter.getReporterScriptPath(["--ignored", `--reporter=${reporterPath}`, "*.test.ts"])).eq(
        reporterPath,
      );
    });
    it("throws for missing -R value", () => {
      expect(() => AsMochaReporter.getReporterScriptPath(["--ignored", "-R"])).throws(
        ReferenceError,
        AsMochaReporter.CANNOT_FIND_ERROR,
      );
    });
    it("throws for missing --reporter value", () => {
      expect(() => AsMochaReporter.getReporterScriptPath(["--ignored", "--reporter"])).throws(
        ReferenceError,
        AsMochaReporter.CANNOT_FIND_ERROR,
      );
    });
    it("throws for missing --reporter=path value", () => {
      expect(() => AsMochaReporter.getReporterScriptPath(["--ignored", "--reporter="])).throws(
        ReferenceError,
        AsMochaReporter.CANNOT_FIND_ERROR,
      );
    });
    it("throws for too many reporters", () => {
      expect(() =>
        AsMochaReporter.getReporterScriptPath(["--ignored", "--reporter", reporterPath, "-R", reporterPath]),
      ).throws(ReferenceError, AsMochaReporter.CANNOT_FIND_ERROR);
    });
  });
  describe("loadReporter", () => {
    it("can load from package name", async () => {
      const loaded = await AsMochaReporter.loadReporter({ reporter: "mocha-reporter-gha" });
      expect(loaded).is.a("function");
    });
    it("can load ESM from path", async () => {
      const testReporterPath = path.resolve(dirName, "test-reporter.mjs");
      const loaded = await AsMochaReporter.loadReporter({ reporter: testReporterPath });
      expect(loaded).is.a("function");
      expect(loaded.name).eq("testReporter");
    });
    it("can load CJS from path", async () => {
      const testReporterPath = path.resolve(dirName, "test-reporter.cjs");
      const loaded = await AsMochaReporter.loadReporter({ reporter: testReporterPath });
      expect(loaded).is.a("function");
      expect(loaded.name).eq("testReporter");
    });
  });
});
