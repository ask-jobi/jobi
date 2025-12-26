import "server-only"

type RollbackAction = () => void | Promise<void>

export class RollbackContext {
  rollbackActions: RollbackAction[] = []
  retryTimes = 3

  constructor() {

  }

  addRollback(func: RollbackAction) {
    this.rollbackActions.push(func)
  }

  private async rollbackRunWithRetry(func: RollbackAction, retryTimes: number = this.retryTimes) {
    try {
      await func()
    } catch (e) {
      if (retryTimes === 0) {
        throw e
      }
      retryTimes --
      await this.rollbackRunWithRetry(func, retryTimes)
    }
  }

  async executeRollback() {
    for (const rollback of [...this.rollbackActions].reverse()) {
      try {
        await this.rollbackRunWithRetry(rollback)
      } catch (error) {
        console.error("Rollback Failed: ", error)
      }
    }
  }
}

export const rollbackStorage = new AsyncLocalStorage<RollbackContext>()
