# IFT Design System

## Typography Scale

### Page Titles (H1)
- **Class**: `text-5xl md:text-7xl font-bold tracking-tighter text-neutral-900 leading-[0.9] uppercase`
- **Usage**: Main page headings on all pages
- **Examples**: Research, Education, Arts, Collaborate, Events, About

### Section Titles (H2)
- **Class**: `text-4xl md:text-6xl font-serif text-neutral-900 tracking-tight`
- **Usage**: Major section headings on homepage
- **Examples**: "Featured Projects", "Latest Events"

### Card Titles
- **Small Cards**: `text-xl font-sans font-medium leading-tight text-neutral-900`
- **Large Cards**: `text-2xl md:text-3xl font-light text-neutral-900`
- **Event Hero**: `text-3xl md:text-5xl font-serif leading-tight`

### Body Text
- **Tagline**: `text-lg md:text-xl text-neutral-500 font-serif italic leading-relaxed`
- **Body**: `text-sm md:text-base text-neutral-500 leading-relaxed`
- **Small**: `text-sm text-neutral-500`

### Meta Text
- **Labels**: `text-xs font-mono uppercase tracking-widest text-neutral-400`
- **Tags**: `text-xs font-mono uppercase tracking-widest text-teal-600`
- **Dates/Authors**: `text-xs font-mono text-neutral-400`

## Color Palette

### Primary
- **Teal-600**: `#0d9488` - Primary brand color
- **Teal-400**: `#2dd4bf` - Accents

### Neutrals
- **White**: `#ffffff` - Background
- **Neutral-50**: `#fafafa` - Alt background
- **Neutral-100**: `#f5f5f5` - Card background
- **Neutral-200**: `#e5e5e5` - Borders
- **Neutral-400**: `#a3a3a3` - Meta text
- **Neutral-500**: `#737373` - Body text
- **Neutral-900**: `#171717` - Headings, dark backgrounds

## Spacing

### Section Padding
- **Standard**: `py-24 px-6 md:px-12`
- **Hero Sections**: `pt-32 lg:pt-32 pb-24`

### Card Gaps
- **Standard Grid**: `gap-8`
- **Tight Grid**: `gap-6`

## Components

### Buttons
- **Primary CTA (Glass Card)**: `bg-neutral-900 text-white px-6 py-3 uppercase text-xs font-bold tracking-widest hover:bg-teal-600 transition-colors flex items-center gap-3`
- **Secondary Link**: `text-sm font-bold uppercase tracking-widest text-neutral-900 hover:text-teal-600 transition-colors flex items-center gap-2`
- **Icon Only**: `ArrowRight` or `ArrowUpRight` with `w-4 h-4` and appropriate hover transforms

### Cards
- **Border**: `border border-neutral-200`
- **Background**: `bg-white` or `bg-neutral-50`
- **Padding**: `p-8` for content, `p-6` for compact
- **Shadow**: `shadow-lg` with `hover:shadow-2xl`
- **Hover Effects**: `group-hover:scale-105 transition-transform duration-700`

### Meta Information Display
- **Tags/Categories**: Always use `text-xs font-mono uppercase tracking-widest text-teal-600`
- **Dates/Years**: Always use `text-xs font-mono text-neutral-400`
- **Authors**: Always use `text-sm text-neutral-500 font-mono`

### Images
- **Aspect Ratios**: 
  - Featured Projects: `aspect-[4/3]`
  - Events Portrait (Talks): `aspect-[3/4]`
  - Events Landscape (Festivals): `aspect-video`
  - Awards: `aspect-square`
- **Hover Effect**: `group-hover:scale-105 transition-transform duration-700`
- **Overlay**: `bg-neutral-900/0 group-hover:bg-neutral-900/10 transition-colors duration-300`

## Background Grid
- **Pattern**: Linear grid 40px x 40px
- **Color**: `#e5e5e5`
- **Opacity**: `opacity-10`
- **Style**: `linear-gradient(to right, #e5e5e5 1px, transparent 1px), linear-gradient(to bottom, #e5e5e5 1px, transparent 1px)`