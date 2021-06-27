import { PendingTaskEvent } from '../src/PendingTaskEvent.js';

export class DemoElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    /** @type {string[]} */
    this.listData = [];
  }

  connectedCallback() {
    /** @type {Promise<void>} */
    this.list = new Promise((resolve, reject) =>
      setTimeout(() => {
        this.listData = ['foo', 'bar', 'qux'];
        this.render();
        !this.hasAttribute('reject') ? resolve() : reject();
      }, 1000),
    );
    this.dispatchEvent(new PendingTaskEvent(this.list));
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
      <p>Hello, World!</p>
      <ul>
        ${this.listData
          .map(
            (item) => `
            <li>${item}</li>
          `,
          )
          .reduce((acc, item) => acc.concat(item), '')}
      </ul>
    `;
    }
  }
}
