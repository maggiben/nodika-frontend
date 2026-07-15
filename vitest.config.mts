import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      exclude: [
        "src/**/*.test.*",
        "src/**/*.spec.*",
        "src/proxy.ts",
        "src/test-utils/**",
        "src/i18n/dictionaries/**",
        "src/app/[locale]/layout.tsx",
        "src/app/[locale]/upload/page.tsx",
        "src/app/[locale]/settings/page.tsx",
        "src/app/[locale]/staff/page.tsx",
        "src/components/staff-messaging-form.tsx",
        "src/components/staff-catalog-panel.tsx",
        "src/lib/messaging-bff.ts",
        "src/app/api/messaging/**",
      ],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
