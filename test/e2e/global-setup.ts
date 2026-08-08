import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

export default async function globalSetup() {
  await execFileAsync("pnpm", ["db:migrate:local"], {
    cwd: process.cwd(),
    env: process.env
  })
}
