// ========================================
// CONTACT PAGE
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize contact page functionality
 */
export function initContact() {
  // Check if we're on the contact page
  const contactPage = document.querySelector('.contact-page');
  if (!contactPage) return;
  
  console.log('📧 Contact page initialized');
  
  // ========================================
  // 1. CONTACT FORM
  // ========================================
  
  const contactForm = $('.contact-form');
  if (!contactForm) return;
  
  // ========================================
  // 1.1 Form validation
  // ========================================
  
  const formFields = contactForm.querySelectorAll('input, textarea, select');
  
  // Validation rules
  const validators = {
    required: (value) => value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    phone: (value) => /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(value.trim()),
    minLength: (value, min) => value.trim().length >= min,
    maxLength: (value, max) => value.trim().length <= max,
  };
  
  function validateField(field) {
    const rules = field.dataset.validate ? field.dataset.validate.split(' ') : [];
    const value = field.value;
    let isValid = true;
    let errorMessage = '';
    
    const isRequired = field.hasAttribute('required') || rules.includes('required');
    
    if (isRequired && !validators.required(value)) {
      isValid = false;
      errorMessage = field.dataset.requiredMessage || 'This field is required';
    } else if (rules.includes('email') && value.trim() && !validators.email(value)) {
      isValid = false;
      errorMessage = field.dataset.emailMessage || 'Please enter a valid email address';
    } else if (rules.includes('phone') && value.trim() && !validators.phone(value)) {
      isValid = false;
      errorMessage = field.dataset.phoneMessage || 'Please enter a valid phone number';
    } else if (rules.some(r => r.startsWith('min:'))) {
      const min = parseInt(rules.find(r => r.startsWith('min:')).split(':')[1]);
      if (value.trim() && value.length < min) {
        isValid = false;
        errorMessage = field.dataset.minMessage || `Minimum ${min} characters required`;
      }
    } else if (rules.some(r => r.startsWith('max:'))) {
      const max = parseInt(rules.find(r => r.startsWith('max:')).split(':')[1]);
      if (value.trim() && value.length > max) {
        isValid = false;
        errorMessage = field.dataset.maxMessage || `Maximum ${max} characters allowed`;
      }
    }
    
    // Update field state
    const errorEl = field.closest('.form-group')?.querySelector('.form-error');
    
    if (isValid) {
      removeClass(field, 'is-error');
      addClass(field, 'is-success');
      field.setAttribute('aria-invalid', 'false');
      if (errorEl) {
        errorEl.textContent = '';
        removeClass(errorEl, 'visible');
      }
    } else {
      addClass(field, 'is-error');
      removeClass(field, 'is-success');
      field.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        addClass(errorEl, 'visible');
      }
    }
    
    return isValid;
  }
  
  function validateForm() {
    let isValid = true;
    formFields.forEach(field => {
      if (field.disabled) return;
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) isValid = false;
    });
    return isValid;
  }
  
  // ========================================
  // 1.2 Real-time validation
  // ========================================
  
  formFields.forEach(field => {
    // Validate on blur
    on(field, 'blur', () => {
      validateField(field);
    });
    
    // Validate on input (debounced)
    on(field, 'input', debounce(() => {
      if (field.value.trim().length > 0) {
        validateField(field);
      } else {
        // Clear error state
        removeClass(field, 'is-error');
        removeClass(field, 'is-success');
        field.setAttribute('aria-invalid', 'false');
        const errorEl = field.closest('.form-group')?.querySelector('.form-error');
        if (errorEl) {
          errorEl.textContent = '';
          removeClass(errorEl, 'visible');
        }
      }
    }, 300));
  });

  // Prevent ancestor key handlers from blocking typing (e.g., Space key)
  // Stop propagation of Space key presses from inputs and textareas so
  // page-level keyboard handlers don't prevent inserting spaces.
  formFields.forEach(field => {
    field.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.stopPropagation();
      }

      if (e.key === 'Enter' && field.tagName !== 'TEXTAREA') {
        // Submit the form when Enter is pressed inside text inputs.
        // Textareas should retain newline behavior.
        e.preventDefault();
        contactForm.requestSubmit();
      }
    });

    // Older browsers may rely on keypress
    field.addEventListener('keypress', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.stopPropagation();
      }
    });
  });
  
  // ========================================
  // 1.3 Form submission
  // ========================================
  
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn?.textContent || 'Send Message';
  const formErrorEl = $('.form-message.error', contactForm) || $('.form-error-general');
  const WHATSAPP_NUMBER = '256726863281'; // Replace with your WhatsApp number

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      padding: 12px 24px;
      border-radius: 12px;
      background: ${type === 'success' ? '#10b981' : '#3b82f6'};
      color: #fff;
      font-weight: 500;
      font-size: 0.9rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.20);
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
      font-family: 'Inter', sans-serif;
      max-width: 90%;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<i class="fab fa-whatsapp" aria-hidden="true" style="font-size: 18px;"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 300);
    }, 3000);
  }

  // ========================================
  // DIRECT CHARACTER MAPPING
  // ========================================

  const MATH_ITALIC_MAP = {
    'A': '𝑨', 'B': '𝑩', 'C': '𝑪', 'D': '𝑫', 'E': '𝑬', 'F': '𝑭',
    'G': '𝑮', 'H': '𝑯', 'I': '𝑰', 'J': '𝑱', 'K': '𝑲', 'L': '𝑳',
    'M': '𝑴', 'N': '𝑵', 'O': '𝑶', 'P': '𝑷', 'Q': '𝑸', 'R': '𝑹',
    'S': '𝑺', 'T': '𝑻', 'U': '𝑼', 'V': '𝑽', 'W': '𝑾', 'X': '𝑿',
    'Y': '𝒀', 'Z': '𝒁',
    'a': '𝒂', 'b': '𝒃', 'c': '𝒄', 'd': '𝒅', 'e': '𝒆', 'f': '𝒇',
    'g': '𝒈', 'h': '𝒉', 'i': '𝒊', 'j': '𝒋', 'k': '𝒌', 'l': '𝒍',
    'm': '𝒎', 'n': '𝒏', 'o': '𝒐', 'p': '𝒑', 'q': '𝒒', 'r': '𝒓',
    's': '𝒔', 't': '𝒕', 'u': '𝒖', 'v': '𝒗', 'w': '𝒘', 'x': '𝒙',
    'y': '𝒚', 'z': '𝒛'
  };

  function toMathItalic(text) {
    return Array.from(text).map(char => {
      return MATH_ITALIC_MAP[char] || char;
    }).join('');
  }

  
  on(contactForm, 'submit', function(e) {
    e.preventDefault();
    
    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      const firstError = contactForm.querySelector('.is-error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    
    const subjectField = contactForm.querySelector('#subject');
    const subject = subjectField ? (
      subjectField.tagName === 'SELECT'
        ? (subjectField.selectedOptions[0]?.textContent || subjectField.value).trim()
        : subjectField.value.trim()
    ) : '';
    const message = contactForm.querySelector('#message')?.value.trim() || '';
    
    const styledSubject = toMathItalic(subject);
    const styledMessage = toMathItalic(message);
    let whatsappMessage = `*${styledSubject}*\n\n`;
    whatsappMessage += `${styledMessage}\n\n`;
    whatsappMessage += toMathItalic('— From Clareon');
    
    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening WhatsApp...';
    }
    
    if (formErrorEl) {
      formErrorEl.textContent = '';
      removeClass(formErrorEl, 'visible');
    }

    // Show toast, wait a short period, then attempt to open WhatsApp.
    showToast('Opening WhatsApp...', 'success');

    const openDelay = 1500; // ms
    const openTimer = setTimeout(() => {
      try {
        const newWindow = window.open(whatsappUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          window.location.href = whatsappUrl;
        }

        if (window.gtag) {
          window.gtag('event', 'contact_whatsapp_open', {
            form_id: contactForm.id || 'contact',
            form_name: contactForm.dataset.name || 'Contact Form',
          });
        }
      } catch (err) {
        if (formErrorEl) {
          formErrorEl.textContent = 'Unable to open WhatsApp. Please try manually.';
          addClass(formErrorEl, 'visible');
        }
        console.error(err);
      } finally {
        clearTimeout(openTimer);
        contactForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    }, openDelay);
  });
  
  // ========================================
  // 2. CONTACT INFO CARDS (Optional interaction)
  // ========================================
  
  const infoCards = $$('.info-card');
  infoCards.forEach(card => {
    // Add subtle hover effect
    on(card, 'mouseenter', () => {
      const icon = card.querySelector('.info-icon i');
      if (icon) {
        icon.style.transition = 'transform 0.3s ease';
        icon.style.transform = 'scale(1.2)';
      }
    });
    
    on(card, 'mouseleave', () => {
      const icon = card.querySelector('.info-icon i');
      if (icon) {
        icon.style.transform = 'scale(1)';
      }
    });
  });
  
  // ========================================
  // 3. PHONE/EMAIL CLICK TRACKING
  // ========================================
  
  const contactLinks = contactPage.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]');
  contactLinks.forEach(link => {
    on(link, 'click', () => {
      const type = link.href.startsWith('tel:') ? 'phone' : 'email';
      const value = link.href.replace(/^(tel|mailto):/, '');
      
      // Track with analytics
      if (window.gtag) {
        window.gtag('event', 'contact_click', {
          contact_type: type,
          contact_value: value,
        });
      }
      
      const event = new CustomEvent('contactLinkClicked', {
        detail: { type, value }
      });
      document.dispatchEvent(event);
    });
  });
  
  console.log('📧 Contact page initialized');
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initContact();
});