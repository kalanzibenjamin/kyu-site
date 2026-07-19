# kyu.clareon.live

**Kyambogo 2026/2027 student hub — resources, announcements, and community**

A student-built resource hub for Kyambogo University admitted students. Built by a student.

## Pages

- Home — Hero, group link, stats, resource teaser
- About — About the site, creator, disclaimer
- Announcements — Latest updates
- FAQ — Frequently asked questions
- Contact — Reach the creator
- Resources — Preview of coming resources
- Programs — Courses/schools covered
- Contribute — Submit resources

## Tech Stack

- **Build Tool:** Vite
- **Styling:** SCSS (modular)
- **JavaScript:** Vanilla JS (modular)
- **Hosting:** GitHub Pages
- **Domain:** kyu.clareon.live

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## GitHub Pages Deployment

This site is set up for deployment with GitHub Actions from the `main` branch.

- Keep the `CNAME` file in the repository root for the custom domain `kyu.clareon.live`.
- Push to `main` and GitHub Actions will build the site and publish the `dist/` folder to Pages.
- No need to commit `dist/` because the workflow uploads the generated output.

If you want, I can also add a small `deploy` script to `package.json` for local testing before pushing.
