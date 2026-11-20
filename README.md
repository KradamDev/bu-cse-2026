# BU CSE 2026

The batch site for Computer Science & Engineering, Bundelkhand University — batch of 2026.

Question papers, books, syllabus, timetable, the class list, feedback and the photo archive,
all in one place. Built with plain HTML, CSS and JavaScript: no framework, no build step, no
dependencies. The folder opens straight in a browser and deploys as-is.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home — hero, the five sections, info and fun previews, feedback form, about |
| `resources.html` | Resources — syllabus download and Drive folders for papers and sessionals |
| `info.html` | Info — Semester I timetable, subjects &amp; faculty, official student list |
| `feedback.html` | Feedback — working mailto form |
| `fun.html` | Page of fun — full gallery of all thirty-seven photos, served at `/fun` |
| `about.html` | About me (stub) |

## Files

```
index.html  resources.html  info.html  feedback.html  fun.html  about.html
style.css            one stylesheet, tokens at the top
script.js            mobile nav, scroll reveal, IST clock, student-list filter, mailto subject
assets/favicon.svg   the "26" mark
assets/bu-logo.png   Bundelkhand University emblem, shown in the home page's at-a-glance card
assets/photos/       seven batch photos, resized to 1500px and re-compressed for the web
docs/                downloadable files (syllabus PDF and future papers)
_redirects           serves fun.html at /fun
```

## Preview locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly — nothing needs compiling.

## Editing content

- Colours, spacing and type live in the `:root` block at the top of `style.css`.
- Student list entries are `<li data-name="...">` rows — the `data-name` attribute is what the
  search box matches, so keep it lowercase. Each searchable list sits in a
  `<div data-student-block>` so a page can hold more than one.
- Anything marked **Sample** on the page is placeholder content. Replace it with the real data
  before sharing the link widely.
- The feedback form posts via `mailto:` to `kradam2557@gmail.com`. Change that address in
  `index.html`, `feedback.html` and `script.js` if it ever moves.

## Where the real data came from

- **Timetable** — the department sheet, Class 1st year / Branch CSE / Sem I / Room T1,
  revised and effective 17 Aug 2026, session July–December 2026-27.
- **Student list** — the department's 1st year students list, 62 names, numbered 01–62.
  That sheet carries no roll numbers; add a roll column when they arrive.
- **Syllabus** — `docs/syllabus-btech-first-year.pdf`, the university's B.Tech First Year
  syllabus, 91 pages, covering the Semester I and II scheme and every course in detail.
- **Photos** — thirty-seven batch photographs in `assets/photos/`. All of them live on
  `fun.html` (served at `/fun` via `_redirects`); the home page shows seven with a link through.
  Every photo opens in a click-to-zoom lightbox.

## Deploy

Static hosting only — no build command, publish directory `.`.
