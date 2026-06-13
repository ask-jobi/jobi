import type {
  RollbackRegistry,
  RollbackAction,
  RollbackResult,
  IntakeEvent
} from "./types"

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_RETRY_DELAY_MS = 200

export type RollbackConfig = {
  maxRetries: number
  retryDelayMs: number
}

/**
 * Explicit rollback registry - no global AsyncLocalStorage.
 * Actions registered in order, executed in reverse.
 * Built-in retry with configurable strategy.
 */
export class RollbackRegistryImpl implements RollbackRegistry {
  private actions: RollbackAction[] = []
  private config: RollbackConfig

  constructor(config?: Partial<RollbackConfig>) {
    this.config = {
      maxRetries: config?.maxRetries ?? DEFAULT_MAX_RETRIES,
      retryDelayMs: config?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS
    }
  }

  register(kind: string, label: string, action: () => Promise<void>): void {
    this.actions.push({ kind, label, execute: action })
  }

  async executeAll(
    emit: (event: IntakeEvent) => Promise<void>
  ): Promise<RollbackResult> {
    await emit({ type: "rollback.start", intakeId: "" })

    const failures: RollbackResult["failures"] = []
    const actions = [...this.actions].reverse()
    this.actions = []

    // execute in reverse registration order
    for (const action of actions) {
      try {
        await this.executeWithRetry(action)
      } catch (err) {
        console.error(
          `Rollback action "${action.label}" (${action.kind}) failed after retries:`,
          err
        )
        failures.push({ label: action.label, error: err })
      }
    }

    const allSucceeded = failures.length === 0
    await emit({
      type: "rollback.done",
      intakeId: "",
      allSucceeded,
      failureCount: failures.length
    })

    return { allSucceeded, failures }
  }

  private async executeWithRetry(action: RollbackAction): Promise<void> {
    let lastError: unknown

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        await action.execute()
        return // success
      } catch (err) {
        lastError = err
        if (attempt < this.config.maxRetries) {
          await new Promise((r) =>
            setTimeout(r, this.config.retryDelayMs * Math.pow(2, attempt))
          )
        }
      }
    }

    throw lastError
  }
}
