// ========================================
// SCROLL COMPONENT
// ========================================

import { $, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';
import { debounce, throttle, isInViewport } from '../utils/helpers.js';

/**
 * Initialize scroll-to-top button
 * @param {Object} options - Configuration options
 * @param {string} options.buttonSelector - Button selector (default: '#scrollToTop')
 * @param {number} options.threshold - Scroll threshold in px (default: 300)
 * @param {string} options.behavior - Scroll behavior (default: 'smooth')
 * @param {number} options.offset - Offset from top (default: 0)
 */
export function initScrollToTop(options = {}) {
  const config = {
    buttonSelector: '#scrollToTop',
    threshold: 300,
    behavior: 'smooth',
    offset: 0,
    ...options,
  };
  
  const button = $(config.buttonSelector);
  if (!button) return null;
  
  let isVisible = false;
  
  // ========================================
  // 1. SHOW/HIDE BUTTON
  // ========================================
  
  const toggleVisibility = throttle(() => {
    const scrollY = window.scrollY;
    const shouldBeVisible = scrollY > config.threshold;
    
    if (shouldBeVisible !== isVisible) {
      isVisible = shouldBeVisible;
      if (isVisible) {
        addClass(button, 'visible');
        button.setAttribute('aria-hidden', 'false');
      } else {
        removeClass(button, 'visible');
        button.setAttribute('aria-hidden', 'true');
      }
    }
  }, 100);
  
  // ========================================
  // 2. SCROLL TO TOP
  // ========================================
  
  function scrollToTop() {
    window.scrollTo({
      top: config.offset,
      behavior: config.behavior,
    });
  }
  
  // ========================================
  // 3. EVENT LISTENERS
  // ========================================
  
  on(window, 'scroll', toggleVisibility, { passive: true });
  on(button, 'click', scrollToTop);
  
  // Keyboard support
  on(button, 'keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });
  
  // Initial state
  toggleVisibility();
  
  console.log('⬆️ Scroll-to-top initialized');
  
  return {
    scrollToTop,
    toggleVisibility,
    destroy: () => {
      // Cleanup
    },
  };
}

// ========================================
// 2. SCROLL PROGRESS INDICATOR
// ========================================

/**
 * Initialize scroll progress indicator
 * @param {Object} options - Configuration options
 * @param {string} options.selector - Progress bar selector (default: '.scroll-progress')
 * @param {string} options.fillSelector - Progress fill selector (default: '.scroll-progress-fill')
 */
export function initScrollProgress(options = {}) {
  const config = {
    selector: '.scroll-progress',
    fillSelector: '.scroll-progress-fill',
    ...options,
  };
  
  const progress = $(config.selector);
  if (!progress) return null;
  
  const fill = $(config.fillSelector, progress) || progress;
  
  const updateProgress = throttle(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;
    
    if (maxScroll <= 0) {
      fill.style.width = '0%';
      return;
    }
    
    const percent = (scrollTop / maxScroll) * 100;
    fill.style.width = Math.min(100, Math.max(0, percent)) + '%';
    
    // Update aria-valuenow
    progress.setAttribute('aria-valuenow', Math.round(percent));
  }, 50);
  
  on(window, 'scroll', updateProgress, { passive: true });
  on(window, 'resize', updateProgress, { passive: true });
  
  // Initial update
  updateProgress();
  
  console.log('📊 Scroll progress initialized');
  
  return {
    update: updateProgress,
    destroy: () => {
      // Cleanup
    },
  };
}

// ========================================
// 3. SCROLL-TRIGGERED ANIMATIONS (Fade-up)
// ========================================

/**
 * Initialize scroll-triggered fade-up animations
 * @param {Object} options - Configuration options
 * @param {string} options.selector - Elements to observe (default: '.fade-up')
 * @param {number} options.threshold - Intersection threshold (default: 0.1)
 * @param {string} options.rootMargin - Root margin (default: '0px 0px -10% 0px')
 */
export function initScrollAnimations(options = {}) {
  const config = {
    selector: '.fade-up',
    threshold: 0.1,
    rootMargin: '0px 0px -10% 0px',
    ...options,
  };
  
  const elements = document.querySelectorAll(config.selector);
  if (elements.length === 0) return null;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Show all elements immediately
    elements.forEach(el => {
      el.classList.add('visible');
    });
    return null;
  }
  
  // ========================================
  // 3.1 Intersection Observer
  // ========================================
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Optionally unobserve after animation
        // observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: config.threshold,
    rootMargin: config.rootMargin,
  });
  
  // Observe each element
  elements.forEach(el => {
    // If already visible, add class immediately
    if (isInViewport(el, 50)) {
      el.classList.add('visible');
    } else {
      observer.observe(el);
    }
  });
  
  console.log('🎬 Scroll animations initialized');
  
  return {
    observer,
    refresh: () => {
      // Re-observe elements
      elements.forEach(el => {
        if (!el.classList.contains('visible')) {
          observer.observe(el);
        }
      });
    },
    destroy: () => {
      observer.disconnect();
    },
  };
}

// ========================================
// 4. PARALLAX EFFECT (Optional)
// ========================================

/**
 * Initialize simple parallax effect
 * @param {Object} options - Configuration options
 * @param {string} options.selector - Parallax element selector (default: '.parallax')
 * @param {number} options.speed - Parallax speed (default: 0.5)
 * @param {number} options.offset - Offset from top (default: 0)
 */
export function initParallax(options = {}) {
  const config = {
    selector: '.parallax',
    speed: 0.5,
    offset: 0,
    ...options,
  };
  
  const elements = document.querySelectorAll(config.selector);
  if (elements.length === 0) return null;
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;
  
  const updateParallax = throttle(() => {
    const scrollY = window.scrollY;
    
    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const windowCenter = window.innerHeight / 2;
      const offset = (center - windowCenter) / windowCenter;
      
      const translateY = offset * config.speed * 20;
      el.style.transform = `translateY(${translateY}px)`;
    });
  }, 50);
  
  on(window, 'scroll', updateParallax, { passive: true });
  on(window, 'resize', updateParallax, { passive: true });
  
  // Initial update
  updateParallax();
  
  console.log('🌀 Parallax initialized');
  
  return {
    update: updateParallax,
    destroy: () => {
      // Cleanup
    },
  };
}

// ========================================
// 5. SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================

/**
 * Initialize smooth scroll for anchor links
 * @param {Object} options - Configuration options
 * @param {string} options.selector - Anchor link selector (default: 'a[href^="#"]:not([href="#"])')
 * @param {number} options.offset - Offset from top (default: 80)
 * @param {string} options.behavior - Scroll behavior (default: 'smooth')
 */
export function initSmoothScroll(options = {}) {
  const config = {
    selector: 'a[href^="#"]:not([href="#"])',
    offset: 80,
    behavior: 'smooth',
    ...options,
  };
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return null;
  
  const links = document.querySelectorAll(config.selector);
  if (links.length === 0) return null;
  
  links.forEach(link => {
    on(link, 'click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      
      const targetId = href.replace('#', '');
      const target = document.getElementById(targetId);
      
      if (!target) return;
      
      e.preventDefault();
      
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - config.offset;
      
      window.scrollTo({
        top: targetPosition,
        behavior: config.behavior,
      });
      
      // Update URL without reload
      history.pushState(null, '', href);
    });
  });
  
  console.log('🔄 Smooth scroll initialized');
  
  return {
    destroy: () => {
      // Cleanup
    },
  };
}

// ========================================
// 6. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Scroll to top button
  if ($('#scrollToTop')) {
    initScrollToTop();
  }
  
  // Scroll progress
  if ($('.scroll-progress')) {
    initScrollProgress();
  }
  
  // Scroll animations
  if (document.querySelectorAll('.fade-up').length > 0) {
    initScrollAnimations();
  }
  
  // Smooth scroll for anchor links
  if (document.querySelectorAll('a[href^="#"]:not([href="#"])').length > 0) {
    initSmoothScroll();
  }
});