export class InkCursor extends HTMLElement {
  static define(tagName = "ink-cursor") {
    customElements.define(tagName, this);
  }

  connectedCallback() {
    console.log("connected");
  }
}
