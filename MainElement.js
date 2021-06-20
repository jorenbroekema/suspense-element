export class MainElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Set property to promise initially
    this.list = new Promise((resolve /* , reject */) =>
      setTimeout(() => {
        resolve(['foo', 'bar', 'qux']);
        // reject(); // <-- if you want to see the error fallback, make this suspense reject
      }, 1000),
    );
  }

  // Tag it as a suspense
  get suspenses() {
    return { list: this.list };
  }

  render() {
    this.shadowRoot.innerHTML = `
      <h1>Hello, World!</h1>
      ${
        // Assume it is resolved here and set to its result
        this.list
          ? this.list
              .map(
                (item) => `
          <li>${item}</li>
        `,
              )
              .reduce((acc, item) => acc.concat(item), '')
          : ''
      }
    `;
  }
}
