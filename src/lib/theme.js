// src/lib/theme.js - FIXED SYSTEM THEME DETECTION
class ThemeManager {
  constructor() {
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.currentTheme = this.getStoredTheme();
    this.listeners = new Set();
    this.init();
  }

  init() {
    // Apply theme immediately
    this.applyTheme(this.currentTheme);
    
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        this.currentTheme = e.newValue || 'system';
        this.applyTheme(this.currentTheme);
        this.notifyListeners();
      }
    });

    // Listen for system theme changes - FIXED
    this.systemMediaQuery.addEventListener('change', (e) => {
      console.log('System theme changed to:', e.matches ? 'dark' : 'light');
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
        this.notifyListeners();
      }
    });
  }

  getStoredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    
    // Default to system preference
    return 'system';
  }

  applyTheme(theme) {
    let isDark = false;
    
    if (theme === 'dark') {
      isDark = true;
    } else if (theme === 'light') {
      isDark = false;
    } else if (theme === 'system') {
      // FIXED: Properly check system preference
      isDark = this.systemMediaQuery.matches;
      console.log('System theme is:', isDark ? 'dark' : 'light');
    }
    
    console.log('Applying theme:', theme, 'isDark:', isDark);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme) {
    if (!['light', 'dark', 'system'].includes(theme)) {
      console.warn('Invalid theme:', theme);
      return;
    }

    console.log('Setting theme to:', theme);
    this.currentTheme = theme;
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
    this.notifyListeners();
  }

  getTheme() {
    return this.currentTheme;
  }

  isDark() {
    if (this.currentTheme === 'dark') {
      return true;
    } else if (this.currentTheme === 'light') {
      return false;
    } else {
      // system theme
      return this.systemMediaQuery.matches;
    }
  }

  // Subscribe to theme changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentTheme);
      } catch (error) {
        console.error('Theme listener error:', error);
      }
    });
  }
}

// Create global instance
export const themeManager = new ThemeManager();

// Export for backward compatibility
export default themeManager;