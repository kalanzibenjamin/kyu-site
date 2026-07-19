// ========================================
// FILTERS COMPONENT
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, toggleClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize filter component
 * @param {Object} options - Configuration options
 * @param {string} options.containerSelector - Filter container selector (default: '.filter-container')
 * @param {string} options.itemsSelector - Items to filter selector (default: '.filter-item')
 * @param {string} options.buttonsSelector - Filter buttons selector (default: '.filter-btn')
 * @param {string} options.filterAttribute - Data attribute for filter value (default: 'data-filter')
 * @param {string} options.activeClass - Active class for buttons (default: 'active')
 * @param {string} options.hiddenClass - Hidden class for items (default: 'filter-hidden')
 * @param {string} options.animationClass - Animation class (default: 'filter-animate')
 * @param {boolean} options.showAllOnEmpty - Show all when no filter selected (default: true)
 * @param {string} options.defaultFilter - Default filter value (default: 'all')
 * @param {number} options.animationDelay - Delay between animations (default: 50)
 */
export function initFilters(options = {}) {
  const config = {
    containerSelector: '.filter-container',
    itemsSelector: '.filter-item',
    buttonsSelector: '.filter-btn',
    filterAttribute: 'data-filter',
    activeClass: 'active',
    hiddenClass: 'filter-hidden',
    animationClass: 'filter-animate',
    showAllOnEmpty: true,
    defaultFilter: 'all',
    animationDelay: 50,
    ...options,
  };
  
  const container = $(config.containerSelector);
  if (!container) return null;
  
  const items = $$(config.itemsSelector, container);
  const buttons = $$(config.buttonsSelector, container);
  
  if (items.length === 0 || buttons.length === 0) return null;
  
  let currentFilter = config.defaultFilter;
  let isAnimating = false;
  
  // ========================================
  // 1. GET UNIQUE FILTER VALUES
  // ========================================
  
  function getFilterValues() {
    const values = new Set(['all']);
    items.forEach(item => {
      const filter = item.getAttribute(config.filterAttribute);
      if (filter) {
        values.add(filter);
      }
    });
    return Array.from(values);
  }
  
  const filterValues = getFilterValues();
  
  // ========================================
  // 2. FILTER FUNCTION
  // ========================================
  
  function filterItems(filterValue) {
    if (isAnimating) return;
    
    currentFilter = filterValue;
    
    // Update buttons
    buttons.forEach(btn => {
      const btnFilter = btn.getAttribute(config.filterAttribute);
      if (btnFilter === filterValue) {
        addClass(btn, config.activeClass);
        btn.setAttribute('aria-pressed', 'true');
      } else {
        removeClass(btn, config.activeClass);
        btn.setAttribute('aria-pressed', 'false');
      }
    });
    
    // Get items to show/hide
    const itemsToShow = [];
    const itemsToHide = [];
    
    items.forEach(item => {
      const itemFilter = item.getAttribute(config.filterAttribute);
      const shouldShow = filterValue === 'all' || itemFilter === filterValue;
      
      if (shouldShow) {
        itemsToShow.push(item);
        // Remove hidden class
        removeClass(item, config.hiddenClass);
      } else {
        itemsToHide.push(item);
        // Add hidden class with animation
        addClass(item, config.hiddenClass);
      }
    });
    
    // Animate in items that are becoming visible
    itemsToShow.forEach((item, index) => {
      // Reset animation
      removeClass(item, config.animationClass);
      
      // Trigger reflow
      void item.offsetWidth;
      
      // Add animation with delay
      setTimeout(() => {
        addClass(item, config.animationClass);
      }, index * config.animationDelay);
    });
    
    // Check if any items are visible
    const visibleCount = itemsToShow.length;
    const noResults = container.querySelector('.no-results');
    if (noResults) {
      if (visibleCount === 0) {
        noResults.style.display = 'block';
        const message = noResults.querySelector('.no-results-message');
        if (message) {
          const filterName = buttons.find(b => 
            b.getAttribute(config.filterAttribute) === filterValue
          )?.textContent || filterValue;
          message.textContent = `No items found for "${filterName}"`;
        }
      } else {
        noResults.style.display = 'none';
      }
    }
    
    // Dispatch filter event
    const event = new CustomEvent('filterChanged', {
      detail: { 
        filter: filterValue, 
        visibleCount,
        totalCount: items.length,
      }
    });
    document.dispatchEvent(event);
  }
  
  // ========================================
  // 3. EVENT LISTENERS
  // ========================================
  
  buttons.forEach(btn => {
    // Click handler
    on(btn, 'click', (e) => {
      e.preventDefault();
      const filter = btn.getAttribute(config.filterAttribute);
      if (filter && filter !== currentFilter) {
        filterItems(filter);
      }
    });
    
    // Keyboard support
    on(btn, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const filter = btn.getAttribute(config.filterAttribute);
        if (filter && filter !== currentFilter) {
          filterItems(filter);
        }
      }
    });
    
    // ARIA attributes
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-pressed', 'false');
    if (!btn.getAttribute('tabindex')) {
      btn.setAttribute('tabindex', '0');
    }
  });
  
  // ========================================
  // 4. KEYBOARD NAVIGATION (Arrow keys)
  // ========================================
  
  on(container, 'keydown', (e) => {
    const activeBtn = container.querySelector(`.${config.activeClass}`);
    if (!activeBtn) return;
    
    const btnArray = Array.from(buttons);
    const currentIndex = btnArray.indexOf(activeBtn);
    
    let targetIndex = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      targetIndex = currentIndex + 1;
      if (targetIndex >= btnArray.length) targetIndex = 0;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) targetIndex = btnArray.length - 1;
    }
    
    if (targetIndex >= 0 && targetIndex < btnArray.length) {
      btnArray[targetIndex].focus();
    }
  });
  
  // ========================================
  // 5. URL PARAMETER SUPPORT
  // ========================================
  
  function getFilterFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter');
    if (filter && filterValues.includes(filter)) {
      return filter;
    }
    return null;
  }
  
  // ========================================
  // 6. INITIALIZE
  // ========================================
  
  // Set initial filter from URL or default
  const initialFilter = getFilterFromUrl() || config.defaultFilter;
  
  // Set active class on default button
  buttons.forEach(btn => {
    const btnFilter = btn.getAttribute(config.filterAttribute);
    if (btnFilter === initialFilter) {
      addClass(btn, config.activeClass);
      btn.setAttribute('aria-pressed', 'true');
    }
  });
  
  // Apply initial filter
  filterItems(initialFilter);
  
  // ========================================
  // 7. EXPOSE API
  // ========================================
  
  const api = {
    filter: filterItems,
    getCurrentFilter: () => currentFilter,
    getFilterValues: () => filterValues,
    reset: () => filterItems(config.defaultFilter),
    refresh: () => {
      // Re-initialize for dynamically added items
    },
    destroy: () => {
      // Cleanup logic
    },
  };
  
  // Attach to window for debugging
  window.__filters = api;
  
  console.log('🔍 Filters initialized');
  
  return api;
}

// ========================================
// 8. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Check if filters exist
  if ($('.filter-container')) {
    initFilters();
  }
});