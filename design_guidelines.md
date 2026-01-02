# Prompt Party - Design Guidelines

## Design Approach
**System:** Modern "Cobalt Noir" aesthetic - bold, vibrant cobalt blues with sophisticated dark undertones. Clean and functional with premium visual effects including glassmorphism, subtle gradients, and ambient glow effects. Enterprise-grade polish with a contemporary edge.

## Core Design Elements

### Typography
- **Primary Font:** Inter (system-ui fallback) - clean, highly legible
- **Headings:** 
  - H1: 2.5rem (40px), font-weight 700, letter-spacing -0.025em
  - H2: 2rem (32px), font-weight 600, letter-spacing -0.02em
  - H3: 1.5rem (24px), font-weight 600
- **Body:** 1rem (16px), font-weight 400, line-height 1.7
- **Code/Prompts:** JetBrains Mono, 0.9375rem (15px), line-height 1.6 for displaying prompt content
- **Metadata:** 0.875rem (14px), font-weight 500

### Color Palette (Cobalt Noir Theme)

**Light Mode:**
- **Primary:** Vibrant cobalt (hsl 218 88% 52%) - buttons, links, active states
- **Accent:** Neon cyan (hsl 192 82% 55%) - highlights, secondary accents
- **Background:** Soft blue-gray (hsl 220 25% 97%) - page background
- **Card:** Near-white blue tint (hsl 220 20% 99%) - card surfaces
- **Foreground:** Deep navy (hsl 222 47% 11%) - headings and primary text
- **Muted Foreground:** Slate blue (hsl 220 15% 45%) - secondary text, metadata
- **Border:** Subtle blue (hsl 220 20% 88%) - dividers, card borders

**Dark Mode:**
- **Background:** Deep indigo-black (hsl 222 47% 6%) - page background
- **Card:** Dark navy (hsl 222 40% 8%) - elevated surfaces
- **Primary:** Bright cobalt (hsl 218 88% 58%) - increased lightness for visibility
- **Accent:** Muted cyan (hsl 192 60% 18% bg, hsl 192 70% 80% text)
- **Foreground:** Cool white (hsl 220 20% 95%) - primary text
- **Muted Foreground:** Medium slate (hsl 220 15% 55%) - secondary text

**Hierarchy Principle:** Primary cobalt for key actions, accent cyan for highlights, deeper indigo for depth/gradients.

### Modern Effects

**Gradients:**
- Hero gradient: 135deg from cobalt → deep indigo → dark background
- Accent gradient: 135deg from cyan → cobalt
- Card gradient: Subtle vertical fade for depth

**Glassmorphism:**
- Semi-transparent backgrounds (70% opacity)
- Backdrop blur (12px)
- Subtle border (50% opacity)
- Use for sidebars, modals, floating elements

**Glow Effects:**
- Primary button glow: 20-30px spread, 25-40% opacity
- Hover intensifies glow
- Use sparingly for primary CTAs

**Shadows:**
- Light mode: Soft blue-tinted shadows
- Dark mode: Deep, rich shadows for depth
- Card lift: translateY(-2px) + shadow-lg on hover

### Layout System
**Spacing Units:** Expanded rhythm - 5, 8, 12, 20, 32, 48
- Card padding: p-6 (24px) internal
- Section spacing: 48px vertical dividers
- Generous whitespace for breathing room

### Component Styling

**Cards:**
- Rounded corners (rounded-md)
- Gradient background option
- Accent glow on top edge
- Lift effect on hover (2px + shadow)

**Buttons:**
- Primary: Gradient background with glow
- Secondary: Glass effect with subtle border
- Ghost: Transparent with hover elevation

**Inputs:**
- Subtle inset shadow
- Focus ring with primary color
- Placeholder in muted-foreground

**Badges:**
- Glass style: 30% opacity, hairline border
- Small size for metadata
- Color-coded by category

**Navigation:**
- Glass effect nav bar
- Accent border highlight
- Translucent on scroll

### Hero Section
- Gradient background (gradient-hero class)
- Decorative blurred blobs (blob-primary, blob-accent)
- Light text on dark gradient
- Glowing primary CTA button
- Clean, bold typography

### Interactions
- Smooth transitions (0.2s ease)
- Subtle hover lifts (2px max)
- Glow intensification on primary actions
- Skeleton loading states
- Toast notifications with glass effect

**Key Principles:** Premium visual polish, vibrant but professional color usage, depth through gradients and glow, modern glassmorphism effects, responsive and performant.
