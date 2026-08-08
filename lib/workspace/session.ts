const COOKIE_NAME = "jobi_workspace"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365
const DEVELOPMENT_SECRET = "jobi-local-workspace-secret-change-me"

const encoder = new TextEncoder()

function getWorkspaceSecret() {
  const secret = process.env.WORKSPACE_COOKIE_SECRET

  if (secret) {
    return secret
  }

  if (process.env.NODE_ENV !== "production") {
    return DEVELOPMENT_SECRET
  }

  throw new Error("WORKSPACE_COOKIE_SECRET is required in production")
}

function encodeBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

async function importSecretKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getWorkspaceSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
}

export async function createWorkspaceToken(workspaceId = crypto.randomUUID()) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importSecretKey(),
    encoder.encode(workspaceId)
  )

  return `${workspaceId}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyWorkspaceToken(token: string | undefined) {
  if (!token) {
    return null
  }

  const separatorIndex = token.indexOf(".")
  if (separatorIndex <= 0 || separatorIndex === token.length - 1) {
    return null
  }

  const workspaceId = token.slice(0, separatorIndex)
  const encodedSignature = token.slice(separatorIndex + 1)

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importSecretKey(),
      decodeBase64Url(encodedSignature),
      encoder.encode(workspaceId)
    )

    return valid ? workspaceId : null
  } catch {
    return null
  }
}

export const workspaceCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS
  }
}
