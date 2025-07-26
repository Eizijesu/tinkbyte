// public/scripts/theme.js - UPDATED FOR SYSTEM THEME SUPPORT
(function() {
  'use strict';

  // Theme configuration
  const THEME_KEY = 'tinkbyte-theme';
  const VALID_THEMES = ['light', 'dark', 'system'];
  const DEFAULT_THEME = 'system';

  // Theme management functions
  function getStoredTheme() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored && VALID_THEMES.includes(stored)) {
          return stored;
        }
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
    return DEFAULT_THEME;
  }

  function setStoredTheme(theme) {
    try {
      if (typeof localStorage !== 'undefined' && VALID_THEMES.includes(theme)) {
        localStorage.setItem(THEME_KEY, theme);
      }
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function resolveTheme(theme) {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }

  function applyTheme(theme) {
    const resolvedTheme = resolveTheme(theme);
    const isDark = resolvedTheme === 'dark';
    
    // Apply theme to document
    const html = document.documentElement;
    const body = document.body;
    
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
      body.classList.add('light');
      body.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
    }

    // Update meta theme-color for mobile browsers
    updateMetaThemeColor(isDark);
    
    // Dispatch theme change event
    dispatchThemeChangeEvent(theme, resolvedTheme);
  }

  function updateMetaThemeColor(isDark) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    // Use your brand colors
    metaThemeColor.content = isDark ? '#0f1419' : '#ffffff';
  }

  function dispatchThemeChangeEvent(theme, resolvedTheme) {
    try {
      const event = new CustomEvent('themechange', {
        detail: {
          theme: theme,
          resolvedTheme: resolvedTheme,
          isDark: resolvedTheme === 'dark'
        }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.warn('Failed to dispatch theme change event:', error);
    }
  }

  function initTheme() {
    const theme = getStoredTheme();
    applyTheme(theme);
    
    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // Remove existing listener if any
      if (window.themeMediaQueryListener) {
        mediaQuery.removeEventListener('change', window.themeMediaQueryListener);
      }
      
      // Add new listener
      window.themeMediaQueryListener = (e) => {
        const currentTheme = getStoredTheme();
        if (currentTheme === 'system') {
          applyTheme('system');
        }
      };
      
      mediaQuery.addEventListener('change', window.themeMediaQueryListener);
    }
  }

  // Public API for theme management
  window.ThemeManager = {
    getTheme: getStoredTheme,
    setTheme: function(theme) {
      if (VALID_THEMES.includes(theme)) {
        setStoredTheme(theme);
        applyTheme(theme);
        return true;
      }
      console.warn('Invalid theme:', theme);
      return false;
    },
    getCurrentTheme: function() {
      return resolveTheme(getStoredTheme());
    },
    getSystemTheme: getSystemTheme,
    toggleTheme: function() {
      const current = getStoredTheme();
      let next;
      
      switch (current) {
        case 'light':
          next = 'dark';
          break;
        case 'dark':
          next = 'system';
          break;
        case 'system':
        default:
          next = 'light';
          break;
      }
      
      return this.setTheme(next);
    },
    cycleTheme: function() {
      const current = getStoredTheme();
      const currentIndex = VALID_THEMES.indexOf(current);
      const nextIndex = (currentIndex + 1) % VALID_THEMES.length;
      return this.setTheme(VALID_THEMES[nextIndex]);
    }
  };

  // Prevent flash of unstyled content
  function preventFlash() {
    const theme = getStoredTheme();
    const resolvedTheme = resolveTheme(theme);
    const isDark = resolvedTheme === 'dark';
    
    // Apply minimal theme immediately
    const html = document.documentElement;
    html.style.colorScheme = isDark ? 'dark' : 'light';
    
    if (isDark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.add('light');
      html.setAttribute('data-theme', 'light');
    }
  }

  // Initialize theme immediately to prevent flash
  preventFlash();

  // Full initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Handle visibility change to refresh system theme
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      const currentTheme = getStoredTheme();
      if (currentTheme === 'system') {
        applyTheme('system');
      }
    }
  });

  // Handle page show event (for back/forward navigation)
  window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
      initTheme();
    }
  });

})();