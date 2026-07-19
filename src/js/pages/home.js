// ========================================
// HOME PAGE
// ========================================

import { $, $$, on, addClass, removeClass, domReady } from '../utils/dom.js';
import { isInViewport, debounce } from '../utils/helpers.js';

/**
 * Initialize home page functionality
 */
export function initHome() {
  // Check if we're on the home page
  const homePage = document.querySelector('.home-page');
  if (!homePage) return;
  
  console.log('🏠 Home page initialized');
  
  // ========================================
  // 1. STATS COUNTER ANIMATION
  // ========================================
  
  function animateCounters() {
    const counters = $$('.stat-number');
    if (counters.length === 0) return;
    
    // Check if counters are in viewport
    let hasAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          
          counters.forEach(counter => {
            const target = parseInt(counter.dataset.target || counter.textContent, 10);
            if (isNaN(target)) return;
            
            const duration = 2000;
            const startTime = performance.now();
            
            function updateCounter(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              
              // Easing function (ease-out)
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.round(eased * target);
              
              counter.textContent = current.toLocaleString();
              
              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              } else {
                counter.textContent = target.toLocaleString();
              }
            }
            
            requestAnimationFrame(updateCounter);
          });
        }
      });
    }, { threshold: 0.5 });
    
    // Observe each counter's parent container
    const statsGrid = counters[0].closest('.stats-grid');
    if (statsGrid) {
      observer.observe(statsGrid);
    } else {
      counters.forEach(counter => observer.observe(counter));
    }
  }
  
  // ========================================
  // 2. FEATURED RESOURCES CAROUSEL (Optional)
  // ========================================
  
  function initFeaturedCarousel() {
    const carousel = $('.featured-carousel');
    if (!carousel) return;
    
    const slides = $$('.carousel-slide', carousel);
    if (slides.length <= 1) return;
    
    let currentIndex = 0;
    let interval = null;
    const autoplayDelay = 5000;
    
    function goToSlide(index) {
      // Remove active class from all slides
      slides.forEach(slide => removeClass(slide, 'active'));
      
      // Add active class to target slide
      addClass(slides[index], 'active');
      
      // Update dots
      const dots = $$('.carousel-dot', carousel);
      dots.forEach((dot, i) => {
        if (i === index) {
          addClass(dot, 'active');
        } else {
          removeClass(dot, 'active');
        }
      });
      
      currentIndex = index;
    }
    
    function nextSlide() {
      const nextIndex = (currentIndex + 1) % slides.length;
      goToSlide(nextIndex);
    }
    
    function prevSlide() {
      const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
      goToSlide(prevIndex);
    }
    
    // Create dots
    const dotsContainer = carousel.querySelector('.carousel-dots');
    if (dotsContainer) {
      slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot';
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        dot.dataset.index = i;
        
        on(dot, 'click', () => {
          goToSlide(i);
          resetAutoplay();
        });
        
        dotsContainer.appendChild(dot);
      });
      
      // Set initial active dot
      const firstDot = dotsContainer.querySelector('.carousel-dot');
      if (firstDot) addClass(firstDot, 'active');
    }
    
    // Navigation buttons
    const nextBtn = carousel.querySelector('.carousel-next');
    const prevBtn = carousel.querySelector('.carousel-prev');
    
    if (nextBtn) on(nextBtn, 'click', () => { nextSlide(); resetAutoplay(); });
    if (prevBtn) on(prevBtn, 'click', () => { prevSlide(); resetAutoplay(); });
    
    // Autoplay
    function startAutoplay() {
      if (interval) clearInterval(interval);
      interval = setInterval(nextSlide, autoplayDelay);
    }
    
    function resetAutoplay() {
      if (interval) {
        clearInterval(interval);
        startAutoplay();
      }
    }
    
    // Pause on hover
    if (carousel) {
      on(carousel, 'mouseenter', () => {
        if (interval) clearInterval(interval);
      });
      
      on(carousel, 'mouseleave', startAutoplay);
    }
    
    // Initialize first slide
    goToSlide(0);
    startAutoplay();
    
    // Keyboard support
    on(document, 'keydown', (e) => {
      if (!carousel.matches(':hover') && !carousel.matches(':focus-within')) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
        resetAutoplay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextSlide();
        resetAutoplay();
      }
    });
  }
  
  // ========================================
  // 3. GROUP CARD CLICK HANDLING
  // ========================================
  
  function initGroupCard() {
    const groupCard = $('.group-card');
    if (!groupCard) return;
    
    // The card is already clickable via the cards.js component
    // Add a custom interaction if needed
    
    // Example: Add ripple effect on click
    on(groupCard, 'click', (e) => {
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = groupCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.width = '100px';
      ripple.style.height = '100px';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255,255,255,0.15)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out forwards';
      ripple.style.pointerEvents = 'none';
      
      groupCard.style.position = 'relative';
      groupCard.style.overflow = 'hidden';
      groupCard.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  }
  
  // ========================================
  // 4. INITIALIZE
  // ========================================
  
  // Animate counters
  animateCounters();
  
  // Initialize carousel
  initFeaturedCarousel();
  
  // Initialize group card
  initGroupCard();
  
  // Add ripple animation keyframes if not already present
  if (!document.querySelector('#ripple-styles')) {
    const style = document.createElement('style');
    style.id = 'ripple-styles';
    style.textContent = `
      @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initHome();
});