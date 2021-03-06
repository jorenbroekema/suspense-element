# suspense-element

A Web Component abstraction to declaratively render elements that depend on asynchronous processes.
This component has 0 dependencies and is made with native browser technologies only.

Inspired by [React Suspense](https://reactjs.org/docs/react-api.html#reactsuspense) and [Pending Task Protocol proposal](https://github.com/webcomponents/community-protocols/pull/1).

<suspense-element class="demo">
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <demo-element></demo-element>
</suspense-element>

[See the demo](https://suspense-element.netlify.app) or run it locally with `npm start` after installing.

## Features

- Allows to easily render fallback content when the `main-element` is still loading (either itself or internal async processes).
- Allows to easily render error content in case any of the internal async processes reject.

## Usage

### Installation

Installing with NPM

```sh
npm i suspense-element
```

Import the class and define it on the registry yourself, or import the custom elements definition to have it done for you.

```js
import { SuspenseElement } from 'suspense-element';

// Or

import 'suspense-element/define';
```

Render the suspense element with a fallback slot, optionally an error slot.

> The main element that is expected to fire a `PendingTaskEvent`, see example code further down.

```html
<suspense-element>
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <main-element></main-element>
</suspense-element>
```

### Demo resolve

If you're viewing the docs site, below is a demo of the suspense-element where the main element pending task is resolved, in action.

<suspense-element class="demo">
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <demo-element></demo-element>
</suspense-element>

### Demo reject

If you're viewing the docs site, below is a demo of the suspense-element where the main element pending task is rejected, in action.

<suspense-element class="demo">
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <demo-element reject></demo-element>
</suspense-element>

### Example main-element

```js
import { PendingTaskEvent } from 'suspense-element';

class MainElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    /**
     * Set property to promise initially
     * @type {Promise<void>}
     */
    this.list = new Promise((resolve /* , reject */) =>
      setTimeout(() => {
        this.listData = ['foo', 'bar', 'qux'];
        this.render();
        resolve();
        // reject(); // <-- if you want to see the error fallback, make this suspense reject
      }, 1000),
    );

    // Alternatively, combine multiple promises in a wrapping Promise.all()

    this.dispatchEvent(new PendingTaskEvent(this.list));
  }

  render() {
    if (this.shadowRoot) {
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
}
```

### Demo subsequent pending tasks

If you're viewing the docs site, below is a demo of the suspense-element where the main element fires pending tasks in 3 second intervals, each resolving in 1 second. It switches between resolving and rejecting.

<suspense-element class="demo">
  <span slot="fallback">Loading...</span>
  <span slot="error">Error :(</span>
  <demo-element pending-interval></demo-element>
</suspense-element>

#### ResetErrorEvent

When sending multiple pending tasks, either in a single event, stacking multiple, or in subsequent (unstacked) pending tasks, `suspense-element` has to decide what to do when any of these tasks throw.
It will display the error slot if it encounters any error.
It will keep doing so even if all pending tasks have completed (some threw), and you send a new one completely separately.
The reason for this behavior is that when your main element depends on asynchronous tasks, and one of them throws at any point, new pending tasks do not mean a recovery from old errors even if the new task resolves, so it makes more sense to maintain the error state.

If you need to recover from this you can do so manually, by sending a ResetErrorEvent to the `suspense-element`.
This will reset the internal error state and re-evaluate if there are any pending tasks, if so, render the fallback slot.

```js
import { ResetErrorEvent } from 'suspense-element';

class MainElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.dispatchEvent(new PendingTaskEvent(
      new Promise((resolve, reject) => setTimeout(reject, 100)),
    ));

    setTimeout(() => {
      this.dispatchEvent(new ResetErrorEvent());
      // error slot is still displayed, but sending a new pending task event 
      // will set the state to 'pending' and display fallback slot.
    }, 110);
  }
}
```

## Rationale

In my opinion, it is often easier and better to handle conditional rendering based on asynchronous processes in the `main-element` itself.
This suspense-element is just a helper, an alternative, to do this declaratively in HTML instead in case people prefer that...
Similar to React.Suspense, I would not recommend it for common usage, honestly, but perhaps I am not aware of some of its niche use cases where it works well.

There is one hard coupling between the `suspense-element` and the `main-element`.
`main-element` must dispatch a PendingTaskEvent with a `complete` property that contains a Promise (or multiple promises wrapped in a `Promise.all()`).
This is necessary for the `suspense-element` to know for which internal asynchronous processes it should suspend displaying the `main-element` and display the fallback instead. It also uses this to watch for any of these internal processes throwing, and render the error content in that case.