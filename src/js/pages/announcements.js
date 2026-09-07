// ========================================
// ANNOUNCEMENTS PAGE
// ========================================

import { $, $$, on, addClass, removeClass, domReady } from '../utils/dom.js';
import { formatDate, truncateText, debounce } from '../utils/helpers.js';

/**
 * Initialize announcements page functionality
 */
export function initAnnouncements() {
  // Check if we're on the announcements page
  const announcementsPage = document.querySelector('.announcements-page');
  if (!announcementsPage) return;
  
  console.log('📢 Announcements page initialized');
  
  // ========================================
  // 1. LOAD ANNOUNCEMENTS FROM JSON
  // ========================================
  
  const container = $('.announcements-list');
  if (!container) return;
  
  // Check if already loaded
  if (container.dataset.loaded === 'true') return;
  
  const dataUrl = container.dataset.jsonUrl || '/data/announcements.json';
  
  // Fetch announcements from JSON
  fetch(dataUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load announcements');
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        showEmptyState(container);
        return;
      }
      
      renderAnnouncements(container, data);
      container.dataset.loaded = 'true';
      initAnnouncementInteractions(container);
      
      console.log(`📢 Loaded ${data.length} announcements`);
    })
    .catch(error => {
      console.error('Failed to load announcements:', error);
      if (container.querySelector('.announcement-item')) {
        container.dataset.loaded = 'true';
        initAnnouncementInteractions(container);
      } else {
        showEmptyState(container);
      }
    });
  
  // ========================================
  // 2. RENDER ANNOUNCEMENTS
  // ========================================
  
  function renderAnnouncements(container, announcements) {
    // Clear container
    container.innerHTML = '';
    
    // Sort by date (newest first)
    const sorted = [...announcements].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
    
    // Render each announcement
    sorted.forEach((item, index) => {
      const announcement = createAnnouncementElement(item, index);
      container.appendChild(announcement);
    });
  }
  
  function createAnnouncementElement(item, index) {
    const date = formatDate(item.date);
    const description = item.description || item.content || '';
    const tag = item.tag || item.category || 'update';
    const detailUrl = item.slug ? `/pages/announcements/${encodeURIComponent(item.slug)}/` : '';
    const image = item.image || '/images/og-image.png';
    const imageWidth = Number(item.imageWidth) || 1200;
    const imageHeight = Number(item.imageHeight) || 630;
    const div = document.createElement(detailUrl ? 'a' : 'div');
    div.className = 'announcement-item fade-up no-style';
    div.style.animationDelay = `${index * 50}ms`;
    if (detailUrl) div.href = detailUrl;
    const escapeHtml = (value) => String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
    
    // Determine tag class
    let tagClass = 'tag-update';
    if (tag === 'important' || tag === 'urgent') tagClass = 'tag-important';
    else if (tag === 'new' || tag === 'feature') tagClass = 'tag-new';
    else if (tag === 'update' || tag === 'announcement') tagClass = 'tag-update';
    
    div.innerHTML = `
      <div class="announcement-card-image" style="aspect-ratio: ${imageWidth} / ${imageHeight}">
        <img src="${escapeHtml(image)}" alt="" loading="lazy" width="${imageWidth}" height="${imageHeight}">
      </div>
      <div class="announcement-card-content">
      <div class="announcement-header">
        <h3 class="announcement-title">${escapeHtml(item.title)}</h3>
        <span class="announcement-date"><i class="fas fa-calendar-alt"></i> ${escapeHtml(date)}</span>
      </div>
      <p class="announcement-description">${escapeHtml(description)}</p>
      <div class="announcement-footer">
        ${tag ? `<span class="announcement-tag ${tagClass}">${escapeHtml(tag)}</span>` : ''}
        ${detailUrl ? '<span class="announcement-read">Read announcement <i class="fas fa-arrow-right" aria-hidden="true"></i></span>' : ''}
      </div>
      </div>
    `;
    
    return div;
  }
  
  // ========================================
  // 3. EMPTY STATE
  // ========================================
  
  function showEmptyState(container) {
    container.innerHTML = `
      <div class="no-announcements">
        <i class="fas fa-newspaper"></i>
        <h3>No announcements yet</h3>
        <p>Check back soon for updates and news.</p>
      </div>
    `;
  }
  
  // ========================================
  // 4. ANNOUNCEMENT INTERACTIONS
  // ========================================
  
  function initAnnouncementInteractions(container) {
    // ========================================
    // 4.1 Search announcements
    // ========================================
    
    const searchInput = $('.announcements-search input');
    if (searchInput) {
      const items = container.querySelectorAll('.announcement-item');
      
      const searchHandler = debounce((query) => {
        const trimmed = query.trim().toLowerCase();
        
        items.forEach(item => {
          const title = item.querySelector('.announcement-title')?.textContent?.toLowerCase() || '';
          const description = item.querySelector('.announcement-description')?.textContent?.toLowerCase() || '';
          const fullText = item.textContent.toLowerCase();
          
          if (trimmed.length < 2) {
            item.style.display = '';
            return;
          }
          
          if (title.includes(trimmed) || description.includes(trimmed) || fullText.includes(trimmed)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      }, 300);
      
      on(searchInput, 'input', (e) => {
        searchHandler(e.target.value);
      });
      
      // Clear button
      const clearBtn = $('.announcements-search .search-clear');
      if (clearBtn) {
        on(clearBtn, 'click', () => {
          searchInput.value = '';
          searchHandler('');
          searchInput.focus();
        });
      }
      
      // Escape key
      on(searchInput, 'keydown', (e) => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          searchHandler('');
          searchInput.blur();
        }
      });
    }
    
    // ========================================
    // 4.2 Announcement click tracking
    // ========================================
    
    const items = container.querySelectorAll('.announcement-item');
    items.forEach(item => {
      on(item, 'click', () => {
        const title = item.querySelector('.announcement-title')?.textContent || '';
        
        // Track announcement click
        if (window.gtag) {
          window.gtag('event', 'announcement_click', {
            announcement_title: title,
          });
        }
        
        const event = new CustomEvent('announcementClicked', {
          detail: { title }
        });
        document.dispatchEvent(event);
      });
    });
  }
  
  // ========================================
  // 5. SUBSCRIBE FORM
  // ========================================
  
  const subscribeForm = $('.subscribe-form');
  if (subscribeForm) {
    on(subscribeForm, 'submit', function(e) {
      e.preventDefault();
      
      const input = this.querySelector('input[type="email"]');
      if (!input) return;
      
      const email = input.value.trim();
      if (!email) return;
      
      // Show loading state
      const btn = this.querySelector('button');
      const originalText = btn?.textContent || 'Subscribe';
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subscribing...';
      }
      
      // Simulate subscription (replace with actual endpoint)
      setTimeout(() => {
        // Show success message
        const message = $('.subscribe-message');
        if (message) {
          message.textContent = '✅ You\'ve been subscribed!';
          message.className = 'subscribe-message success visible';
        }
        
        input.value = '';
        
        // Reset button
        if (btn) {
          btn.disabled = false;
          btn.textContent = originalText;
        }
        
        // Track subscription
        if (window.gtag) {
          window.gtag('event', 'subscribe', {
            form_name: 'announcements_subscribe',
          });
        }
        
        const event = new CustomEvent('announcementSubscribe', {
          detail: { email }
        });
        document.dispatchEvent(event);
        
      }, 1000);
    });
  }
  
  // ========================================
  // 6. MARKDOWN/HTML RENDERING (Optional)
  // ========================================
  
  // If announcement descriptions contain markdown or HTML,
  // you can render them here
  function renderDescription(text) {
    if (!text) return '';
    
    // Simple URL detection
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Simple line breaks
    text = text.replace(/\n/g, '<br>');
    
    return text;
  }
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initAnnouncements();
});