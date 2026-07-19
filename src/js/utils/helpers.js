// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format a date string to readable format
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale string (default: 'en-UG')
 * @returns {string} Formatted date
 */
export function formatDate(date, locale = 'en-UG') {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d)) return 'Invalid date';
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Format a date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date with time
 */
export function formatDateTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d)) return 'Invalid date';
  
  return new Intl.DateTimeFormat('en-UG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Truncate text to a certain length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length (default: 100)
 * @param {string} suffix - Suffix to add (default: '…')
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100, suffix = '…') {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + suffix;
}

/**
 * Debounce function for performance (search, resize, scroll)
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms (default: 300)
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function for performance (scroll, resize)
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in ms (default: 200)
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 200) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Check if element is in viewport
 * @param {Element} element - DOM element to check
 * @param {number} offset - Offset in pixels (default: 0)
 * @returns {boolean} True if in viewport
 */
export function isInViewport(element, offset = 0) {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= windowHeight + offset &&
    rect.right <= windowWidth + offset
  );
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.error('Failed to copy text:', error);
    return false;
  }
}

/**
 * Generate a random ID
 * @param {number} length - Length of ID (default: 8)
 * @returns {string} Random ID
 */
export function generateId(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Get URL parameter by name
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null
 */
export function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Update URL parameter without reloading
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
export function updateUrlParam(name, value) {
  const url = new URL(window.location);
  if (value) {
    url.searchParams.set(name, value);
  } else {
    url.searchParams.delete(name);
  }
  window.history.replaceState({}, '', url);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} html - HTML string to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
export function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration
 */
export function setCookie(name, value, days = 30) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Get page name from body data attribute or URL
 * @returns {string} Page name
 */
export function getPageName() {
  // Check body data attribute first
  const body = document.body;
  if (body.dataset.page) return body.dataset.page;
  
  // Fallback: get from URL
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return 'home';
  
  const parts = path.split('/').filter(Boolean);
  return parts[0] || 'home';
}

/**
 * Is mobile device (simple check)
 * @returns {boolean} True if mobile
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Is touch device
 * @returns {boolean} True if touch capable
 */
export function isTouchDevice() {
  return (
    ('ontouchstart' in window) ||
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0) ||
    window.matchMedia('(pointer: coarse)').matches
  );
}