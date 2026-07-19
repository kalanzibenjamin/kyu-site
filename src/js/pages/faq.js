// ========================================
// FAQ PAGE
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';
import { debounce, truncateText } from '../utils/helpers.js';
import { initAccordion } from '../components/accordion.js';

/**
 * Initialize FAQ page functionality
 */
export function initFaq() {
  // Check if we're on the FAQ page
  const faqPage = document.querySelector('.faq-page');
  if (!faqPage) return;
  
  initAccordion();
  
  console.log('❓ FAQ page initialized');
  
  // ========================================
  // 1. FAQ SEARCH
  // ========================================
  
  const searchInput = $('.faq-search input');
  const faqItems = $$('.faq-item');
  
  if (searchInput && faqItems.length > 0) {
    // Store original content for search
    const itemData = Array.from(faqItems).map(item => ({
      element: item,
      question: item.querySelector('.faq-question-text')?.textContent?.toLowerCase() || '',
      answer: item.querySelector('.faq-answer p')?.textContent?.toLowerCase() || '',
      tags: item.dataset.tags?.toLowerCase() || '',
      fullText: item.textContent.toLowerCase(),
    }));
    
    const noResults = $('.no-results');
    const noResultsMessage = noResults?.querySelector('.no-results-message');
    
    function performFaqSearch(query) {
      const trimmed = query.trim().toLowerCase();
      
      // Show/hide clear button
      const clearBtn = $('.faq-search .search-clear');
      if (clearBtn) {
        if (trimmed.length > 0) {
          addClass(clearBtn, 'visible');
        } else {
          removeClass(clearBtn, 'visible');
        }
      }
      
      // If query is too short, show all items and close any open
      if (trimmed.length < 2) {
        faqItems.forEach(item => {
          item.style.display = '';
        });
        
        // Close all accordion items
        faqItems.forEach(item => {
          if (hasClass(item, 'is-open')) {
            const header = item.querySelector('.faq-question');
            const content = item.querySelector('.faq-answer');
            const icon = header?.querySelector('.faq-icon');
            
            removeClass(item, 'is-open');
            if (header) header.setAttribute('aria-expanded', 'false');
            if (icon) {
              removeClass(icon, 'fa-chevron-down');
              addClass(icon, 'fa-chevron-right');
            }
            if (content) content.style.maxHeight = '0';
          }
        });
        
        if (noResults) noResults.style.display = 'none';
        return;
      }
      
      let matchCount = 0;
      
      itemData.forEach(({ element, question, answer, tags, fullText }) => {
        const matches = question.includes(trimmed) || 
                        answer.includes(trimmed) || 
                        tags.includes(trimmed) ||
                        fullText.includes(trimmed);
        
        if (matches) {
          element.style.display = '';
          matchCount++;
          
          // Auto-open matching items
          if (!hasClass(element, 'is-open')) {
            const header = element.querySelector('.faq-question');
            const content = element.querySelector('.faq-answer');
            const icon = header?.querySelector('.faq-icon');
            
            addClass(element, 'is-open');
            if (header) header.setAttribute('aria-expanded', 'true');
            if (icon) {
              removeClass(icon, 'fa-chevron-right');
              addClass(icon, 'fa-chevron-down');
            }
            if (content) content.style.maxHeight = content.scrollHeight + 'px';
          }
          
          // Highlight matching text (optional)
          highlightFaqText(element, trimmed);
        } else {
          element.style.display = 'none';
          // Close if open
          if (hasClass(element, 'is-open')) {
            const header = element.querySelector('.faq-question');
            const content = element.querySelector('.faq-answer');
            const icon = header?.querySelector('.faq-icon');
            
            removeClass(element, 'is-open');
            if (header) header.setAttribute('aria-expanded', 'false');
            if (icon) {
              removeClass(icon, 'fa-chevron-down');
              addClass(icon, 'fa-chevron-right');
            }
            if (content) content.style.maxHeight = '0';
          }
        }
      });
      
      // Show/hide no results
      if (noResults) {
        if (matchCount === 0) {
          noResults.style.display = 'block';
          if (noResultsMessage) {
            noResultsMessage.textContent = `No FAQs found for "${query.trim()}"`;
          }
        } else {
          noResults.style.display = 'none';
        }
      }
      
      // Dispatch search event
      const event = new CustomEvent('faqSearchPerformed', {
        detail: { query: trimmed, results: matchCount }
      });
      document.dispatchEvent(event);
    }
    
    function highlightFaqText(item, query) {
      // Remove existing highlights
      const highlighted = item.querySelectorAll('.faq-highlight');
      highlighted.forEach(el => {
        const parent = el.parentNode;
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      });
      
      if (query.length < 2) return;
      
      // Highlight in question and answer
      const questionText = item.querySelector('.faq-question-text');
      const answerText = item.querySelector('.faq-answer p');
      
      [questionText, answerText].forEach(el => {
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
          span.innerHTML = before + `<span class="faq-highlight">${match}</span>` + after;
          el.replaceWith(span);
        }
      });
    }
    
    // Debounced search
    const debouncedSearch = debounce((e) => {
      performFaqSearch(e.target.value);
    }, 300);
    
    on(searchInput, 'input', debouncedSearch);
    
    // Clear button
    const clearBtn = $('.faq-search .search-clear');
    if (clearBtn) {
      on(clearBtn, 'click', () => {
        searchInput.value = '';
        performFaqSearch('');
        searchInput.focus();
      });
    }
    
    // Escape key
    on(searchInput, 'keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        performFaqSearch('');
        searchInput.blur();
      }
    });
  }
  
  // ========================================
  // 2. FAQ CATEGORY FILTER (Optional)
  // ========================================
  
  const categoryButtons = $$('.category-btn');
  if (categoryButtons.length > 0 && faqItems.length > 0) {
    categoryButtons.forEach(btn => {
      on(btn, 'click', () => {
        // Update active state
        categoryButtons.forEach(b => removeClass(b, 'active'));
        addClass(btn, 'active');
        
        const category = btn.dataset.category || 'all';
        
        faqItems.forEach(item => {
          const itemCategory = item.dataset.category || 'general';
          
          if (category === 'all' || itemCategory === category) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
            // Close if open
            if (hasClass(item, 'is-open')) {
              const header = item.querySelector('.faq-question');
              const content = item.querySelector('.faq-answer');
              const icon = header?.querySelector('.faq-icon');
              
              removeClass(item, 'is-open');
              if (header) header.setAttribute('aria-expanded', 'false');
              if (icon) {
                removeClass(icon, 'fa-chevron-down');
                addClass(icon, 'fa-chevron-right');
              }
              if (content) content.style.maxHeight = '0';
            }
          }
        });
        
        // Show/hide no results
        const visibleItems = faqItems.filter(item => item.style.display !== 'none');
        const noResults = $('.no-results');
        if (noResults) {
          if (visibleItems.length === 0) {
            noResults.style.display = 'block';
            const message = noResults.querySelector('.no-results-message');
            if (message) {
              message.textContent = `No FAQs in category "${btn.textContent}"`;
            }
          } else {
            noResults.style.display = 'none';
          }
        }
      });
    });
  }
  
  // ========================================
  // 3. LOAD FAQ FROM JSON (Optional)
  // ========================================
  
  function loadFaqFromJson() {
    const container = $('.faq-list');
    if (!container || container.dataset.loaded) return;
    
    const dataUrl = container.dataset.jsonUrl;
    if (!dataUrl) return;
    
    fetch(dataUrl)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load FAQ data');
        return response.json();
      })
      .then(data => {
        if (!data || !Array.isArray(data)) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Render FAQ items
        data.forEach((item, index) => {
          const faqItem = document.createElement('div');
          faqItem.className = 'faq-item';
          faqItem.dataset.category = item.category || 'general';
          faqItem.dataset.tags = item.tags || '';
          
          faqItem.innerHTML = `
            <button class="faq-question" aria-expanded="false" role="button">
              <span class="faq-question-text">${item.question}</span>
              <i class="fas fa-chevron-right faq-icon"></i>
            </button>
            <div class="faq-answer" style="max-height: 0;">
              <p>${item.answer}</p>
            </div>
          `;
          
          container.appendChild(faqItem);
        });
        
        container.dataset.loaded = 'true';
        
        // Re-initialize accordion for newly loaded FAQ items
        initAccordion();
        
        console.log(`📋 Loaded ${data.length} FAQ items from JSON`);
      })
      .catch(error => {
        console.error('Failed to load FAQ data:', error);
      });
  }
  
  // Load FAQ from JSON if data attribute is present
  const faqContainer = $('.faq-list');
  if (faqContainer && faqContainer.dataset.jsonUrl) {
    loadFaqFromJson();
  }
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initFaq();
});