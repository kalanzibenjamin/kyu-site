// ========================================
// SEARCH COMPONENT
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';
import { debounce, truncateText } from '../utils/helpers.js';

/**
 * Initialize search component
 * @param {Object} options - Configuration options
 * @param {string} options.inputSelector - Search input selector (default: '#searchInput')
 * @param {string} options.clearSelector - Clear button selector (default: '#searchClearBtn')
 * @param {string} options.itemsSelector - Items to filter selector (default: '.searchable-item')
 * @param {string} options.noResultsSelector - No results message selector (default: '.no-results')
 * @param {string} options.itemTitleSelector - Item title selector (default: '.item-title')
 * @param {string} options.itemDescriptionSelector - Item description selector (default: '.item-description')
 * @param {number} options.debounceDelay - Debounce delay in ms (default: 300)
 * @param {number} options.minChars - Minimum characters to trigger search (default: 2)
 */
export function initSearch(options = {}) {
  const config = {
    inputSelector: '#searchInput',
    clearSelector: '#searchClearBtn',
    itemsSelector: '.searchable-item',
    noResultsSelector: '.no-results',
    itemTitleSelector: '.item-title',
    itemDescriptionSelector: '.item-description',
    debounceDelay: 300,
    minChars: 2,
    ...options,
  };
  
  const input = $(config.inputSelector);
  const clearBtn = $(config.clearSelector);
  
  if (!input) {
    // No search input found — quietly exit
    return;
  }
  
  // Get all searchable items
  const items = $$(config.itemsSelector);
  const noResults = $(config.noResultsSelector);
  const itemsContainer = items.length > 0 ? items[0].parentElement : null;
  
  // If no items to search, still allow clear button functionality
  const hasItems = items.length > 0;
  
  // Store original content for reset
  let originalItems = [];
  if (hasItems) {
    originalItems = Array.from(items).map(item => ({
      element: item,
      title: (item.querySelector(config.itemTitleSelector)?.textContent || item.textContent || '').toLowerCase(),
      description: (item.querySelector(config.itemDescriptionSelector)?.textContent || '').toLowerCase(),
      fullText: item.textContent.toLowerCase(),
    }));
  }
  
  // ========================================
  // 1. SEARCH FUNCTION
  // ========================================
  
  const performSearch = debounce((query) => {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Show/hide clear button
    if (clearBtn) {
      if (trimmedQuery.length > 0) {
        addClass(clearBtn, 'visible');
      } else {
        removeClass(clearBtn, 'visible');
      }
    }
    
    // If no items to search, just handle clear button
    if (!hasItems) {
      return;
    }
    
    // If query is too short, show all items
    if (trimmedQuery.length < config.minChars) {
      items.forEach(item => {
        item.style.display = '';
      });
      if (noResults) {
        noResults.style.display = 'none';
      }
      return;
    }
    
    // Search through items
    let matchCount = 0;
    
    originalItems.forEach(({ element, title, description, fullText }) => {
      const matches = title.includes(trimmedQuery) || 
                      description.includes(trimmedQuery) || 
                      fullText.includes(trimmedQuery);
      
      if (matches) {
        element.style.display = '';
        matchCount++;
        // Highlight matched text (optional)
        highlightMatch(element, trimmedQuery);
      } else {
        element.style.display = 'none';
      }
    });
    
    // Show/hide no results message
    if (noResults) {
      if (matchCount === 0) {
        noResults.style.display = 'block';
        // Update no results message with query
        const message = noResults.querySelector('.no-results-message');
        if (message) {
          message.textContent = `No results found for "${query.trim()}"`;
        }
      } else {
        noResults.style.display = 'none';
      }
    }
    
    // Dispatch custom event for analytics
    const event = new CustomEvent('searchPerformed', {
      detail: { 
        query: trimmedQuery, 
        results: matchCount,
        total: originalItems.length,
      }
    });
    document.dispatchEvent(event);
    
  }, config.debounceDelay);
  
  // ========================================
  // 2. HIGHLIGHT MATCHES (Optional)
  // ========================================
  
  function highlightMatch(element, query) {
    // Remove existing highlights
    const highlighted = element.querySelectorAll('.search-highlight');
    highlighted.forEach(el => {
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent), el);
      parent.normalize();
    });
    
    // Only highlight if query is long enough
    if (query.length < 2) return;
    
    // Find and highlight matching text in title and description
    const titleEl = element.querySelector(config.itemTitleSelector);
    const descEl = element.querySelector(config.itemDescriptionSelector);
    
    [titleEl, descEl].forEach(el => {
      if (!el) return;
      const text = el.textContent;
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      
      if (lowerText.includes(lowerQuery)) {
        const index = lowerText.indexOf(lowerQuery);
        const before = text.substring(0, index);
        const match = text.substring(index, index + query.length);
        const after = text.substring(index + query.length);
        
        const span = document.createElement('span');
        span.innerHTML = before + `<span class="search-highlight">${match}</span>` + after;
        el.replaceWith(span);
      }
    });
  }
  
  // ========================================
  // 3. CLEAR SEARCH
  // ========================================
  
  function clearSearch() {
    input.value = '';
    if (clearBtn) {
      removeClass(clearBtn, 'visible');
    }
    
    // Show all items
    if (hasItems) {
      items.forEach(item => {
        item.style.display = '';
        // Remove highlights
        const highlighted = item.querySelectorAll('.search-highlight');
        highlighted.forEach(el => {
          const parent = el.parentNode;
          parent.replaceChild(document.createTextNode(el.textContent), el);
          parent.normalize();
        });
      });
      
      if (noResults) {
        noResults.style.display = 'none';
      }
    }
    
    input.focus();
    
    // Dispatch clear event
    const event = new CustomEvent('searchCleared');
    document.dispatchEvent(event);
  }
  
  // ========================================
  // 4. EVENT LISTENERS
  // ========================================
  
  // Input event
  on(input, 'input', (e) => {
    performSearch(e.target.value);
  });
  
  // Keydown events (Enter, Escape)
  on(input, 'keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
      input.blur();
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      // Could trigger a specific action like navigating to search results
      const event = new CustomEvent('searchSubmitted', {
        detail: { query: input.value.trim() }
      });
      document.dispatchEvent(event);
    }
  });
  
  // Clear button
  if (clearBtn) {
    on(clearBtn, 'click', clearSearch);
  }
  
  // ========================================
  // 5. SEARCH ON PAGE LOAD (from URL param)
  // ========================================
  
  // Check for search parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const searchQuery = urlParams.get('q');
  if (searchQuery && searchQuery.length >= config.minChars) {
    input.value = searchQuery;
    performSearch(searchQuery);
  }
  
  // ========================================
  // 6. EXPOSE API
  // ========================================
  
  const api = {
    search: performSearch,
    clear: clearSearch,
    getQuery: () => input.value.trim(),
    getResults: () => {
      if (!hasItems) return [];
      return originalItems
        .filter(({ element }) => element.style.display !== 'none')
        .map(({ element }) => element);
    },
    destroy: () => {
      // Clean up event listeners
      // (Implementation depends on how you want to handle cleanup)
    }
  };
  
  // Attach to window for debugging
  window.__search = api;
  
  console.log('🔍 Search initialized');
  
  return api;
}

// ========================================
// 7. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Auto-initialize if search input exists
  if ($('#searchInput')) {
    initSearch();
  }
});