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
  
  // ========================================
  // 1.3 Form submission
  // ========================================
  
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn?.textContent || 'Send Message';
  const successEl = $('.form-success');
  const formErrorEl = $('.form-message.error', contactForm) || $('.form-error-general');
  
  on(contactForm, 'submit', function(e) {
    e.preventDefault();
    
    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      // Focus first invalid field
      const firstError = contactForm.querySelector('.is-error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }
    
    // Collect form data
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());
    
    // Determine submit URL
    const action = contactForm.getAttribute('action') || window.location.href;
    const method = contactForm.getAttribute('method') || 'POST';
    
    // Submit form
    fetch(action, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(result => {
      // Success
      contactForm.style.display = 'none';
      if (successEl) {
        addClass(successEl, 'visible');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Track conversion
      if (window.gtag) {
        window.gtag('event', 'form_submission', {
          form_name: 'contact_form',
          form_id: contactForm.id || 'contact',
        });
      }
      
      // Dispatch event
      const event = new CustomEvent('contactFormSuccess', {
        detail: { result }
      });
      document.dispatchEvent(event);
      
      console.log('✅ Contact form submitted successfully');
    })
    .catch(error => {
      // Error
      console.error('❌ Contact form submission error:', error);
      
      if (formErrorEl) {
        formErrorEl.textContent = 'Something went wrong. Please try again or email us directly.';
        addClass(formErrorEl, 'visible');
      }
      
      // Dispatch error event
      const event = new CustomEvent('contactFormError', {
        detail: { error }
      });
      document.dispatchEvent(event);
    })
    .finally(() => {
      // Reset button
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
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