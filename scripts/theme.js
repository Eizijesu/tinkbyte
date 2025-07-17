// public/scripts/theme.js - UPDATED FOR SYSTEM THEME SUPPORT
(function() {
  // Theme toggle functionality
  function initTheme() {
    const getTheme = () => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          return stored;
        }
      }
      
      return 'system'; // Default to system
    };

    const applyTheme = (theme) => {
      let isDark = false;
      
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else if (theme === 'system') {
        isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    const theme = getTheme();
    applyTheme(theme);
    
    // Store the theme
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        const currentTheme = getTheme();
        if (currentTheme === 'system') {
          applyTheme('system');
        }
      });
    }
  }

  // Initialize theme immediately
  initTheme();

  // Re-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  }
})();