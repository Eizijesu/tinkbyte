// public/scripts/api-client.js - CLIENT-SIDE API WRAPPER
console.log('🚀 Loading TinkByte Client API...');

// Wait for supabase to be available
async function initializeClientAPI() {
  try {
    // Import the TinkByteAPI class
    const { TinkByteAPI } = await import('/src/lib/supabase.js');
    
    // Make it globally available
    window.TinkByteAPI = TinkByteAPI;
    
    console.log('✅ Client API initialized');
    
  } catch (error) {
    console.error('❌ Client API failed:', error);
    
    // Create minimal fallback API
    window.TinkByteAPI = {
      addComment: async () => ({ success: false, error: 'API not available' }),
      updateComment: async () => ({ success: false, error: 'API not available' }),
      deleteComment: async () => ({ success: false, error: 'API not available' }),
      toggleCommentLike: async () => ({ success: false, error: 'API not available' }),
      toggleCommentBookmark: async () => ({ success: false, error: 'API not available' }),
      saveCommentDraft: async () => ({ success: false, error: 'API not available' }),
      getCommentDraft: async () => ({ success: false, error: 'API not available' })
    };
  }
}

// Initialize immediately
initializeClientAPI();