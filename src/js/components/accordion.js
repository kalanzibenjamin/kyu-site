// ========================================
// ACCORDION COMPONENT
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, toggleClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize accordion component
 * @param {Object} options - Configuration options
 * @param {string} options.containerSelector - Accordion container selector (default: '.faq-list')
 * @param {string} options.itemSelector - Accordion item selector (default: '.faq-item')
 * @param {string} options.headerSelector - Accordion header selector (default: '.faq-question')
 * @param {string} options.contentSelector - Accordion content selector (default: '.faq-answer')
 * @param {string} options.openClass - Class for open state (default: 'is-open')
 * @param {boolean} options.allowMultiple - Allow multiple open items (default: false)
 * @param {number} options.maxOpen - Maximum number of open items (default: 3)
 * @param {boolean} options.autoCloseOthers - Auto close other items when opening (default: true)
 */
export function initAccordion(options = {}) {
  const config = {
    containerSelector: '.faq-list',
    itemSelector: '.faq-item',
    headerSelector: '.faq-question',
    contentSelector: '.faq-answer',
    openClass: 'is-open',
    allowMultiple: false,
    maxOpen: 3,
    autoCloseOthers: true,
    ...options,
  };
  
  const container = $(config.containerSelector);
  if (!container) {
    // No accordion container found
    return null;
  }

  if (container.dataset.accordionInitialized === 'true') {
    return null;
  }

  container.dataset.accordionInitialized = 'true';
  
  const items = $$(config.itemSelector, container);
  if (items.length === 0) return null;
  
  // Track open items
  let openItems = [];
  
  // ========================================
  // 1. OPEN / CLOSE ITEM
  // ========================================
  
  function openItem(item) {
    if (!item) return;
    
    const header = $(config.headerSelector, item);
    const content = $(config.contentSelector, item);
    const icon = header ? header.querySelector('.collapse-icon, .faq-icon') : null;
    
    // Add open class
    addClass(item, config.openClass);
    
    // Update header attributes
    if (header) {
      header.setAttribute('aria-expanded', 'true');
    }
    
    // Update icon
    if (icon) {
      removeClass(icon, 'fa-chevron-right');
      addClass(icon, 'fa-chevron-down');
    }
    
    // Set max-height for smooth animation
    if (content) {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
    
    // Add to open items list
    const itemId = getItemId(item);
    if (itemId && !openItems.includes(itemId)) {
      openItems.push(itemId);
    }
    
    // Enforce max open limit
    if (openItems.length > config.maxOpen) {
      const oldestId = openItems.shift();
      const oldestItem = $(`[data-accordion-id="${oldestId}"]`);
      if (oldestItem) {
        closeItem(oldestItem);
      }
    }
  }
  
  function closeItem(item) {
    if (!item) return;
    
    const header = $(config.headerSelector, item);
    const content = $(config.contentSelector, item);
    const icon = header ? header.querySelector('.collapse-icon, .faq-icon') : null;
    
    // Remove open class
    removeClass(item, config.openClass);
    
    // Update header attributes
    if (header) {
      header.setAttribute('aria-expanded', 'false');
    }
    
    // Update icon
    if (icon) {
      removeClass(icon, 'fa-chevron-down');
      addClass(icon, 'fa-chevron-right');
    }
    
    // Reset max-height
    if (content) {
      content.style.maxHeight = '0';
    }
    
    // Remove from open items list
    const itemId = getItemId(item);
    if (itemId) {
      openItems = openItems.filter(id => id !== itemId);
    }
  }
  
  function toggleItem(item) {
    if (!item) return;
    
    const isOpen = hasClass(item, config.openClass);
    
    // If auto-close others is enabled, close all other items
    if (!config.allowMultiple && config.autoCloseOthers && !isOpen) {
      items.forEach(otherItem => {
        if (otherItem !== item && hasClass(otherItem, config.openClass)) {
          closeItem(otherItem);
        }
      });
    }
    
    if (isOpen) {
      closeItem(item);
    } else {
      openItem(item);
    }
  }
  
  // ========================================
  // 2. UTILITY FUNCTIONS
  // ========================================
  
  function getItemId(item) {
    return item.dataset.accordionId || item.id || null;
  }
  
  function getItemById(id) {
    if (!id) return null;
    return $(`[data-accordion-id="${id}"]`) || $(`#${id}`);
  }
  
  // ========================================
  // 3. EVENT LISTENERS
  // ========================================
  
  // Click on header to toggle
  items.forEach(item => {
    const header = $(config.headerSelector, item);
    if (!header) return;
    
    // Set ARIA attributes
    const isOpen = hasClass(item, config.openClass);
    header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    header.setAttribute('role', 'button');
    
    // Add unique ID if not present
    if (!item.id && !item.dataset.accordionId) {
      const id = 'accordion-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      item.dataset.accordionId = id;
    }
    
    // Click handler
    on(header, 'click', (e) => {
      e.preventDefault();
      toggleItem(item);
    });
    
    // Keyboard support (Enter and Space)
    on(header, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleItem(item);
      }
      
      // Arrow navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = Array.from(items).indexOf(item);
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const targetIndex = currentIndex + direction;
        
        if (targetIndex >= 0 && targetIndex < items.length) {
          const targetItem = items[targetIndex];
          const targetHeader = $(config.headerSelector, targetItem);
          if (targetHeader) {
            targetHeader.focus();
          }
        }
      }
      
      // Home / End keys
      if (e.key === 'Home') {
        e.preventDefault();
        const firstHeader = $(config.headerSelector, items[0]);
        if (firstHeader) firstHeader.focus();
      }
      
      if (e.key === 'End') {
        e.preventDefault();
        const lastHeader = $(config.headerSelector, items[items.length - 1]);
        if (lastHeader) lastHeader.focus();
      }
    });
  });
  
  // ========================================
  // 4. OPEN FROM HASH (URL anchor)
  // ========================================
  
  function openFromHash() {
    const hash = window.location.hash;
    if (!hash) return;
    
    // Check if hash matches an accordion item
    const targetId = hash.replace('#', '');
    const targetItem = $(`#${targetId}`) || $(`[data-accordion-id="${targetId}"]`);
    
    if (targetItem && targetItem.matches(config.itemSelector)) {
      // Wait a bit for page to load
      setTimeout(() => {
        openItem(targetItem);
        // Scroll to the item
        targetItem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }
  
  // ========================================
  // 5. SEARCH/FILTER FOR FAQ (Optional)
  // ========================================
  
  function initFaqSearch() {
    const searchInput = $('.faq-search input');
    if (!searchInput) return;
    
    const searchHandler = debounce((query) => {
      const trimmed = query.trim().toLowerCase();
      
      items.forEach(item => {
        const header = $(config.headerSelector, item);
        const content = $(config.contentSelector, item);
        const text = (header?.textContent || '') + ' ' + (content?.textContent || '');
        
        if (trimmed.length < 2) {
          item.style.display = '';
          return;
        }
        
        if (text.toLowerCase().includes(trimmed)) {
          item.style.display = '';
          // Auto-open matching items
          if (!hasClass(item, config.openClass)) {
            openItem(item);
          }
        } else {
          item.style.display = 'none';
          if (hasClass(item, config.openClass)) {
            closeItem(item);
          }
        }
      });
    }, 300);
    
    on(searchInput, 'input', (e) => {
      searchHandler(e.target.value);
    });
    
    // Clear search on Escape
    on(searchInput, 'keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchHandler('');
        searchInput.blur();
      }
    });
  }
  
  // ========================================
  // 6. EXPOSE API
  // ========================================
  
  const api = {
    openItem,
    closeItem,
    toggleItem,
    getOpenItems: () => openItems,
    getAllItems: () => items,
    openFromHash,
    destroy: () => {
      // Cleanup logic
    },
  };
  
  // ========================================
  // 7. INITIALIZE
  // ========================================
  
  // Open items with initial open class
  items.forEach(item => {
    if (hasClass(item, config.openClass)) {
      const itemId = getItemId(item);
      if (itemId) {
        openItems.push(itemId);
      }
      // Set initial max-height
      const content = $(config.contentSelector, item);
      if (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
      const header = $(config.headerSelector, item);
      if (header) {
        header.setAttribute('aria-expanded', 'true');
      }
    }
  });
  
  // Open from URL hash
  openFromHash();
  
  // Initialize FAQ search
  initFaqSearch();
  
  // Listen for hash changes
  on(window, 'hashchange', openFromHash);
  
  console.log('📋 Accordion initialized');
  
  return api;
}

