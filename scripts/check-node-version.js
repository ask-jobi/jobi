const REQUIRED_NODE_VERSION = "24.15.0"

if (process.versions.node !== REQUIRED_NODE_VERSION) {
  console.error(
    [
      `Unsupported Node.js version: ${process.versions.node}`,
      `Jobi requires Node.js ${REQUIRED_NODE_VERSION}.`,
      "Run `nvm use` (or switch your Node runtime) and try again."
    ].join("\n")
  )
  process.exit(1)
}
