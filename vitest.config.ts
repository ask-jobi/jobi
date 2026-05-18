import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    setupFiles: ["./vitest.env-setup.tsx", "./vitest.component-setup.tsx"],
    exclude: ["test/e2e/**", "node_modules/**", ".next/**", "out/**"],
    coverage: {
      provider: "v8",
      include: [
        "server/**/*.{ts,tsx}",
        "app/api/**/*.ts",
        "client-components/**/*.{ts,tsx}"
      ],
      exclude: [
        "server/ai/prompts/**",
        "node_modules/**",
        ".next/**",
        "out/**"
      ],
      thresholds: { lines: 50, functions: 50, branches: 50, statements: 50 }
    },
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: [
            "server/**/*.test.{ts,tsx}",
            "app/api/**/*.test.{ts,tsx}",
            "app/auth/**/*.test.{ts,tsx}",
            "components/editor/**/*.test.{ts,tsx}",
            "lib/hooks/**/*.test.{ts,tsx}",
            "lib/templates/**/*.test.{ts,tsx}"
          ],
          exclude: ["server/ai/prompts/**", "components/ui/**"]
        }
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["components/**/*.test.{ts,tsx}"],
          exclude: ["components/ui/**"]
        }
      }
    ]
  }
})
