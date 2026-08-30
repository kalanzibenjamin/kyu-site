// ========================================
// COURSE UNIT PAGES
// ========================================

import { domReady } from '../utils/dom.js';

export function initCourseUnits() {
  const courseUnitPage = document.querySelector('[data-page="course-unit"]');
  if (!courseUnitPage) return;

  initTouchDeviceClass();
  initTopicToggles();
  initTopicNavigation();
  initEpisodeSearch();
  initEpisodeRows();
  initFadeUpObserver();
  setupLongTitleHandling();
}

function initEpisodeSearch() {
  const search = document.getElementById('episode-search');
  const searchWrapper = document.querySelector('.course-episode-search');
  const topics = [...document.querySelectorAll('.course-topic-section')];
  if (!search || !searchWrapper || topics.length === 0) return;

  const normalize = (value) => value.toLocaleLowerCase().trim();
  const count = searchWrapper.querySelector('.course-episode-search-count');
  const clearButton = searchWrapper.querySelector('.course-episode-search-clear');
  const emptyState = document.querySelector('.course-episode-search-empty');
  let idleTimer;
  let isStickyActive = false;

  const updateStickyState = () => {
    const searchTop = searchWrapper.getBoundingClientRect().top;
    const shouldBeSticky = window.scrollY > searchWrapper.offsetTop && searchTop <= 1;
    isStickyActive = shouldBeSticky;

    if (!isStickyActive) {
      window.clearTimeout(idleTimer);
      searchWrapper.classList.remove('is-idle');
    }
  };

  const setActive = () => {
    searchWrapper.classList.remove('is-idle');
    window.clearTimeout(idleTimer);
    updateStickyState();
    if (!isStickyActive) return;
    idleTimer = window.setTimeout(() => {
      if (document.activeElement !== search) searchWrapper.classList.add('is-idle');
    }, 1800);
  };

  const filterEpisodes = () => {
    const query = normalize(search.value);
    const terms = query.split(/\s+/).filter(Boolean);
    let matches = 0;

    topics.forEach((topic) => {
      const rows = [...topic.querySelectorAll('.course-episode-row')];
      const topicText = normalize(topic.querySelector('.course-topic-title')?.textContent || '');
      const matchingRows = rows.filter((row) => {
        const text = normalize(row.querySelector('.course-episode-title')?.textContent || row.textContent);
        return terms.every((term) => text.includes(term) || topicText.includes(term));
      });
      const hasMatches = query.length === 0 || matchingRows.length > 0;
      topic.hidden = !hasMatches;
      rows.forEach((row) => {
        row.hidden = query.length > 0 && !matchingRows.includes(row);
      });

      if (query.length > 0 && matchingRows.length > 0) {
        const header = topic.querySelector('.course-topic-header');
        const content = topic.querySelector('.course-topic-content');
        const icon = header?.querySelector('.collapse-icon');
        content?.classList.add('open');
        header?.setAttribute('aria-expanded', 'true');
        icon?.classList.replace('fa-chevron-right', 'fa-chevron-down');
      }
      matches += matchingRows.length;
    });

    if (count) count.textContent = query ? `${matches} ${matches === 1 ? 'match' : 'matches'}` : '';
    if (clearButton) clearButton.hidden = !query;
    if (emptyState) emptyState.hidden = !query || matches > 0;
    setActive();
  };

  search.addEventListener('input', filterEpisodes);
  clearButton?.addEventListener('click', () => {
    search.value = '';
    filterEpisodes();
    search.focus();
  });
  search.addEventListener('focus', setActive);
  searchWrapper.addEventListener('mouseenter', setActive);
  window.addEventListener('scroll', () => {
    updateStickyState();
    if (isStickyActive) setActive();
  }, { passive: true });
  window.addEventListener('resize', updateStickyState);
  filterEpisodes();
  updateStickyState();
}

function initTouchDeviceClass() {
  const isTouchDevice = 'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  if (isTouchDevice) {
    document.documentElement.classList.add('touch-device');
    document.body.classList.add('touch-device');
  }
}

function initTopicToggles() {
  const headers = document.querySelectorAll('.course-topic-header');
  if (headers.length === 0) return;

  const openTopics = [];

  const setTopicState = (header, topicId, isOpen) => {
    const content = document.getElementById(`topic-content-${topicId}`);
    const icon = header.querySelector('.collapse-icon');
    if (!content) return;

    content.classList.toggle('open', isOpen);
    header.setAttribute('aria-expanded', String(isOpen));
    icon?.classList.toggle('fa-chevron-down', isOpen);
    icon?.classList.toggle('fa-chevron-right', !isOpen);
  };

  const toggleTopic = (header) => {
    const topicId = header.closest('.course-topic-section')?.id?.replace('topic-', '');
    if (!topicId) return;

    const content = document.getElementById(`topic-content-${topicId}`);
    const isOpen = content?.classList.contains('open');
    if (isOpen) {
      setTopicState(header, topicId, false);
      openTopics.splice(openTopics.indexOf(topicId), 1);
      return;
    }

    if (openTopics.length >= 3) {
      const oldestId = openTopics.shift();
      const oldestHeader = document.querySelector(`#topic-${oldestId} .topic-header`);
      if (oldestHeader) setTopicState(oldestHeader, oldestId, false);
    }

    setTopicState(header, topicId, true);
    openTopics.push(topicId);
  };

  headers.forEach((header) => {
    header.setAttribute('aria-expanded', header.getAttribute('aria-expanded') || 'false');
    header.addEventListener('click', () => toggleTopic(header));
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleTopic(header);
      }
    });
  });

  const openTopicFromHash = () => {
    const topicId = window.location.hash.match(/^#topic-(.+)$/)?.[1];
    const header = topicId && document.querySelector(`#topic-${topicId} .topic-header`);
    if (header && !document.getElementById(`topic-content-${topicId}`)?.classList.contains('open')) {
      toggleTopic(header);
    }
  };

  openTopicFromHash();
  window.addEventListener('hashchange', openTopicFromHash);
}

function initTopicNavigation() {
  const topicsNav = document.getElementById('topicsNav');
  const leftButton = document.querySelector('.nav-arrow-left');
  const rightButton = document.querySelector('.nav-arrow-right');
  if (!topicsNav || !leftButton || !rightButton) return;

  const updateButtons = () => {
    const hasOverflow = topicsNav.scrollWidth > topicsNav.clientWidth + 1;
    const atStart = topicsNav.scrollLeft <= 1;
    const atEnd = topicsNav.scrollLeft + topicsNav.clientWidth >= topicsNav.scrollWidth - 1;

    leftButton.disabled = !hasOverflow || atStart;
    rightButton.disabled = !hasOverflow || atEnd;
    leftButton.classList.toggle('hidden', leftButton.disabled);
    rightButton.classList.toggle('hidden', rightButton.disabled);
  };

  leftButton.addEventListener('click', () => topicsNav.scrollBy({ left: -300, behavior: 'smooth' }));
  rightButton.addEventListener('click', () => topicsNav.scrollBy({ left: 300, behavior: 'smooth' }));
  topicsNav.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  updateButtons();
}

function initEpisodeRows() {
  document.querySelectorAll('.episode-row[data-href]').forEach((row) => {
    row.setAttribute('tabindex', row.getAttribute('tabindex') || '0');
    row.setAttribute('role', 'link');

    const navigate = () => {
      window.location.href = row.dataset.href;
    };

    row.addEventListener('click', navigate);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        navigate();
      }
    });
  });
}

function setupLongTitleHandling() {
  document.querySelectorAll('.episode-title, .topic-name').forEach((title) => {
    if (title.querySelector('.episode-title-text, .topic-name-text')) return;

    const wrapper = document.createElement('span');
    wrapper.className = title.classList.contains('episode-title')
      ? 'episode-title-text'
      : 'topic-name-text';
    wrapper.textContent = title.textContent.trim();
    title.replaceChildren(wrapper);
  });
}

function initFadeUpObserver() {
  const fadeElements = document.querySelectorAll('.fade-up');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || !('IntersectionObserver' in window)) {
    fadeElements.forEach((element) => element.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -10% 0px' });

  fadeElements.forEach((element) => observer.observe(element));
}

domReady(() => {
  initCourseUnits();
});
