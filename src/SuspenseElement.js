/**
 * @typedef {import('./PendingTaskEvent.js').PendingTaskEvent} PendingTaskEvent
 */
export class SuspenseElement extends HTMLElement {
  get state() {
    return this.getAttribute('state') || 'pending';
  }

  /** @param {string} value */
  set state(value) {
    this.setAttribute('state', value);
  }

  get mainSlot() {
    return this.shadowRoot?.querySelector('slot.main');
  }

  constructor() {
    super();
    this.boundPendingTaskEventHandler = this.pendingTaskEventHandler.bind(this);
    this.addEventListener('pending-task', this.boundPendingTaskEventHandler);
    this.attachShadow({ mode: 'open' });
    this.state = 'pending';
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener('pending-task', this.boundPendingTaskEventHandler);
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

  /** @param {Event} e */
  async pendingTaskEventHandler(e) {
    const _e = /** @type {PendingTaskEvent} */ (e);
    _e.stopPropagation();

    _e.complete
      .then(() => {
        this.state = 'success';
        this.style.setProperty('--main-display', 'block');
        this.style.setProperty('--fallback-display', 'none');
      })
      .catch(() => {
        this.state = 'error';
        this.style.setProperty('--error-display', 'block');
        this.style.setProperty('--fallback-display', 'none');
      });
  }
}
