// ========================================
// PROGRAMS PAGE
// ========================================

import { $, $$, on, addClass, removeClass, domReady } from '../utils/dom.js';
import { debounce } from '../utils/helpers.js';

/**
 * Initialize programs page functionality
 */
export function initPrograms() {
  // Check if we're on the programs page
  const programsPage = document.querySelector('.programs-page');
  if (!programsPage) return;

  if (document.body.dataset.page === 'course-unit') {
    initCourseUnitPage();
    return;
  }

  initProgramBreadcrumbs(programsPage);
  initYearGroups(programsPage);
  initCourseLinks(programsPage);
  
  console.log('🎓 Programs page initialized');
  
  // ========================================
  // 1. LOAD PROGRAMS FROM JSON
  // ========================================
  
  const container = $('.programs-list');
  if (!container) return;
  
  // Check if already loaded
  if (container.dataset.loaded === 'true') return;
  
  const dataUrl = container.dataset.jsonUrl || '/data/programs.json';
  
  // Check if there are static programs already in the container
  const staticItems = container.querySelectorAll('.school-card');
  if (staticItems.length > 0) {
    // Static content exists, no need to fetch
    container.dataset.loaded = 'true';
    initProgramInteractions(container);
    return;
  }
  
  // Fetch programs from JSON
  fetch(dataUrl)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load programs');
      return response.json();
    })
    .then(data => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        showEmptyState(container);
        return;
      }
      
      renderPrograms(container, data);
      container.dataset.loaded = 'true';
      initProgramInteractions(container);
      
      console.log(`🎓 Loaded ${data.length} programs`);
    })
    .catch(error => {
      console.error('Failed to load programs:', error);
      showEmptyState(container);
    });
  
  // ========================================
  // 2. RENDER PROGRAMS
  // ========================================
  
  function renderPrograms(container, programs) {
    // Clear container
    container.innerHTML = '';
    
    // Sort by school name
    const sorted = [...programs].sort((a, b) => {
      return (a.schoolName || a.name || '').localeCompare(b.schoolName || b.name || '');
    });
    
    // Render each program/school
    sorted.forEach((item, index) => {
      const program = createProgramElement(item, index);
      container.appendChild(program);
    });
  }
  
  function createProgramElement(item, index) {
    const schoolName = item.schoolName || item.name || 'School';
    const schoolCode = item.schoolCode || item.code || '';
    const description = item.description || '';
    const courses = item.courses || item.programs || [];
    const status = item.status || 'active';
    const icon = item.icon || 'fa-graduation-cap';
    
    const div = document.createElement('div');
    div.className = 'school-card fade-up';
    div.dataset.school = schoolCode.toLowerCase();
    div.dataset.status = status;
    div.style.animationDelay = `${index * 100}ms`;
    
    // Status badge class
    let statusClass = 'status-active';
    if (status === 'coming' || status === 'coming-soon') statusClass = 'status-coming';
    else if (status === 'planning') statusClass = 'status-planning';
    
    // Status label
    let statusLabel = 'Active';
    if (status === 'coming' || status === 'coming-soon') statusLabel = 'Coming Soon';
    else if (status === 'planning') statusLabel = 'Planning';
    
    div.innerHTML = `
      <div class="school-header">
        <div class="school-icon">
          <i class="fas ${icon}"></i>
        </div>
        <div class="school-info">
          <h2>${schoolName}</h2>
          ${schoolCode ? `<span class="school-code">${schoolCode}</span>` : ''}
        </div>
        <span class="school-status ${statusClass}">${statusLabel}</span>
      </div>
      ${description ? `<p class="school-description">${description}</p>` : ''}
      <div class="course-list">
        ${courses.map(course => `
          <span class="course-tag ${course.status === 'coming' ? 'coming' : ''}">
            <i class="fas ${course.status === 'coming' ? 'fa-clock' : 'fa-check-circle'}"></i>
            ${course.name || course}
          </span>
        `).join('')}
      </div>
    `;
    
    return div;
  }
  
  // ========================================
  // 3. EMPTY STATE
  // ========================================
  
  function showEmptyState(container) {
    container.innerHTML = `
      <div class="no-programs">
        <i class="fas fa-university"></i>
        <h3>No programs found</h3>
        <p>Check back soon for program information.</p>
      </div>
    `;
  }
  
  // ========================================
  // 4. PROGRAM INTERACTIONS
  // ========================================
  
  function initProgramInteractions(container) {
    // ========================================
    // 4.1 Search programs
    // ========================================
    
    const searchInput = $('.programs-search input');
    if (searchInput) {
      const items = container.querySelectorAll('.school-card');
      
      const searchHandler = debounce((query) => {
        const trimmed = query.trim().toLowerCase();
        
        items.forEach(item => {
          const text = item.textContent.toLowerCase();
          const school = (item.dataset.school || '').toLowerCase();
          
          if (trimmed.length < 2) {
            item.style.display = '';
            return;
          }
          
          if (text.includes(trimmed) || school.includes(trimmed)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
        
        // Update stats
        updateVisibleStats(items);
      }, 300);
      
      on(searchInput, 'input', (e) => {
        searchHandler(e.target.value);
      });
      
      // Clear button
      const clearBtn = $('.programs-search .search-clear');
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
    // 4.2 Filter buttons
    // ========================================
    
    const filterButtons = $$('.filter-btn');
    const items = container.querySelectorAll('.school-card');
    
    if (filterButtons.length > 0) {
      filterButtons.forEach(btn => {
        on(btn, 'click', () => {
          // Update active state
          filterButtons.forEach(b => removeClass(b, 'active'));
          addClass(btn, 'active');
          
          const filter = btn.dataset.filter || 'all';
          
          items.forEach(item => {
            const school = item.dataset.school || '';
            const status = item.dataset.status || '';
            
            if (filter === 'all') {
              item.style.display = '';
            } else if (filter === 'active' && status === 'active') {
              item.style.display = '';
            } else if (filter === 'coming' && (status === 'coming' || status === 'coming-soon')) {
              item.style.display = '';
            } else if (filter === 'planning' && status === 'planning') {
              item.style.display = '';
            } else if (school === filter) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
          
          // Update stats
          updateVisibleStats(items);
        });
      });
    }
    
    // ========================================
    // 4.3 Stats update
    // ========================================
    
    function updateVisibleStats(items) {
      const visibleItems = Array.from(items).filter(item => item.style.display !== 'none');
      const totalVisible = visibleItems.length;
      
      // Update stats
      const stats = container.closest('.programs-page')?.querySelector('.programs-stats');
      if (stats) {
        const countEl = stats.querySelector('.stat-count');
        if (countEl) {
          countEl.textContent = totalVisible;
        }
      }
      
      // Show/hide no results
      const noResults = container.querySelector('.no-programs');
      if (noResults) {
        if (totalVisible === 0) {
          noResults.style.display = 'block';
        } else {
          noResults.style.display = 'none';
        }
      }
    }
    
    // ========================================
    // 4.4 Course tag click
    // ========================================
    
    const courseTags = container.querySelectorAll('.course-tag');
    courseTags.forEach(tag => {
      on(tag, 'click', (e) => {
        e.stopPropagation();
        const courseName = tag.textContent.trim();
        
        // Track course tag click
        if (window.gtag) {
          window.gtag('event', 'course_tag_click', {
            course_name: courseName,
          });
        }
        
        const event = new CustomEvent('courseTagClicked', {
          detail: { courseName }
        });
        document.dispatchEvent(event);
      });
    });
  }
}

function initYearGroups(programsPage) {
  const curriculum = programsPage.querySelector('.curriculum');
  const semesterGrid = curriculum?.querySelector('.semester-grid');
  if (!semesterGrid || semesterGrid.dataset.grouped === 'true') return;

  const semesterBlocks = Array.from(semesterGrid.children).filter((element) => {
    return element.classList.contains('semester-block');
  });
  if (semesterBlocks.length === 0) return;

  const years = new Map();
  semesterBlocks.forEach((semesterBlock) => {
    const heading = semesterBlock.querySelector('h3')?.textContent.trim() || '';
    const yearMatch = heading.match(/Year\s+(\d+)/i);
    const yearNumber = yearMatch ? yearMatch[1] : '1';
    if (!years.has(yearNumber)) years.set(yearNumber, []);
    years.get(yearNumber).push(semesterBlock);
  });

  semesterGrid.replaceChildren();
  years.forEach((blocks, yearNumber) => {
    const yearGroup = document.createElement('section');
    yearGroup.className = 'year-group';
    yearGroup.setAttribute('aria-labelledby', `year-${yearNumber}-title`);

    const yearHeader = document.createElement('div');
    yearHeader.className = 'year-header';
    yearHeader.innerHTML = `<h3 id="year-${yearNumber}-title"><i class="fas fa-graduation-cap"></i> Year ${yearNumber}</h3>`;

    const semesterRow = document.createElement('div');
    semesterRow.className = 'semester-row';
    blocks.forEach((block) => semesterRow.appendChild(block));

    yearGroup.append(yearHeader, semesterRow);
    semesterGrid.appendChild(yearGroup);
  });

  semesterGrid.dataset.grouped = 'true';
}

function initCourseLinks(programsPage) {
  const courseLists = programsPage.querySelectorAll('.semester-courses');
  const programCode = document.body.dataset.courseCode || 'program';

  courseLists.forEach((courseList) => {
    const semester = courseList.closest('.semester-block')?.querySelector('h3')?.textContent.trim() || '';

    courseList.querySelectorAll('li').forEach((courseItem) => {
      if (courseItem.querySelector('a')) return;

      const courseName = courseItem.textContent.trim();
      const courseLink = document.createElement('a');
      const slug = courseName
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      courseLink.href = `/pages/programs/scis/${programCode.toLowerCase()}/${slug}/`;
      courseLink.className = 'course-link no-style';

      while (courseItem.firstChild) {
        courseLink.appendChild(courseItem.firstChild);
      }
      courseItem.appendChild(courseLink);
    });
  });
}

function initCourseUnitPage() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  const program = params.get('program') || 'Program';
  const semester = params.get('semester') || '';
  const title = document.querySelector('[data-course-title]');
  const breadcrumb = document.querySelector('[data-course-breadcrumb]');
  const semesterElement = document.querySelector('[data-course-semester]');

  if (!name || !title || !breadcrumb) return;

  title.textContent = name;
  breadcrumb.textContent = name;
  if (semesterElement) semesterElement.textContent = semester;

  const programLink = document.querySelector('[data-program-link]');
  if (programLink) {
    programLink.textContent = program;
    programLink.href = `/pages/programs/scis/${program.toLowerCase()}/`;
  }

  document.title = `${name} | kyu.clareon.live`;
}

/**
 * Add a breadcrumb trail to school and faculty detail pages.
 * @param {HTMLElement} programsPage - The current programmes page
 */
function initProgramBreadcrumbs(programsPage) {
  if (document.body.dataset.page !== 'program-detail') return;

  const main = document.querySelector('#main-content');
  const hero = main?.querySelector('.programs-hero');
  const title = hero?.querySelector('h1')?.textContent.trim();
  if (!main || !hero || !title || main.querySelector('.breadcrumb')) return;

  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'breadcrumb fade-up';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');

  const homeItem = document.createElement('li');
  const homeLink = document.createElement('a');
  homeLink.href = '/';
  homeLink.textContent = 'Home';
  homeItem.appendChild(homeLink);

  const programsItem = document.createElement('li');
  const programsLink = document.createElement('a');
  programsLink.href = '/pages/programs/';
  programsLink.textContent = 'Programs';
  programsItem.appendChild(programsLink);

  const currentItem = document.createElement('li');
  currentItem.className = 'current';
  currentItem.setAttribute('aria-current', 'page');
  currentItem.textContent = title;

  [homeItem.firstChild, programsItem.firstChild, currentItem].forEach((item, index) => {
    if (index > 0) {
      const separator = document.createElement('span');
      separator.className = 'separator';
      separator.textContent = '\u203a';
      breadcrumb.appendChild(separator);
    }
    breadcrumb.appendChild(item);
  });
  main.insertBefore(breadcrumb, hero);
}

// ========================================
// AUTO-INITIALIZE
// ========================================

domReady(() => {
  initPrograms();
});