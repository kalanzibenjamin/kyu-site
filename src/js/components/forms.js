// ========================================
// FORMS COMPONENT
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, toggleClass, domReady } from '../utils/dom.js';
import { debounce, escapeHtml } from '../utils/helpers.js';

/**
 * Initialize form handling
 * @param {Object} options - Configuration options
 * @param {string} options.formSelector - Form selector (default: '.contact-form')
 * @param {string} options.successSelector - Success message selector (default: '.form-success')
 * @param {string} options.errorSelector - Error message selector (default: '.form-error')
 * @param {string} options.loadingClass - Loading class (default: 'form-loading')
 * @param {string} options.errorClass - Error class (default: 'is-error')
 * @param {string} options.successClass - Success class (default: 'is-success')
 * @param {boolean} options.validateOnBlur - Validate on blur (default: true)
 * @param {boolean} options.validateOnInput - Validate on input (default: false)
 * @param {boolean} options.resetOnSuccess - Reset form on success (default: true)
 * @param {string} options.submitEndpoint - Submit endpoint URL (default: form action)
 * @param {string} options.submitMethod - Submit method (default: form method)
 */
export function initForms(options = {}) {
  const config = {
    formSelector: '.contact-form',
    successSelector: '.form-success',
    errorSelector: '.form-error',
    loadingClass: 'form-loading',
    errorClass: 'is-error',
    successClass: 'is-success',
    validateOnBlur: true,
    validateOnInput: false,
    resetOnSuccess: true,
    submitEndpoint: null,
    submitMethod: null,
    ...options,
  };
  
  const forms = $$(config.formSelector);
  if (forms.length === 0) return;
  
  // ========================================
  // 1. VALIDATION RULES
  // ========================================
  
  const validators = {
    required: (value) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    },
    
    email: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value.trim());
    },
    
    phone: (value) => {
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
      return phoneRegex.test(value.trim());
    },
    
    minLength: (value, min) => {
      return value.trim().length >= min;
    },
    
    maxLength: (value, max) => {
      return value.trim().length <= max;
    },
    
    number: (value) => {
      return !isNaN(parseFloat(value)) && isFinite(value);
    },
    
    url: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    
    match: (value, fieldId) => {
      const matchField = $(`#${fieldId}`);
      if (!matchField) return true;
      return value === matchField.value;
    },
  };
  
  // ========================================
  // 2. VALIDATE A SINGLE FIELD
  // ========================================
  
  function validateField(field) {
    const rules = field.dataset.validate ? field.dataset.validate.split(' ') : [];
    const value = field.value;
    let isValid = true;
    let errorMessage = '';
    
    // Check if field is required (also check for required attribute)
    const isRequired = field.hasAttribute('required') || rules.includes('required');
    
    if (isRequired && !validators.required(value)) {
      isValid = false;
      errorMessage = field.dataset.requiredMessage || 'This field is required';
    } else if (rules.includes('email') && !validators.email(value)) {
      isValid = false;
      errorMessage = field.dataset.emailMessage || 'Please enter a valid email address';
    } else if (rules.includes('phone') && !validators.phone(value)) {
      isValid = false;
      errorMessage = field.dataset.phoneMessage || 'Please enter a valid phone number';
    } else if (rules.includes('number') && !validators.number(value)) {
      isValid = false;
      errorMessage = field.dataset.numberMessage || 'Please enter a valid number';
    } else if (rules.includes('url') && !validators.url(value)) {
      isValid = false;
      errorMessage = field.dataset.urlMessage || 'Please enter a valid URL';
    } else if (rules.some(r => r.startsWith('min:'))) {
      const min = parseInt(rules.find(r => r.startsWith('min:')).split(':')[1]);
      if (value.length < min) {
        isValid = false;
        errorMessage = field.dataset.minMessage || `Minimum ${min} characters required`;
      }
    } else if (rules.some(r => r.startsWith('max:'))) {
      const max = parseInt(rules.find(r => r.startsWith('max:')).split(':')[1]);
      if (value.length > max) {
        isValid = false;
        errorMessage = field.dataset.maxMessage || `Maximum ${max} characters allowed`;
      }
    } else if (rules.some(r => r.startsWith('match:'))) {
      const matchId = rules.find(r => r.startsWith('match:')).split(':')[1];
      if (!validators.match(value, matchId)) {
        isValid = false;
        errorMessage = field.dataset.matchMessage || 'Fields do not match';
      }
    }
    
    // Update field state
    if (isValid) {
      removeClass(field, config.errorClass);
      addClass(field, config.successClass);
      field.setAttribute('aria-invalid', 'false');
      
      // Clear error message
      const errorEl = field.closest('.form-group')?.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = '';
        removeClass(errorEl, 'visible');
      }
    } else {
      addClass(field, config.errorClass);
      removeClass(field, config.successClass);
      field.setAttribute('aria-invalid', 'true');
      
      // Show error message
      const errorEl = field.closest('.form-group')?.querySelector('.form-error');
      if (errorEl) {
        errorEl.textContent = errorMessage;
        addClass(errorEl, 'visible');
      }
    }
    
    return isValid;
  }
  
  // ========================================
  // 3. VALIDATE ENTIRE FORM
  // ========================================
  
  function validateForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    fields.forEach(field => {
      // Skip disabled fields
      if (field.disabled) return;
      
      // Skip fields without validation
      if (!field.dataset.validate && !field.hasAttribute('required')) return;
      
      const fieldIsValid = validateField(field);
      if (!fieldIsValid) isValid = false;
    });
    
    return isValid;
  }
  
  // ========================================
  // 4. HANDLE FORM SUBMISSION
  // ========================================
  
  function handleSubmit(form, e) {
    if (e) e.preventDefault();
    
    // Validate form
    const isValid = validateForm(form);
    
    if (!isValid) {
      // Focus first invalid field
      const firstError = form.querySelector(`.${config.errorClass}`);
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    
    // Get submit button
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn?.textContent || 'Submit';
    
    // Show loading state
    addClass(form, config.loadingClass);
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }
    
    // Collect form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Determine submit endpoint
    const endpoint = config.submitEndpoint || form.action || window.location.href;
    const method = config.submitMethod || form.method || 'POST';
    
    // ========================================
    // 4.1 AJAX SUBMISSION
    // ========================================
    
    fetch(endpoint, {
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
      handleSuccess(form, result);
    })
    .catch(error => {
      // Error
      handleError(form, error);
    })
    .finally(() => {
      // Reset loading state
      removeClass(form, config.loadingClass);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }
  
  // ========================================
  // 5. SUCCESS / ERROR HANDLING
  // ========================================
  
  function handleSuccess(form, result) {
    // Dispatch success event
    const event = new CustomEvent('formSuccess', {
      detail: { form, result },
    });
    document.dispatchEvent(event);
    
    // Show success message
    const successEl = $(config.successSelector, form) || $(config.successSelector);
    if (successEl) {
      addClass(successEl, 'visible');
    }
    
    // Hide form
    form.style.display = 'none';
    
    // Reset form if configured
    if (config.resetOnSuccess) {
      form.reset();
    }
    
    // Track conversion (analytics)
    if (window.gtag) {
      window.gtag('event', 'form_submission', {
        form_id: form.id || 'contact_form',
        form_name: form.dataset.name || 'Contact Form',
      });
    }
    
    console.log('✅ Form submitted successfully');
  }
  
  function handleError(form, error) {
    // Dispatch error event
    const event = new CustomEvent('formError', {
      detail: { form, error },
    });
    document.dispatchEvent(event);
    
    // Show general error message
    const errorEl = form.querySelector('.form-message.error') || $(config.errorSelector);
    if (errorEl) {
      errorEl.textContent = 'Something went wrong. Please try again.';
      addClass(errorEl, 'visible');
    }
    
    console.error('❌ Form submission error:', error);
  }
  
  // ========================================
  // 6. EVENT LISTENERS
  // ========================================
  
  forms.forEach(form => {
    // ========================================
    // 6.1 Submit handler
    // ========================================
    
    on(form, 'submit', (e) => {
      handleSubmit(form, e);
    });
    
    // ========================================
    // 6.2 Field validation
    // ========================================
    
    const fields = form.querySelectorAll('input, textarea, select');
    
    fields.forEach(field => {
      // Validate on blur
      if (config.validateOnBlur) {
        on(field, 'blur', () => {
          validateField(field);
        });
      }
      
      // Validate on input (real-time)
      if (config.validateOnInput) {
        const debouncedValidate = debounce(() => {
          validateField(field);
        }, 300);
        
        on(field, 'input', debouncedValidate);
      }
    });
    
    // ========================================
    // 6.3 Reset error state on focus
    // ========================================
    
    fields.forEach(field => {
      on(field, 'focus', () => {
        if (hasClass(field, config.errorClass)) {
          removeClass(field, config.errorClass);
          field.setAttribute('aria-invalid', 'false');
          
          const errorEl = field.closest('.form-group')?.querySelector('.form-error');
          if (errorEl) {
            removeClass(errorEl, 'visible');
          }
        }
      });
    });
  });
  
  console.log('📝 Forms initialized');
  
  return {
    validateField,
    validateForm,
    handleSubmit,
    destroy: () => {
      // Cleanup
    },
  };
}

// ========================================
// 7. AUTO-INITIALIZE
// ========================================

domReady(() => {
  if ($('.contact-form')) {
    initForms();
  }
});