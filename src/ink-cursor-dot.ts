const DOT_STYLES = new CSSStyleSheet();
DOT_STYLES.replaceSync(`
  span {
    position: absolute;
    
    display: block;
    background: var(--ink-cursor-background);
    width: var(--ink-cursor-size);
    height: var(--ink-cursor-size);
    border-radius: 50%;

    transform-origin center center;
  }
`);

export class InkCursorDot extends HTMLElement {
  x: number = 0;
  y: number = 0;
  #lockX: number = 0;
  #lockY: number = 0;

  #scale: number = 1;

  #angleX: number = 0;
  #angleY: number = 0;
  #anglespeed: number = 0.05;

  #range: number;
  #limit: number;

  #element: HTMLElement | null = null;
  #shadowRoot = this.attachShadow({ mode: "open" });

  static define(tag = "ink-cursor-dot") {
    customElements.define(tag, this);
  }

  constructor(size: number, scale: number) {
    super();

    this.#scale = scale;
    this.#range = size / 2 - (size / 2) * this.#scale + 2;
    this.#limit = size * 0.75 * this.#scale;
  }

  connectedCallback = () => {
    this.#element = document.createElement("span");
    this.#shadowRoot.adoptedStyleSheets = [DOT_STYLES];
    this.#shadowRoot.appendChild(this.#element);

    this.#updateTransform();
  };

  #updateTransform = () => {
    this.#element!.style.transform = `translate(${this.x}px,${
      this.y
    }px) scale(${this.#scale})`;
  };

  lock = () => {
    this.#lockX = this.x;
    this.#lockY = this.y;
    this.#generateRandomAngles();
  };

  #generateRandomAngles = () => {
    this.#angleX = Math.PI * 2 * Math.random();
    this.#angleY = Math.PI * 2 * Math.random();
  };

  #limitValue = (value: number) => {
    return Math.max(-this.#limit, Math.min(value, this.#limit));
  };

  draw = (idle: boolean = false) => {
    if (idle) {
      this.#angleX += this.#anglespeed;
      this.#angleY += this.#anglespeed;

      this.y =
        this.#lockY + this.#limitValue(Math.sin(this.#angleY) * this.#range);
      this.x =
        this.#lockX + this.#limitValue(Math.sin(this.#angleX) * this.#range);
    }

    this.#updateTransform();
  };
}
