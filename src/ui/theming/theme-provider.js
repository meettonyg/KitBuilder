/**
 * Theme Provider for Media Kit Builder
 * Manages theme selection and application of CSS variables
 */

import { EventEmitter } from '@core/events';

export class ThemeProvider {
  /**
   * Initialize the theme provider
   * @param {EventEmitter} events - Event emitter instance
   */
  constructor(events) {
    this.events = events || new EventEmitter();
    this.currentTheme = 'default';
    this.themes = {
      default: {
        colors: {
          primary: 'var(--color-primary)',
          primaryLight: 'var(--color-primary-light)',
          primaryDark: 'var(--color-primary-dark)',
          secondary: 'var(--color-secondary)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          border: 'var(--color-border)'
        },
        spacing: {
          small: 'var(--spacing-sm)',
          medium: 'var(--spacing-md)',
          large: 'var(--spacing-lg)'
        }
      },
      dark: {
        colors: {
          primary: 'var(--color-primary)',
          primaryLight: 'var(--color-primary-light)',
          primaryDark: 'var(--color-primary-dark)',
          secondary: 'var(--color-secondary)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          text: 'var(--color-text)',
          border: 'var(--color-border)'
        },
        spacing: {
          small: 'var(--spacing-sm)',
          medium: 'var(--spacing-md)',
          large: 'var(--spacing-lg)'
        }
      }
    };
  }
  
  /**
   * Apply a theme by name
   * @param {string} themeName - Name of the theme to apply
   * @returns {boolean} Success status
   */
  applyTheme(themeName) {
    if (!this.themes[themeName]) {
      console.error(`Theme "${themeName}" not found`);
      return false;
    }
    
    this.currentTheme = themeName;
    
    // Apply theme class to document root
    document.documentElement.classList.remove('theme-default', 'theme-dark');
    document.documentElement.classList.add(`theme-${themeName}`);
    
    // Emit theme change event
    this.events.emit('theme-changed', { theme: themeName });
    
    return true;
  }
  
  /**
   * Get the current theme name
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }
  
  /**
   * Get theme data for the current theme
   * @returns {Object} Theme data
   */
  getThemeData() {
    return { ...this.themes[this.currentTheme] };
  }
  
  /**
   * Get a specific theme property
   * @param {string} path - Dot-notation path to property (e.g., 'colors.primary')
   * @returns {*} Theme property value
   */
  getThemeProperty(path) {
    const parts = path.split('.');
    let current = this.themes[this.currentTheme];
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

export default ThemeProvider;
