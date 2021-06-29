import { expect, fixture as _fixture, defineCE, aTimeout } from '@open-wc/testing';
import { PendingTaskEvent, ResetErrorEvent } from '../index.js';
import '../define.js';

/**
 * @typedef {import('../src/SuspenseElement').SuspenseElement} SuspenseElement
 * @typedef {<T extends SuspenseElement>(template: string) => Promise<T>} fixture
 * @type {fixture}
 */
const fixture = _fixture;

class MainElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    /** @type {Promise<void>} */
    this.list = new Promise((resolve, reject) =>
      setTimeout(() => {
        this.listData = ['foo', 'bar', 'qux'];
        !this.hasAttribute('reject') ? resolve() : reject();
      }, 50),
    );
    this.dispatchEvent(new PendingTaskEvent(this.list));
  }
}
const mainTag = defineCE(MainElement);

/** @param {HTMLElement} suspenseEl */
const getMembers = (suspenseEl) => {
  const mainSlottable = /** @type {MainElement} */ (suspenseEl.querySelector(':not([slot])'));
  const mainSlot = /** @type {HTMLSlotElement} */ (
    suspenseEl.shadowRoot?.querySelector('slot:not([name])')
  );
  const errorSlot = /** @type {HTMLSlotElement} */ (
    suspenseEl.shadowRoot?.querySelector('slot[name="error"]')
  );
  const fallbackSlot = /** @type {HTMLSlotElement} */ (
    suspenseEl.shadowRoot?.querySelector('slot[name="fallback"]')
  );
  return { mainSlottable, mainSlot, errorSlot, fallbackSlot };
};

describe('<suspense-element>', () => {
  it('renders 3 slots, default slot, error slot, fallback slot', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    expect(el).shadowDom.to.equal(`
      <slot class="main"></slot>
      <slot name="error"></slot>
      <slot name="fallback"></slot>
    `);
  });

  it('has a state property that reflects the pending task state, starting with "pending"', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    expect(el.state).to.equal('pending');
  });

  it('has a state property that becomes success or error after the pending task is complete', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag} reject></${mainTag}>
      </suspense-element>
    `);
    await aTimeout(50);
    expect(el.state).to.equal('error');

    const elResolve = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);
    await aTimeout(50);
    expect(elResolve.state).to.equal('success');
  });

  it('renders displays fallback slot by default, hides main element and error', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    const { fallbackSlot, errorSlot, mainSlot } = getMembers(el);

    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);
  });

  it('renders main element after the complete Promise on the PendingTaskEvent has resolved', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    const { fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    await aTimeout(50);

    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);
  });

  it('renders error slottable after the complete Promise on the PendingTaskEvent has rejected', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag} reject></${mainTag}>
      </suspense-element>
    `);

    const { fallbackSlot, errorSlot, mainSlot } = getMembers(el);

    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    await aTimeout(50);

    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);
  });

  it('handles subsequent async tasks through pending-task events, showing again the fallback until it resolves', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    const { mainSlottable, fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);
  });

  it('handles multiple stacked pending tasks and resolves to rendering the main element after all of them have resolved', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag}></${mainTag}>
      </suspense-element>
    `);

    const { mainSlottable, fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 150))),
    );
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);
    await aTimeout(150);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);
  });

  it('keeps showing the error slot by default when a single pending task rejects', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag} reject></${mainTag}>
      </suspense-element>
    `);

    const { mainSlottable, fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);
  });

  it('supports resetting the error state in order for pending and success to be possible again', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag} reject></${mainTag}>
      </suspense-element>
    `);

    const { mainSlottable, fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    mainSlottable.dispatchEvent(new ResetErrorEvent());
    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);
  });

  it('supports resetting the error state while a pending task was already sent and is still pending', async () => {
    const el = await fixture(`
      <suspense-element>
        <span slot="fallback">Loading...</span>
        <span slot="error">Error :(</span>
        <${mainTag} reject></${mainTag}>
      </suspense-element>
    `);

    const { mainSlottable, fallbackSlot, errorSlot, mainSlot } = getMembers(el);
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    mainSlottable.dispatchEvent(
      new PendingTaskEvent(new Promise((resolve) => setTimeout(resolve, 50))),
    );
    mainSlottable.dispatchEvent(new ResetErrorEvent());

    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`block`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`none`);

    await aTimeout(50);
    expect(getComputedStyle(errorSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(fallbackSlot).getPropertyValue('display')).to.equal(`none`);
    expect(getComputedStyle(mainSlot).getPropertyValue('display')).to.equal(`block`);
  });
});
