import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/*.test.ts"],
    // Full catalog and SQL fixtures are memory-intensive; keep the default
    // run bounded even on machines with many logical CPUs.
    maxWorkers: 2,
  },
});
