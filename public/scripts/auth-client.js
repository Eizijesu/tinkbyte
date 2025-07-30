// public/scripts/auth-client.js - CLIENT-SIDE AUTH WRAPPER
console.log('🔄 Loading TinkByte Client Auth...');

// Import and initialize auth manager
async function initializeClientAuth() {
  try {
    // Import the auth manager
    const { authManager } = await import('/src/lib/auth.js');
    
    // Initialize it
    await authManager.initialize();
    
    // Make it globally available
    window.authManager = authManager;
    window.supabase = authManager.supabase;
    
    // Create a simple wrapper that matches what comments.js expects
    const authWrapper = {
      authState: {
        get currentUser() { return authManager.getUser(); },
        get profile() { return authManager.getProfile(); },
        get isAuthenticated() { return !!authManager.getUser(); }
      },
      getCurrentUser: () => authManager.getUser(),
      getProfile: () => authManager.getProfile(),
      isUserAuthenticated: () => !!authManager.getUser(),
      onAuthStateChange: (callback) => authManager.onAuthChange(callback),
      initialize: () => Promise.resolve() // Already initialized
    };
    
    // Set the wrapper as the global auth manager
    window.authManager = authWrapper;
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('authReady', {
      detail: {
        authManager: authWrapper,
        supabase: authManager.supabase
      }
    }));
    
    console.log('✅ Client auth initialized:', {
      authenticated: !!authManager.getUser(),
      user: authManager.getUser()?.email
    });
    
  } catch (error) {
    console.error('❌ Client auth failed:', error);
    
    // Fallback - create minimal auth manager
    window.authManager = {
      authState: { currentUser: null, profile: null, isAuthenticated: false },
      getCurrentUser: () => null,
      getProfile: () => null,
      isUserAuthenticated: () => false,
      onAuthStateChange: () => () => {},
      initialize: () => Promise.resolve()
    };
    
    window.dispatchEvent(new CustomEvent('authReady', {
      detail: {
        authManager: window.authManager,
        supabase: window.supabase
      }
    }));
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClientAuth);
} else {
  initializeClientAuth();
}