# Prompt Party - Design Guidelines

## Design Approach
**System:** Linear/Notion-inspired productivity aesthetic - clean, functional, content-first design emphasizing clarity and organization. This approach prioritizes usability and information architecture for enterprise knowledge sharing.

## Core Design Elements

### Typography
- **Primary Font:** Inter (Google Fonts) - clean, highly legible
- **Headings:** 
  - H1: 2.5rem (40px), font-weight 700
  - H2: 2rem (32px), font-weight 600
  - H3: 1.5rem (24px), font-weight 600
- **Body:** 1rem (16px), font-weight 400, line-height 1.6
- **Code/Prompts:** JetBrains Mono, 0.875rem (14px) for displaying prompt content

### Layout System
**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16
- Consistent padding: p-6 for cards, p-8 for sections
- Margins: mb-8 between major sections, mb-4 for component spacing
- Container: max-w-7xl with px-4 for edge breathing room

### Component Library

**Navigation:**
- Fixed top navbar with subtle bottom border
- Logo left, search bar center (max-w-2xl), user menu right
- Navigation links: Dashboard, Browse Prompts, Submit Prompt, My Prompts

**Hero Section (Homepage):**
- Clean, centered layout (not full viewport - natural height)
- Bold headline emphasizing "Centralize Your Team's Prompts"
- Subheading explaining organizational knowledge sharing
- Primary CTA: "Submit a Prompt" + Secondary: "Browse Library"
- No background image - use clean gradient or solid background with floating UI mockup showing prompt cards

**Prompt Cards:**
- Rounded corners (rounded-lg), subtle shadow, hover lift effect
- Header: Prompt title (truncated if needed) + Domain badge (pill-style)
- Body: Prompt preview (3-line truncation) in monospace font
- Footer: Task tag, comment count, timestamp, author
- Click-through to full prompt detail view

**Search & Filters:**
- Prominent search bar with icon (magnifying glass)
- Filter sidebar with checkboxes for Domains and Tasks
- Sort dropdown: Latest, Most Commented, Alphabetical
- Active filter chips with remove option

**Prompt Detail Page:**
- Two-column layout (2:1 ratio): Main content left, metadata sidebar right
- Full prompt display in syntax-highlighted code block style
- Metadata panel: Domain, Task, Author, Timestamp, Notes section
- Comment thread below with nested replies support
- "Use This Prompt" primary action button

**Submit Form:**
- Single-column centered form (max-w-3xl)
- Large textarea for Prompt (monospace preview)
- Select dropdowns for Domain and Task (searchable)
- Notes textarea (optional context)
- Preview mode toggle
- Submit button with validation feedback

**Comments Section:**
- Threaded conversation UI
- User avatar + name + timestamp
- Reply and like actions
- Markdown support indicator

**Dashboard:**
- Three-column stats cards: Total Prompts Submitted, Comments Received, Favorites
- "Recent Activity" feed
- "Trending Prompts" grid (3 columns on desktop)

### Images
**Hero Mockup:** Isometric or flat illustration showing prompt cards interface - conveys collaboration and organization (positioned right side of hero text)
**Empty States:** Custom illustrations for "No prompts found" and "Start sharing prompts"
**User Avatars:** Gravatar integration or initials-based fallbacks

### Interactions
- Smooth hover states on cards (subtle transform and shadow increase)
- Loading states with skeleton screens
- Toast notifications for actions (submit, comment, like)
- Modal overlays for quick prompt preview
- Minimal animations - focus on instant responsiveness

**Key Principles:** Scannable content hierarchy, generous whitespace, functional elegance over decorative elements, enterprise-grade polish.