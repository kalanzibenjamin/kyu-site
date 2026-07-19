// ========================================
// CARDS COMPONENT
// ========================================

import { $, $$, on, domReady } from '../utils/dom.js';
import { isTouchDevice } from '../utils/helpers.js';

/**
 * Initialize clickable cards
 * @param {Object} options - Configuration options
 * @param {string} options.cardSelector - Card selector (default: '.glass-card, .group-card, .card-link')
 * @param {string} options.hrefAttribute - Attribute containing URL (default: 'data-href')
 * @param {string} options.targetAttribute - Attribute containing target (default: 'data-target')
 * @param {boolean} options.openInNewTab - Open links in new tab (default: false)
 * @param {string} options.activeClass - Class for active state (default: 'is-active')
 */
export function initClickableCards(options = {}) {
  const config = {
    cardSelector: '.glass-card, .group-card, .card-link, .clickable-card',
    hrefAttribute: 'data-href',
    targetAttribute: 'data-target',
    openInNewTab: false,
    activeClass: 'is-active',
    ...options,
  };
  
  const cards = $$(config.cardSelector);
  if (cards.length === 0) return;
  
  let touchStartTime = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let hasMoved = false;
  let isTouchDevice_ = isTouchDevice();
  
  // ========================================
  // 1. NAVIGATION HELPER
  // ========================================
  
  function navigateToCard(card, e) {
    const href = card.getAttribute(config.hrefAttribute);
    if (!href || href === '#') return false;
    
    // Check if target is set
    const target = card.getAttribute(config.targetAttribute) || '_self';
    const shouldOpenNewTab = config.openInNewTab || target === '_blank';
    
    // Check if text is selected
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      return false;
    }
    
    // Prevent default if event provided
    if (e) e.preventDefault();
    
    // Open link
    if (shouldOpenNewTab) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = href;
    }
    
    // Track card click
    const event = new CustomEvent('cardClicked', {
      detail: { 
        card, 
        href, 
        target: shouldOpenNewTab ? '_blank' : '_self',
        cardText: card.textContent?.trim().slice(0, 50) || '',
      }
    });
    document.dispatchEvent(event);
    
    return true;
  }
  
  // ========================================
  // 2. CHECK IF TEXT IS SELECTED
  // ========================================
  
  function isTextSelected() {
    const selection = window.getSelection();
    return selection && selection.toString().length > 0;
  }
  
  // ========================================
  // 3. MOUSE EVENTS (Desktop)
  // ========================================
  
  let mouseDownTime = 0;
  let mouseHasMoved = false;
  let mouseDownTarget = null;
  
  cards.forEach(card => {
    on(card, 'mousedown', (e) => {
      // Only handle left click
      if (e.button !== 0) return;
      
      mouseDownTime = Date.now();
      mouseHasMoved = false;
      mouseDownTarget = card;
    });
    
    on(card, 'mousemove', () => {
      if (mouseDownTarget === card) {
        mouseHasMoved = true;
      }
    });
    
    on(card, 'mouseup', (e) => {
      // Only handle left click
      if (e.button !== 0) return;
      
      const pressDuration = Date.now() - mouseDownTime;
      
      // Only navigate if:
      // 1. Not selecting text
      // 2. Mouse didn't move much (not dragging to select)
      // 3. Press duration is less than 500ms (not a long press)
      if (!isTextSelected() && !mouseHasMoved && pressDuration < 500) {
        navigateToCard(card, e);
      }
      
      // Reset
      mouseDownTime = 0;
      mouseHasMoved = false;
      mouseDownTarget = null;
    });
    
    on(card, 'mouseleave', () => {
      mouseDownTime = 0;
      mouseHasMoved = false;
      mouseDownTarget = null;
    });
  });
  
  // ========================================
  // 4. TOUCH EVENTS (Mobile)
  // ========================================
  
  if (isTouchDevice_) {
    let touchCard = null;
    let touchTimeout = null;
    
    cards.forEach(card => {
      on(card, 'touchstart', (e) => {
        const touch = e.touches[0];
        touchStartTime = Date.now();
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        hasMoved = false;
        touchCard = card;
        
        // Clear any existing timeout
        if (touchTimeout) {
          clearTimeout(touchTimeout);
          touchTimeout = null;
        }
        
        // Add visual feedback
        addClass(card, config.activeClass);
      }, { passive: true });
      
      on(card, 'touchmove', (e) => {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartX);
        const deltaY = Math.abs(touch.clientY - touchStartY);
        
        // If moved more than 10px, consider it as scrolling/dragging
        if (deltaX > 10 || deltaY > 10) {
          hasMoved = true;
          removeClass(card, config.activeClass);
        }
      }, { passive: true });
      
      on(card, 'touchend', (e) => {
        const touchDuration = Date.now() - touchStartTime;
        
        // Remove visual feedback
        if (touchCard) {
          removeClass(touchCard, config.activeClass);
        }
        
        // Prevent default to avoid double navigation
        e.preventDefault();
        
        // Check if this was a valid tap
        const isValidTap = !hasMoved && touchDuration < 500 && !isTextSelected();
        
        if (isValidTap && touchCard) {
          // Use timeout to ensure no other touch events interfere
          touchTimeout = setTimeout(() => {
            navigateToCard(touchCard, e);
            touchTimeout = null;
          }, 50);
        }
        
        // Reset values
        touchStartTime = 0;
        hasMoved = false;
        touchCard = null;
      });
      
      on(card, 'touchcancel', () => {
        if (touchCard) {
          removeClass(touchCard, config.activeClass);
        }
        touchStartTime = 0;
        hasMoved = false;
        touchCard = null;
        if (touchTimeout) {
          clearTimeout(touchTimeout);
          touchTimeout = null;
        }
      });
    });
  }
  
  // ========================================
  // 5. KEYBOARD EVENTS (Accessibility)
  // ========================================
  
  cards.forEach(card => {
    // Make cards focusable
    if (!card.getAttribute('tabindex')) {
      card.setAttribute('tabindex', '0');
    }
    
    // Add ARIA role
    if (card.getAttribute(config.hrefAttribute)) {
      card.setAttribute('role', 'link');
    }
    
    // Keyboard support (Enter and Space)
    on(card, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        navigateToCard(card, e);
      }
    });
  });
  
  // ========================================
  // 6. CLICK FALLBACK (for safety)
  // ========================================
  
  cards.forEach(card => {
    on(card, 'click', (e) => {
      // Skip if already handled by touch
      if (isTouchDevice_ && Date.now() - touchStartTime < 200) {
        return;
      }
      
      // Skip if text is selected
      if (isTextSelected()) {
        return;
      }
      
      // Only navigate if not handled by mouse/touch events
      navigateToCard(card, e);
    });
  });
  
  console.log('🃏 Clickable cards initialized');
  
  return {
    navigateTo: navigateToCard,
    refresh: () => {
      // Re-initialize for dynamically added cards
    },
    destroy: () => {
      // Cleanup logic
    },
  };
}

// ========================================
// 7. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Check if any clickable cards exist
  const cards = document.querySelectorAll('.glass-card, .group-card, .card-link, .clickable-card');
  if (cards.length > 0) {
    initClickableCards();
  }
});