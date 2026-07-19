// ========================================
// ANALYTICS UTILITIES
// ========================================

// GA4 Measurement ID for the Kyambogo Student Hub stream
const GA_MEASUREMENT_ID = 'G-RS13PTVK8E';

/**
 * Initialize Google Analytics 4
 * Loads the GA4 script and initializes tracking
 */
export function initAnalytics() {
  // Check if GA is already loaded or if we're in development
  if (typeof window === 'undefined') return;
  
  // Skip if no measurement ID is set
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.log('ℹ️ Google Analytics not configured. Add your GA4 ID to analytics.js');
    return;
  }
  
  // Skip if already initialized
  if (window.gtag) {
    console.log('📊 Google Analytics already initialized');
    return;
  }
  
  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);
  
  // Initialize GA4
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
    page_title: document.title,
    page_location: window.location.href,
  });
  
  console.log('📊 Google Analytics initialized with ID:', GA_MEASUREMENT_ID);
}

/**
 * Track a page view
 * @param {string} pageTitle - Page title (optional)
 * @param {string} pagePath - Page path (optional)
 */
export function trackPageView(pageTitle, pagePath) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_title: pageTitle || document.title,
    page_location: pagePath || window.location.href,
    page_path: pagePath || window.location.pathname,
  });
}

/**
 * Track a custom event
 * @param {string} eventName - Event name
 * @param {Object} eventParams - Event parameters
 */
export function trackEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, eventParams);
}

/**
 * Track a click event
 * @param {string} elementId - Element ID or selector
 * @param {string} elementText - Element text content
 */
export function trackClick(elementId, elementText) {
  trackEvent('click', {
    element_id: elementId,
    element_text: elementText || '',
  });
}

/**
 * Track a form submission
 * @param {string} formId - Form ID
 * @param {string} formName - Form name
 */
export function trackFormSubmission(formId, formName) {
  trackEvent('form_submission', {
    form_id: formId,
    form_name: formName || '',
  });
}

/**
 * Track a search query
 * @param {string} query - Search query
 * @param {number} results - Number of results
 */
export function trackSearch(query, results = 0) {
  trackEvent('search', {
    search_term: query,
    search_results: results,
  });
}

/**
 * Track a resource download
 * @param {string} resourceName - Resource name
 * @param {string} resourceType - Resource type (pdf, doc, etc.)
 * @param {string} course - Course name (optional)
 */
export function trackDownload(resourceName, resourceType, course = '') {
  trackEvent('download', {
    resource_name: resourceName,
    resource_type: resourceType,
    course: course || '',
  });
}

/**
 * Track outbound link click
 * @param {string} url - Outbound URL
 * @param {string} linkText - Link text
 */
export function trackOutboundLink(url, linkText) {
  trackEvent('outbound_click', {
    outbound_url: url,
    link_text: linkText || '',
  });
}

/**
 * Track user engagement (time on page, scroll depth, etc.)
 * @param {string} engagementType - Type of engagement
 * @param {Object} engagementData - Engagement data
 */
export function trackEngagement(engagementType, engagementData = {}) {
  trackEvent('engagement', {
    engagement_type: engagementType,
    ...engagementData,
  });
}

/**
 * Track external link click with navigation delay
 * @param {string} url - External URL
 * @param {string} linkText - Link text
 * @param {Function} callback - Callback after tracking
 */
export function trackOutboundWithRedirect(url, linkText, callback = null) {
  if (!window.gtag) {
    if (callback) callback();
    return;
  }
  
  trackOutboundLink(url, linkText);
  
  // Give GA time to send the event
  setTimeout(() => {
    if (callback) {
      callback();
    } else {
      window.location.href = url;
    }
  }, 200);
}

/**
 * Track scroll depth
 * Triggers events at 25%, 50%, 75%, 100%
 */
export function trackScrollDepth() {
  if (typeof window === 'undefined') return;
  
  let hasTracked25 = false;
  let hasTracked50 = false;
  let hasTracked75 = false;
  let hasTracked100 = false;
  let hasTracked90 = false; // For video/content consumption
  
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    
    if (scrollPercent >= 25 && !hasTracked25) {
      hasTracked25 = true;
      trackEngagement('scroll_depth', { scroll_depth: 25 });
    }
    
    if (scrollPercent >= 50 && !hasTracked50) {
      hasTracked50 = true;
      trackEngagement('scroll_depth', { scroll_depth: 50 });
    }
    
    if (scrollPercent >= 75 && !hasTracked75) {
      hasTracked75 = true;
      trackEngagement('scroll_depth', { scroll_depth: 75 });
    }
    
    if (scrollPercent >= 90 && !hasTracked90) {
      hasTracked90 = true;
      trackEngagement('scroll_depth', { scroll_depth: 90 });
    }
    
    if (scrollPercent >= 100 && !hasTracked100) {
      hasTracked100 = true;
      trackEngagement('scroll_depth', { scroll_depth: 100 });
    }
  };
  
  // Throttle scroll events
  let ticking = false;
  const throttledScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleScroll();
        ticking = false;
      });
      ticking = true;
    }
  };
  
  window.addEventListener('scroll', throttledScroll, { passive: true });
}

/**
 * Track time on page
 * Tracks time spent on page in seconds
 */
export function trackTimeOnPage() {
  if (typeof window === 'undefined') return;
  
  let startTime = Date.now();
  let isPageVisible = true;
  
  const handleVisibilityChange = () => {
    if (document.hidden) {
      isPageVisible = false;
    } else {
      isPageVisible = true;
      startTime = Date.now();
    }
  };
  
  const handleBeforeUnload = () => {
    if (!isPageVisible) return;
    
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    if (timeSpent > 5) { // Only track if more than 5 seconds
      trackEngagement('time_on_page', { time_seconds: timeSpent });
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
}

/**
 * Track video engagement (for future video content)
 * @param {string} videoId - Video identifier
 * @param {string} action - Action (play, pause, complete, etc.)
 * @param {number} progress - Progress percentage
 */
export function trackVideoEngagement(videoId, action, progress = 0) {
  trackEvent('video_engagement', {
    video_id: videoId,
    action: action,
    progress: progress,
  });
}

/**
 * Track quiz completion
 * @param {string} quizId - Quiz identifier
 * @param {number} score - Quiz score
 * @param {number} total - Total questions
 */
export function trackQuizCompletion(quizId, score, total) {
  trackEvent('quiz_completion', {
    quiz_id: quizId,
    score: score,
    total: total,
    percentage: Math.round((score / total) * 100),
  });
}

/**
 * Initialize all analytics tracking
 * Call this once on page load
 */
export function initAnalyticsTracking() {
  // Initialize GA4
  initAnalytics();
  
  // Track initial page view
  trackPageView();
  
  // Track scroll depth
  trackScrollDepth();
  
  // Track time on page
  trackTimeOnPage();
  
  // Track external link clicks
  document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])').forEach(link => {
    link.addEventListener('click', (e) => {
      const url = link.getAttribute('href');
      const text = link.textContent || link.getAttribute('aria-label') || '';
      
      // Don't track if it's a mailto or tel link
      if (url.startsWith('mailto:') || url.startsWith('tel:')) return;
      
      e.preventDefault();
      trackOutboundWithRedirect(url, text, () => {
        window.location.href = url;
      });
    });
  });
  
  // Track all download links
  document.querySelectorAll('a[download], a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"], a[href$=".zip"]').forEach(link => {
    link.addEventListener('click', () => {
      const url = link.getAttribute('href');
      const text = link.textContent || link.getAttribute('aria-label') || '';
      const type = url.split('.').pop().toLowerCase();
      
      trackDownload(text || url, type);
    });
  });
  
  console.log('📊 Analytics tracking initialized');
}

// Auto-initialize on DOM ready
import { domReady } from './dom.js';

domReady(() => {
  initAnalyticsTracking();
});