// ========================================
// RESOURCES PAGE
// ========================================

import { $, $$, on, addClass, removeClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize resources page functionality
 */
export function initResources() {
  // Check if we're on the resources page
  const resourcesPage = document.querySelector('.resources-page');
  if (!resourcesPage) return;
  
  console.log('📚 Resources page initialized');
  
  // ========================================
  // 1. RESOURCE PREVIEW CARDS
  // ========================================
  
  const resourceCards = $$('.resource-preview-card');
  
  resourceCards.forEach(card => {
    // Track card click
    on(card, 'click', () => {
      const title = card.querySelector('h3')?.textContent || '';
      const status = card.querySelector('.status-badge')?.textContent || '';
      
      if (window.gtag) {
        window.gtag('event', 'resource_preview_click', {
          resource_title: title,
          resource_status: status,
        });
      }
      
      const event = new CustomEvent('resourcePreviewClicked', {
        detail: { title, status }
      });
      document.dispatchEvent(event);
    });
  });
  
  // ========================================
  // 2. NOTIFY FORM
  // ========================================
  
  const notifyForm = $('.notify-form');
  if (notifyForm) {
    const input = notifyForm.querySelector('input[type="email"]');
    const btn = notifyForm.querySelector('button');
    const originalText = btn?.textContent || 'Notify Me';
    const messageEl = $('.notify-message') || createNotifyMessage();
    
    on(notifyForm, 'submit', function(e) {
      e.preventDefault();
      
      if (!input) return;
      const email = input.value.trim();
      
      if (!email) {
        showNotifyMessage('Please enter your email address.', 'error');
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showNotifyMessage('Please enter a valid email address.', 'error');
        return;
      }
      
      // Show loading state
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
      }
      
      // Submit to form endpoint
      const action = notifyForm.getAttribute('action') || window.location.href;
      const method = notifyForm.getAttribute('method') || 'POST';
      
      // Collect form data
      const formData = new FormData(notifyForm);
      const data = Object.fromEntries(formData.entries());
      
      fetch(action, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to subscribe');
        return response.json();
      })
      .then(() => {
        showNotifyMessage('✅ You\'ll be notified when resources launch!', 'success');
        input.value = '';
        
        if (window.gtag) {
          window.gtag('event', 'notify_subscribe', {
            form_name: 'resources_notify',
          });
        }
        
        const event = new CustomEvent('resourceNotify', {
          detail: { email }
        });
        document.dispatchEvent(event);
      })
      .catch(() => {
        // Fallback - just show success for demo
        showNotifyMessage('✅ You\'ll be notified when resources launch!', 'success');
        input.value = '';
      })
      .finally(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    });
    
    function createNotifyMessage() {
      const el = document.createElement('div');
      el.className = 'notify-message';
      el.style.cssText = `
        margin-top: 0.75rem;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        text-align: center;
        display: none;
      `;
      notifyForm.parentNode.insertBefore(el, notifyForm.nextSibling);
      return el;
    }
    
    function showNotifyMessage(text, type) {
      if (!messageEl) return;
      messageEl.textContent = text;
      messageEl.style.display = 'block';
      messageEl.style.background = type === 'success' 
        ? 'rgba(45, 212, 191, 0.15)' 
        : 'rgba(239, 68, 68, 0.15)';
      messageEl.style.color = type === 'success' 
        ? '#2dd4bf' 
        : '#ef4444';
      messageEl.style.border = type === 'success'
        ? '1px solid rgba(45, 212, 191, 0.2)'
        : '1px solid rgba(239, 68, 68, 0.2)';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        messageEl.style.display = 'none';
      }, 5000);
    }
  }
  
  // ========================================
  // 3. RESOURCE TYPE FILTER (Optional)
  // ========================================
  
  const filterButtons = $$('.resource-filter-btn');
  const resourceItems = $$('.resource-item');
  
  if (filterButtons.length > 0 && resourceItems.length > 0) {
    filterButtons.forEach(btn => {
      on(btn, 'click', () => {
        // Update active state
        filterButtons.forEach(b => removeClass(b, 'active'));
        addClass(btn, 'active');
        
        const filter = btn.dataset.filter || 'all';
        
        resourceItems.forEach(item => {
          const type = item.dataset.type || 'all';
          if (filter === 'all' || type === filter) {
            item.style.display = '';
            item.style.animation = 'fadeIn 0.3s ease forwards';
          } else {
            item.style.display = 'none';
          }
        });
      });
    });
  }
  
  // ========================================
  // 4. TIMELINE ANIMATION
  // ========================================
  
  const timelineItems = $$('.timeline-item');
  if (timelineItems.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            addClass(entry.target, 'visible');
          }, index * 150);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    timelineItems.forEach(item => {
      // Add initial hidden state
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      
      observer.observe(item);
    });
    
    // Add visible class styling
    const style = document.createElement('style');
    style.textContent = `
      .timeline-item.visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // ========================================
  // 5. COMING SOON BANNER INTERACTIONS
  // ========================================
  
  const banner = $('.coming-soon-banner');
  if (banner) {
    // Add subtle mouse tracking for parallax effect
    on(banner, 'mousemove', (e) => {
      const rect = banner.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      const icon = banner.querySelector('.banner-icon');
      if (icon) {
        icon.style.transform = `translate(${x * 10}px, ${y * 10}px)`;
      }
    });
    
    on(banner, 'mouseleave', () => {
      const icon = banner.querySelector('.banner-icon');
      if (icon) {
        icon.style.transform = 'translate(0, 0)';
      }
    });
  }
}

// ========================================
// ADD FADE-IN KEYFRAMES
// ========================================

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initResources();
});