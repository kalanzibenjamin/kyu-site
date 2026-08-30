import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const contentDirectory = path.join(root, 'data/course-units');
const generatedDate = new Date().toISOString().slice(0, 10);
const schoolCatalog = JSON.parse(fs.readFileSync(path.join(root, 'data/programs.json'), 'utf8'));
const scis = schoolCatalog.find((school) => school.slug === 'scis');
const programs = (scis?.programmes || []).map((programme) => ({
  code: programme.shortName,
  name: programme.name,
  directory: programme.slug,
  semesters: programme.semesters
}));

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const slugify = (value) => value.toLowerCase()
  .replaceAll('&', 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const defaultTopics = [
  {
    title: 'Foundations',
    episodes: [
      { number: 1, name: 'Course overview', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 2, name: 'Key terms and definitions', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 3, name: 'Core concepts', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 4, name: 'Guided examples', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 5, name: 'Topic review', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] }
    ]
  },
  {
    title: 'Core Concepts',
    episodes: [
      { number: 1, name: 'Concept introduction', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 2, name: 'Structures and principles', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 3, name: 'Worked examples', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 4, name: 'Common questions', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 5, name: 'Topic review', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] }
    ]
  },
  {
    title: 'Applications',
    episodes: [
      { number: 1, name: 'Practical context', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 2, name: 'Methods and techniques', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 3, name: 'Applied example', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 4, name: 'Practice questions', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] },
      { number: 5, name: 'Topic review', parts: [{ number: 1, type: 'quiz', name: 'Self-test', url: '' }] }
    ]
  }
];

const getTopics = (course) => {
  const contentPath = path.join(contentDirectory, `${course.slug}.json`);
  if (!fs.existsSync(contentPath)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
    fs.writeFileSync(contentPath, `${JSON.stringify({ lastUpdated: generatedDate, topics: defaultTopics }, null, 2)}\n`);
    return defaultTopics;
  }

  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  let needsMigration = !content.lastUpdated;
  const topics = Array.isArray(content.topics) ? content.topics.map((topic) => ({
    ...topic,
    episodes: Array.isArray(topic.episodes) ? topic.episodes.slice(0, 5).map((episode, index) => {
      if (!episode.name && episode.title) needsMigration = true;
      if (!Array.isArray(episode.parts)) needsMigration = true;
      const parts = Array.isArray(episode.parts)
        ? episode.parts.map((part, partIndex) => ({
          number: part.number || partIndex + 1,
          type: part.type || 'resource',
          name: part.name || part.title || 'Course material',
          url: part.url || part.formUrl || '',
          ...(part.forEpisode ? { forEpisode: part.forEpisode } : {}),
          ...(part.forPart ? { forPart: part.forPart } : {})
        }))
        : [{ number: 1, type: episode.formUrl ? 'quiz' : 'resource', name: episode.formUrl ? 'Self-test' : episode.name || episode.title, url: episode.formUrl || '' }];
      return {
        number: episode.number || index + 1,
        name: episode.name || episode.title,
        parts
      };
    }) : []
  })) : [];

  if (needsMigration) {
    fs.writeFileSync(contentPath, `${JSON.stringify({ lastUpdated: content.lastUpdated || generatedDate, topics }, null, 2)}\n`);
  }

  return topics.length > 0
    ? topics
    : defaultTopics;
};

const getLastUpdated = (course) => {
  const contentPath = path.join(contentDirectory, `${course.slug}.json`);
  const content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  return content.lastUpdated || 'Not set';
};

const siteHeader = `<header class="site-header" role="banner"><div class="header-container"><a href="/" class="logo" aria-label="Home | kyu.clareon.live"><span class="logo-icon"><img src="/images/logo/kyu-logo.png" alt="KYU logo"></span><span class="logo-text">kyu.clareon.live</span></a><nav class="main-nav" aria-label="Main navigation"><button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle menu"><i class="fas fa-bars"></i></button><ul id="nav-menu" role="menubar"><li role="none"><a href="/" role="menuitem">Home</a></li><li role="none"><a href="/pages/programs/" role="menuitem" class="active">Programs</a></li><li role="none"><a href="/pages/announcements/" role="menuitem">Announcements</a></li><li role="none"><a href="/pages/faq/" role="menuitem">FAQ</a></li><li role="none"><a href="/pages/about/" role="menuitem">About</a></li><li role="none"><a href="/pages/contact/" role="menuitem">Contact</a></li></ul></nav></div></header>`;
const siteFooter = `<footer class="footer-wrapper" role="contentinfo"><div class="footer-content"><div class="social-links"><a class="social-icon" data-social="whatsapp" href="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a><a class="social-icon" data-social="telegram" href="https://t.me/clareoniz" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><i class="fab fa-telegram"></i></a><a class="social-icon" data-social="youtube" href="https://youtube.com/@clareoniz" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a><a class="social-icon" data-social="tiktok" href="https://tiktok.com/@clareoniz" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok"></i></a><a class="social-icon" data-social="instagram" href="https://instagram.com/clareoniz" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a><a class="social-icon" data-social="github" href="https://github.com/ClareonSage" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a></div><div class="footer-cta"><button class="whatsapp-channel" id="whatsappChannelBtn" data-url="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" aria-label="Join our WhatsApp channel"><i class="fab fa-whatsapp"></i><span>Join our WhatsApp channel for fresh revision updates</span><i class="fas fa-arrow-right"></i></button><p class="footer-note">Site is still being constructed — this is a clean revision template.</p></div><a class="footer-contact-link" href="/pages/contact/"><i class="fas fa-envelope" aria-hidden="true"></i> Contact</a><div class="footer-divider"></div><div class="copyright"><i class="far fa-copyright"></i><span class="copyright-year" data-start-year="2026">2026</span> — Kyambogo Student Hub</div></div></footer>`;
const pageShell = (title, description, body) => `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)} | kyu.clareon.live</title><meta name="description" content="${escapeHtml(description)}"><link rel="icon" type="image/png" href="/images/logo/kyu-logo.png"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"><script>(function(){const theme=localStorage.getItem('clareon-theme')==='light'?'light':'dark';document.documentElement.classList.toggle('light-mode',theme==='light');document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme;})();</script><link rel="stylesheet" href="/src/scss/main.scss"></head><body data-page="programs" class="programs-page"><div class="cosmic-bg" aria-hidden="true"><div class="floating-orb orb-a"></div><div class="floating-orb orb-b"></div><div class="floating-orb orb-c"></div></div>${siteHeader}<main class="container" id="main-content">${body}</main>${siteFooter}<button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme"><i class="fas fa-moon"></i></button><script type="module" src="/src/js/main.js"></script></body></html>`;

const generatedMarker = '<!-- GENERATED FILE: do not edit manually -->';

const writeGeneratedPage = (filePath, contents) => {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (!existing.startsWith(generatedMarker)) {
      throw new Error(`Refusing to overwrite unmarked page: ${path.relative(root, filePath)}`);
    }
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${generatedMarker}\n${contents}`);
};

const validateCatalogue = () => {
  const slugs = new Set();
  const courseSlugs = new Set();
  schoolCatalog.forEach((school) => {
    if (!school.slug || !school.schoolCode || !['school', 'faculty'].includes(school.type)) {
      throw new Error(`Invalid school/faculty record: ${school.schoolCode || 'unnamed'}`);
    }
    if (slugs.has(school.slug)) throw new Error(`Duplicate school/faculty slug: ${school.slug}`);
    slugs.add(school.slug);
    (school.programmes || []).forEach((programme) => {
      if (!programme.slug || !programme.name || !programme.shortName || !Array.isArray(programme.semesters)) {
        throw new Error(`Invalid programme record: ${school.schoolCode}/${programme.shortName || 'unnamed'}`);
      }
      programme.semesters.forEach((semester) => {
        if (!Number.isInteger(semester.year) || !Number.isInteger(semester.semester) || !Array.isArray(semester.courses)) {
          throw new Error(`Invalid semester record: ${programme.shortName}`);
        }
        semester.courses.forEach((course) => {
          if (!course.name || !course.slug) throw new Error(`Invalid course record: ${programme.shortName}`);
          courseSlugs.add(course.slug);
        });
      });
    });
  });

  courseSlugs.forEach((slug) => {
    const contentPath = path.join(contentDirectory, `${slug}.json`);
    if (!fs.existsSync(contentPath)) return;

    let content;
    try {
      content = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
    } catch (error) {
      throw new Error(`Invalid course JSON: ${path.relative(root, contentPath)} (${error.message})`);
    }

    if (content.lastUpdated !== undefined && typeof content.lastUpdated !== 'string') {
      throw new Error(`Invalid lastUpdated in ${path.relative(root, contentPath)}`);
    }
    if (!Array.isArray(content.topics)) {
      throw new Error(`Missing topics array in ${path.relative(root, contentPath)}`);
    }
    content.topics.forEach((topic, topicIndex) => {
      if (!topic.title || !Array.isArray(topic.episodes)) {
        throw new Error(`Invalid topic ${topicIndex + 1} in ${path.relative(root, contentPath)}`);
      }

      const visibleEpisodes = topic.episodes.slice(0, 5);
      if (visibleEpisodes.length === 0) {
        throw new Error(`Topic ${topicIndex + 1} has no visible episodes in ${path.relative(root, contentPath)}`);
      }

      visibleEpisodes.forEach((episode, episodeIndex) => {
        if (!Number.isInteger(episode.number) || !episode.name || !Array.isArray(episode.parts) || episode.parts.length === 0) {
          throw new Error(`Invalid episode ${episodeIndex + 1} in ${path.relative(root, contentPath)}`);
        }
        episode.parts.forEach((part, partIndex) => {
          if (!Number.isInteger(part.number) || !part.name || !['quiz', 'resource', 'solutions', 'video', 'download'].includes(part.type) || typeof part.url !== 'string') {
            throw new Error(`Invalid part ${partIndex + 1} in episode ${episode.number} of ${path.relative(root, contentPath)}`);
          }
        });
      });
    });
  });
};

validateCatalogue();

const renderProgramsIndex = () => {
  const cards = schoolCatalog.map((school) => `<a href="/pages/programs/${school.slug}/" class="school-card fade-up no-style"><div class="school-header"><div class="school-icon"><i class="fas ${school.icon}"></i></div><div class="school-info"><h2>${escapeHtml(school.schoolName)}</h2><span class="school-code">${escapeHtml(school.schoolCode)}</span></div><span class="school-status status-${school.status}">${escapeHtml(school.status)}</span></div><p class="school-description">${escapeHtml(school.description)}</p><div class="course-list">${(school.programmes || school.courses || []).map((item) => `<span class="course-tag"><i class="fas fa-check-circle"></i> ${escapeHtml(item.shortName || item.name)}</span>`).join('')}</div></a>`).join('');
  return pageShell('Programs', 'Browse schools, faculties, and programmes at Kyambogo University.', `<div class="breadcrumb fade-up"><a href="/">Home</a><span class="separator">&#8250;</span><span class="current">Programs</span></div><div class="programs-hero fade-up"><h1>Our <span class="highlight">Programs</span></h1><p>Browse schools, faculties, and programmes at Kyambogo University.</p></div><div class="programs-search search-section fade-up"><div class="search-wrapper"><i class="fas fa-search" aria-hidden="true"></i><input type="search" placeholder="Search schools or programmes..." aria-label="Search schools or programmes" autocomplete="off"><button class="search-clear" type="button" aria-label="Clear programme search"><i class="fas fa-times-circle" aria-hidden="true"></i></button></div></div><div class="programs-list">${cards}</div>`);
};

const renderSchoolPage = (school) => {
  const programmes = school.programmes || [];
  const cards = programmes.length > 0
    ? programmes.map((programme) => `<a href="/pages/programs/${school.slug}/${programme.slug}/" class="school-card fade-up no-style"><div class="school-header"><div class="school-icon"><i class="fas ${school.icon}"></i></div><div class="school-info"><h2>${escapeHtml(programme.name)}</h2><span class="school-code">${escapeHtml(programme.shortName)}</span></div></div><p class="school-description">${escapeHtml(programme.name)} at ${escapeHtml(school.schoolName)}.</p></a>`).join('')
    : `<section class="school-card fade-up"><h2>Programme information is coming soon.</h2><p class="school-description">${escapeHtml(school.description)}</p></section>`;
  return pageShell(school.schoolName, school.description, `<div class="breadcrumb fade-up"><a href="/">Home</a><span class="separator">&#8250;</span><a href="/pages/programs/">Programs</a><span class="separator">&#8250;</span><span class="current">${escapeHtml(school.schoolName)}</span></div><div class="programs-hero fade-up"><h1>${escapeHtml(school.schoolName)}</h1><p>${escapeHtml(school.description)}</p></div>${cards}<div class="btn-group"><a href="/pages/programs/" class="btn btn-secondary no-style"><i class="fas fa-arrow-left"></i> All Programs</a></div>`);
};

const renderProgrammePage = (school, programme) => {
  const years = new Map();
  programme.semesters.forEach((semester) => {
    if (!years.has(semester.year)) years.set(semester.year, []);
    years.get(semester.year).push(semester);
  });
  const curriculum = [...years.entries()].map(([year, semesters]) => `<section class="year-group fade-up"><div class="year-header"><h3><i class="fas fa-graduation-cap"></i> Year ${year}</h3></div><div class="semester-row">${semesters.map((semester) => `<section class="semester-block"><div class="semester-heading"><h3>Semester ${['I', 'II', 'III'][semester.semester - 1] || semester.semester}</h3><span class="course-count">${semester.courses.length} Courses</span></div><ul class="semester-courses">${semester.courses.map((course) => `<li><a class="course-link no-style" href="/pages/programs/${school.slug}/${programme.slug}/${course.slug}/"><i class="fas fa-check-circle"></i>${escapeHtml(course.name)}</a></li>`).join('')}</ul></section>`).join('')}</div></section>`).join('');
  return pageShell(programme.name, `${programme.shortName} programme information at Kyambogo University.`, `<div class="breadcrumb fade-up"><a href="/">Home</a><span class="separator">&#8250;</span><a href="/pages/programs/">Programs</a><span class="separator">&#8250;</span><a href="/pages/programs/${school.slug}/">${escapeHtml(school.schoolCode)}</a><span class="separator">&#8250;</span><span class="current">${escapeHtml(programme.shortName)}</span></div><div class="programs-hero fade-up"><h1>${escapeHtml(programme.name)}</h1><p>${escapeHtml(programme.shortName)} programme information at Kyambogo University.</p></div><section class="curriculum fade-up"><div class="semester-grid">${curriculum}</div></section><div class="btn-group"><a href="/pages/programs/${school.slug}/" class="btn btn-secondary no-style"><i class="fas fa-arrow-left"></i> ${escapeHtml(school.schoolCode)}</a><a href="/pages/programs/" class="btn btn-secondary no-style">All Programs</a></div>`);
};

writeGeneratedPage(path.join(root, 'pages/programs/index.html'), renderProgramsIndex());
schoolCatalog.filter((school) => Array.isArray(school.programmes)).forEach((school) => {
  writeGeneratedPage(path.join(root, 'pages/programs', school.slug, 'index.html'), renderSchoolPage(school));
  school.programmes.forEach((programme) => {
    writeGeneratedPage(path.join(root, 'pages/programs', school.slug, programme.slug, 'index.html'), renderProgrammePage(school, programme));
  });
});

const extractCurriculum = (program) => {
  const courses = [];

  program.semesters.forEach((semester) => {
    semester.courses.forEach((course) => {
      courses.push({
        slug: course.slug,
        title: course.name,
        semester: `Year ${semester.year} · Semester ${['I', 'II'][semester.semester - 1] || semester.semester}`
      });
    });
  });

  return courses;
};

const renderTopics = (course) => getTopics(course).map((topic, topicIndex) => {
  const topicId = `${course.slug}-topic-${topicIndex + 1}`;
  const episodes = topic.episodes.slice(0, 5).map((episode, episodeIndex) => {
    const number = episode.number || episodeIndex + 1;
    const showParts = episode.parts.length > 1;
    const parts = episode.parts.map((part, partIndex) => {
      const partNumber = part.number || partIndex + 1;
      const href = part.url || `#${topicId}-episode-${number}-part-${partNumber}`;
      const externalAttributes = part.url ? ' target="_blank" rel="noopener noreferrer"' : '';
      const icon = { quiz: 'fa-clipboard-check', resource: 'fa-file-alt', solutions: 'fa-lightbulb', video: 'fa-play-circle', download: 'fa-download' }[part.type] || 'fa-link';
      const relation = part.forEpisode ? ` · Solutions for Episode ${part.forEpisode}${part.forPart ? ` Part ${part.forPart}` : ''}` : '';
      const label = showParts ? `Episode ${number} Part ${partNumber}` : `Episode ${number}`;
      return `<a class="course-episode-row" href="${escapeHtml(href)}" id="${topicId}-episode-${number}-part-${partNumber}"${externalAttributes}><span class="course-episode-number">${label}</span><span class="course-episode-info"><span class="course-episode-title">${escapeHtml(showParts ? part.name : (part.name || episode.name))}${escapeHtml(relation)}</span></span><i class="fas ${icon} course-episode-arrow" aria-hidden="true"></i></a>`;
    }).join('');
    return showParts
      ? `<div class="course-episode-group"><div class="course-episode-heading"><span>Episode ${number}</span><strong>${escapeHtml(episode.name)}</strong></div>${parts}</div>`
      : parts;
  }).join('');

  return `
      <section class="course-topic-section fade-up" id="topic-${topicId}">
        <button class="course-topic-header" type="button" aria-expanded="false" aria-controls="topic-content-${topicId}">
          <span class="course-topic-title"><span class="topic-number">${topicIndex + 1}.</span><span class="topic-name">${escapeHtml(topic.title)}</span></span>
          <i class="fas fa-chevron-right collapse-icon" aria-hidden="true"></i>
        </button>
        <div class="course-topic-content" id="topic-content-${topicId}">${episodes}
        </div>
      </section>`;
}).join('');

const renderPage = (program, course) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.title)} | kyu.clareon.live</title>
  <meta name="description" content="${escapeHtml(course.title)} revision topics and episodes for ${program.name} at Kyambogo University.">
  <link rel="icon" type="image/png" href="/images/logo/kyu-logo.png">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <script>(function(){const theme=localStorage.getItem('clareon-theme')==='light'?'light':'dark';document.documentElement.classList.toggle('light-mode',theme==='light');document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme;})();</script>
  <link rel="stylesheet" href="/src/scss/main.scss">
</head>
<body data-page="course-unit" data-program="${program.code}" data-course-slug="${course.slug}" class="programs-page">
  <div class="cosmic-bg" aria-hidden="true"><div class="floating-orb orb-a"></div><div class="floating-orb orb-b"></div><div class="floating-orb orb-c"></div></div>
  <header class="site-header" role="banner"><div class="header-container"><a href="/" class="logo" aria-label="Home | kyu.clareon.live"><span class="logo-icon"><img src="/images/logo/kyu-logo.png" alt="KYU logo"></span><span class="logo-text">kyu.clareon.live</span></a><nav class="main-nav" aria-label="Main navigation"><button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle menu"><i class="fas fa-bars"></i></button><ul id="nav-menu" role="menubar"><li role="none"><a href="/" role="menuitem">Home</a></li><li role="none"><a href="/pages/programs/" role="menuitem" class="active">Programs</a></li><li role="none"><a href="/pages/announcements/" role="menuitem">Announcements</a></li><li role="none"><a href="/pages/faq/" role="menuitem">FAQ</a></li><li role="none"><a href="/pages/about/" role="menuitem">About</a></li><li role="none"><a href="/pages/contact/" role="menuitem">Contact</a></li></ul></nav></div></header>
  <main class="container" id="main-content">
    <div class="breadcrumb fade-up"><a href="/">Home</a><span class="separator">&#8250;</span><a href="/pages/programs/">Programs</a><span class="separator">&#8250;</span><a href="/pages/programs/scis/">SCIS</a><span class="separator">&#8250;</span><a href="/pages/programs/scis/${program.directory}/">${program.code}</a><span class="separator">&#8250;</span><span class="current">${escapeHtml(course.title)}</span></div>
    <section class="course-unit-header fade-up">
      <h1 class="course-unit-title"><i class="fas fa-book-open" aria-hidden="true"></i>${escapeHtml(course.title)}</h1>
      <div class="course-unit-meta"><span class="meta-program"><i class="fas fa-graduation-cap" aria-hidden="true"></i>${program.code}</span><span class="meta-semester"><i class="fas fa-calendar-alt" aria-hidden="true"></i>${escapeHtml(course.semester)}</span><span class="meta-topics"><i class="fas fa-layer-group" aria-hidden="true"></i>${getTopics(course).length} topics</span><span class="meta-episodes"><i class="fas fa-list-ol" aria-hidden="true"></i>${getTopics(course).reduce((total, topic) => total + Math.min(topic.episodes.length, 5), 0)} episodes</span><span class="meta-updated"><i class="fas fa-clock" aria-hidden="true"></i>Updated ${escapeHtml(getLastUpdated(course))}</span></div>
    </section>
    <div class="course-topics-nav-wrapper"><div class="course-topics-nav-row"><button class="course-nav-arrow nav-arrow-left" type="button" aria-label="Scroll topics left"><i class="fas fa-chevron-left" aria-hidden="true"></i></button><nav class="course-topics-nav" id="topicsNav" aria-label="Course topics">${getTopics(course).map((topic, index) => `<a class="course-topic-nav-link" href="#topic-${course.slug}-topic-${index + 1}">${index + 1}. ${escapeHtml(topic.title)}</a>`).join('')}</nav><button class="course-nav-arrow nav-arrow-right" type="button" aria-label="Scroll topics right"><i class="fas fa-chevron-right" aria-hidden="true"></i></button></div></div><div class="course-episode-search" role="search"><label class="visually-hidden" for="episode-search">Search episodes</label><i class="fas fa-search" aria-hidden="true"></i><input id="episode-search" type="search" placeholder="Search episodes..." autocomplete="off" aria-controls="course-topics"><button class="course-episode-search-clear" type="button" aria-label="Clear episode search" hidden><i class="fas fa-times" aria-hidden="true"></i></button><span class="course-episode-search-count" aria-live="polite"></span></div>
    <div class="course-topics" id="course-topics">${renderTopics(course)}<p class="course-episode-search-empty" hidden>No episodes match your search.</p></div>
    <div class="btn-group"><a href="/pages/programs/scis/${program.directory}/" class="btn btn-secondary no-style"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to ${program.code}</a><a href="/pages/programs/" class="btn btn-secondary no-style">All Programs</a></div>
  </main>
  <footer class="footer-wrapper" role="contentinfo">
    <div class="footer-content">
      <div class="social-links">
        <a class="social-icon" data-social="whatsapp" href="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
        <a class="social-icon" data-social="telegram" href="https://t.me/clareoniz" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><i class="fab fa-telegram"></i></a>
        <a class="social-icon" data-social="youtube" href="https://youtube.com/@clareoniz" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
        <a class="social-icon" data-social="tiktok" href="https://tiktok.com/@clareoniz" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
        <a class="social-icon" data-social="instagram" href="https://instagram.com/clareoniz" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
        <a class="social-icon" data-social="github" href="https://github.com/ClareonSage" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a>
      </div>
      <div class="footer-cta">
        <button class="whatsapp-channel" id="whatsappChannelBtn" data-url="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" aria-label="Join our WhatsApp channel"><i class="fab fa-whatsapp"></i><span>Join our WhatsApp channel for fresh revision updates</span><i class="fas fa-arrow-right"></i></button>
        <p class="footer-note">Site is still being constructed — this is a clean revision template.</p>
      </div>
      <a class="footer-contact-link" href="/pages/contact/"><i class="fas fa-envelope" aria-hidden="true"></i> Contact</a>
      <div class="footer-divider"></div>
      <div class="copyright"><i class="far fa-copyright"></i><span class="copyright-year" data-start-year="2026">2026</span> — Kyambogo Student Hub</div>
    </div>
  </footer>
  <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>
  <script type="module" src="/src/js/main.js"></script>
</body>
</html>`;

const catalog = [];
const searchIndex = [];

schoolCatalog.forEach((school) => {
  const schoolDirectory = school.schoolCode.toLowerCase();
  searchIndex.push({
    type: school.schoolName.toLowerCase().startsWith('faculty') ? 'Faculty' : 'School',
    program: school.schoolCode,
    aliases: [school.schoolName, school.schoolCode],
    title: school.schoolName,
    context: `${school.schoolCode} · ${school.description}`,
    url: `/pages/programs/${schoolDirectory}/`
  });
  (school.programmes || []).forEach((programme) => {
    searchIndex.push({
      type: 'Programme',
      program: programme.shortName,
      aliases: [programme.shortName, programme.name, school.schoolCode, school.schoolName],
      title: programme.name,
      context: `${school.schoolCode} · ${school.schoolName}`,
      url: `/pages/programs/${school.slug}/${programme.slug}/`
    });
  });
});

programs.forEach((program) => {
  extractCurriculum(program).forEach((course) => {
    const record = {
      ...course,
      lastUpdated: getLastUpdated(course),
      program: program.code,
      programme: program.name,
      path: `/pages/programs/scis/${program.directory}/${course.slug}/`,
        topics: getTopics(course).map((topic, topicIndex) => ({
        id: `${course.slug}-topic-${topicIndex + 1}`,
        title: topic.title,
        episodes: topic.episodes.slice(0, 5).map((episode, episodeIndex) => ({
          number: episode.number || episodeIndex + 1,
          name: episode.name,
          parts: episode.parts.map((part, partIndex) => ({
            number: part.number || partIndex + 1,
            type: part.type || 'resource',
            name: part.name,
            url: part.url || '',
            ...(part.forEpisode ? { forEpisode: part.forEpisode } : {}),
            ...(part.forPart ? { forPart: part.forPart } : {})
          }))
        }))
      }))
    };
    catalog.push(record);
    searchIndex.push({
      type: 'Course',
      program: program.code,
      aliases: [program.code, program.name],
      courseName: course.title,
      title: course.title,
      context: `${program.code} · ${course.semester}`,
      url: record.path
    });
    record.topics.forEach((topic, topicIndex) => {
      searchIndex.push({
        type: 'Topic',
        program: program.code,
        aliases: [program.code, program.name],
        courseName: course.title,
        topicName: topic.title,
        title: topic.title,
        context: `${course.title} · ${program.code}`,
        url: `${record.path}#topic-${course.slug}-topic-${topicIndex + 1}`
      });
      topic.episodes.forEach((episode) => {
        searchIndex.push({
          type: 'Episode',
          program: program.code,
          aliases: [program.code, program.name],
          courseName: course.title,
          topicName: topic.title,
          episodeName: episode.name,
          title: `Episode ${episode.number} · ${episode.name}`,
          context: `${course.title} · ${topic.title}`,
          url: `${record.path}#topic-${topic.id}`
        });
        episode.parts.forEach((part) => {
          searchIndex.push({
            type: 'Part',
            program: program.code,
            aliases: [program.code, program.name],
            courseName: course.title,
            topicName: topic.title,
            episodeName: episode.name,
            partName: part.name,
            title: `Episode ${episode.number} Part ${part.number} · ${part.name}`,
            context: `${course.title} · ${topic.title} · Episode ${episode.number}`,
            url: `${record.path}#topic-${topic.id}-episode-${episode.number}-part-${part.number}`
          });
        });
      });
    });
    const outputDirectory = path.join(root, 'pages/programs/scis', program.directory, course.slug);
    fs.mkdirSync(outputDirectory, { recursive: true });
    writeGeneratedPage(path.join(outputDirectory, 'index.html'), renderPage(program, course));
  });
});

fs.writeFileSync(path.join(root, 'data/course-units.json'), `${JSON.stringify(catalog, null, 2)}\n`);
fs.writeFileSync(path.join(root, 'data/search-index.json'), `${JSON.stringify(searchIndex, null, 2)}\n`);
console.log(`Generated ${catalog.length} course-unit pages and data/course-units.json`);
