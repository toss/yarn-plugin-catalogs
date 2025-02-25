import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["sources/__tests__/**/*.test.ts"],
    testTimeout: 30000, // 30 seconds, as yarn operations might take time
  },
});
