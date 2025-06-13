# Media Kit Builder CSS Architecture

## Overview
This document outlines the CSS architecture for the Media Kit Builder plugin. The CSS has been organized using a BEM methodology with clear separation of concerns to improve maintainability, performance, and developer experience.

## File Structure

### Core Files
1. **builder.css** - Core framework and layout styles
   - Base variables and reset
   - Main layout structure
   - Responsive framework
   - Section architecture
   - UI controls and common elements

2. **components.css** - Component-specific styles
   - Component variables
   - Individual component styling
   - Component states and variations
   - Component responsive behavior

3. **frontend.css** - Public-facing styles
   - Styles for rendered media kits
   - Print styles
   - Animation classes
   - Public preview functionality

4. **wp-admin-compat.css** - WordPress admin integration
   - Admin compatibility
   - WordPress color scheme integration
   - Form styling for admin areas
   - Modal and notification styles

5. **admin.css** - Admin-specific UI
   - Plugin settings pages
   - Dashboard widgets
   - Admin toolbar integration

## Naming Convention (BEM)

The CSS follows the Block, Element, Modifier (BEM) methodology:

```css
/* Block component */
.block {}

/* Element that depends upon the block */
.block__element {}

/* Modifier that changes the style of the block */
.block--modifier {}
```

Examples:
- `.section` (Block)
- `.section__content` (Element)
- `.section__content--two-column` (Modifier)

## CSS Variables

### Core Variables (in builder.css)
```css
:root {
  /* Color Palette */
  --color-primary: #0ea5e9;
  --color-primary-hover: #0284c7;
  
  /* Typography */
  --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  
  /* Spacing */
  --spacing-xs: 8px;
  --spacing-sm: 12px;
  --spacing-md: 16px;
  
  /* Borders & Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  
  /* Transitions */
  --transition-fast: 0.2s ease;
}
```

### Component Variables (in components.css)
```css
:root {
  /* Component Colors */
  --component-bg: #ffffff;
  --component-bg-alt: #f8fafc;
  
  /* Component Typography */
  --component-title-size: 20px;
  
  /* Component Spacing */
  --component-padding: 30px;
}
```

## Responsive Design

### Breakpoints
The CSS uses standardized breakpoints:

```css
/* Mobile (default) */
/* Tablet (≥768px) */
@media (min-width: 768px) { ... }
/* Desktop (≥1024px) */
@media (min-width: 1024px) { ... }
/* Large Desktop (≥1280px) */
@media (min-width: 1280px) { ... }
```

### Mobile-First Approach
All styles are written mobile-first, with progressive enhancement for larger screens.

## Cross-Browser Compatibility

The CSS includes specific sections for browser compatibility:

```css
/* Firefox specific fixes */
@-moz-document url-prefix() { ... }

/* Safari specific fixes */
@media not all and (min-resolution:.001dpcm) { 
  @supports (-webkit-appearance:none) { ... }
}

/* Edge specific fixes */
@supports (-ms-ime-align:auto) { ... }
```

## Accessibility Support

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001s !important;
    transition-duration: 0.001s !important;
  }
}
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .btn--primary {
    background: #000;
    color: #fff;
  }
}
```

## Best Practices for Working with This CSS

1. **Use Existing Variables**: Always use existing CSS variables for colors, spacing, etc.
2. **Follow BEM Naming**: Maintain consistent naming convention when adding new styles
3. **Mobile First**: Write styles for mobile first, then enhance for larger screens
4. **Component Isolation**: Keep component styles in components.css
5. **Browser Testing**: Test changes across different browsers
6. **Accessibility**: Ensure styles support reduced motion and high contrast preferences

## Adding New Styles

When adding new styles:

1. Determine which file is appropriate for your styles
2. Use existing CSS variables
3. Follow the BEM methodology
4. Add responsive styles using the established breakpoints
5. Document any unique behavior or dependencies

## CSS Performance Considerations

- CSS selectors are kept simple to minimize specificity issues
- Animations and transitions are optimized for performance
- Media queries are strategically used to avoid excessive code
- Critical CSS is separated from non-critical styles
