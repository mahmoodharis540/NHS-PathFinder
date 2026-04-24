import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    fileParallelism: false,
    globalSetup: "./vitest.globalSetup.ts",
    env: {
      DATABASE_URL: "file:./test.db",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
