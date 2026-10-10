import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterAll } from "vitest";

const requestedDir = process.env.WISSENSQUIZ_TEST_REPORT_DIR;
const temporaryRoot = realpathSync(tmpdir());
const reportDir =
  requestedDir ?? mkdtempSync(join(temporaryRoot, "wissensquiz-test-reports-"));
mkdirSync(reportDir, { recursive: true });

afterAll(() => {
  if (requestedDir) return;
  // Only remove the fresh directory created by this test module.
  if (dirname(resolve(reportDir)) !== temporaryRoot)
    throw new Error("Unerwarteter Testberichtspfad.");
  rmSync(reportDir, { recursive: true, force: true });
});

export const testReportPath = (filename: string) => join(reportDir, filename);
