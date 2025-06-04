// src/scripts/theme.js
(function() {
  // Theme toggle functionality
  function initTheme() {
    const getTheme = () => {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('theme');
        if (stored && ['light', 'dark'].includes(stored)) {
          return stored;
        }
      }
      
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      
      return 'light';
    };

    const theme = getTheme();
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Store the theme
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  // Initialize theme immediately
  initTheme();

  // Re-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  }
})();