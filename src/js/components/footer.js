// ========================================
// FOOTER COMPONENT
// ========================================

import { $, $$, on, domReady } from '../utils/dom.js';

/**
 * Initialize footer component
 * @param {Object} options - Configuration options
 * @param {string} options.whatsappSelector - WhatsApp channel button selector (default: '#whatsappChannelBtn')
 * @param {string} options.whatsappUrl - WhatsApp channel URL (default: from data attribute)
 * @param {string} options.yearSelector - Copyright year selector (default: '.copyright-year')
 * @param {string} options.scrollTopSelector - Scroll to top in footer selector (default: '.footer-scroll-top')
 */
export function initFooter(options = {}) {
  const config = {
    whatsappSelector: '#whatsappChannelBtn, .whatsapp-channel',
    whatsappUrl: null,
    yearSelector: '.copyright-year',
    scrollTopSelector: '.footer-scroll-top',
    ...options,
  };
  
  // ========================================
  // 1. WHATSAPP CHANNEL BUTTON
  // ========================================
  
  const whatsappBtn = $(config.whatsappSelector);
  if (whatsappBtn) {
    // Get URL from data attribute or config
    const url = config.whatsappUrl || whatsappBtn.dataset.url;
    
    if (url) {
      on(whatsappBtn, 'click', (e) => {
        e.preventDefault();
        window.open(url, '_blank', 'noopener,noreferrer');
        
        // Track WhatsApp click
        const event = new CustomEvent('whatsappClicked', {
          detail: { url }
        });
        document.dispatchEvent(event);
      });
      
      // Keyboard support
      on(whatsappBtn, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
      
      // ARIA attributes
      whatsappBtn.setAttribute('role', 'button');
      whatsappBtn.setAttribute('tabindex', '0');
      if (!whatsappBtn.getAttribute('aria-label')) {
        whatsappBtn.setAttribute('aria-label', 'Join our WhatsApp channel');
      }
    }
  }
  
  // ========================================
  // 2. COPYRIGHT YEAR
  // ========================================
  
  const yearEl = $(config.yearSelector);
  if (yearEl) {
    const currentYear = new Date().getFullYear();
    const startYear = yearEl.dataset.startYear || currentYear;
    
    if (startYear === currentYear) {
      yearEl.textContent = currentYear;
    } else {
      yearEl.textContent = `${startYear} – ${currentYear}`;
    }
  }
  
  // ========================================
  // 3. SCROLL TO TOP (Footer link)
  // ========================================
  
  const scrollTopBtn = $(config.scrollTopSelector);
  if (scrollTopBtn) {
    on(scrollTopBtn, 'click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    on(scrollTopBtn, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
    
    scrollTopBtn.setAttribute('role', 'button');
    scrollTopBtn.setAttribute('tabindex', '0');
    if (!scrollTopBtn.getAttribute('aria-label')) {
      scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
    }
  }
  
  // ========================================
  // 4. SOCIAL ICON TRACKING
  // ========================================
  
  const socialIcons = $$('.social-icon');
  socialIcons.forEach(icon => {
    on(icon, 'click', (e) => {
      const platform = icon.dataset.social || icon.dataset.platform;
      const url = icon.getAttribute('href');
      
      // Track social click
      const event = new CustomEvent('socialClicked', {
        detail: { 
          platform, 
          url,
          element: icon,
        }
      });
      document.dispatchEvent(event);
      
      // Track with analytics if available
      if (window.gtag && platform) {
        window.gtag('event', 'social_click', {
          social_platform: platform,
          social_url: url || '',
        });
      }
    });
  });
  
  // ========================================
  // 5. FOOTER VISIBILITY ANIMATION
  // ========================================
  
  // Detect when footer enters viewport
  const footer = $('.footer-wrapper');
  if (footer && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('footer-visible');
          // Dispatch event
          const event = new CustomEvent('footerVisible');
          document.dispatchEvent(event);
        }
      });
    }, {
      threshold: 0.2,
    });
    
    observer.observe(footer);
  }
  
  // ========================================
  // 6. FOOTER NAVIGATION
  // ========================================
  
  const footerLinks = $$('.footer-nav a, .footer-content a');
  footerLinks.forEach(link => {
    // Skip if already has target
    if (link.getAttribute('target')) return;
    
    // Check if external link
    const href = link.getAttribute('href');
    if (href && (href.startsWith('http') || href.startsWith('//'))) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    }
  });
  
  console.log('📋 Footer initialized');
  
  // ========================================
  // 7. EXPOSE API
  // ========================================
  
  return {
    openWhatsApp: () => {
      const url = config.whatsappUrl || 
                   $(config.whatsappSelector)?.dataset.url;
      if (url) window.open(url, '_blank');
    },
    scrollToTop: () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    destroy: () => {
      // Cleanup logic
    },
  };
}

// ========================================
// 8. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Auto-initialize if footer exists
  if ($('.footer-wrapper')) {
    initFooter();
  }
});