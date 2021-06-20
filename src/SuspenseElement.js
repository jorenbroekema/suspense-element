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
    this.attachShadow({ mode: 'open' });
    this.state = 'pending';
  }

  connectedCallback() {
    this.render();
    this.mainSlot?.addEventListener('slotchange', this.onSlotChange.bind(this));
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

  /**
   * @param {Event} ev
   */
  async onSlotChange(ev) {
    // Get the default slot assigned node (ignore text nodes)
    const assignedNode =
      /** @type {Array<HTMLElement & { suspenses: Promise<unknown>[]}>} */ (
        Array.from(
          /** @type {HTMLSlotElement} */ (ev.target).assignedNodes(),
        ).filter((node) => node.nodeName !== '#text')
      )[0];

    // The main slottable might not be defined yet in case of a custom element
    const tagName = assignedNode.tagName.toLowerCase();
    customElements.whenDefined(tagName).then(() => {
      const results = [];
      for (const suspense of assignedNode.suspenses) {
        results.push(suspense);
      }

      Promise.all(results)
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
    });
  }
}
