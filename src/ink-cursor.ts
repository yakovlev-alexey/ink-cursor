import { InkCursorDot } from "./ink-cursor-dot";

const cursorFilter = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <defs>
    <filter id="ink-cursor-goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feColorMatrix in="blur" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -15" result="ink-cursor-goo"/>
      <feComposite in="SourceGraphic" in2="ink-cursor-goo" operator="atop"/>
    </filter>
  </defs>
</svg>`;

const cursorStyles = new CSSStyleSheet();
cursorStyles.replaceSync(`
  span {
    position: fixed;
    
    display: block;

    pointer-events: none;
    
    z-index: var(--ink-cursor-z-index, 1000);
    
    filter: url(#ink-cursor-goo);
  }

  span.disabled {
    display: none;
  }
`);

const CURSOR_NONE_STYLE = "*{cursor: none!important;}";

export class InkCursor extends HTMLElement {
  #lastFrame: number = 0;
  #rafId: number = -1;

  #dots: InkCursorDot[] = [];
  #dotSize: number;
  #dotAmount: number;
  #sineDots: number;

  #idle: boolean = false;
  #idleTimeout: number = 150;
  #idleTimerId: number = -1;

  #cursorPosition = { x: -100, y: -100 };

  #enabled = false;

  #styleElement: HTMLStyleElement | null = null;

  #shadowRoot = this.attachShadow({ mode: "open" });

  static define = (tag = "ink-cursor") => {
    customElements.define(tag, this);
  };

  connectedCallback = () => {
    const isTouchDevice = "ontouchstart" in document.documentElement;
    if (isTouchDevice) {
      return;
    }

    this.#dotSize = Number(this.dataset.dotSize) || 26;
    this.#dotAmount = Number(this.dataset.dotAmount) || 20;
    this.#sineDots =
      Number(this.dataset.sineDots) || Math.floor(this.#dotAmount * 0.3);

    this.#shadowRoot.adoptedStyleSheets = [cursorStyles];
    this.#shadowRoot.innerHTML = cursorFilter;
    this.#setupCursorNoneStyle();

    const span = document.createElement("span");
    this.#shadowRoot.append(span);

    this.#buildDots();
    for (const dot of this.#dots) {
      span.prepend(dot);
    }

    this.#enabled = this.dataset.enabled !== undefined;
    this.#updateStatus();

    this.#lastFrame = Number(new Date());
    this.#render(this.#lastFrame);

    window.addEventListener("mousemove", this.onMouseMove);
  };

  disconnectedCallback = () => {
    window.removeEventListener("mousemove", this.onMouseMove);
    cancelAnimationFrame(this.#rafId);
    clearTimeout(this.#idleTimerId);
  };

  onMouseMove = (event: MouseEvent) => {
    this.#cursorPosition.x = event.clientX - this.#dotSize / 2;
    this.#cursorPosition.y = event.clientY - this.#dotSize / 2;
    this.#resetIdleTimer();
  };

  #buildDots = () => {
    const sizeStep = 1 / this.#dotSize;
    for (let i = 0; i < this.#dotAmount; i++) {
      let dot = new InkCursorDot(this.#dotSize, 1 - sizeStep * this.#dotSize);
      this.#dots.push(dot);
    }
  };

  #goInactive = () => {
    this.#idle = true;
    this.#dots.forEach((dot) => dot.lock());
  };

  #startIdleTimer = () => {
    this.#idleTimerId = setTimeout(this.#goInactive, this.#idleTimeout);
    this.#idle = false;
  };

  #resetIdleTimer = () => {
    clearTimeout(this.#idleTimerId);
    this.#startIdleTimer();
  };

  #render = (timestamp: number) => {
    const delta = timestamp - this.#lastFrame;
    this.#positionCursor(delta);
    this.#lastFrame = timestamp;
    requestAnimationFrame(this.#render);
  };

  #positionCursor = (delta: number) => {
    let x = this.#cursorPosition.x;
    let y = this.#cursorPosition.y;

    this.#dots.forEach((dot, index, dots) => {
      let nextDot = dots[index + 1] || dots[0];
      dot.x = x;
      dot.y = y;
      dot.draw();

      if (!this.#idle || index <= this.#sineDots) {
        const dx = (nextDot.x - dot.x) * 0.35;
        const dy = (nextDot.y - dot.y) * 0.35;
        x += dx;
        y += dy;
      }
    });
  };

  toggle = () => {
    this.#enabled = !this.#enabled;
    this.#updateStatus();
  };

  enable = () => {
    this.#enabled = true;
    this.#updateStatus();
  };

  disable = () => {
    this.#enabled = false;
    this.#updateStatus();
  };

  #updateStatus = () => {
    if (this.#enabled) {
      this.#shadowRoot.querySelector("span")?.classList.remove("disabled");
      this.#styleElement!.innerHTML = CURSOR_NONE_STYLE;
    } else {
      this.#shadowRoot.querySelector("span")?.classList.add("disabled");
      this.#styleElement!.innerHTML = "";
    }
  };

  #setupCursorNoneStyle = () => {
    this.#styleElement = document.querySelector("#ink-cursor-none");
    if (!this.#styleElement) {
      this.#styleElement = document.createElement("style");
      this.#styleElement.type = "text/css";
      this.#styleElement.innerHTML = CURSOR_NONE_STYLE;
      document.body.appendChild(this.#styleElement);
    }
  };
}
