import {loadEnvConfig} from "@next/env";

loadEnvConfig(process.cwd())
jest.mock('server-only', () => ({}));
