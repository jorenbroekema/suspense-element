export class SuspenseElement extends HTMLElement {
  get state() {
    return this.getAttribute('state');
  }

  set state(value) {
    this.setAttribute('state', value);
  }

  get mainSlot() {
    return this.shadowRoot.querySelector('slot.main');
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = 'pending';
  }

  connectedCallback() {
    this.render();
    this.mainSlot.addEventListener('slotchange', this.onSlotChange.bind(this));
  }

  render() {
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

  /**
   * @overridable
   * Override this method to define how the main slottable
   * should be re-rendered now that all data on which the
   * template depends has finished loading.
   */
  // eslint-disable-next-line class-methods-use-this
  _rerenderMainSlottable(mainSlottable) {
    mainSlottable.render();
  }

  async onSlotChange(ev) {
    // Get the default slot assigned node (ignore text nodes)
    const assignedNode = Array.from(ev.target.assignedNodes()).filter(
      (node) => node.nodeName !== '#text',
    )[0];

    // The main slottable might not be defined yet in case of a custom element
    const tagName = assignedNode.tagName.toLowerCase();
    customElements.whenDefined(tagName).then(() => {
      const results = [];
      for (const [key, suspense] of Object.entries(assignedNode.suspenses)) {
        results.push(suspense);
        suspense
          .then((result) => {
            /**
             * Currently this assumes that the main slottable's suspenses
             * will resolve to a value, the variable to which the suspense
             * key references will then be set to that value instead of the
             * Promise which it was before.
             *
             * We then assume there is a render method in the main slottable
             * that we can call, as a re-render is needed now that the data
             * is available..
             */
            assignedNode[key] = result;
            this._rerenderMainSlottable(assignedNode);
          })
          .catch(() => {});
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
