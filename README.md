# suspense-element

A Web Component abstraction to declaratively render elements that depend on asynchronous processes.
This component has 0 dependencies and is made with native browser technologies only.

Inspired by [React Suspense](https://reactjs.org/docs/react-api.html#reactsuspense)

```html
<suspense-element>
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <main-element></main-element>
</suspense-element>
```

## Features

- Allows to easily render fallback content when the `main-element` is still loading (either itself or internal async processes).
- Allows to easily render error content in case any of the internal async processes reject.

## Usage

```sh
npm i suspense-element
```

```js
// defines it on customElements registry
import 'suspense-element/define';

// or to import the element and handle that yourself or extend it
import { SuspenseElement } from 'suspense-element';
```

## Rationale

In my opinion, it is often easier and better to handle conditional rendering based on asynchronous processes in the `main-element` itself.
This suspense-element is just a helper, an alternative, to do this declaratively in HTML instead in case people prefer that...
Similar to React.Suspense, I would not recommend it for common usage, honestly, but perhaps I am not aware of some of its niche use cases where it works well.

There is one hard coupling between the suspense-element and the main-element.
`main-element` must have a `suspenses` getter that retuns an array of Promises. This is necessary for the `suspense-element` to know for which internal asynchronous processes it should suspend displaying the `main-element` and display the fallback instead. It also uses this to watch for any of these internal processes throwing, and render the error content in that case.

> This is mostly an experimental thing for now, if people want to use it in production environments, please raise an issue and I'll write tests for this.

## Example main-element

```js
export class MainElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.list = new Promise((resolve /* , reject */) =>
      setTimeout(() => {
        this.listData = ['foo', 'bar', 'qux'];
        this.render();
        resolve();
        // reject(); // <-- if you want to see the error fallback, make this suspense reject
      }, 1000),
    );
  }

  // Tag it as a suspense
  get suspenses() {
    return [this.list];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <h1>Hello, World!</h1>
      ${this.listData
        .map(
          (item) => `
          <li>${item}</li>
        `,
        )
        .reduce((acc, item) => acc.concat(item), '')}
    `;
  }
}
```

> With a Lit component you would probably set shouldUpdate to false until all data is available that the template depends on and trigger a manual re-render.
