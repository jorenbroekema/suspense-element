export class ResetErrorEvent extends Event {
  constructor() {
    super('reset-error', { bubbles: true, composed: true });
  }
}
