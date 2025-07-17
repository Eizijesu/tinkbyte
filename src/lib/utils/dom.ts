// src/lib/utils/dom.ts
export function safeQuerySelector<T extends Element>(
    selector: string,
    parent: Document | Element = document
  ): T | null {
    return parent.querySelector<T>(selector);
  }
  
  export function safeGetElementById<T extends HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }
  
  export function safeElementAction<T extends Element>(
    element: T | null,
    action: (el: T) => void
  ): void {
    if (element) {
      action(element);
    }
  }
  
  // Type guards for common element types
  export function isHTMLInputElement(element: Element | null): element is HTMLInputElement {
    return element instanceof HTMLInputElement;
  }
  
  export function isHTMLButtonElement(element: Element | null): element is HTMLButtonElement {
    return element instanceof HTMLButtonElement;
  }
  
  export function isHTMLTextAreaElement(element: Element | null): element is HTMLTextAreaElement {
    return element instanceof HTMLTextAreaElement;
  }
  
  export function isHTMLSelectElement(element: Element | null): element is HTMLSelectElement {
    return element instanceof HTMLSelectElement;
  }
  
  export function isHTMLElement(element: Element | null): element is HTMLElement {
    return element instanceof HTMLElement;
  }
  
  // Safe property access - fixed to handle dataset properly
  export function getDataset(element: Element | null): DOMStringMap | null {
    if (!element) return null;
    
    // Type guard to check if element is HTMLElement or SVGElement
    if (element instanceof HTMLElement || element instanceof SVGElement) {
      return element.dataset;
    }
    
    return null;
  }
  
  export function getElementStyle(element: HTMLElement | null): CSSStyleDeclaration | null {
    return element?.style || null;
  }
  
  // Safe dataset access with type checking
  export function safeGetDataAttribute(element: Element | null, attribute: string): string | undefined {
    const dataset = getDataset(element);
    return dataset?.[attribute];
  }
  
  export function safeSetDataAttribute(element: Element | null, attribute: string, value: string): void {
    const dataset = getDataset(element);
    if (dataset) {
      dataset[attribute] = value;
    }
  }