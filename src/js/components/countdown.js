// ========================================
// COUNTDOWN COMPONENT
// ========================================

import { $, on, domReady } from '../utils/dom.js';

/**
 * Initialize countdown timer
 * @param {Object} options - Configuration options
 * @param {string} options.targetDate - Target date (ISO string or Date object)
 * @param {string} options.containerSelector - Container selector (default: '.countdown')
 * @param {string} options.daysSelector - Days element selector (default: '.countdown-days')
 * @param {string} options.hoursSelector - Hours element selector (default: '.countdown-hours')
 * @param {string} options.minutesSelector - Minutes element selector (default: '.countdown-minutes')
 * @param {string} options.secondsSelector - Seconds element selector (default: '.countdown-seconds')
 * @param {string} options.completedMessage - Message when countdown completes (default: '🎉 Started!')
 * @param {boolean} options.autoStart - Auto-start countdown (default: true)
 * @param {number} options.updateInterval - Update interval in ms (default: 1000)
 */
export function initCountdown(options = {}) {
  const config = {
    targetDate: null,
    containerSelector: '.countdown',
    daysSelector: '.countdown-days',
    hoursSelector: '.countdown-hours',
    minutesSelector: '.countdown-minutes',
    secondsSelector: '.countdown-seconds',
    completedMessage: '🎉 Started!',
    autoStart: true,
    updateInterval: 1000,
    ...options,
  };
  
  const container = $(config.containerSelector);
  if (!container) return null;
  
  // Get target date from data attribute or options
  let targetDate = config.targetDate || container.dataset.targetDate;
  
  if (!targetDate) {
    console.warn('No target date provided for countdown');
    return null;
  }
  
  // Parse target date
  const target = new Date(targetDate);
  if (isNaN(target.getTime())) {
    console.warn('Invalid target date:', targetDate);
    return null;
  }
  
  // Get elements
  const daysEl = $(config.daysSelector, container);
  const hoursEl = $(config.hoursSelector, container);
  const minutesEl = $(config.minutesSelector, container);
  const secondsEl = $(config.secondsSelector, container);
  
  let timer = null;
  let isRunning = false;
  let isCompleted = false;
  
  // ========================================
  // 1. CALCULATE TIME REMAINING
  // ========================================
  
  function getTimeRemaining() {
    const now = new Date();
    const timeRemaining = target.getTime() - now.getTime();
    
    if (timeRemaining <= 0) {
      return {
        total: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isComplete: true,
      };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
    
    return {
      total: timeRemaining,
      days,
      hours,
      minutes,
      seconds,
      isComplete: false,
    };
  }
  
  // ========================================
  // 2. UPDATE DISPLAY
  // ========================================
  
  function updateDisplay() {
    const remaining = getTimeRemaining();
    
    if (remaining.isComplete) {
      // Countdown completed
      if (!isCompleted) {
        isCompleted = true;
        container.classList.add('completed');
        
        // Show completed message
        const messageEl = container.querySelector('.countdown-message');
        if (messageEl) {
          messageEl.textContent = config.completedMessage;
          messageEl.style.display = 'block';
        }
        
        // Hide individual numbers
        if (daysEl) daysEl.parentElement.style.display = 'none';
        if (hoursEl) hoursEl.parentElement.style.display = 'none';
        if (minutesEl) minutesEl.parentElement.style.display = 'none';
        if (secondsEl) secondsEl.parentElement.style.display = 'none';
        
        // Dispatch completion event
        const event = new CustomEvent('countdownComplete');
        document.dispatchEvent(event);
        
        stop();
      }
      return;
    }
    
    // Update each element
    if (daysEl) {
      daysEl.textContent = String(remaining.days).padStart(2, '0');
      // Update aria-label
      const label = daysEl.closest('.countdown-unit')?.querySelector('.countdown-label');
      if (label) {
        label.textContent = remaining.days === 1 ? 'Day' : 'Days';
      }
    }
    
    if (hoursEl) {
      hoursEl.textContent = String(remaining.hours).padStart(2, '0');
      const label = hoursEl.closest('.countdown-unit')?.querySelector('.countdown-label');
      if (label) {
        label.textContent = remaining.hours === 1 ? 'Hour' : 'Hours';
      }
    }
    
    if (minutesEl) {
      minutesEl.textContent = String(remaining.minutes).padStart(2, '0');
      const label = minutesEl.closest('.countdown-unit')?.querySelector('.countdown-label');
      if (label) {
        label.textContent = remaining.minutes === 1 ? 'Minute' : 'Minutes';
      }
    }
    
    if (secondsEl) {
      secondsEl.textContent = String(remaining.seconds).padStart(2, '0');
      const label = secondsEl.closest('.countdown-unit')?.querySelector('.countdown-label');
      if (label) {
        label.textContent = remaining.seconds === 1 ? 'Second' : 'Seconds';
      }
    }
    
    // Update progress bar (optional)
    const progressBar = container.querySelector('.countdown-progress');
    if (progressBar) {
      const totalMs = target.getTime() - new Date(container.dataset.startDate || Date.now()).getTime();
      const progress = 100 - (remaining.total / totalMs * 100);
      progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
    }
  }
  
  // ========================================
  // 3. START / STOP / RESET
  // ========================================
  
  function start() {
    if (isRunning) return;
    isRunning = true;
    isCompleted = false;
    
    // Remove completed state
    container.classList.remove('completed');
    
    // Show units
    const units = container.querySelectorAll('.countdown-unit');
    units.forEach(unit => unit.style.display = '');
    
    // Hide message
    const messageEl = container.querySelector('.countdown-message');
    if (messageEl) {
      messageEl.style.display = 'none';
    }
    
    // Update immediately
    updateDisplay();
    
    // Start timer
    timer = setInterval(updateDisplay, config.updateInterval);
    
    // Dispatch start event
    const event = new CustomEvent('countdownStart');
    document.dispatchEvent(event);
    
    console.log('⏱️ Countdown started');
  }
  
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    isRunning = false;
    
    const event = new CustomEvent('countdownStop');
    document.dispatchEvent(event);
  }
  
  function reset() {
    stop();
    isCompleted = false;
    container.classList.remove('completed');
    
    // Show units
    const units = container.querySelectorAll('.countdown-unit');
    units.forEach(unit => unit.style.display = '');
    
    // Hide message
    const messageEl = container.querySelector('.countdown-message');
    if (messageEl) {
      messageEl.style.display = 'none';
    }
    
    updateDisplay();
    
    const event = new CustomEvent('countdownReset');
    document.dispatchEvent(event);
  }
  
  // ========================================
  // 4. AUTO-START
  // ========================================
  
  if (config.autoStart) {
    // Check if already completed
    const remaining = getTimeRemaining();
    if (remaining.isComplete) {
      isCompleted = true;
      container.classList.add('completed');
      
      const messageEl = container.querySelector('.countdown-message');
      if (messageEl) {
        messageEl.textContent = config.completedMessage;
        messageEl.style.display = 'block';
      }
      
      const units = container.querySelectorAll('.countdown-unit');
      units.forEach(unit => unit.style.display = 'none');
    } else {
      start();
    }
  }
  
  // ========================================
  // 5. EXPOSE API
  // ========================================
  
  const api = {
    start,
    stop,
    reset,
    getTimeRemaining,
    isRunning: () => isRunning,
    isCompleted: () => isCompleted,
    getTargetDate: () => target,
    update: updateDisplay,
    destroy: () => {
      stop();
    },
  };
  
  // Attach to window for debugging
  window.__countdown = api;
  
  console.log('⏱️ Countdown initialized');
  
  return api;
}

// ========================================
// 6. AUTO-INITIALIZE
// ========================================

domReady(() => {
  // Auto-initialize if countdown exists
  const countdown = $('.countdown');
  if (countdown) {
    initCountdown({
      targetDate: countdown.dataset.targetDate,
    });
  }
});