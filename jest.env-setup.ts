import {config} from "dotenv";

config({path: ".env.test"});
jest.mock('server-only', () => ({}));
