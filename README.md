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

## Course Unit Content Workflow

Course-unit pages are generated from the curriculum pages and editable JSON files. The generator preserves the course title, programme, semester, and page URL from the curriculum. The JSON controls the course topics, episodes, episode parts, links, and last-updated date.

### Where to Add Content

Edit the matching file inside `data/course-units/`:

```text
data/course-units/computer-applications.json
data/course-units/discrete-mathematics.json
data/course-units/introduction-to-programming.json
```

Use the course slug as the filename. A repeated course unit uses one shared file automatically. For example, the BIS and BITC pages for `computer-applications` both use `computer-applications.json`.

Do not edit `data/course-units.json`. It is generated automatically as a catalogue of the course pages.

### JSON Format

Each file contains a date and a list of topics. Each topic contains up to five episodes. An episode can contain one or more parts.

```json
{
	"lastUpdated": "2026-08-29",
	"topics": [
		{
			"title": "Quadratic Equations",
			"episodes": [
				{
					"number": 1,
					"name": "Solving quadratic equations",
					"parts": [
						{
							"number": 1,
							"type": "resource",
							"name": "Practice questions",
							"url": "https://drive.google.com/your-practice-file"
						},
						{
							"number": 2,
							"type": "solutions",
							"name": "Worked solutions",
							"url": "https://drive.google.com/your-solutions-file",
							"forEpisode": 1,
							"forPart": 1
						},
						{
							"number": 3,
							"type": "quiz",
							"name": "Theory check",
							"url": "https://docs.google.com/forms/d/e/your-form-id/viewform"
						}
					]
				}
			]
		}
	]
}
```

### Episode Display Rules

- One-part episode: displays as `Episode 1` followed by the part name. `Part 1` is hidden to avoid repetition.
- Multi-part episode: displays the episode heading, then `Episode 1 Part 1`, `Episode 1 Part 2`, and so on.
- Clicking a part opens its `url` in a new tab.
- Empty URLs remain non-destination placeholders until a real link is added.
- `forEpisode` and `forPart` identify which practice material a solution belongs to.

Supported part types are `quiz`, `resource`, `solutions`, `video`, and `download`. The page selects an appropriate icon for each type.

### Updating Pages

After editing one or more JSON files, run:

```bash
npm run sync:courses
```

This regenerates all BIS and BITC course-unit pages and updates `data/course-units.json`. It does not create individual episode pages.

To verify the complete site afterward, run:

```bash
npm run build
```

The course page also provides an in-page search for topic, episode, and part names. The search, topic accordions, sticky search bar, and hover behavior are provided by `src/js/pages/course-units.js` and `src/scss/pages/_course-units.scss`.

### Home Search Index

The home page search is client-side and does not require a backend. It reads the generated `data/search-index.json` file and provides live results for schools, faculties, programmes, course units, topics, episodes, and episode parts. Programme records include both their short code, such as `BITC`, and their full name, such as `Bachelor of Information Technology and Computing`. Results link to the relevant school, programme, course page, or content anchor.

The search index is rebuilt automatically when you run:

```bash
npm run sync:courses
```

Do not edit `data/search-index.json` manually. It is generated from the curriculum pages and the JSON files in `data/course-units/`.
