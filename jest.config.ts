/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest"
import path from "path"

const baseConfig: Config = {
  moduleDirectories: ["node_modules", "<rootDir>"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },

  modulePathIgnorePatterns: ["test/e2e/", "node_modules/", "lib/"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          module: "ESNext",
          target: "ES2020"
        }
      }
    ]
  },

  preset: "ts-jest",

  setupFilesAfterEnv: ["<rootDir>/jest.env-setup.ts"]
}

const serverConfig: Config = {
  ...baseConfig,
  displayName: "server",
  testEnvironment: "node",
  rootDir: path.resolve(__dirname),
  testMatch: [
    "<rootDir>/server/**/*.test.{ts,tsx}",
    "<rootDir>/app/api/**/*.test.{ts,tsx}",
    "<rootDir>/components/editor/**/*.test.{ts,tsx}"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/server/ai/prompts",
    "<rootDir>/components/ui/"
  ],
  collectCoverageFrom: [
    "<rootDir>/server/**/*.{ts,tsx}",
    "<rootDir>/app/api/**/*.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}

const componentConfig: Config = {
  ...baseConfig,
  displayName: "components",
  testEnvironment: "jsdom",
  rootDir: path.resolve(__dirname),
  testMatch: ["<rootDir>/components/client-components/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["<rootDir>/components/ui/"],
  collectCoverageFrom: ["<rootDir>/components/client-components/**/*.{ts,tsx}"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: [
    "<rootDir>/jest.env-setup.ts",
    "<rootDir>/jest.component-setup.ts"
  ],
  transformIgnorePatterns: ["node_modules/(?!(next-intl)/)"]
}

const config: Config = {
  projects: [serverConfig, componentConfig]
}

export default config
