// ========================================
// TOUCH DEVICE UTILITIES
// ========================================

import { addClass, on, domReady } from './dom.js';

/**
 * Detect if device supports touch events
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

/**
 * Detect if device is mobile (based on screen width)
 * @param {number} breakpoint - Breakpoint in pixels (default: 768)
 * @returns {boolean} True if mobile
 */
export function isMobile(breakpoint = 768) {
  return window.innerWidth < breakpoint;
}

/**
 * Detect if device is a tablet (based on screen width and touch)
 * @param {number} minBreakpoint - Min breakpoint (default: 768)
 * @param {number} maxBreakpoint - Max breakpoint (default: 1024)
 * @returns {boolean} True if tablet
 */
export function isTablet(minBreakpoint = 768, maxBreakpoint = 1024) {
  const width = window.innerWidth;
  return width >= minBreakpoint && width < maxBreakpoint && isTouchDevice();
}

/**
 * Get device type string
 * @returns {string} 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType() {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
}

/**
 * Apply touch-specific classes to html/body
 * Adds 'touch-device' class for touch devices
 * Adds 'no-touch' class for non-touch devices
 */
export function applyTouchClasses() {
  const isTouch = isTouchDevice();
  
  if (isTouch) {
    document.documentElement.classList.add('touch-device');
    document.body.classList.add('touch-device');
    document.documentElement.classList.remove('no-touch');
    document.body.classList.remove('no-touch');
  } else {
    document.documentElement.classList.add('no-touch');
    document.body.classList.add('no-touch');
    document.documentElement.classList.remove('touch-device');
    document.body.classList.remove('touch-device');
  }
  
  return isTouch;
}

/**
 * Detect if user prefers reduced motion
 * @returns {boolean} True if prefers reduced motion
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply reduced motion class if user prefers it
 */
export function applyReducedMotionClass() {
  if (prefersReducedMotion()) {
    document.documentElement.classList.add('reduced-motion');
    document.body.classList.add('reduced-motion');
    return true;
  }
  return false;
}

/**
 * Handle touch start event (prevent ghost clicks, etc.)
 * @param {Element} element - Element to attach to
 * @param {Function} handler - Touch start handler
 */
export function onTouchStart(element, handler) {
  if (!element) return;
  
  const touchHandler = (e) => {
    // Only handle if it's a touch event
    if (e.type === 'touchstart') {
      const touch = e.touches[0];
      if (touch) {
        handler(e, touch);
      }
    }
  };
  
  element.addEventListener('touchstart', touchHandler, { passive: true });
  return touchHandler;
}

/**
 * Handle long press on touch devices
 * @param {Element} element - Element to attach to
 * @param {Function} callback - Long press callback
 * @param {number} duration - Duration in ms (default: 500)
 * @returns {Object} Cleanup functions
 */
export function onLongPress(element, callback, duration = 500) {
  if (!element) return null;
  
  let timer = null;
  let startX = 0;
  let startY = 0;
  let isPressed = false;
  let isLongPressTriggered = false;
  
  const start = (e) => {
    const touch = e.touches ? e.touches[0] : e;
    startX = touch.clientX;
    startY = touch.clientY;
    isPressed = true;
    isLongPressTriggered = false;
    
    timer = setTimeout(() => {
      if (isPressed && !isLongPressTriggered) {
        isLongPressTriggered = true;
        callback(e);
      }
    }, duration);
  };
  
  const move = (e) => {
    if (!isPressed) return;
    const touch = e.touches ? e.touches[0] : e;
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    
    // Cancel long press if finger moved too much
    if (deltaX > 10 || deltaY > 10) {
      clearTimeout(timer);
      isPressed = false;
    }
  };
  
  const end = () => {
    clearTimeout(timer);
    isPressed = false;
  };
  
  // Touch events
  element.addEventListener('touchstart', start, { passive: true });
  element.addEventListener('touchmove', move, { passive: true });
  element.addEventListener('touchend', end, { passive: true });
  element.addEventListener('touchcancel', end, { passive: true });
  
  // Mouse fallback (for testing)
  element.addEventListener('mousedown', start);
  element.addEventListener('mousemove', move);
  element.addEventListener('mouseup', end);
  element.addEventListener('mouseleave', end);
  
  return {
    destroy: () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', end);
      element.removeEventListener('touchcancel', end);
      element.removeEventListener('mousedown', start);
      element.removeEventListener('mousemove', move);
      element.removeEventListener('mouseup', end);
      element.removeEventListener('mouseleave', end);
      clearTimeout(timer);
    }
  };
}

/**
 * Prevent zoom on double tap (iOS)
 * @param {Element} element - Element to prevent zoom on
 */
export function preventDoubleTapZoom(element) {
  if (!element || !isTouchDevice()) return;
  
  let lastTouchEnd = 0;
  
  const handler = (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  };
  
  element.addEventListener('touchend', handler, { passive: false });
  return () => element.removeEventListener('touchend', handler);
}

/**
 * Setup viewport meta for touch devices
 * Ensures proper viewport scaling
 */
export function setupTouchViewport() {
  if (!isTouchDevice()) return;
  
  // Check if viewport meta exists
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.name = 'viewport';
    document.head.appendChild(viewport);
  }
  
  // Set proper viewport for touch devices
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
}

/**
 * Initialize touch device detection and optimizations
 */
export function initTouchOptimizations() {
  const isTouch = applyTouchClasses();
  applyReducedMotionClass();
  
  if (isTouch) {
    setupTouchViewport();
    
    // Add touch-specific body class for performance
    addClass(document.body, 'touch-device');
    
    // Prevent zoom on double tap for interactive elements
    document.querySelectorAll('button, a, .clickable, .card-link, .glass-card').forEach(el => {
      preventDoubleTapZoom(el);
    });
    
    console.log('📱 Touch device detected — optimizations applied');
  }
  
  return isTouch;
}

// Auto-initialize on DOM ready
domReady(() => {
  initTouchOptimizations();
  
  // Handle resize events for device type changes
  let resizeTimeout;
  const handleResize = () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Re-check touch classes on orientation change
      applyTouchClasses();
    }, 250);
  };
  
  on(window, 'resize', handleResize);
});