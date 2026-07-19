// ========================================
// CONTRIBUTE PAGE
// ========================================

import { $, $$, on, addClass, removeClass, hasClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize contribute page functionality
 */
export function initContribute() {
  // Check if we're on the contribute page
  const contributePage = document.querySelector('.contribute-page');
  if (!contributePage) return;
  
  console.log('🤝 Contribute page initialized');
  
  // ========================================
  // 1. CONTRIBUTION FORM
  // ========================================
  
  const contributeForm = $('.contribute-form');
  if (!contributeForm) return;
  
  const formFields = contributeForm.querySelectorAll('input, textarea, select');
  const submitBtn = contributeForm.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn?.textContent || 'Submit';
  const successEl = $('.form-success');
  const formErrorEl = $('.form-message.error');
  
  // ========================================
  // 1.1 File upload preview
  // ========================================
  
  const fileInput = contributeForm.querySelector('input[type="file"]');
  if (fileInput) {
    const filePreview = contributeForm.querySelector('.file-preview');
    
    on(fileInput, 'change', () => {
      if (!filePreview) return;
      
      const files = fileInput.files;
      if (files.length === 0) {
        filePreview.innerHTML = '';
        filePreview.style.display = 'none';
        return;
      }
      
      filePreview.style.display = 'block';
      filePreview.innerHTML = '';
      
      Array.from(files).forEach(file => {
        const fileSize = (file.size / 1024).toFixed(1);
        const icon = file.type.startsWith('image/') ? 'fa-file-image' : 'fa-file';
        
        const el = document.createElement('div');
        el.className = 'file-item';
        el.innerHTML = `
          <i class="fas ${icon}"></i>
          <span>${file.name}</span>
          <small>(${fileSize} KB)</small>
        `;
        filePreview.appendChild(el);
      });
    });
  }
  
  // ========================================
  // 1.2 Contribution type selection
  // ========================================
  
  const typeCards = $$('.submit-type-card');
  const typeInput = contributeForm.querySelector('input[name="contribution_type"]');
  
  if (typeCards.length > 0 && typeInput) {
    typeCards.forEach(card => {
      on(card, 'click', () => {
        // Remove active state from all cards
        typeCards.forEach(c => removeClass(c, 'selected'));
        
        // Add active state to clicked card
        addClass(card, 'selected');
        
        // Set hidden input value
        const type = card.dataset.type || card.querySelector('h5')?.textContent || '';
        typeInput.value = type;
        
        // Track type selection
        const event = new CustomEvent('contributionTypeSelected', {
          detail: { type }
        });
        document.dispatchEvent(event);
      });
      
      // Keyboard support
      on(card, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
      
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
    });
  }
  
  // ========================================
  // 1.3 Form validation
  // ========================================
  
  function validateField(field) {
    const rules = field.dataset.validate ? field.dataset.validate.split(' ') : [];
    const value = field.value;
    let isValid = true;
    let errorMessage = '';
    
    const isRequired = field.hasAttribute('required') || rules.includes('required');
    
    if (isRequired && !value.trim()) {
      isValid = false;
      errorMessage = field.dataset.requiredMessage || 'This field is required';
    } else if (rules.includes('email') && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      isValid = false;
      errorMessage = field.dataset.emailMessage || 'Please enter a valid email address';
    } else if (rules.some(r => r.startsWith('min:'))) {
      const min = parseInt(rules.find(r => r.startsWith('min:')).split(':')[1]);
      if (value.trim() && value.length < min) {
        isValid = false;
        errorMessage = field.dataset.minMessage || `Minimum ${min} characters required`;
      }
    }
    
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
  
  // Real-time validation
  formFields.forEach(field => {
    on(field, 'blur', () => {
      if (field.value.trim().length > 0 || field.hasAttribute('required')) {
        validateField(field);
      }
    });
    
    on(field, 'input', debounce(() => {
      if (field.value.trim().length > 0) {
        validateField(field);
      }
    }, 300));
  });
  
  // ========================================
  // 1.4 Form submission
  // ========================================
  
  on(contributeForm, 'submit', function(e) {
    e.preventDefault();
    
    // Validate form
    const isValid = validateForm();
    if (!isValid) {
      const firstError = contributeForm.querySelector('.is-error');
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    
    // Check if contribution type is selected
    const type = typeInput?.value;
    if (!type && typeCards.length > 0) {
      typeCards.forEach(c => addClass(c, 'error'));
      
      const errorMsg = document.createElement('div');
      errorMsg.className = 'form-message error visible';
      errorMsg.textContent = 'Please select a contribution type';
      contributeForm.prepend(errorMsg);
      
      setTimeout(() => errorMsg.remove(), 4000);
      return;
    }
    
    // Show loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
    
    // Collect form data
    const formData = new FormData(contributeForm);
    const data = Object.fromEntries(formData.entries());
    
    // Determine submit URL
    const action = contributeForm.getAttribute('action') || window.location.href;
    const method = contributeForm.getAttribute('method') || 'POST';
    
    // Submit
    fetch(action, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(result => {
      // Success
      contributeForm.style.display = 'none';
      if (successEl) {
        addClass(successEl, 'visible');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      if (window.gtag) {
        window.gtag('event', 'contribution_submit', {
          contribution_type: type,
          form_name: 'contribute_form',
        });
      }
      
      const event = new CustomEvent('contributionSubmitted', {
        detail: { result, type }
      });
      document.dispatchEvent(event);
      
      console.log('✅ Contribution submitted successfully');
    })
    .catch(error => {
      console.error('❌ Contribution submission error:', error);
      
      if (formErrorEl) {
        formErrorEl.textContent = 'Something went wrong. Please try again or email us directly.';
        addClass(formErrorEl, 'visible');
      }
      
      const event = new CustomEvent('contributionError', {
        detail: { error }
      });
      document.dispatchEvent(event);
    })
    .finally(() => {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    });
  });
  
  // ========================================
  // 2. BENEFITS CARD ANIMATION
  // ========================================
  
  const benefitItems = $$('.benefit-item');
  if (benefitItems.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            addClass(entry.target, 'visible');
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    
    benefitItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateX(-20px)';
      item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(item);
    });
  }
  
  // ========================================
  // 3. STEP CARDS ANIMATION
  // ========================================
  
  const stepCards = $$('.step-card');
  if (stepCards.length > 0 && 'IntersectionObserver' in window) {
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
    
    stepCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(card);
    });
  }
  
  // ========================================
  // 4. ADD VISIBLE CLASS STYLES
  // ========================================
  
  const style = document.createElement('style');
  style.textContent = `
    .step-card.visible,
    .benefit-item.visible {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
    .benefit-item.visible {
      transform: translateX(0) !important;
    }
    .submit-type-card.selected {
      border-color: var(--accent-blue, #4f9eff);
      background: rgba(79, 158, 255, 0.12);
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(79, 158, 255, 0.15);
    }
    .submit-type-card.error {
      border-color: #ef4444;
      animation: shake 0.4s ease;
    }
    .file-preview {
      display: none;
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      border: 1px dashed var(--glass-border);
    }
    .file-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .file-item i {
      color: var(--accent-blue);
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-8px); }
      40%, 80% { transform: translateX(8px); }
    }
  `;
  document.head.appendChild(style);
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initContribute();
});