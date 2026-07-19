// ========================================
// THEME COMPONENT
// ========================================

import { $, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';

const THEME_KEY = 'kyu-theme';
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

/**
 * Get the current theme from localStorage
 * @returns {string} 'dark' or 'light'
 */
export function getTheme() {
  return localStorage.getItem(THEME_KEY) || THEME_DARK;
}

/**
 * Set the theme and save to localStorage
 * @param {string} theme - 'dark' or 'light'
 */
export function setTheme(theme) {
  const validTheme = theme === THEME_LIGHT ? THEME_LIGHT : THEME_DARK;
  const root = document.documentElement;
  const body = document.body;
  
  // Apply theme to the root element and body early
  if (validTheme === THEME_LIGHT) {
    addClass(root, 'light-mode');
    addClass(body, 'light-mode');
    root.style.colorScheme = 'light';
  } else {
    removeClass(root, 'light-mode');
    removeClass(body, 'light-mode');
    root.style.colorScheme = 'dark';
  }
  
  root.setAttribute('data-theme', validTheme);
  
  // Save to localStorage
  localStorage.setItem(THEME_KEY, validTheme);
  
  // Update theme toggle button
  updateThemeButton(validTheme);
  
  // Dispatch custom event for other components
  const event = new CustomEvent('themeChange', { detail: { theme: validTheme } });
  document.dispatchEvent(event);
  
  console.log(`🎨 Theme set to: ${validTheme}`);
}

/**
 * Toggle between light and dark mode
 */
export function toggleTheme() {
  const current = getTheme();
  const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
  setTheme(next);
}

/**
 * Update the theme toggle button icon
 * @param {string} theme - 'dark' or 'light'
 */
export function updateThemeButton(theme) {
  const toggle = $('#themeToggle');
  if (!toggle) return;
  
  const icon = toggle.querySelector('i');
  if (!icon) return;
  
  if (theme === THEME_LIGHT) {
    icon.className = 'fas fa-sun';
    toggle.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    icon.className = 'fas fa-moon';
    toggle.setAttribute('aria-label', 'Switch to light mode');
  }
}

/**
 * Initialize theme toggle button
 * Handles both theme toggle and scroll-to-top functionality
 */
export function initThemeToggle() {
  const toggle = $('#themeToggle');
  if (!toggle) return;
  
  // Get initial theme
  const currentTheme = getTheme();
  setTheme(currentTheme);
  
  // Click handler
  on(toggle, 'click', () => {
    // Check if we're in scroll-to-top mode
    if (toggle.classList.contains('scroll-top')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Toggle theme
    toggleTheme();
  });
  
  // Handle scroll for button visibility and mode switching
  let isVisible = false;
  let isScrollTopMode = false;
  const SCROLL_THRESHOLD = 220;
  
  const handleScroll = () => {
    const scrollY = window.scrollY;
    const shouldBeVisible = scrollY > 100;
    const shouldBeScrollTop = scrollY > SCROLL_THRESHOLD;
    
    // Handle visibility
    if (shouldBeVisible !== isVisible) {
      isVisible = shouldBeVisible;
      if (isVisible) {
        addClass(toggle, 'visible');
        removeClass(toggle, 'fade-out');
        
        // Auto-fade after 3 seconds of inactivity
        clearTimeout(window._themeFadeTimer);
        window._themeFadeTimer = setTimeout(() => {
          removeClass(toggle, 'visible');
          addClass(toggle, 'fade-out');
        }, 3000);
      } else {
        removeClass(toggle, 'visible');
        addClass(toggle, 'fade-out');
      }
    }
    
    // Handle scroll-to-top mode
    if (shouldBeScrollTop !== isScrollTopMode) {
      isScrollTopMode = shouldBeScrollTop;
      if (isScrollTopMode) {
        addClass(toggle, 'scroll-top');
        const icon = toggle.querySelector('i');
        if (icon) {
          icon.className = 'fas fa-arrow-up';
          toggle.setAttribute('aria-label', 'Scroll to top');
        }
      } else {
        removeClass(toggle, 'scroll-top');
        const currentTheme = getTheme();
        updateThemeButton(currentTheme);
      }
    }
  };
  
  // Debounced scroll handler
  let ticking = false;
  const scrollHandler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  on(window, 'scroll', scrollHandler, { passive: true });
  
  // Show button on mouse movement near bottom
  let mouseTimeout;
  on(document, 'mousemove', (e) => {
    const viewportHeight = window.innerHeight;
    if (e.clientY > viewportHeight - 100) {
      addClass(toggle, 'visible');
      removeClass(toggle, 'fade-out');
      
      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        if (window.scrollY < 100) {
          removeClass(toggle, 'visible');
          addClass(toggle, 'fade-out');
        }
      }, 3000);
    }
  });
  
  // Initial state
  handleScroll();
  
  console.log('🎨 Theme toggle initialized');
}

/**
 * Apply system preference (optional)
 * Reads prefers-color-scheme and applies if no saved preference
 */
export function applySystemPreference() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  
  // If user has already set a preference, respect it
  if (savedTheme) return;
  
  // Check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const systemTheme = prefersDark ? THEME_DARK : THEME_LIGHT;
  
  setTheme(systemTheme);
  console.log(`🌓 Applied system preference: ${systemTheme}`);
}

/**
 * Listen for system theme changes
 * Updates the site when system preference changes
 */
export function listenForSystemThemeChanges() {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (e) => {
    // Only apply if user hasn't manually set a preference
    if (!localStorage.getItem(THEME_KEY)) {
      const newTheme = e.matches ? THEME_DARK : THEME_LIGHT;
      setTheme(newTheme);
      console.log(`🌓 System theme changed to: ${newTheme}`);
    }
  };
  
  // Use the modern API if available
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleChange);
  } else if (mediaQuery.addListener) {
    // Fallback for older browsers
    mediaQuery.addListener(handleChange);
  }
}

/**
 * Initialize theme system
 */
export function initTheme() {
  // Apply system preference if no saved theme
  applySystemPreference();
  
  // Initialize theme toggle
  initThemeToggle();
  
  // Listen for system theme changes
  listenForSystemThemeChanges();
  
  console.log('🎨 Theme system initialized');
}

// Auto-initialize on DOM ready
domReady(() => {
  initTheme();
});