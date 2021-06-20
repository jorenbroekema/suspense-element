import { SuspenseElement } from './SuspenseElement.js';

customElements.define('suspense-element', SuspenseElement);

// Mocking a custom element which takes a bit of time to get defined on the
// custom elements registry
setTimeout(async () => {
  const { MainElement } = await import('./MainElement.js');
  customElements.define('main-element', MainElement);
}, 500);
