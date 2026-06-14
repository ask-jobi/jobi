#!/usr/bin/env sh
set -eu

required_node_version="$(cat .nvmrc)"
current_node_version="$(node -p 'process.versions.node')"

if [ "$current_node_version" != "$required_node_version" ]; then
  if [ -z "${NVM_DIR:-}" ]; then
    NVM_DIR="$HOME/.nvm"
  fi

  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    echo "Unsupported Node.js version: $current_node_version" >&2
    echo "Jobi requires Node.js $required_node_version." >&2
    echo "Install nvm or switch your Node runtime and try again." >&2
    exit 1
  fi

  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm use "$required_node_version" >/dev/null
fi

exec "$@"
