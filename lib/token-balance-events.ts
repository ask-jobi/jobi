"use client"

export const TOKEN_BALANCE_UPDATED_EVENT = "jobi:token-balance-updated"

export function notifyTokenBalanceUpdated() {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(new Event(TOKEN_BALANCE_UPDATED_EVENT))
}

