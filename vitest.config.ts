import { defineConfig } from "vitest/config"
import tsconfigPaths from "vite-tsconfig-paths"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    setupFiles: ["./vitest.env-setup.tsx", "./vitest.component-setup.tsx"],
    exclude: ["test/e2e/**", "node_modules/**", "lib/**", ".next/**", "out/**"],
    coverage: {
      provider: "v8",
      include: ["server/**/*.{ts,tsx}", "app/api/**/*.ts"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 }
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
            "components/editor/**/*.test.{ts,tsx}"
          ],
          exclude: ["server/ai/prompts/**", "components/ui/**"]
        }
      },
      {
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["components/client-components/**/*.test.{ts,tsx}"],
          exclude: ["components/ui/**"]
        }
      }
    ]
  }
})
