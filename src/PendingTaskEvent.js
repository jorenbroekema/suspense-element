export class PendingTaskEvent extends Event {
  /** @param {Promise<void> | Promise<void>[]} complete */
  constructor(complete) {
    super('pending-task', { bubbles: true, composed: true });
    this.complete = complete;
  }
}
