# IFT Website — Content Editability Recap

> Updated: February 27, 2026  
> **All content is now editable via the CMS in edit mode.**

---

## Global Summary

| Category | Editable (CMS) | Hardcoded |
|----------|:-:|:-:|
| Text / Labels | ✅ All | — |
| Images | ✅ All | — |
| Collections (teams, events, projects…) | ✅ All | — |
| Navigation links | — | ✅ (structural) |
| Logos / SVG marks | — | ✅ (branding) |

---

## Page-by-Page Breakdown

### 1. Hero (`Hero.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Main headline | `hero-title` | EditableContent |
| Subtitle / blurb | `hero-blurb` | EditableContent |
| CTA button text | `hero-button` | EditableContent |
| Hero video URL override | `hero-video-url` | EditableContent (URL) |

### 2. About (`About.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Intro paragraph | `about-intro` | EditableContent |
| Pillar 1 title | `about-pillar-1-title` | EditableContent |
| Pillar 1 description | `about-pillar-1-desc` | EditableContent |
| Pillar 2 title | `about-pillar-2-title` | EditableContent |
| Pillar 2 description | `about-pillar-2-desc` | EditableContent |
| Pillar 3 title | `about-pillar-3-title` | EditableContent |
| Pillar 3 description | `about-pillar-3-desc` | EditableContent |
| Campus image | `about-campus-image` | EditableImageSingle |

### 3. Team (`Team.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Title prefix ("The") | `team-title-prefix` | EditableContent |
| Title highlight ("Team") | `team-title-highlight` | EditableContent |
| Subtitle | `team-subtitle` | EditableContent |
| Core team members | `team-members-core` | EditableCollection |
| Affiliated members | `team-members-affiliated` | EditableCollection |

### 4. Research (`Research.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Intro paragraph | `research-intro` | EditableContent |
| Research themes | `research-themes` | EditableCollection + getContent |
| Publications | `research-publications` | EditableCollection |

### 5. Education (`Education.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Intro paragraph | `edu-intro` | EditableContent |
| Education programs | `edu-programs` | EditableCollection + getContent |
| Philosophy image | `edu-philosophy-image` | EditableImageSingle |
| Philosophy 1 title | `edu-phil-1-title` | EditableContent |
| Philosophy 1 text | `edu-phil-1` | EditableContent |
| Philosophy 2 title | `edu-phil-2-title` | EditableContent |
| Philosophy 2 text | `edu-phil-2` | EditableContent |
| Philosophy 3 title | `edu-phil-3-title` | EditableContent |
| Philosophy 3 text | `edu-phil-3` | EditableContent |
| Student projects | `edu-student-projects` | EditableCollection |

### 6. Arts (`Arts.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Intro paragraph | `arts-intro` | EditableContent |
| Exhibitions | `arts-exhibitions` | EditableCollection + getContent |

### 7. Events (`Events.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Intro paragraph | `events-intro` | EditableContent |
| Talks collection | `events-talks` | EditableCollection + getContent |
| Festivals collection | `events-festivals` | EditableCollection + getContent |
| Awards & Press (misc) | `events-misc` | EditableCollection + getContent |

### 8. Collaborate (`Collaborate.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Tagline | `collaborate-tagline` | EditableContent |
| Collaboration types | `collaborate-types` | EditableCollection + getContent |
| Partners list | `collaborate-partners` | EditableCollection + getContent |

### 9. Featured Projects (`FeaturedProjects.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Section label | `featured-projects-label` | EditableContent |
| Section title | `featured-projects-title` | EditableContent |
| Button text | `featured-projects-button` | EditableContent |
| Selected project IDs | `featured-project-ids` | FeaturedProjectSelector |
| Project pool | `research-projects` | EditableCollection + getContent |

### 10. Latest Events (`LatestEvents.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Section label | `latest-events-label` | EditableContent |
| Section title | `latest-events-title` | EditableContent |
| Button text | `latest-events-button` | EditableContent |
| Events list | `latest-events` | EditableCollection |

### 11. Footer (`Footer.tsx`)

| Element | CMS ID | Type |
|---------|--------|------|
| Location title | `footer-location-title` | EditableContent |
| Address line 1 | `footer-address-line1` | EditableContent |
| Address line 2 | `footer-address-line2` | EditableContent |
| Address line 3 | `footer-address-line3` | EditableContent |
| Connect title | `footer-connect-title` | EditableContent |
| Email | `footer-email` | EditableContent |
| Legal title | `footer-legal-title` | EditableContent |
| Privacy link | `footer-privacy-link` | EditableContent |
| Terms link | `footer-terms-link` | EditableContent |
| Copyright | `footer-copyright` | EditableContent |
| Twitter URL | `footer-social-twitter` | EditableContent |
| LinkedIn URL | `footer-social-linkedin` | EditableContent |
| Instagram URL | `footer-social-instagram` | EditableContent |
| GitHub URL | `footer-social-github` | EditableContent |

### 12. Navbar (`Navbar.tsx`)

| Element | Status | Notes |
|---------|--------|-------|
| Navigation links | Hardcoded | Structural — tied to React Router routes |
| Logo SVG | Hardcoded | Branding asset |

---

## Intentionally Hardcoded

These elements remain hardcoded by design:

- **Navbar links** — They map directly to React Router routes. Editing them from the CMS could break navigation.
- **Logo SVGs** — Brand identity assets that should be updated via code deployment, not CMS.
- **Layout / structural elements** — Grid lines, background patterns, animation configurations.
- **Icon components** — Lucide icons are JSX components and cannot be serialized to localStorage.

---

## How to Edit Content

1. Log in at `/login`
2. The edit toolbar appears at the top of the page
3. Hover over any editable element to see edit/delete controls
4. For collections, scroll down to find "Manage …" sections with add/edit/delete
5. All changes are saved to `localStorage` and persist across sessions
