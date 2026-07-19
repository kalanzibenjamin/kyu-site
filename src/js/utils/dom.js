// ========================================
// DOM UTILITY FUNCTIONS
// ========================================

/**
 * Select a single DOM element
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null} DOM element or null
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Select multiple DOM elements
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {NodeList} NodeList of elements
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Add event listener with shorthand
 * @param {Element|string} target - Element or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 */
export function on(target, event, handler, options = {}) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.addEventListener(event, handler, options);
}

/**
 * Remove event listener
 * @param {Element|string} target - Element or selector
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 */
export function off(target, event, handler) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.removeEventListener(event, handler);
}

/**
 * Add class to element
 * @param {Element|string} target - Element or selector
 * @param {string} className - Class name
 */
export function addClass(target, className) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.classList.add(className);
}

/**
 * Remove class from element
 * @param {Element|string} target - Element or selector
 * @param {string} className - Class name
 */
export function removeClass(target, className) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.classList.remove(className);
}

/**
 * Toggle class on element
 * @param {Element|string} target - Element or selector
 * @param {string} className - Class name
 * @param {boolean} force - Force state (optional)
 */
export function toggleClass(target, className, force) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (typeof force === 'boolean') {
    el.classList.toggle(className, force);
  } else {
    el.classList.toggle(className);
  }
}

/**
 * Check if element has class
 * @param {Element|string} target - Element or selector
 * @param {string} className - Class name
 * @returns {boolean} True if has class
 */
export function hasClass(target, className) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return false;
  return el.classList.contains(className);
}

/**
 * Set element attributes
 * @param {Element|string} target - Element or selector
 * @param {Object} attrs - Key-value pairs of attributes
 */
export function setAttrs(target, attrs) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  Object.entries(attrs).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  });
}

/**
 * Get element attribute
 * @param {Element|string} target - Element or selector
 * @param {string} name - Attribute name
 * @returns {string|null} Attribute value
 */
export function getAttr(target, name) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return null;
  return el.getAttribute(name);
}

/**
 * Set element text content
 * @param {Element|string} target - Element or selector
 * @param {string} text - Text content
 */
export function setText(target, text) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.textContent = text;
}

/**
 * Set element HTML content
 * @param {Element|string} target - Element or selector
 * @param {string} html - HTML content
 */
export function setHtml(target, html) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.innerHTML = html;
}

/**
 * Show element (remove display:none)
 * @param {Element|string} target - Element or selector
 * @param {string} display - Display value (default: 'block')
 */
export function show(target, display = 'block') {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.style.display = display;
}

/**
 * Hide element (set display:none)
 * @param {Element|string} target - Element or selector
 */
export function hide(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  el.style.display = 'none';
}

/**
 * Toggle visibility of element
 * @param {Element|string} target - Element or selector
 * @param {string} display - Display value (default: 'block')
 */
export function toggleVisibility(target, display = 'block') {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  if (el.style.display === 'none' || !el.style.display) {
    el.style.display = display;
  } else {
    el.style.display = 'none';
  }
}

/**
 * Get element's position relative to viewport
 * @param {Element|string} target - Element or selector
 * @returns {Object} Position {top, left, width, height}
 */
export function getPosition(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX,
  };
}

/**
 * Scroll element into view smoothly
 * @param {Element|string} target - Element or selector
 * @param {Object} options - Scroll options
 */
export function scrollToElement(target, options = {}) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return;
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    ...options,
  };
  el.scrollIntoView(defaultOptions);
}

/**
 * Get element's offset from top of document
 * @param {Element|string} target - Element or selector
 * @returns {number} Offset in pixels
 */
export function getOffsetTop(target) {
  const el = typeof target === 'string' ? $(target) : target;
  if (!el) return 0;
  let offset = 0;
  let current = el;
  while (current) {
    offset += current.offsetTop || 0;
    current = current.offsetParent;
  }
  return offset;
}

/**
 * Create a DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes
 * @param {Array|string} children - Child elements or text
 * @returns {Element} Created element
 */
export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object') {
      Object.entries(value).forEach(([prop, val]) => {
        el.style[prop] = val;
      });
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = value;
    } else if (key.startsWith('aria-')) {
      el.setAttribute(key, value);
    } else {
      el.setAttribute(key, value);
    }
  });
  
  // Add children
  if (typeof children === 'string') {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Element) {
        el.appendChild(child);
      }
    });
  }
  
  return el;
}

/**
 * Wait for DOM to be ready
 * @param {Function} callback - Function to execute
 */
export function domReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

/**
 * Wait for element to exist in DOM (with retry)
 * @param {string} selector - CSS selector
 * @param {number} timeout - Max wait time in ms (default: 5000)
 * @param {number} interval - Check interval in ms (default: 100)
 * @returns {Promise<Element>} DOM element
 */
export function waitForElement(selector, timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const el = $(selector);
      if (el) {
        resolve(el);
        return;
      }
      if (Date.now() - start > timeout) {
        reject(new Error(`Element "${selector}" not found after ${timeout}ms`));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}