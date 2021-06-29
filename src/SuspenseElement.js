/**
 * @typedef {import('./PendingTaskEvent.js').PendingTaskEvent} PendingTaskEvent
 * @typedef {import('./ResetErrorEvent.js').ResetErrorEvent} ResetErrorEvent
 */
export class SuspenseElement extends HTMLElement {
  get state() {
    return /** @type {string} */ (this.getAttribute('state'));
  }

  /** @param {string} value */
  set state(value) {
    this.setAttribute('state', value);
  }

  get pendingTaskCount() {
    return /** @type {number} */ (this._pendingTaskCount);
  }

  /** @param {number} value */
  set pendingTaskCount(value) {
    this._pendingTaskCount = value;

    this._handleState();
  }

  constructor() {
    super();
    this._pendingTaskCount = 0;
    this.state = 'pending';
    this._errorState = false;
    this.attachShadow({ mode: 'open' });
    this.boundPendingTaskEventHandler = this.pendingTaskEventHandler.bind(this);
    this.boundResetErrorHandler = this.resetErrorHandler.bind(this);
    this.addEventListener('pending-task', this.boundPendingTaskEventHandler);
    this.addEventListener('reset-error', this.boundResetErrorHandler);
    this.render();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --main-display: none;
            --error-display: none;
            --fallback-display: block;
          }

          .main {
            display: var(--main-display);
          }

          [name="error"] {
            display: var(--error-display);
          }

          [name="fallback"] {
            display: var(--fallback-display);
          }
        </style>
        <slot class="main"></slot>
        <slot name="error"></slot>
        <slot name="fallback"></slot>
      `;
    }
  }

  /** @param {ResetErrorEvent} e */
  resetErrorHandler(e) {
    e.stopPropagation();
    this._errorState = false;
    if (this.pendingTaskCount > 0) {
      this._setPending();
    }
  }

  /** @param {Event} e */
  async pendingTaskEventHandler(e) {
    const _e = /** @type {PendingTaskEvent} */ (e);
    _e.stopPropagation();
    this.pendingTaskCount += 1;
    _e.complete
      .catch(() => {
        this._errorState = true;
      })
      .finally(() => {
        this.pendingTaskCount -= 1;
      });
  }

  _handleState() {
    if (this._errorState) {
      this._setError();
      return;
    }

    if (this.pendingTaskCount > 0 && this.state !== 'pending') {
      this._setPending();
      return;
    }

    if (this.pendingTaskCount === 0) {
      this._setSuccess();
    }
  }

  _setPending() {
    this.state = 'pending';
    this.style.setProperty('--error-display', 'none');
    this.style.setProperty('--fallback-display', 'block');
    this.style.setProperty('--main-display', 'none');
  }

  _setError() {
    this.state = 'error';
    this.style.setProperty('--error-display', 'block');
    this.style.setProperty('--fallback-display', 'none');
    this.style.setProperty('--main-display', 'none');
  }

  _setSuccess() {
    this.state = 'success';
    this.style.setProperty('--error-display', 'none');
    this.style.setProperty('--fallback-display', 'none');
    this.style.setProperty('--main-display', 'block');
  }
}
