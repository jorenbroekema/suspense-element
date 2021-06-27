import { SuspenseElement } from '../index.js';

customElements.define('suspense-element', SuspenseElement);

// Mocking a custom element which takes a bit of time to get defined on the
// custom elements registry
setTimeout(async () => {
  const { DemoElement } = await import('./DemoElement.js');
  customElements.define('demo-element', DemoElement);
}, 500);
