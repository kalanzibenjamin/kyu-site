import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'data/announcements.json');
const outputDirectory = path.join(root, 'pages/announcements');
const generatedMarker = '<!-- GENERATED FILE: do not edit manually -->';
const siteUrl = 'https://kyu.clareon.live';
const siteName = 'Kyambogo Student Hub';
const siteLocale = 'en_UG';
const defaultImage = '/images/og-image.png';
const defaultImageType = 'image/png';
const defaultImageWidth = 671;
const defaultImageHeight = 527;
const publicAssetDirectory = path.join(root, 'src/assets');

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatDate = (value) => new Intl.DateTimeFormat('en', {
  dateStyle: 'long'
}).format(new Date(`${value}T00:00:00`));

const isSafeLink = (url) => url.startsWith('/') || /^https:\/\//i.test(url);

const renderAnnouncementBody = (announcement) => {
  if (!Array.isArray(announcement.body)) {
    return `<p>${escapeHtml(announcement.content || announcement.description)}</p>`;
  }

  return announcement.body.map((block) => {
    const text = escapeHtml(block.text || '');
    if (block.type === 'heading') return `<h2>${text}</h2>`;
    if (block.type === 'list' && Array.isArray(block.items)) {
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    }
    if (block.type === 'links' && Array.isArray(block.items)) {
      const links = block.items
        .filter((item) => item && item.label && item.url && isSafeLink(item.url))
        .map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></li>`)
        .join('');
      return links ? `<ul class="announcement-links">${links}</ul>` : '';
    }
    if (block.type === 'quote') {
      return `<blockquote><p>${text}</p>${block.cite ? `<cite>${escapeHtml(block.cite)}</cite>` : ''}</blockquote>`;
    }
    if (block.type === 'callout') {
      return `<aside class="announcement-callout"><h3>${escapeHtml(block.title || 'Important')}</h3><p>${text}</p></aside>`;
    }
    return `<p>${text}</p>`;
  }).join('\n');
};

const readImageDimensions = (filePath) => {
  const buffer = fs.readFileSync(filePath);

  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          width: buffer.readUInt16BE(offset + 7),
          height: buffer.readUInt16BE(offset + 5)
        };
      }
      offset += 2 + length;
    }
  }

  throw new Error(`Unsupported image format: ${filePath}`);
};

const getImageMetadata = (announcement) => {
  const image = announcement.image || defaultImage;
  const extension = path.extname(image).toLowerCase();
  const imageType = announcement.imageType || ({
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.png': 'image/png'
  }[extension] || defaultImageType);
  return {
    image,
    imageType,
    imageWidth: announcement.imageWidth || (image === defaultImage ? defaultImageWidth : 1200),
    imageHeight: announcement.imageHeight || (image === defaultImage ? defaultImageHeight : 630)
  };
};

const siteFooter = `<footer class="footer-wrapper" role="contentinfo"><div class="footer-content"><div class="social-links"><a class="social-icon" data-social="whatsapp" href="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a><a class="social-icon" data-social="telegram" href="https://t.me/clareonsage" target="_blank" rel="noopener noreferrer" aria-label="Telegram"><i class="fab fa-telegram"></i></a><a class="social-icon" data-social="youtube" href="https://youtube.com/@clareonsage" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><i class="fab fa-youtube"></i></a><a class="social-icon" data-social="tiktok" href="https://tiktok.com/@clareonsage" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><i class="fab fa-tiktok"></i></a><a class="social-icon" data-social="instagram" href="https://instagram.com/clareonsage" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i class="fab fa-instagram"></i></a><a class="social-icon" data-social="github" href="https://github.com/ClareonSage" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fab fa-github"></i></a></div><div class="footer-cta"><button class="whatsapp-channel" id="whatsappChannelBtn" data-url="https://whatsapp.com/channel/0029Vb7UygL1dAvuZvBWhB3y" aria-label="Join our WhatsApp channel"><i class="fab fa-whatsapp"></i><span>Join our WhatsApp channel for fresh revision updates</span><i class="fas fa-arrow-right"></i></button><p class="footer-note">Site is still being constructed — this is a clean revision template.</p></div><a class="footer-contact-link" href="/pages/contact/"><i class="fas fa-envelope" aria-hidden="true"></i> Contact</a><div class="footer-divider"></div><div class="copyright"><i class="far fa-copyright"></i><span class="copyright-year" data-start-year="2026">2026</span> — Kyambogo Student Hub</div></div></footer>`;

const readAnnouncements = () => {
  const source = fs.readFileSync(sourcePath, 'utf8').replace(/^\uFEFF/, '');
  const announcements = JSON.parse(source);
  if (!Array.isArray(announcements)) throw new Error('Announcements data must be an array');

  const slugs = new Set();
  let dimensionsUpdated = false;
  announcements.forEach((announcement, index) => {
    if (!announcement.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(announcement.slug)) {
      throw new Error(`Announcement ${index + 1} must have a valid slug`);
    }
    if (slugs.has(announcement.slug)) throw new Error(`Duplicate announcement slug: ${announcement.slug}`);
    if (!announcement.date || Number.isNaN(new Date(`${announcement.date}T00:00:00`).getTime())) {
      throw new Error(`Announcement ${announcement.slug} must have a valid date`);
    }
    if (!announcement.title || !announcement.description) {
      throw new Error(`Announcement ${announcement.slug} must have a title and description`);
    }
    const image = announcement.image || defaultImage;
    if (!image.startsWith('/') || image.includes('..')) {
      throw new Error(`Announcement ${announcement.slug} must have a root-relative image path`);
    }
    const imagePath = path.join(publicAssetDirectory, image.slice(1));
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Announcement ${announcement.slug} image does not exist: ${image}`);
    }
    const dimensions = readImageDimensions(imagePath);
    if (announcement.imageWidth !== dimensions.width || announcement.imageHeight !== dimensions.height) {
      announcement.imageWidth = dimensions.width;
      announcement.imageHeight = dimensions.height;
      dimensionsUpdated = true;
    }
    slugs.add(announcement.slug);
  });

  if (dimensionsUpdated) {
    fs.writeFileSync(sourcePath, `${JSON.stringify(announcements, null, 2)}\n`);
  }

  return announcements.sort((a, b) => new Date(b.date) - new Date(a.date));
};

const pageShell = (announcement) => {
  const title = `${announcement.title} | kyu.clareon.live`;
  const description = announcement.description;
  const canonicalUrl = `${siteUrl}/pages/announcements/${announcement.slug}/`;
  const content = announcement.content || announcement.description;
  const bodyMarkup = renderAnnouncementBody(announcement);
  const author = announcement.author || siteName;
  const category = announcement.category || announcement.tag || 'Announcement';
  const { image, imageType, imageWidth, imageHeight } = getImageMetadata(announcement);
  const imageUrl = `${siteUrl}${image}`;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: announcement.title,
    description,
    image: imageUrl,
    datePublished: announcement.date,
    dateModified: announcement.updatedAt || announcement.date,
    articleSection: category,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Organization',
      name: author,
      url: siteUrl
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl
    }
  });
  const breadcrumbData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
      { '@type': 'ListItem', position: 2, name: 'Announcements', item: `${siteUrl}/pages/announcements/` },
      { '@type': 'ListItem', position: 3, name: announcement.title, item: canonicalUrl }
    ]
  });
  return `${generatedMarker}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="${escapeHtml(author)}" />
  <meta name="theme-color" content="#071c3a" />
  <meta property="og:locale" content="${siteLocale}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="kyu.clareon.live" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:type" content="${imageType}" />
  <meta property="og:image:width" content="${imageWidth}" />
  <meta property="og:image:height" content="${imageHeight}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <script type="application/ld+json">${structuredData}</script>
  <script type="application/ld+json">${breadcrumbData}</script>
  <link rel="icon" type="image/png" href="/images/logo/kyu-logo.png" />
  <link rel="manifest" href="/favicon/site.webmanifest" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
  <link rel="stylesheet" href="/src/scss/main.scss" />
  <script>(function(){const theme=localStorage.getItem('clareon-theme')==='light'?'light':'dark';document.documentElement.classList.toggle('light-mode',theme==='light');document.documentElement.setAttribute('data-theme',theme);document.documentElement.style.colorScheme=theme;})();</script>
</head>
<body data-page="announcement" class="announcements-page">
  <div class="cosmic-bg" aria-hidden="true">
    <div class="floating-orb orb-a"></div>
    <div class="floating-orb orb-b"></div>
    <div class="floating-orb orb-c"></div>
  </div>
  <header class="site-header" role="banner">
    <div class="header-container">
      <a href="/" class="logo" aria-label="Home | kyu.clareon.live"><span class="logo-icon"><img src="/images/logo/kyu-logo.png" alt="KYU logo"></span><span class="logo-text">kyu.clareon.live</span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle menu"><i class="fas fa-bars"></i></button><ul id="nav-menu" role="menubar"><li role="none"><a href="/" role="menuitem">Home</a></li><li role="none"><a href="/pages/programs/" role="menuitem">Programs</a></li><li role="none"><a href="/pages/announcements/" role="menuitem" class="active">Announcements</a></li><li role="none"><a href="/pages/faq/" role="menuitem">FAQ</a></li><li role="none"><a href="/pages/about/" role="menuitem">About</a></li><li role="none"><a href="/pages/contact/" role="menuitem">Contact</a></li></ul></nav>
    </div>
  </header>
  <main class="container" id="main-content">
    <article class="announcement-detail fade-up">
      <nav class="announcement-breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><i class="fas fa-chevron-right" aria-hidden="true"></i><a href="/pages/announcements/">Announcements</a><i class="fas fa-chevron-right" aria-hidden="true"></i><span aria-current="page">${escapeHtml(announcement.title)}</span>
      </nav>
      <header class="announcement-detail-header">
        <h1>${escapeHtml(announcement.title)}</h1>
        <div class="announcement-detail-meta">
          <time datetime="${escapeHtml(announcement.date)}"><i class="fas fa-calendar-alt" aria-hidden="true"></i> Published ${formatDate(announcement.date)}</time>
          <span><i class="fas fa-user" aria-hidden="true"></i> ${escapeHtml(author)}</span>
        </div>
      </header>
      <figure class="announcement-detail-image">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(announcement.imageAlt || announcement.title)}" fetchpriority="high" width="${imageWidth}" height="${imageHeight}">
      </figure>
      <section class="announcement-detail-content" aria-labelledby="announcement-content-title">
        <p class="announcement-detail-lede">${escapeHtml(announcement.description)}</p>
        <h2 id="announcement-content-title"><i class="fas fa-newspaper" aria-hidden="true"></i> The update</h2>
        ${bodyMarkup}
      </section>
      <div class="announcement-share" aria-label="Share this announcement">
        <div class="announcement-share-group announcement-share-quick">
          <span class="announcement-share-label">Quick share</span>
          <div class="announcement-share-actions">
            <button class="share-btn share-btn-quick" type="button" data-platform="native" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share using your device"><i class="fas fa-share-alt" aria-hidden="true"></i><span>Share</span></button>
            <button class="share-btn share-btn-quick" type="button" data-platform="copy" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Copy announcement link"><i class="fas fa-link" aria-hidden="true"></i><span>Copy link</span></button>
          </div>
        </div>
        <div class="announcement-share-group announcement-share-social">
          <span class="announcement-share-label">Share on social</span>
          <div class="announcement-share-actions">
            <button class="share-btn share-btn-social" type="button" data-platform="whatsapp" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share on WhatsApp"><i class="fab fa-whatsapp" aria-hidden="true"></i><span>WhatsApp</span></button>
            <button class="share-btn share-btn-social" type="button" data-platform="telegram" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share on Telegram"><i class="fab fa-telegram-plane" aria-hidden="true"></i><span>Telegram</span></button>
            <button class="share-btn share-btn-social" type="button" data-platform="facebook" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share on Facebook"><i class="fab fa-facebook-f" aria-hidden="true"></i><span>Facebook</span></button>
            <button class="share-btn share-btn-social" type="button" data-platform="twitter" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share on X"><i class="fab fa-twitter" aria-hidden="true"></i><span>X</span></button>
            <button class="share-btn share-btn-social" type="button" data-platform="email" data-url="${canonicalUrl}" data-title="${escapeHtml(announcement.title)}" data-description="${escapeHtml(description)}" aria-label="Share via email"><i class="fas fa-envelope" aria-hidden="true"></i><span>Email</span></button>
          </div>
        </div>
      </div>
    </article>
  </main>
  ${siteFooter}
  <button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme"><i class="fas fa-moon"></i></button>
  <script type="module" src="/src/js/main.js"></script>
</body>
</html>
`;
};

const writePage = (announcement) => {
  const directory = path.join(outputDirectory, announcement.slug);
  const filePath = path.join(directory, 'index.html');
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(filePath) && !fs.readFileSync(filePath, 'utf8').startsWith(generatedMarker)) {
    throw new Error(`Refusing to overwrite unmarked page: ${path.relative(root, filePath)}`);
  }
  fs.writeFileSync(filePath, pageShell(announcement));
};

const writeSitemap = (announcements) => {
  const staticUrls = [
    ['/', '1.0', 'weekly'],
    ['/about/', '0.8'],
    ['/announcements/', '0.8'],
    ['/faq/', '0.7'],
    ['/contact/', '0.7'],
    ['/resources/', '0.6'],
    ['/programs/', '0.6'],
    ['/contribute/', '0.6']
  ];
  const announcementUrls = announcements.map((announcement) => [
    `/pages/announcements/${announcement.slug}/`,
    '0.7'
  ]);
  const programRoot = path.join(root, 'pages/programs');
  const programUrls = fs.readdirSync(programRoot, { recursive: true })
    .filter((file) => file.endsWith('/index.html') || file === 'index.html')
    .map((file) => file.replace(/\\/g, '/').replace(/(^|\/)index\.html$/, ''))
    .filter(Boolean)
    .map((file) => `/pages/programs/${file}/`)
    .map((url) => [url, url.split('/').length > 5 ? '0.5' : '0.6']);
  const uniqueUrls = new Map([...staticUrls, ...programUrls, ...announcementUrls].map((entry) => [entry[0], entry]));
  const urls = [...uniqueUrls.values()].map(([url, priority, changefreq]) => `  <url>\n    <loc>${siteUrl}${url}</loc>\n    <priority>${priority}</priority>${changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ''}\n  </url>`).join('\n');
  fs.writeFileSync(path.join(root, 'src/assets/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
};

const announcements = readAnnouncements();
announcements.forEach(writePage);
writeSitemap(announcements);
console.log(`Generated ${announcements.length} announcement pages`);