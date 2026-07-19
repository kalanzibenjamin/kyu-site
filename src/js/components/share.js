// ========================================
// SHARE COMPONENT
// ========================================

import { $, $$, on, domReady } from '../utils/dom.js';
import { copyToClipboard } from '../utils/helpers.js';

/**
 * Initialize share buttons
 * @param {Object} options - Configuration options
 * @param {string} options.buttonsSelector - Share button selector (default: '.share-btn')
 * @param {string} options.url - URL to share (default: current page URL)
 * @param {string} options.title - Title to share (default: page title)
 * @param {string} options.description - Description to share (default: meta description)
 * @param {string} options.image - Image URL for sharing (default: OG image)
 */
export function initShareButtons(options = {}) {
  const config = {
    buttonsSelector: '.share-btn',
    url: window.location.href,
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content || '',
    image: document.querySelector('meta[property="og:image"]')?.content || '',
    ...options,
  };
  
  const buttons = $$(config.buttonsSelector);
  if (buttons.length === 0) return;
  
  // ========================================
  // 1. SHARE URLS
  // ========================================
  
  const getShareUrls = (platform, url, title, description) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedTitle}%0A${encodedDesc}%0A${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}%0A${encodedDesc}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
      copy: 'copy', // Special case
      // Custom platforms
      signal: `https://signal.me/#p/${encodedUrl}`,
      messenger: `fb-messenger://share?link=${encodedUrl}`,
    };
    
    return urls[platform] || null;
  };
  
  // ========================================
  // 2. SHARE HANDLER
  // ========================================
  
  function handleShare(button, platform) {
    const url = button.dataset.url || config.url;
    const title = button.dataset.title || config.title;
    const description = button.dataset.description || config.description;
    
    // Check if native share is available (mobile)
    if (navigator.share && platform === 'native') {
      navigator.share({
        title: title,
        text: description,
        url: url,
      }).catch(err => {
        if (err.name !== 'AbortError') {
          console.warn('Share cancelled or failed:', err);
        }
      });
      return;
    }
    
    // Get share URL
    const shareUrl = getShareUrls(platform, url, title, description);
    
    if (!shareUrl) {
      console.warn(`No share URL for platform: ${platform}`);
      return;
    }
    
    // Handle copy to clipboard
    if (platform === 'copy') {
      const fullText = `${title}\n${description}\n${url}`;
      copyToClipboard(fullText).then(success => {
        if (success) {
          showFeedback(button, '✅ Link copied!');
        } else {
          showFeedback(button, '❌ Failed to copy');
        }
      });
      return;
    }
    
    // Open share window
    const width = 600;
    const height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const popup = window.open(
      shareUrl,
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // Fallback: open in new tab if popup blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.open(shareUrl, '_blank');
    }
    
    // Track share event
    const event = new CustomEvent('sharePerformed', {
      detail: { platform, url, title }
    });
    document.dispatchEvent(event);
  }
  
  // ========================================
  // 3. FEEDBACK TOAST
  // ========================================
  
  function showFeedback(button, message) {
    // Remove existing feedback
    const existing = button.querySelector('.share-feedback');
    if (existing) existing.remove();
    
    // Create feedback element
    const feedback = document.createElement('span');
    feedback.className = 'share-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: var(--glass-bg, rgba(0,0,0,0.8));
      color: var(--text-primary, #fff);
      padding: 0.3rem 0.8rem;
      border-radius: 6px;
      font-size: 0.75rem;
      white-space: nowrap;
      pointer-events: none;
      z-index: 100;
      border: 1px solid var(--glass-border, transparent);
      backdrop-filter: blur(8px);
    `;
    
    // Position relative on button
    if (getComputedStyle(button).position === 'static') {
      button.style.position = 'relative';
    }
    
    button.appendChild(feedback);
    
    // Remove after 2 seconds
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }
  
  // ========================================
  // 4. EVENT LISTENERS
  // ========================================
  
  buttons.forEach(button => {
    // Get platform from data attribute
    const platform = button.dataset.platform || button.dataset.social;
    if (!platform) return;
    
    // Click handler
    on(button, 'click', (e) => {
      e.preventDefault();
      handleShare(button, platform);
    });
    
    // Keyboard support
    on(button, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleShare(button, platform);
      }
    });
    
    // ARIA attributes
    button.setAttribute('role', 'button');
    button.setAttribute('tabindex', '0');
    if (!button.getAttribute('aria-label')) {
      button.setAttribute('aria-label', `Share on ${platform}`);
    }
  });
  
  // ========================================
  // 5. NATIVE SHARE BUTTON (Mobile)
  // ========================================
  
  // Check if Web Share API is available
  if (navigator.share) {
    // Add a native share button if it exists
    const nativeBtn = $('.share-native');
    if (nativeBtn) {
      on(nativeBtn, 'click', (e) => {
        e.preventDefault();
        handleShare(nativeBtn, 'native');
      });
    }
  }
  
  // ========================================
  // 6. EXPOSE API
  // ========================================
  
  const api = {
    share: handleShare,
    getShareUrls,
    showFeedback,
    destroy: () => {
      // Cleanup logic
    },
  };
  
  console.log('📤 Share buttons initialized');
  
  return api;
}

// ========================================
// 7. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Auto-initialize if share buttons exist
  if ($('.share-btn')) {
    initShareButtons();
  }
});