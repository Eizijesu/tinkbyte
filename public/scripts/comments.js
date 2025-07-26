// public/scripts/comments.js
console.log('TinkByte Comments loading...');


  const DEBUG = false;

  // Debug logging function
  function debugLog(...args) {
    if (DEBUG) console.log(...args);
  }

  // Additional delay for static sites
  setTimeout(() => {
    if (window.tinkbyteComments) {
      debugLog('🔄DOM fully loaded, updating permissions...');
      window.tinkbyteComments.updateAllCommentPermissions();
    }
  }, 1000);

// Also listen for window load
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.tinkbyteComments) {
        debugLog('🔄Window fully loaded, final permission update...');
        window.tinkbyteComments.updateAllCommentPermissions();
      }
    }, 500);
  });

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Initializing TinkByte Comments (Static Mode)');
  
  try {
    // Import Supabase with fallback paths for static deployment
    const imports = await importSupabase();
    
    // *** FIX: Create the instance and assign it to a variable ***
    const commentSystem = new TinkByteCommentSystem(imports.supabase, imports.TinkByteAPI, imports.AuthState);

    // *** FIX: Now expose it to window ***
    if (typeof window !== 'undefined') {
      window.tinkbyteComments = commentSystem;
      console.log('✅ Comment system exposed to window.tinkbyteComments');
    }

  } catch (error) {
    console.error('❌ Failed to initialize comments:', error);
    showInitializationError();
  }
});


// Static-compatible import with fallbacks
async function importSupabase() {
  const importPaths = [
    '/src/lib/supabase.js',
    '/src/lib/supabase.js?v=' + Date.now(),
    new URL('/src/lib/supabase.js', window.location.origin).href
  ];

  for (const path of importPaths) {
    try {
      const imports = await import(path);
      console.log('✅ Supabase imported from:', path);
      return imports;
    } catch (error) {
      console.log('❌ Failed path:', path);
    }
  }
  
  throw new Error('Could not import Supabase');
}

function showInitializationError() {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; background: #ef4444; color: white;
    padding: 12px 24px; border-radius: 8px; z-index: 10000; display: flex;
    gap: 10px; align-items: center;
  `;
  errorDiv.innerHTML = `
    Comment system failed to load. 
    <button onclick="window.location.reload()" style="background: white; color: #ef4444; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
      Retry
    </button>
  `;
  document.body.appendChild(errorDiv);
}

class TinkByteCommentSystem {
  constructor(supabase, TinkByteAPI, AuthState) {
    this.supabase = supabase;
    this.TinkByteAPI = TinkByteAPI;
    this.AuthState = AuthState;
    this.authState = AuthState.getInstance();

   
    
    // State management
    this.currentUser = null;
    this.profile = null;
    this.articleId = null;
    this.isAuthenticated = false;
    this.authInitialized = false;
    this.authPromise = null; // Cache the auth promise for performance

    this.environment = 'production';
    
    // Form and interaction state
    this.replyingTo = null;
    this.editingComment = null;
    this.isSubmitting = false;
    
    // Pagination and sorting
    this.currentSort = 'newest';
    this.currentPage = 1;
    this.hasMoreComments = false;
    
    // UI state
    this.draftTimeout = null;
    this.currentEmojiForm = null;
    this.currentEmojiTextarea = null;
    this.emojiPickerVisible = false;
    
    // MENTION PROPERTIES ***
    this.currentMentionDropdown = null;
    this.currentMentionTextarea = null;
    this.currentMentionStart = -1;
    this.selectedMentionIndex = 0;
    this.mentionInputHandler = null;
    this.mentionKeyHandler = null;
  
    // *** PAGINATION PROPERTIES ***
    this.commentsPerPage = 5;
    this.currentPage = 1;
    this.totalComments = 0;
    this.loadedComments = 0;
    this.isLoadingMore = false;
    
    this.init();
  }

  // ADD THIS METHOD HERE - inside the class
  waitForCommentsToRender(callback, maxAttempts = 10, attempt = 1) {
    const commentCards = document.querySelectorAll('.comment-card[data-comment-id], .reply-card[data-comment-id]');
    
    if (commentCards.length > 0) {
      console.log(`✅ Found ${commentCards.length} comment cards, updating permissions`);
      callback();
      return;
    }
    
    if (attempt >= maxAttempts) {
      console.log('⚠️ Max attempts reached, no comments found to update permissions');
      return;
    }
    
    debugLog(`🔄 Waiting for comments to render... (attempt ${attempt}/${maxAttempts})`);
    setTimeout(() => {
      this.waitForCommentsToRender(callback, maxAttempts, attempt + 1);
    }, 200);
  }

updateCommentDataAttributes() {
  debugLog('🔄 Updating comment data attributes after auth...');
  
  if (!this.currentUser) {
    debugLog('❌ No current user, skipping data attribute update');
    return;
  }
  
  // Find all comment cards that might be missing user data
  const commentCards = document.querySelectorAll('.comment-card[data-comment-id], .reply-card[data-comment-id]');
  
  commentCards.forEach(card => {
    const commentId = card.dataset.commentId;
    const currentUserId = card.dataset.userId;
    
    // If the data-user-id is empty/null/undefined, try to get it from the comment data
    if (!currentUserId || currentUserId.trim() === '' || currentUserId === 'null' || currentUserId === 'undefined') {
      debugLog(`⚠️ Comment ${commentId} has invalid user_id, attempting to fix...`);
      
      // Try to get comment data from the server to fix the attribute
      this.fixCommentDataAttribute(commentId, card);
    }
  });
}

// Method to fix individual comment data attributes
async fixCommentDataAttribute(commentId, commentCard) {
  try {
    console.log(`🔧 Attempting to fix data attributes for comment: ${commentId}`);
    
    // Get comment data from server
    const { data, error } = await this.supabase
      .from('comments')
      .select('user_id, created_at')
      .eq('id', commentId)
      .eq('environment', environment)
      .single();
    
    if (error) {
      console.error(`❌ Error fetching comment ${commentId}:`, error);
      return;
    }
    
    if (data) {
      console.log(`✅ Found comment data for ${commentId}:`, data);
      
      // Update the data attributes
      if (data.user_id) {
        commentCard.setAttribute('data-user-id', data.user_id);
        commentCard.dataset.userId = data.user_id;
        console.log(`✅ Updated user_id for comment ${commentId}: ${data.user_id}`);
      }
      
      if (data.created_at) {
        commentCard.setAttribute('data-created-at', data.created_at);
        commentCard.dataset.createdAt = data.created_at;
        console.log(`✅ Updated created_at for comment ${commentId}: ${data.created_at}`);
      }
      
      // Update permissions after fixing data
      setTimeout(() => {
        this.updateCommentPermissions(commentId);
      }, 100);
    }
    
  } catch (error) {
    console.error(`❌ Error fixing comment ${commentId} data:`, error);
  }
}
  async identifyCommentOwnership(commentId) {
  if (!this.currentUser) return false;
  
  try {
    const { data, error } = await this.supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .eq('user_id', this.currentUser.id)
      .eq('environment', environment)
      .single();
    
    return !error && !!data;
  } catch (error) {
    console.error('Error checking comment ownership:', error);
    return false;
  }
}

// Add this method to your TinkByteCommentSystem class
async forceFixCommentData() {
  console.log('🔧 Force fixing all comment data attributes...');
  
  if (!this.currentUser) {
    console.log('❌ No authenticated user');
    return;
  }
  
  const commentCards = document.querySelectorAll('.comment-card[data-comment-id], .reply-card[data-comment-id]');
  console.log(`Found ${commentCards.length} comment cards to check`);
  
  for (const card of commentCards) {
    const commentId = card.dataset.commentId;
    const currentUserId = card.dataset.userId;
    
    // Check if data attributes are missing or empty
    if (!currentUserId || currentUserId.trim() === '' || currentUserId === 'null') {
      console.log(`🔧 Fixing comment ${commentId} - missing user data`);
      await this.fixCommentDataAttribute(commentId, card);
    } else {
      console.log(`✅ Comment ${commentId} already has user data: ${currentUserId}`);
    }
  }
  
  // Update all permissions after fixing data
  setTimeout(() => {
    debugLog('🔄Updating permissions after data fix...');
    this.updateAllCommentPermissions();
  }, 1000);
}

// Add this helper method too
async fixCommentDataAttribute(commentId, commentCard) {
  try {
    console.log(`🔧 Fetching data for comment: ${commentId}`);
    
    // Get comment data from server
    const { data, error } = await this.supabase
      .from('comments')
      .select('user_id, created_at')
      .eq('id', commentId)
      .eq('environment', this.environment)
      .single();
    
    if (error) {
      console.error(`❌ Error fetching comment ${commentId}:`, error);
      return;
    }
    
    if (data) {
      console.log(`✅ Found data for comment ${commentId}:`, {
        user_id: data.user_id,
        created_at: data.created_at
      });
      
      // Update the data attributes
      if (data.user_id) {
        commentCard.setAttribute('data-user-id', data.user_id);
        commentCard.dataset.userId = data.user_id;
        console.log(`✅ Updated user_id for comment ${commentId}`);
      }
      
      if (data.created_at) {
        commentCard.setAttribute('data-created-at', data.created_at);
        commentCard.dataset.createdAt = data.created_at;
        console.log(`✅ Updated created_at for comment ${commentId}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error fixing comment ${commentId}:`, error);
  }
}

// Add this method inside your TinkByteCommentSystem class
createCommentElement(comment) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comment-wrapper';
  wrapper.dataset.commentId = comment.id;
  
  const threadLevel = Math.min(comment.thread_level || 0, 4);
  const avatarUrl = this.getUserAvatar(comment.profiles);
  const formattedContent = this.formatContent(comment.content);
  const displayName = comment.profiles?.display_name || 'Anonymous';
  const isAdmin = comment.profiles?.is_admin || false;
  
  wrapper.innerHTML = `
    <div class="comment-card" data-comment-id="${comment.id}" data-user-id="${comment.user_id}" data-created-at="${comment.created_at}" data-thread-level="${threadLevel}">
      <div class="comment-header">
        <div class="comment-user-info">
          <div class="comment-avatar">
            <img src="${avatarUrl}" alt="${displayName}" loading="lazy" />
            ${isAdmin ? '<div class="admin-badge">👑</div>' : ''}
          </div>
          <div class="comment-meta">
            <div class="user-details">
              <span class="username ${isAdmin ? 'admin' : ''}">${displayName}</span>
              ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
            </div>
            <div class="comment-time-wrapper">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span class="comment-time" title="${new Date(comment.created_at).toLocaleString()}">
                ${this.formatDate(comment.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        <div class="comment-actions-menu">
          <button class="menu-btn" data-comment-id="${comment.id}" title="More options" aria-label="Comment options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <div class="dropdown-menu" id="dropdown-${comment.id}">
            <button class="dropdown-item edit-comment-btn" data-comment-id="${comment.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="dropdown-item delete-comment-btn" data-comment-id="${comment.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
            <button class="dropdown-item report-btn" data-comment-id="${comment.id}" style="display: flex;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              Report
            </button>
          </div>
        </div>
      </div>

      <div class="comment-content">
        <div class="comment-text">${formattedContent}</div>
      </div>

      <div class="comment-footer">
        <div class="vote-section">
          <button class="vote-btn upvote-btn" data-comment-id="${comment.id}" data-action="upvote" title="Upvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 14l5-5 5 5"></path>
            </svg>
          </button>
          <span class="vote-count" id="vote-count-${comment.id}">${comment.like_count || 0}</span>
          <button class="vote-btn downvote-btn" data-comment-id="${comment.id}" data-action="downvote" title="Downvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 10l-5 5-5-5"></path>
            </svg>
          </button>
        </div>
        
        <div class="comment-reactions">
          <button class="reaction-btn" data-reaction="like" data-comment-id="${comment.id}" title="Like">
            <span class="reaction-emoji">👍</span>
            <span class="reaction-count" id="reaction-like-${comment.id}">${comment.reaction_counts?.like || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="love" data-comment-id="${comment.id}" title="Love">
            <span class="reaction-emoji">❤️</span>
            <span class="reaction-count" id="reaction-love-${comment.id}">${comment.reaction_counts?.love || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="laugh" data-comment-id="${comment.id}" title="Laugh">
            <span class="reaction-emoji">😂</span>
            <span class="reaction-count" id="reaction-laugh-${comment.id}">${comment.reaction_counts?.laugh || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="wow" data-comment-id="${comment.id}" title="Wow">
            <span class="reaction-emoji">😮</span>
            <span class="reaction-count" id="reaction-wow-${comment.id}">${comment.reaction_counts?.wow || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="angry" data-comment-id="${comment.id}" title="Angry">
            <span class="reaction-emoji">😠</span>
            <span class="reaction-count" id="reaction-angry-${comment.id}">${comment.reaction_counts?.angry || 0}</span>
          </button>
        </div>

        <div class="comment-actions">
          <button class="action-btn reply-btn" data-comment-id="${comment.id}" data-author="${displayName}" title="Reply">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,17 4,12 9,7"></polyline>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
            </svg>
            Reply
          </button>
          <button class="action-btn bookmark-btn" data-comment-id="${comment.id}" title="Bookmark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Bookmark
          </button>
          <button class="action-btn copy-btn" data-comment-id="${comment.id}" title="Copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
      </div>

      <div class="inline-reply-container" data-comment-id="${comment.id}" style="display: none;"></div>
      <div class="inline-edit-container" data-comment-id="${comment.id}" style="display: none;"></div>
      <div class="replies-container comment-replies"></div>
    </div>
  `;
  
  // Update permissions for the new comment after adding to DOM
  setTimeout(() => {
    this.updateCommentPermissions(comment.id);
  }, 100);
  
  return wrapper;
}

// Add helper method for creating reply elements
createReplyElement(reply) {
  const wrapper = document.createElement('div');
  wrapper.className = 'comment-wrapper reply-wrapper';
  wrapper.dataset.commentId = reply.id;
  
  const avatarUrl = this.getUserAvatar(reply.profiles);
  const formattedContent = this.formatContent(reply.content);
  const displayName = reply.profiles?.display_name || 'Anonymous';
  const isAdmin = reply.profiles?.is_admin || false;
  
  wrapper.innerHTML = `
    <div class="comment-card reply-card" data-comment-id="${reply.id}" data-user-id="${reply.user_id}" data-created-at="${reply.created_at}">
      <div class="reply-connector"></div>
      
      <div class="comment-header">
        <div class="comment-user-info">
          <div class="comment-avatar">
            <img src="${avatarUrl}" alt="${displayName}" loading="lazy" />
            ${isAdmin ? '<div class="admin-badge">👑</div>' : ''}
          </div>
          <div class="comment-meta">
            <div class="user-details">
              <span class="username ${isAdmin ? 'admin' : ''}">${displayName}</span>
            </div>
            <div class="comment-time-wrapper">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span class="comment-time">${this.formatDate(reply.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div class="comment-actions-menu">
          <button class="menu-btn" data-comment-id="${reply.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="19" cy="12" r="1"></circle>
              <circle cx="5" cy="12" r="1"></circle>
            </svg>
          </button>
          <div class="dropdown-menu" id="dropdown-${reply.id}">
            <button class="dropdown-item edit-comment-btn" data-comment-id="${reply.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="dropdown-item delete-comment-btn" data-comment-id="${reply.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
            <button class="dropdown-item report-btn" data-comment-id="${reply.id}" style="display: flex;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              Report
            </button>
          </div>
        </div>
      </div>

      <div class="comment-content">
        <div class="comment-text">${formattedContent}</div>
      </div>

      <div class="comment-footer">
        <div class="vote-section">
          <button class="vote-btn upvote-btn" data-comment-id="${reply.id}" data-action="upvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 14l5-5 5 5"></path>
            </svg>
          </button>
          <span class="vote-count">${reply.like_count || 0}</span>
          <button class="vote-btn downvote-btn" data-comment-id="${reply.id}" data-action="downvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 10l-5 5-5-5"></path>
            </svg>
          </button>
        </div>
        
        <div class="comment-reactions">
          <button class="reaction-btn" data-reaction="like" data-comment-id="${reply.id}">
            <span class="reaction-emoji">👍</span>
            <span class="reaction-count">${reply.reaction_counts?.like || 0}</span>
          </button>
          <button class="reaction-btn" data-reaction="love" data-comment-id="${reply.id}">
            <span class="reaction-emoji">❤️</span>
            <span class="reaction-count">${reply.reaction_counts?.love || 0}</span>
          </button>
        </div>

        <div class="comment-actions">
          <button class="action-btn reply-btn" data-comment-id="${reply.id}" data-author="${displayName}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,17 4,12 9,7"></polyline>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
            </svg>
            Reply
          </button>
          <button class="action-btn copy-btn" data-comment-id="${reply.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>
        </div>
      </div>

      <div class="inline-reply-container" data-comment-id="${reply.id}" style="display: none;"></div>
      <div class="inline-edit-container" data-comment-id="${reply.id}" style="display: none;"></div>
    </div>
  `;
  
  setTimeout(() => {
    this.updateCommentPermissions(reply.id);
  }, 100);
  
  return wrapper;
}

// Add helper method for date formatting if not exists
formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = (now - date) / 1000;
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

// Add helper method for building comment tree if not exists
buildCommentTree(comments) {
  const commentMap = new Map();
  const rootComments = [];
  
  // Create map
  comments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });
  
  // Build tree
  comments.forEach(comment => {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id).replies.push(comment);
    } else if (!comment.parent_id) {
      rootComments.push(comment);
    }
  });
  
  return rootComments;
}

  async init() {
    const commentSection = document.getElementById('comments-section');
    if (!commentSection) return;
    
    this.articleId = commentSection.dataset.articleId;
    this.environment = commentSection.dataset.environment || 'production';
    
    // Initialize auth and wait for it to complete
    await this.initializeAuth();
    
    // Then initialize UI and event listeners
    this.initializeUI();
    this.setupEventListeners();
    this.setupModalHandlers();
    this.setupKeyboardShortcuts();
    this.setupFormResponsiveness();
    this.setupMentionSystem(); 
    this.setupLoadMore();
    this.preventFormRefresh();

    // Load drafts if authenticated
    if (this.isAuthenticated) {
      await this.loadDrafts();
    }
    
    console.log('✅ TinkByte Comments initialized');
  }


  
preventFormRefresh() {
  // Prevent any form from causing page refresh
  document.addEventListener('submit', (e) => {
    if (e.target.closest('#comments-section')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });
  
  // Prevent button clicks from causing navigation
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button');
    if (target && target.closest('#comments-section')) {
      if (!target.getAttribute('type')) {
        target.setAttribute('type', 'button');
      }
    }
  });
}


// Enhanced initialization for static sites
async initializeAuth() {
  if (!this.authPromise) {
    this.authPromise = this._doAuthInitialization();
  }
  return this.authPromise;
}

async _doAuthInitialization() {
  try {
    console.log('🔐 Starting auth initialization...');
    console.log('🔐 Environment:', this.environment);
    
    await this.authState.initialize();
    
    // ✅ ADD MORE DETAILED DEBUG
    const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
    
    console.log('🔐 DETAILED AUTH DEBUG:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      sessionError,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionData: session
    });
    
    if (session?.user) {
      this.currentUser = { id: session.user.id, email: session.user.email };
      this.isAuthenticated = true;
      console.log('✅ User IS authenticated:', this.currentUser);
      
      await this.loadUserProfile();
      console.log('✅ Profile loaded:', this.profile);
    } else {
      console.log('❌ No session found - user not authenticated');
    }
    
    this.authInitialized = true;
    
    // ✅ FORCE UPDATE UI
    console.log('🎨 About to update UI with auth state:', this.isAuthenticated);
    this.updateUI();
    
    // ✅ UPDATE PERMISSIONS
    this.waitForCommentsToRender(() => {
      this.updateCommentDataAttributes();
      setTimeout(() => {
        this.updateAllCommentPermissions();
      }, 500);
    });

    // Listen for auth changes
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      debugLog('🔄Auth state changed:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        this.currentUser = { id: session.user.id, email: session.user.email };
        this.isAuthenticated = true;
        await this.loadUserProfile();
        this.updateUI();
        
        // Fix data attributes and update permissions after login
        this.waitForCommentsToRender(() => {
          this.updateCommentDataAttributes();
          setTimeout(() => {
            this.updateAllCommentPermissions();
          }, 500);
        });
        
        console.log('✅ Auth updated - user now logged in:', this.currentUser);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
        this.profile = null;
        this.isAuthenticated = false;
        this.updateUI();
        this.updateAllCommentPermissions();
        console.log('👤 Auth updated - user logged out');
      }
    });
    
  } catch (error) {
    console.error('❌ Auth initialization error:', error);
    this.authInitialized = true;
    
    this.waitForCommentsToRender(() => {
      this.updateAllCommentPermissions();
    });
  }
}

updatePermissionsWithRetry() {
  const attempts = [100, 500, 1000, 2000, 5000]; // Multiple timing attempts
  
  attempts.forEach((delay, index) => {
    setTimeout(() => {
      debugLog(`🔄 Permission update attempt ${index + 1}...`);
      this.updateAllCommentPermissions();
    }, delay);
  });
}

// Enhanced permission update with ownership check
updateCommentPermissions(commentId) {
  
  const dropdown = document.getElementById(`dropdown-${commentId}`);
  
  // *** FIX: Look specifically for the comment-card, not the wrapper ***
  const commentCard = document.querySelector(`.comment-card[data-comment-id="${commentId}"], .reply-card[data-comment-id="${commentId}"]`);
  
  if (!dropdown || !commentCard) {
    console.log(`❌ Missing elements for ${commentId}:`, {
      dropdown: !!dropdown,
      commentCard: !!commentCard
    });
    return;
  }
  
  const editBtn = dropdown.querySelector('.edit-comment-btn');
  const deleteBtn = dropdown.querySelector('.delete-comment-btn');
  const reportBtn = dropdown.querySelector('.report-btn');
  
  const currentUserId = this.currentUser?.id;
  const commentUserId = commentCard.dataset.userId; // Now this will work!
  const commentCreatedAt = commentCard.dataset.createdAt;
  
  // Handle empty string case
  const actualCommentUserId = commentUserId && commentUserId.trim() !== "" ? commentUserId.trim() : null;
  const actualCreatedAt = commentCreatedAt && commentCreatedAt.trim() !== "" ? commentCreatedAt.trim() : null;
  
  // Check ownership
  const isOwner = currentUserId && actualCommentUserId && 
                 String(currentUserId).trim() === String(actualCommentUserId).trim();
  
  const canStillEdit = actualCreatedAt ? this.canStillEdit(actualCreatedAt) : false;

  // Apply permissions
  if (editBtn) {
    const shouldShowEdit = isOwner && canStillEdit;
    editBtn.style.display = shouldShowEdit ? 'flex' : 'none';
    //console.log(`✏️ Edit button: ${shouldShowEdit ? 'SHOW' : 'HIDE'}`);
  }
  
  if (deleteBtn) {
    const shouldShowDelete = isOwner;
    deleteBtn.style.display = shouldShowDelete ? 'flex' : 'none';
    //console.log(`🗑️ Delete button: ${shouldShowDelete ? 'SHOW' : 'HIDE'}`);
  }
  
  if (reportBtn) {
    reportBtn.style.display = 'flex';
    //console.log(`🚩 Report button: SHOW`);
  }
}


  // Ultra-fast auth check - instant after first load
  async ensureAuth() {
    if (this.authInitialized) return; // Immediate return 99% of the time
    
    // Wait for the cached auth promise
    await this.authPromise;
  }

  async loadUserProfile() {
    if (!this.currentUser) return;
    
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', this.currentUser.id)
        .eq('environment', this.environment)
        .single();
      
      if (error) throw error;
      this.profile = data;
    } catch (error) {
      console.error('❌ Profile load error:', error);
    }
  }

  initializeUI() {
  this.updateUI();
  
  this.waitForCommentsToRender(() => {
    this.updateAllCommentPermissions();
    // ADD THIS LINE:
    this.initializePagination();
  });
}

// Add this method to your class
initializePagination() {
  const commentSection = document.getElementById('comments-section');
  if (!commentSection) {
    console.error('❌ Comment section not found');
    return;
  }

  this.totalComments = parseInt(commentSection.dataset.totalComments || '0');
  this.loadedComments = parseInt(commentSection.dataset.loadedComments || '0');
  this.commentsPerPage = parseInt(commentSection.dataset.commentsPerPage || '5');
  
  console.log(`📊 Pagination initialized:`);
  console.log(`   - Total: ${this.totalComments}`);
  console.log(`   - Loaded: ${this.loadedComments}`);
  console.log(`   - Per page: ${this.commentsPerPage}`);

  this.updateLoadMoreUI();
}

  updateLoadMoreUI() {
    const showingCount = document.getElementById('showing-count');
    const totalCount = document.getElementById('total-count');
    const loadMoreSection = document.getElementById('load-more-section');
    
    console.log(`🔄 Updating load more UI: ${this.loadedComments}/${this.totalComments}`);
    
    if (showingCount) {
      showingCount.textContent = this.loadedComments.toString();
    }
    
    if (totalCount) {
      totalCount.textContent = this.totalComments.toString();
    }
    
    if (loadMoreSection) {
      if (this.loadedComments >= this.totalComments) {
        loadMoreSection.style.display = 'none';
        console.log('✅ All comments loaded, hiding load more button');
      } else {
        loadMoreSection.style.display = 'block';
        console.log(`📊 Showing load more: ${this.loadedComments}/${this.totalComments} remaining`);
      }
    }
  }


  updateUI() {
    const guestPrompt = document.getElementById('guest-comment-prompt');
    const userForm = document.getElementById('user-comment-form');
    
    if (this.isAuthenticated) {
      if (guestPrompt) guestPrompt.style.display = 'none';
      if (userForm) userForm.style.display = 'block';
      this.updateUserInfo();
    } else {
      if (guestPrompt) guestPrompt.style.display = 'flex';
      if (userForm) userForm.style.display = 'none';
    }
  }

  updateUserInfo() {
    if (!this.profile) return;

    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');
    
    if (userAvatar) {
      const avatarUrl = this.getUserAvatar(this.profile);
      userAvatar.innerHTML = `<img src="${avatarUrl}" alt="${this.profile.display_name}" />`;
    }
    
    if (userName) {
      userName.textContent = this.profile.display_name || 'User';
    }
  }

  getUserAvatar(profile) {
    if (!profile) return "/images/avatars/preset-1.svg";
    
    if (profile.avatar_type === "uploaded" && profile.avatar_url) {
      return profile.avatar_url;
    }
    
    if (profile.avatar_type === "google" && profile.avatar_url) {
      return profile.avatar_url;
    }
    
    const presetId = profile.avatar_preset_id || 1;
    return `/images/avatars/preset-${presetId}.svg`;
  }

  setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Main comment form
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', this.handleCommentSubmit.bind(this));
    }

    // Character count and draft saving
    const textarea = document.getElementById('comment-textarea');
    if (textarea) {
      textarea.addEventListener('input', this.updateCharacterCount.bind(this));
      textarea.addEventListener('input', this.saveDraft.bind(this));
    }

    // Setup other handlers
    this.setupFormattingButtons();
    this.setupEmojiPicker();
    this.setupCommentActions();
    this.setupSorting();
    this.setupLoadMore();
    this.setupInlineHandlers();

    // Cancel reply
    const cancelReplyBtn = document.getElementById('cancel-reply');
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', this.cancelReply.bind(this));
    }

    // Account management
    const accountBtn = document.getElementById('tinkbyte-account-btn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => window.location.href = '/auth/signin');
    }
  }

 setupKeyboardShortcuts() {
  console.log('🎹 Setting up keyboard shortcuts...');
  
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const activeElement = document.activeElement;
      console.log('⌨️ Keyboard shortcut triggered:', {
        element: activeElement?.tagName,
        id: activeElement?.id,
        isTextarea: activeElement?.tagName === 'TEXTAREA'
      });
      
      if (activeElement?.tagName === 'TEXTAREA') {
        const form = activeElement.closest('form');
        if (form) {
          e.preventDefault();
          e.stopPropagation();
          console.log('🚀 Submitting form via keyboard shortcut');
          
          const submitEvent = new Event('submit', { 
            bubbles: true, 
            cancelable: true 
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
    
    // Escape to close
    if (e.key === 'Escape') {
      debugLog('🔄Escape key pressed - closing forms and modals');
      this.handleEscapeKey();
    }
  });
  
  console.log('✅ Keyboard shortcuts setup complete');
}

  handleEscapeKey() {
    this.closeAllModals();
    this.closeAllInlineForms();
    this.closeAllEmojiPickers();
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }

  setupModalHandlers() {
    // Delete modal
    ['close-delete-modal', 'cancel-delete'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.hideModal('delete-modal'));
    });
    
    const confirmDelete = document.getElementById('confirm-delete');
    if (confirmDelete) {
      confirmDelete.addEventListener('click', this.confirmDelete.bind(this));
    }

    // Report modal
    ['close-report-modal', 'cancel-report'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', () => this.hideModal('report-modal'));
    });
    
    const confirmReport = document.getElementById('confirm-report');
    if (confirmReport) {
      confirmReport.addEventListener('click', this.confirmReport.bind(this));
    }

    // Close modals on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.hideModal(e.target.id);
      }
    });
  }

  setupInlineHandlers() {
    //console.log('🔧 Setting up inline handlers...');
    
    // Inline reply cancel handlers
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-inline-reply')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Cancel inline reply clicked');
        
        const container = e.target.closest('.inline-reply-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
          console.log('✅ Inline reply form closed');
        }
      }
    });

    // Inline edit handlers
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-edit-inline')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Cancel inline edit clicked');
        
        const container = e.target.closest('.inline-edit-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
          console.log('✅ Inline edit form closed');
        }
      }
    });

    // Main form cancel button
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-btn')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('❌ Main cancel button clicked');
        
        const form = e.target.closest('form');
        if (form) {
          this.resetForm(form);
          this.resetFormState(form);
          console.log('✅ Main form reset');
        }
      }
    });

    // Inline form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.classList.contains('inline-comment-form')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('📝 Inline reply form submitted');
        this.handleInlineReply(e.target);
      }
      
      if (e.target.classList.contains('edit-comment-form-inline')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('✏️ Inline edit form submitted');
        this.handleInlineEdit(e.target);
      }
    });
  }

  setupFormResponsiveness() {
    debugLog('🔄Setting up form responsiveness...');
    
    // Re-initialize forms periodically
    setInterval(() => {
      this.refreshFormEventListeners();
    }, 60000); // Every 1 minutes
  }

refreshFormEventListeners() {
  debugLog('🔄 Refreshing form event listeners...');
  
  // Re-check auth state
  this.updateUI();
  
  // Re-setup character counters (but don't interfere with mentions)
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach(textarea => {
    // Only re-add character count, not all input listeners
    textarea.removeEventListener('input', this.updateCharacterCount);
    textarea.addEventListener('input', this.updateCharacterCount.bind(this));
  });
  
  // Re-setup form submissions
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.id === 'comment-form') {
      form.removeEventListener('submit', this.handleCommentSubmit);
      form.addEventListener('submit', this.handleCommentSubmit.bind(this));
    }
  });
  
  // DON'T re-setup mention system here - it should only be set up once
}

setupFormattingButtons() {
  document.addEventListener('click', (e) => {
    // Existing format buttons
    if (e.target.closest('.format-btn, .inline-format-btn, .edit-format-btn')) {
      e.preventDefault();
      const btn = e.target.closest('.format-btn, .inline-format-btn, .edit-format-btn');
      const format = btn.dataset.format;
      const form = btn.closest('form');
      const textarea = form.querySelector('textarea');
      this.applyFormatting(format, textarea);
    }

    // *** ADD THIS: Mention button handler ***
    if (e.target.closest('.mention-btn')) {
      e.preventDefault();
      e.stopPropagation();
      
      const btn = e.target.closest('.mention-btn');
      const form = btn.closest('form') || btn.closest('.comment-form-container');
      const textarea = form.querySelector('textarea');
      
      if (textarea) {
        // Insert @ symbol and trigger mention detection
        const cursorPos = textarea.selectionStart;
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);
        
        textarea.value = textBefore + '@' + textAfter;
        textarea.focus();
        textarea.setSelectionRange(cursorPos + 1, cursorPos + 1);
        
        // Trigger mention input detection
        this.handleMentionInput(textarea);
      }
    }
  });
}
  setupEmojiPicker() {
    this.createGlobalEmojiPicker();
    
    document.addEventListener('click', (e) => {
      // Handle emoji button clicks
      if (e.target.closest('.emoji-btn, .inline-emoji-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target.closest('.emoji-btn, .inline-emoji-btn');
        const form = btn.closest('form') || btn.closest('.comment-form-container');
        
        if (form) {
          this.currentEmojiForm = form;
          this.currentEmojiTextarea = form.querySelector('textarea');
          this.showGlobalEmojiPicker(btn);
        }
        return;
      }

      // Handle emoji category clicks
      if (e.target.closest('.emoji-category')) {
        e.preventDefault();
        e.stopPropagation();
        
        const category = e.target.closest('.emoji-category');
        const categoryName = category.dataset.category;
        this.switchEmojiCategory(categoryName);
        return;
      }

      // Handle emoji option clicks
      if (e.target.closest('.emoji-option')) {
        e.preventDefault();
        e.stopPropagation();
        
        const option = e.target.closest('.emoji-option');
        const emoji = option.dataset.emoji;
        
        if (this.currentEmojiTextarea) {
          this.insertEmoji(emoji, this.currentEmojiTextarea);
        }
        
        this.hideGlobalEmojiPicker();
        return;
      }

      // Close emoji picker when clicking outside
      if (!e.target.closest('.global-emoji-picker, .emoji-btn, .inline-emoji-btn')) {
        this.hideGlobalEmojiPicker();
      }
    });
    
    window.addEventListener('resize', () => {
      this.hideGlobalEmojiPicker();
    });
    
    window.addEventListener('scroll', () => {
      this.hideGlobalEmojiPicker();
    });
  }

  createGlobalEmojiPicker() {
    const existingPicker = document.getElementById('global-emoji-picker');
    if (existingPicker) {
      existingPicker.remove();
    }
    
    const picker = document.createElement('div');
    picker.id = 'global-emoji-picker';
    picker.className = 'global-emoji-picker';
    picker.style.cssText = `
      position: fixed;
      z-index: 99999;
      width: 320px;
      max-width: 90vw;
      max-height: 300px;
      background: var(--secondary-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 0.75rem;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: none;
      box-sizing: border-box;
    `;
    
    picker.innerHTML = `
      <div class="emoji-categories">
        <button class="emoji-category active" data-category="recent">Recent</button>
        <button class="emoji-category" data-category="smileys">😀</button>
        <button class="emoji-category" data-category="people">👤</button>
        <button class="emoji-category" data-category="nature">🌱</button>
        <button class="emoji-category" data-category="food">🍎</button>
        <button class="emoji-category" data-category="activities">⚽</button>
        <button class="emoji-category" data-category="travel">🚗</button>
        <button class="emoji-category" data-category="objects">💡</button>
        <button class="emoji-category" data-category="symbols">❤️</button>
        <button class="emoji-category" data-category="flags">🇳🇬</button>
        <button class="emoji-category" data-category="coding">💻</button>
      </div>
      <div class="emoji-grid" id="emoji-grid-container">
        <!-- Emojis will be populated based on category -->
      </div>
    `;
    
    document.body.appendChild(picker);
    
    // Initialize with recent emojis
    this.switchEmojiCategory('recent');
  }

  switchEmojiCategory(categoryName) {
    const categories = document.querySelectorAll('.emoji-category');
    categories.forEach(cat => cat.classList.remove('active'));
    
    const activeCategory = document.querySelector(`[data-category="${categoryName}"]`);
    if (activeCategory) {
      activeCategory.classList.add('active');
    }
    
    const grid = document.getElementById('emoji-grid-container');
    if (!grid) return;
    
    const emojiSets = {
      recent: ['😀', '😊', '😂', '❤️', '👍', '👎', '🎉', '🔥', '💯', '✨', '🚀', '💪', '🙏', '👏', '🎊', '🎈'],
      
      smileys: [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
        '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
        '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥'
      ],
      
      people: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
        '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅',
        '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄'
      ],
      
      nature: [
        '🐵', '🐒', '🦍', '🦧', '🐶', '🐕', '🦮', '🐩', '🐺', '🦊', '🦝', '🐱', '🐈', '🦁', '🐯', '🐅',
        '🐆', '🐴', '🐎', '🦄', '🦓', '🦌', '🐮', '🐂', '🐃', '🐄', '🐷', '🐖', '🐗', '🐽', '🐏', '🐑',
        '🌱', '🌿', '🍀', '🍃', '🌳', '🌲', '🌴', '🌵', '🌾', '🌻', '🌺', '🌸', '🌼', '🌷', '🥀', '🌹'
      ],
      
      food: [
        '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
        '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
        '🥐', '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴'
      ],
      
      activities: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
        '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌'
      ],
      
      travel: [
        '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵',
        '🚲', '🛴', '🛹', '🛼', '🚁', '🛸', '✈️', '🛩️', '🛫', '🛬', '🪂', '💺', '🚀', '🛰️', '🚉', '🚊'
      ],
      
      objects: [
        '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀', '📼',
        '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭'
      ],
      
      symbols: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
        '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈'
      ],
      
      flags: [
        // Major countries including Nigeria with full flag emojis
        '🇳🇬', '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇷🇺', '🇨🇳', '🇯🇵', '🇰🇷', '🇮🇳', '🇧🇷', '🇲🇽',
        // African countries
        '🇿🇦', '🇪🇬', '🇰🇪', '🇬🇭', '🇪🇹', '🇲🇦', '🇹🇳', '🇩🇿', '🇱🇾', '🇸🇩', '🇺🇬', '🇹🇿', '🇷🇼', '🇿🇼', '🇧🇼', '🇳🇦',
        // European countries
        '🇳🇱', '🇧🇪', '🇨🇭', '🇦🇹', '🇵🇱', '🇨🇿', '🇭🇺', '🇷🇴', '🇧🇬', '🇭🇷', '🇷🇸', '🇸🇮', '🇸🇰', '🇺🇦', '🇧🇾', '🇱🇹',
        // Asian countries
        '🇹🇭', '🇻🇳', '🇵🇭', '🇮🇩', '🇲🇾', '🇸🇬', '🇧🇩', '🇵🇰', '🇱🇰', '🇦🇫', '🇮🇷', '🇮🇶', '🇸🇦', '🇦🇪', '🇮🇱', '🇹🇷',
        // Special flags
        '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇺🇳', '🇪🇺'
      ],
      
      coding: [
        // Programming and tech symbols
        '💻', '🖥️', '⌨️', '🖱️', '🖲️', '💾', '💿', '📀', '🧮', '📱', '📲', '☎️', '📞', '📟', '📠', '📡',
        // Code symbols
        '⚡', '🔌', '🔋', '🪫', '💡', '🔦', '🕯️', '🧯', '⚙️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩', '⚗️',
        // Mathematical and logical symbols
        '🔢', '🔣', '🔤', '🔡', '🔠', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣',
        '9️⃣', '🔟', '💯', '➕', '➖', '✖️', '➗', '♾️', '‼️', '⁉️', '❓', '❔', '❗', '❕', '〰️', '🔀',
        // Arrows and navigation
        '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️', '🔄', '🔃',
        // Status and controls
        '▶️', '⏸️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '🔼', '🔽', '◀️', '🔁', '🔂', '🔀'
      ]
    };
    
    const emojis = emojiSets[categoryName] || emojiSets.recent;
    
    grid.innerHTML = emojis.map(emoji => 
      `<button class="emoji-option" data-emoji="${emoji}">${emoji}</button>`
    ).join('');
  }

  showGlobalEmojiPicker(btn) {
    const picker = document.getElementById('global-emoji-picker');
    if (!picker) return;
    
    const btnRect = btn.getBoundingClientRect();
    const pickerWidth = 320;
    const pickerHeight = 300;
    
    let left = btnRect.left;
    let top = btnRect.top - pickerHeight - 8;
    
    if (left + pickerWidth > window.innerWidth) {
      left = window.innerWidth - pickerWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    if (top < 20) {
      top = btnRect.bottom + 8;
    }
    
    picker.style.left = `${left}px`;
    picker.style.top = `${top}px`;
    picker.style.display = 'block';
    this.emojiPickerVisible = true;
  }

  hideGlobalEmojiPicker() {
    const picker = document.getElementById('global-emoji-picker');
    if (picker) {
      picker.style.display = 'none';
    }
    
    this.currentEmojiForm = null;
    this.currentEmojiTextarea = null;
    this.emojiPickerVisible = false;
  }

  closeAllEmojiPickers() {
    this.hideGlobalEmojiPicker();
    
    document.querySelectorAll('.emoji-picker, .inline-emoji-picker').forEach(picker => {
      picker.classList.remove('show');
      picker.style.display = 'none';
      picker.style.visibility = 'hidden';
      picker.style.opacity = '0';
    });
    
    this.emojiPickerVisible = false;
  }

  setupCommentActions() {
    document.addEventListener('click', (e) => {
      // Reply buttons
      if (e.target.closest('.reply-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.reply-btn');
        this.handleInlineReplySetup(btn.dataset.commentId, btn.dataset.author);
      }

      // Vote buttons  
      if (e.target.closest('.vote-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.vote-btn');
        this.handleVote(btn.dataset.commentId, btn.dataset.action || 'upvote');
      }

      // Reaction buttons
      if (e.target.closest('.reaction-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.reaction-btn');
        this.handleReaction(btn.dataset.commentId, btn.dataset.reaction);
      }

      // Menu buttons
      if (e.target.closest('.menu-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.menu-btn');
        this.toggleDropdown(btn.dataset.commentId);
      }

      // Edit buttons
      if (e.target.closest('.edit-comment-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.edit-comment-btn');
        this.handleInlineEditSetup(btn.dataset.commentId);
      }

      // Delete buttons
      if (e.target.closest('.delete-comment-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.delete-comment-btn');
        this.handleDeleteSetup(btn.dataset.commentId);
      }

      // Report buttons
      if (e.target.closest('.report-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.report-btn');
        this.handleReportSetup(btn.dataset.commentId);
      }

      // Bookmark and copy buttons
      if (e.target.closest('.bookmark-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.bookmark-btn');
        this.handleBookmark(btn.dataset.commentId);
      }

      if (e.target.closest('.copy-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.copy-btn');
        this.handleCopy(btn.dataset.commentId);
      }
    });
  }

  setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortComments(e.target.value);
      });
    }
  }

  setupLoadMore() {
    console.log('🔧 Setting up load more functionality...');
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      // Remove any existing listeners first
      const newBtn = loadMoreBtn.cloneNode(true);
      loadMoreBtn.parentNode?.replaceChild(newBtn, loadMoreBtn);
      
      // Add the event listener with proper error handling
      newBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔄 Load more button clicked');
        
        try {
          await this.loadMoreComments();
        } catch (error) {
          console.error('❌ Load more error:', error);
          this.showError('Failed to load more comments. Please try again.');
        }
      });
      
      console.log('✅ Load more button listener attached');
    } else {
      console.warn('⚠️ Load more button not found');
    }
    
    // Setup load more replies buttons
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.load-more-replies-btn')) {
        e.preventDefault();
        e.stopPropagation();
        
        const btn = e.target.closest('.load-more-replies-btn');
        const commentId = btn.dataset.commentId;
        const currentlyLoaded = parseInt(btn.dataset.loaded || '0');
        
        if (commentId) {
          console.log(`🔄 Loading more replies for comment: ${commentId}`);
          try {
            await this.loadMoreReplies(commentId, currentlyLoaded);
          } catch (error) {
            console.error('❌ Load more replies error:', error);
            this.showError('Failed to load more replies. Please try again.');
          }
        }
      }
    });
  }

  // Optimized comment submission with ultra-fast auth check
  async handleCommentSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Comment form submitted');
    
    // Ultra-fast auth check - instant after first load
    await this.ensureAuth();
    
    if (!this.isAuthenticated || !this.currentUser) {
      console.log('❌ User not authenticated:', { 
        isAuthenticated: this.isAuthenticated, 
        currentUser: this.currentUser,
        authInitialized: this.authInitialized
      });
      this.showError('Please sign in to comment');
      return;
    }

    if (this.isSubmitting) {
      console.log('Form already submitting...');
      return;
    }

    this.isSubmitting = true;

    const form = e.target;
    const formData = new FormData(form);
    const content = formData.get('content')?.trim();

    if (!this.validateComment(content)) {
      this.isSubmitting = false;
      return;
    }

    const submitBtn = form.querySelector('.submit-btn');
    if (submitBtn) submitBtn.disabled = true;
    
    this.showLoading(form);

    try {
      console.log('🚀 Submitting comment with user:', this.currentUser);
      
      const result = await this.TinkByteAPI.addComment(
        this.articleId,
        content, 
        this.replyingTo?.id || null
      );

      if (result.success) {
        // Check moderation status and show appropriate message
        if (['auto_approved', 'approved'].includes(result.data.moderation_status)) {
          this.showSuccess('Comment posted successfully!');
          this.addCommentToUI(result.data);
        } else {
          this.showSuccess('Comment submitted and pending approval!');
        }
        
        this.resetForm(form);
        this.clearDraft();
        this.updateCommentCount(1);
        this.resetFormState(form);
      } else {
        // Handle specific error messages
        if (result.error && result.error.includes('links are not allowed')) {
          this.showError('Links are not allowed in comments. Please remove any URLs and try again.');
        } else {
          this.showError(result.error || 'Failed to post comment');
        }
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(form);
      this.isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  // Inline reply setup with optimized auth check
  async handleInlineReplySetup(commentId, author) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    const container = document.querySelector(`[data-comment-id="${commentId}"] .inline-reply-container`);
    if (!container) return;

    const template = document.getElementById('inline-reply-template');
    const clone = template.content.cloneNode(true);

    const authorName = clone.querySelector('.reply-author-name');
    if (authorName) authorName.textContent = author;

    const userAvatar = clone.querySelector('.inline-user-avatar');
    const userName = clone.querySelector('.inline-user-name');
    
    if (userAvatar && this.profile) {
      userAvatar.innerHTML = `<img src="${this.getUserAvatar(this.profile)}" alt="${this.profile.display_name}" />`;
    }
    
    if (userName && this.profile) {
      userName.textContent = this.profile.display_name || 'User';
    }

    const form = clone.querySelector('.inline-comment-form');
    form.dataset.commentId = commentId;
    form.dataset.articleId = this.articleId;

    const textarea = clone.querySelector('.inline-textarea');
    const charCount = clone.querySelector('.inline-char-count .count');
    
    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = count;
      
      if (count > 800) {
        charCount.style.color = 'var(--warning-color)';
      } else if (count >= 1000) {
        charCount.style.color = 'var(--error-color)';
      } else {
        charCount.style.color = 'var(--text-secondary)';
      }
    });

    container.innerHTML = '';
    container.appendChild(clone);
    container.style.display = 'block';
    textarea.focus();
  }

  // Inline reply submission with optimized auth check
  async handleInlineReply(form) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) return;

    const formData = new FormData(form);
    const content = formData.get('content').trim();
    const commentId = form.dataset.commentId;

    if (!this.validateComment(content)) return;

    this.showLoading(form);

    try {
      const result = await this.TinkByteAPI.addComment(
        this.articleId, 
        content, 
        commentId
      );

      if (result.success) {
        this.showSuccess('Reply posted successfully!');
        
        const container = form.closest('.inline-reply-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
        }
        
        this.addReplyToUI(result.data, commentId);
        this.updateCommentCount(1);
      } else {
        this.showError(result.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Reply submission error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(form);
    }
  }

  // Inline edit setup with optimized auth check
  async handleInlineEditSetup(commentId) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) return;

    const container = document.querySelector(`[data-comment-id="${commentId}"] .inline-edit-container`);
    const commentCard = this.getCommentCardElement(commentId);
    
    if (!container || !commentCard) return;

    const commentText = commentCard.querySelector('.comment-text')?.textContent || '';

    const template = document.getElementById('inline-edit-template');
    const clone = template.content.cloneNode(true);

    const form = clone.querySelector('.edit-comment-form-inline');
    form.dataset.commentId = commentId;

    const textarea = clone.querySelector('.edit-textarea');
    textarea.value = commentText;

    const charCount = clone.querySelector('.edit-char-count .count');
    charCount.textContent = commentText.length;

    textarea.addEventListener('input', () => {
      const count = textarea.value.length;
      charCount.textContent = count;
      
      if (count > 800) {
        charCount.style.color = 'var(--warning-color)';
      } else if (count >= 1000) {
        charCount.style.color = 'var(--error-color)';
      } else {
        charCount.style.color = 'var(--text-secondary)';
      }
    });

    container.innerHTML = '';
    container.appendChild(clone);
    container.style.display = 'block';
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  // Inline edit submission with optimized auth check
  async handleInlineEdit(form) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) return;

    const formData = new FormData(form);
    const content = formData.get('content').trim();
    const editReason = formData.get('edit_reason');
    const commentId = form.dataset.commentId;

    if (!this.validateComment(content)) return;

    this.showLoading(form);

    try {
      const result = await this.TinkByteAPI.updateComment(commentId, content, editReason);

      if (result.success) {
        this.showSuccess('Comment updated successfully!');
        
        const container = form.closest('.inline-edit-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
        }
        
        this.updateCommentInUI(result.data);
      } else {
        this.showError(result.error || 'Failed to update comment');
      }
    } catch (error) {
      console.error('Edit submission error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(form);
    }
  }

  // Vote handling with optimized auth check
  async handleVote(commentId, action = 'upvote') {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const result = await this.TinkByteAPI.toggleCommentLike(commentId);
      
      if (result.success) {
        this.updateVoteUI(commentId, result);
      } else {
        this.showError(result.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Vote error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  // Reaction handling with optimized auth check
  async handleReaction(commentId, reactionType) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const result = await this.TinkByteAPI.toggleCommentReaction(commentId, reactionType);
      
      if (result.success) {
        this.updateReactionUI(commentId, reactionType, result);
      } else {
        this.showError(result.error || 'Failed to react');
      }
    } catch (error) {
      console.error('Reaction error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  // Bookmark handling with optimized auth check
  async handleBookmark(commentId) {
    await this.ensureAuth();
    
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const result = await this.TinkByteAPI.toggleCommentBookmark(commentId);
      
      if (result.success) {
        this.updateBookmarkUI(commentId, result.bookmarked);
        this.showSuccess(result.bookmarked ? 'Comment bookmarked!' : 'Bookmark removed!');
      } else {
        this.showError(result.error || 'Failed to bookmark');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  // Copy handling
  async handleCopy(commentId) {
    const commentCard = this.getCommentCardElement(commentId);
    const commentText = commentCard?.querySelector('.comment-text')?.textContent || '';

    if (!commentText) return;

    try {
      await navigator.clipboard.writeText(commentText);
      this.showSuccess('Comment copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
      this.showError('Failed to copy comment');
    }
  }

  // Delete setup
  handleDeleteSetup(commentId) {
    if (!commentId) {
      console.error('No comment ID provided for deletion');
      return;
    }

    const commentCard = this.getCommentCardElement(commentId);
    if (!commentCard) {
      console.error('Comment card not found for ID:', commentId);
      return;
    }

    const commentText = commentCard.querySelector('.comment-text')?.textContent || '';

    const preview = document.getElementById('delete-comment-preview');
    const confirmBtn = document.getElementById('confirm-delete');

    if (preview) {
      preview.textContent = commentText.substring(0, 100) + (commentText.length > 100 ? '...' : '');
    }

    if (confirmBtn) {
      confirmBtn.dataset.commentId = commentId;
    }

    this.showModal('delete-modal');
  }

  // Delete confirmation
  async confirmDelete() {
    const confirmBtn = document.getElementById('confirm-delete');
    const commentId = confirmBtn?.dataset.commentId;

    if (!commentId) {
      console.error('No comment ID found for deletion');
      this.showError('Error: No comment ID found');
      return;
    }

    this.showLoading(confirmBtn.closest('.modal-actions'));

    try {
      const result = await this.TinkByteAPI.deleteComment(commentId);

      if (result.success) {
        this.showSuccess('Comment deleted successfully!');
        this.removeCommentFromUI(commentId);
        this.updateCommentCount(-1);
        this.hideModal('delete-modal');
        confirmBtn.dataset.commentId = '';
      } else {
        this.showError(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Delete error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(confirmBtn.closest('.modal-actions'));
    }
  }

  // Report setup
  handleReportSetup(commentId) {
    const confirmBtn = document.getElementById('confirm-report');

    if (confirmBtn) {
      confirmBtn.dataset.commentId = commentId;
    }

    const reportModal = document.getElementById('report-modal');
    const reportReasons = reportModal.querySelectorAll('input[name="report-reason"]');
    reportReasons.forEach(radio => radio.checked = false);

    const reportDetails = document.getElementById('report-details');
    if (reportDetails) reportDetails.value = '';

    this.showModal('report-modal');
  }

  // Report confirmation
  async confirmReport() {
    const confirmBtn = document.getElementById('confirm-report');
    const commentId = confirmBtn?.dataset.commentId;

    if (!commentId) return;

    const selectedReason = document.querySelector('input[name="report-reason"]:checked');
    const details = document.getElementById('report-details')?.value || '';

    if (!selectedReason) {
      this.showError('Please select a reason for reporting');
      return;
    }

    this.showLoading(confirmBtn.closest('.modal-actions'));

    try {
      // For now, just show success - you can implement actual reporting later
      this.showSuccess('Comment reported successfully!');
      this.hideModal('report-modal');
    } catch (error) {
      console.error('Report error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(confirmBtn.closest('.modal-actions'));
    }
  }

  // Update permissions for all comments (static-compatible)
  updateAllCommentPermissions() {
    debugLog('🔄Updating permissions for all comments...');
    
    // Find all comment cards, including replies
    const commentCards = document.querySelectorAll('.comment-card[data-comment-id], .reply-card[data-comment-id]');
    
    console.log(`Found ${commentCards.length} comments to update permissions for`);
    
    commentCards.forEach(card => {
      const commentId = card.dataset.commentId;
      if (commentId) {
        this.updateCommentPermissions(commentId);
      }
    });
    
    console.log('✅ All comment permissions updated');
  }

updateAllCommentPermissions() {
  // Debounce to prevent excessive calls
  clearTimeout(this.permissionUpdateTimeout);
  this.permissionUpdateTimeout = setTimeout(() => {
    const commentCards = document.querySelectorAll('.comment-card[data-comment-id], .reply-card[data-comment-id]');
    
    commentCards.forEach(card => {
      const commentId = card.dataset.commentId;
      if (commentId) {
        this.updateCommentPermissions(commentId);
      }
    });
  }, 100);
}

    // Update permissions for a specific comment (pure client-side)
    updateCommentPermissions(commentId) {
      
      const dropdown = document.getElementById(`dropdown-${commentId}`);
      const commentCard = this.getCommentCardElement(commentId);
      
      if (!dropdown || !commentCard) {
        console.log(`❌ Missing elements for ${commentId}:`, {
          dropdown: !!dropdown,
          commentCard: !!commentCard
        });
        return;
      }
      
      const editBtn = dropdown.querySelector('.edit-comment-btn');
      const deleteBtn = dropdown.querySelector('.delete-comment-btn');
      const reportBtn = dropdown.querySelector('.report-btn');
      
      const currentUserId = this.currentUser?.id;
      const commentUserId = commentCard.dataset.userId;
      const commentCreatedAt = commentCard.dataset.createdAt;
      
      // *** Handle empty string from Astro properly ***
      const actualCommentUserId = commentUserId && commentUserId.trim() !== "" ? commentUserId : null;
      
      // Check ownership
      const isOwner = currentUserId && actualCommentUserId && 
                    String(currentUserId).trim() === String(actualCommentUserId).trim();
      
      const canStillEdit = this.canStillEdit(commentCreatedAt);

      // Apply permissions
      if (editBtn) {
        const shouldShowEdit = isOwner && canStillEdit;
        editBtn.style.display = shouldShowEdit ? 'flex' : 'none';
        //console.log(`✏️ Edit button: ${shouldShowEdit ? 'SHOW' : 'HIDE'}`);
      }
      
      if (deleteBtn) {
        const shouldShowDelete = isOwner;
        deleteBtn.style.display = shouldShowDelete ? 'flex' : 'none';
        //console.log(`🗑️ Delete button: ${shouldShowDelete ? 'SHOW' : 'HIDE'}`);
      }
      
      if (reportBtn) {
        reportBtn.style.display = 'flex';
        //console.log(`🚩 Report button: SHOW`);
      }
    }
  toggleDropdown(commentId) {
    const dropdown = document.getElementById(`dropdown-${commentId}`);
    if (!dropdown) return;

    // Close other dropdowns
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      if (menu !== dropdown) {
        menu.classList.remove('show');
      }
    });

    // Toggle current dropdown
    dropdown.classList.toggle('show');
    
    if (dropdown.classList.contains('show')) {
      this.updateCommentPermissions(commentId);
    }
  }

  canStillEdit(createdAtString) {
    if (!createdAtString) return false;
    
    const createdAt = new Date(createdAtString);
    const now = new Date();
    const diffInMinutes = (now - createdAt) / (1000 * 60);
    
    return diffInMinutes <= 15;
  }

  // UI Update Methods
  updateVoteUI(commentId, voteData) {
    const commentCard = this.getCommentCardElement(commentId);
    if (!commentCard) return;

    const voteBtn = commentCard.querySelector('.vote-btn');
    const voteCount = commentCard.querySelector('.vote-count');

    if (voteBtn) {
      voteBtn.classList.toggle('active', voteData.liked);
    }

    if (voteCount) {
      const currentCount = parseInt(voteCount.textContent) || 0;
      voteCount.textContent = voteData.liked ? currentCount + 1 : currentCount - 1;
    }
  }

  updateReactionUI(commentId, reactionType, reactionData) {
    const reactionBtn = document.querySelector(`[data-comment-id="${commentId}"] .reaction-btn[data-reaction="${reactionType}"]`);
    const countElement = document.getElementById(`reaction-${reactionType}-${commentId}`);
    
    if (reactionBtn) {
      reactionBtn.classList.toggle('active', reactionData.reacted);
    }
    
    if (countElement) {
      countElement.textContent = reactionData.count || 0;
    }
  }

  updateBookmarkUI(commentId, bookmarked) {
    const bookmarkBtn = document.querySelector(`[data-comment-id="${commentId}"] .bookmark-btn`);
    if (bookmarkBtn) {
      bookmarkBtn.classList.toggle('active', bookmarked);
      const svg = bookmarkBtn.querySelector('svg');
      if (svg) {
        svg.style.fill = bookmarked ? 'currentColor' : 'none';
      }
    }
  }

  updateCommentInUI(commentData) {
    const commentCard = document.querySelector(`[data-comment-id="${commentData.id}"]`);
    if (!commentCard) return;

    const commentText = commentCard.querySelector('.comment-text');
    if (commentText) {
      commentText.innerHTML = this.formatContent(commentData.content);
    }

    const userDetails = commentCard.querySelector('.user-details');
    if (userDetails && !userDetails.querySelector('.edit-indicator')) {
      const editIndicator = document.createElement('span');
      editIndicator.className = 'edit-indicator';
      editIndicator.title = 'This comment has been edited';
      editIndicator.textContent = '(edited)';
      userDetails.appendChild(editIndicator);
    }
  }

addCommentToUI(commentData) {
  console.log('Adding comment to UI:', commentData);
  
  if (commentData.moderation_status === 'pending' && commentData.user_id !== this.currentUser?.id) {
    console.log('Comment is pending and not from current user, not displaying');
    return;
  }

  setTimeout(() => {
    this.syncCommentsWithDatabase();
  }, 1000);
  
  let commentsContainer = this.getMainCommentsContainer();
  
  if (!commentsContainer) {
    console.error('❌ Could not find comments container');
    // **FIX 2: Force create container if needed**
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      // Look for existing lists first
      let commentsList = commentsSection.querySelector('.comments-list');
      if (!commentsList) {
        commentsList = document.createElement('div');
        commentsList.className = 'comments-list';
        commentsList.id = 'comments-list';
        commentsSection.appendChild(commentsList);
      }
      
      commentsContainer = document.createElement('div');
      commentsContainer.className = 'comments-items';
      commentsContainer.id = 'comments-items';
      commentsList.appendChild(commentsContainer);
    } else {
      console.error('❌ No comments section found');
      return;
    }
  }


  // Hide empty state
  const emptyState = document.getElementById('empty-state') || 
                    document.querySelector('.empty-state');
  
  if (emptyState) {
    emptyState.style.display = 'none';
    console.log('Hidden empty state');
  }

  // Create the comment element
  const commentElement = document.createElement('div');
  commentElement.className = commentData.parent_id ? 'comment-wrapper reply-wrapper' : 'comment-wrapper';
  commentElement.dataset.commentId = commentData.id;
  
  const threadLevel = commentData.thread_level || 0;
  const avatarUrl = this.getUserAvatar(this.profile);
  const formattedContent = this.formatContent(commentData.content);
  
  commentElement.innerHTML = `
    <div class="comment-card ${commentData.parent_id ? 'reply-card' : ''}" 
         data-comment-id="${commentData.id}" 
         data-user-id="${this.currentUser.id}"
         data-created-at="${commentData.created_at}"
         data-thread-level="${threadLevel}">
      
      ${commentData.parent_id ? '<div class="reply-connector"></div>' : ''}
      
      <div class="comment-header">
        <div class="comment-user-info">
          <div class="comment-avatar">
            <img src="${avatarUrl}" alt="${this.profile.display_name}" loading="lazy" />
            ${this.profile.is_admin ? '<div class="admin-badge">👑</div>' : ''}
          </div>
          <div class="comment-meta">
            <div class="user-details">
              <span class="username ${this.profile.is_admin ? 'admin' : ''}">${this.profile.display_name}</span>
              ${this.profile.is_admin ? '<span class="admin-badge">Admin</span>' : ''}
              ${this.profile.membership_type === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}
            </div>
            <div class="comment-time-wrapper">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12,6 12,12 16,14"></polyline>
              </svg>
              <span class="comment-time" title="${new Date(commentData.created_at).toLocaleString()}">
                Just now
              </span>
            </div>
          </div>
        </div>
        
        <div class="comment-actions-menu">
          <button class="menu-btn" data-comment-id="${commentData.id}" aria-label="Comment options">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
          <div class="dropdown-menu" id="dropdown-${commentData.id}">
            <button class="dropdown-item edit-comment-btn" data-comment-id="${commentData.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              Edit
            </button>
            <button class="dropdown-item delete-comment-btn" data-comment-id="${commentData.id}" style="display: none;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
            <button class="dropdown-item report-btn" data-comment-id="${commentData.id}" style="display: flex;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              Report
            </button>
          </div>
        </div>
      </div>

      <div class="comment-content">
        <div class="comment-text">${formattedContent}</div>
      </div>

      <div class="comment-footer">
        <div class="vote-section">
          <button class="vote-btn upvote-btn" data-comment-id="${commentData.id}" data-action="upvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M7 14l5-5 5 5"></path>
            </svg>
          </button>
          <span class="vote-count">${commentData.like_count || 0}</span>
          <button class="vote-btn downvote-btn" data-comment-id="${commentData.id}" data-action="downvote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 10l-5 5-5-5"></path>
            </svg>
          </button>
        </div>
        
        <div class="comment-reactions">
          <button class="reaction-btn" data-reaction="like" data-comment-id="${commentData.id}">
            <span class="reaction-emoji">👍</span>
            <span class="reaction-count" id="reaction-like-${commentData.id}">0</span>
          </button>
          <button class="reaction-btn" data-reaction="love" data-comment-id="${commentData.id}">
            <span class="reaction-emoji">❤️</span>
            <span class="reaction-count" id="reaction-love-${commentData.id}">0</span>
          </button>
          <button class="reaction-btn" data-reaction="laugh" data-comment-id="${commentData.id}">
            <span class="reaction-emoji">😂</span>
            <span class="reaction-count" id="reaction-laugh-${commentData.id}">0</span>
          </button>
          <button class="reaction-btn" data-reaction="wow" data-comment-id="${commentData.id}">
            <span class="reaction-emoji">😮</span>
            <span class="reaction-count" id="reaction-wow-${commentData.id}">0</span>
          </button>
          <button class="reaction-btn" data-reaction="angry" data-comment-id="${commentData.id}">
            <span class="reaction-emoji">😠</span>
            <span class="reaction-count" id="reaction-angry-${commentData.id}">0</span>
          </button>
        </div>

        <div class="comment-actions">
          <button class="action-btn reply-btn" data-comment-id="${commentData.id}" data-author="${this.profile.display_name}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,17 4,12 9,7"></polyline>
              <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
            </svg>
            Reply
          </button>

          <button class="action-btn copy-btn" data-comment-id="${commentData.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
            </svg>
            Copy
          </button>

          <button class="action-btn bookmark-btn" data-comment-id="${commentData.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            Bookmark
          </button>
        </div>
      </div>

      <div class="inline-reply-container" style="display: none;"></div>
      <div class="inline-edit-container" style="display: none;"></div>
      <div class="replies-container comment-replies"></div>
    </div>
  `;

  // Add to the appropriate container
  if (commentData.parent_id) {
    commentsContainer.appendChild(commentElement);
  } else {
    commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    console.log('Root comment added to main container');
  }
  
  // Highlight the new comment
  const commentCard = commentElement.querySelector('.comment-card');
  commentCard.classList.add('new-comment');
  
  setTimeout(() => {
    commentCard.classList.remove('new-comment');
  }, 3000);
  
  // Scroll to the new comment
  commentElement.scrollIntoView({ 
    behavior: 'smooth', 
    block: 'center' 
  });
  
    // Update permissions for the new comment
  this.updateCommentPermissions(commentData.id);
    
   if (!commentData.parent_id) {
    this.totalComments++;
    this.loadedComments++;
    
    const totalCountElement = document.getElementById('total-count');
    const threadCount = document.getElementById('total-comments');
    
    if (totalCountElement) totalCountElement.textContent = this.totalComments;
    if (threadCount) threadCount.textContent = this.totalComments;
    
    this.updateLoadMoreUI();
  }
  
  console.log('✅ Comment added to UI successfully');
}

  async syncCommentsWithDatabase() {
    try {
      const result = await this.TinkByteAPI.getComments(this.articleId);
      if (result.success) {
        this.updateCommentCount(result.data.length);
        //console.log('Comments synced with database');
      }
    } catch (error) {
      console.error('Failed to sync comments:', error);
    }
  }

  getMainCommentsContainer() {
    let commentsContainer = document.getElementById('comments-items') || 
                          document.getElementById('comments-list') || 
                          document.querySelector('.comments-items') ||
                          document.querySelector('.comments-list') ||
                          document.querySelector('.comments-container');
    
    if (!commentsContainer) {
      //console.log('Comments container not found. Creating new one...');
      
      const commentsSection = document.getElementById('comments-section');
      if (commentsSection) {
        commentsContainer = document.createElement('div');
        commentsContainer.id = 'comments-items';
        commentsContainer.className = 'comments-items';
        commentsSection.appendChild(commentsContainer);
        //console.log('Created new comments container');
      } else {
        console.error('Could not find or create comments container');
        return null;
      }
    }
    
    return commentsContainer;
  }

  addReplyToUI(replyData, parentId) {
    console.log('Adding reply to UI:', replyData, 'Parent:', parentId);
    
    const parentComment = document.querySelector(`[data-comment-id="${parentId}"]`);
    if (!parentComment) {
      console.error('Parent comment not found:', parentId);
      return;
    }

    let repliesContainer = parentComment.querySelector('.replies-container');
    if (!repliesContainer) {
      repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies-container';
      parentComment.appendChild(repliesContainer);
    }

    const avatarUrl = this.getUserAvatar(this.profile);
    const formattedContent = this.formatContent(replyData.content);
    
    const replyElement = document.createElement('div');
    replyElement.className = 'comment-wrapper reply-wrapper';
    replyElement.dataset.commentId = replyData.id;
    
    replyElement.innerHTML = `
      <div class="comment-card reply-card" data-comment-id="${replyData.id}" data-user-id="${this.currentUser.id}" data-created-at="${replyData.created_at}">
        <div class="reply-connector"></div>
        
        <div class="comment-header">
          <div class="comment-user-info">
            <div class="comment-avatar">
              <img src="${avatarUrl}" alt="${this.profile.display_name}" loading="lazy" />
            </div>
            <div class="comment-meta">
              <div class="user-details">
                <span class="username">${this.profile.display_name}</span>
                ${this.profile.is_admin ? '<span class="admin-badge">Admin</span>' : ''}
                ${this.profile.membership_type === 'premium' ? '<span class="premium-badge">Premium</span>' : ''}
              </div>
              <div class="comment-time-wrapper">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span class="comment-time" title="${new Date(replyData.created_at).toLocaleString()}">Just now</span>
              </div>
            </div>
          </div>
          
          <div class="comment-actions-menu">
            <button class="menu-btn" data-comment-id="${replyData.id}" aria-label="Reply options">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
            <div class="dropdown-menu" id="dropdown-${replyData.id}">
              <button class="dropdown-item edit-comment-btn" data-comment-id="${replyData.id}" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button class="dropdown-item delete-comment-btn" data-comment-id="${replyData.id}" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
              <button class="dropdown-item report-btn" data-comment-id="${replyData.id}" style="display: flex;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                Report
              </button>
            </div>
          </div>
        </div>

        <div class="comment-content">
          <div class="comment-text">${formattedContent}</div>
        </div>

        <div class="comment-footer">
          <div class="vote-section">
            <button class="vote-btn upvote-btn" data-comment-id="${replyData.id}" data-action="upvote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 14l5-5 5 5"></path>
              </svg>
            </button>
            <span class="vote-count">${replyData.like_count || 0}</span>
            <button class="vote-btn downvote-btn" data-comment-id="${replyData.id}" data-action="downvote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 10l-5 5-5-5"></path>
              </svg>
            </button>
          </div>
          
          <div class="comment-reactions">
            <button class="reaction-btn" data-reaction="like" data-comment-id="${replyData.id}">
              <span class="reaction-emoji">👍</span>
              <span class="reaction-count" id="reaction-like-${replyData.id}">0</span>
            </button>
            <button class="reaction-btn" data-reaction="love" data-comment-id="${replyData.id}">
              <span class="reaction-emoji">❤️</span>
              <span class="reaction-count" id="reaction-love-${replyData.id}">0</span>
            </button>
            <button class="reaction-btn" data-reaction="laugh" data-comment-id="${replyData.id}">
              <span class="reaction-emoji">😂</span>
              <span class="reaction-count" id="reaction-laugh-${replyData.id}">0</span>
            </button>
          </div>

          <div class="comment-actions">
            <button class="action-btn reply-btn" data-comment-id="${replyData.id}" data-author="${this.profile.display_name}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,17 4,12 9,7"></polyline>
                <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
              </svg>
              Reply
            </button>
            
            <button class="action-btn copy-btn" data-comment-id="${replyData.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
            
            <button class="action-btn bookmark-btn" data-comment-id="${replyData.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
              Bookmark
            </button>
          </div>
        </div>

        <div class="inline-reply-container" style="display: none;"></div>
        <div class="inline-edit-container" style="display: none;"></div>
      </div>
    `;

    repliesContainer.appendChild(replyElement);
    
    // Add highlight animation
    const replyCard = replyElement.querySelector('.reply-card');
    replyCard.classList.add('new-comment');
    
    setTimeout(() => {
      replyCard.classList.remove('new-comment');
    }, 3000);
    
    // Scroll to the new reply
    replyElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Update permissions for the new reply
    this.updateCommentPermissions(replyData.id);
    
    console.log('✅ Reply added to UI successfully');
  }

  removeCommentFromUI(commentId) {
    const commentCard = this.getCommentCardElement(commentId);
    const commentWrapper = commentCard?.closest('.comment-wrapper');
    
    if (commentWrapper) {
      commentWrapper.remove();
    } else if (commentCard) {
      commentCard.remove();
    }
  }

    getCommentCardElement(commentId) {
    return document.querySelector(`.comment-card[data-comment-id="${commentId}"], .reply-card[data-comment-id="${commentId}"]`);
  }


  updateCommentCount(change) {
    const countElement = document.getElementById('total-comments');
    if (countElement) {
      const currentCount = parseInt(countElement.textContent) || 0;
      countElement.textContent = Math.max(0, currentCount + change);
    }
  }

  // Utility Methods
  validateComment(content) {
    if (!content || content.length < 1) {
      this.showError('Comment cannot be empty');
      return false;
    }

    if (content.length > 1000) {
      this.showError('Comment cannot exceed 1000 characters');
      return false;
    }

    return true;
  }

  formatContent(content) {
    const mentionPattern = /@(\w+)/g;
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(mentionPattern, '<span class="mention">@$1</span>')
      .replace(/\n/g, "<br>");
  }

  applyFormatting(format, textarea) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let formattedText = '';
    
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      default:
        return;
    }

    textarea.value = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    
    const form = textarea.closest('form');
    const charCount = form?.querySelector('.count');
    if (charCount) {
      charCount.textContent = textarea.value.length;
    }
  }

  insertEmoji(emoji, textarea) {
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    textarea.value = textarea.value.substring(0, start) + emoji + textarea.value.substring(end);
    textarea.focus();
    textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    
    const form = textarea.closest('form');
    const charCount = form?.querySelector('.count');
    if (charCount) {
      charCount.textContent = textarea.value.length;
    }
  }

  updateCharacterCount() {
    const textarea = document.getElementById('comment-textarea');
    const countElement = document.querySelector('#character-count-comment-form .count') || 
                        document.querySelector('.character-count .count') ||
                        document.getElementById('character-count');
    
    if (textarea && countElement) {
      const count = textarea.value.length;
      countElement.textContent = count;
      
      if (count > 800) {
        countElement.style.color = 'var(--warning-color)';
      } else if (count >= 1000) {
        countElement.style.color = 'var(--error-color)';
      } else {
        countElement.style.color = 'var(--text-secondary)';
      }
    }
  }

  // Modal methods
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  }

  hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  // Loading states
  showLoading(container) {
    const submitBtn = container.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'not-allowed';
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'flex';
    }
  }

  hideLoading(container) {
    const submitBtn = container.querySelector('.submit-btn');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
      if (btnText) btnText.style.display = 'flex';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  // Notifications
  showError(message) {
    console.error('Comment error:', message);
    
    const notification = document.createElement('div');
    notification.className = 'comment-error-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  showSuccess(message) {
    console.log('Comment success:', message);
    
    const notification = document.createElement('div');
    notification.className = 'comment-success-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  resetForm(form) {
    debugLog('🔄Resetting form...');
    
    const textarea = form.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      textarea.disabled = false;
      
      // Trigger input event to update character count
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
    }
    
    // Reset all form elements
    form.reset();
    
    // Close any open pickers
    this.closeAllEmojiPickers();
    
    console.log('✅ Form reset complete');
  }

  resetFormState(form) {
    debugLog('🔄Resetting form state...');
    
    const textarea = form.querySelector('textarea');
    const charCount = form.querySelector('.character-count .count, .count');
    const submitBtn = form.querySelector('.submit-btn');
    
    if (textarea) {
      textarea.value = '';
      textarea.disabled = false;
      textarea.style.opacity = '1';
    }
    
    if (charCount) {
      charCount.textContent = '0';
      charCount.style.color = 'var(--text-secondary)';
    }
    
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = '1';
      submitBtn.style.cursor = 'pointer';
      
      const btnText = submitBtn.querySelector('.btn-text');
      const btnSpinner = submitBtn.querySelector('.btn-spinner');
      
      if (btnText) btnText.style.display = 'flex';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
    
    this.closeAllEmojiPickers();
    
    console.log('✅ Form state reset complete');
  }

  cancelReply() {
    this.replyingTo = null;
    const replyContext = document.getElementById('reply-context');
    if (replyContext) {
      replyContext.style.display = 'none';
    }
    
    // Close all inline reply forms
    document.querySelectorAll('.inline-reply-container').forEach(container => {
      container.style.display = 'none';
      container.innerHTML = '';
    });
  }

  closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.style.display = 'none';
    });
    document.body.style.overflow = '';
  }

  closeAllInlineForms() {
    document.querySelectorAll('.inline-reply-container, .inline-edit-container').forEach(container => {
      container.style.display = 'none';
      container.innerHTML = '';
    });
  }



  // Add this method after your existing methods in the class
setupMentionSystem() {
  debugLog('🔧 Setting up mention system...');
  
  // Remove any existing mention listeners first
  document.removeEventListener('input', this.mentionInputHandler);
  document.removeEventListener('keydown', this.mentionKeyHandler);
  
  // Create bound handlers to avoid conflicts
  this.mentionInputHandler = (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      debugLog('📝 Mention input detected:', e.target.value);
      this.handleMentionInput(e.target);
    }
  };
  
  this.mentionKeyHandler = (e) => {
    if (e.target.tagName === 'TEXTAREA') {
      this.handleMentionNavigation(e);
    }
  };
  
  // Add the listeners
  document.addEventListener('input', this.mentionInputHandler);
  document.addEventListener('keydown', this.mentionKeyHandler);
  
  // Close mention dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mention-dropdown, textarea')) {
      this.closeMentionDropdown();
    }
  });
  
  console.log('✅ Mention system setup complete');
}

handleMentionInput(textarea) {
  debugLog('🔍 handleMentionInput called with:', {
    value: textarea.value,
    selectionStart: textarea.selectionStart,
    selectionEnd: textarea.selectionEnd
  });
  
  const cursorPosition = textarea.selectionStart;
  const textBeforeCursor = textarea.value.substring(0, cursorPosition);
  
  debugLog('🔍 Text before cursor:', textBeforeCursor);
  
  // Look for @ symbol followed by word characters
  const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
  
  debugLog('🔍 Mention match result:', mentionMatch);
  
  if (mentionMatch) {
    const query = mentionMatch[1]; // The text after @
    const mentionStart = cursorPosition - mentionMatch[0].length; // Position of @
    
    console.log('✅ Mention detected!', { query, mentionStart });
    this.showMentionDropdown(textarea, query, mentionStart);
  } else {
    console.log('❌ No mention pattern found');
    this.closeMentionDropdown();
  }
}

async showMentionDropdown(textarea, query, mentionStart) {
  debugLog('🔍 showMentionDropdown called:', { query, mentionStart });
  
  // Close any existing dropdown
  this.closeMentionDropdown();
  
  // Get mentionable users
  const users = await this.getMentionableUsers(query);
  
  if (!users || users.length === 0) {
    console.log('❌ No users found for query:', query);
    return;
  }
  
  debugLog('✅ Found users:', users);
  
  // Create dropdown
  const dropdown = document.createElement('div');
  dropdown.className = 'mention-dropdown';
  dropdown.style.cssText = `
    position: fixed;
    background: var(--secondary-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 200px;
  `;
  
  // Add users to dropdown
  users.forEach((user, index) => {
    const item = document.createElement('div');
    item.className = 'mention-item';
    item.dataset.username = user.username;
    item.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      ${index === 0 ? 'background: var(--tertiary-bg);' : ''}
    `;
    
    // Get avatar URL
    const avatarUrl = this.getUserAvatar(user);
    
    item.innerHTML = `
      <div class="mention-item-avatar" style="width: 24px; height: 24px; border-radius: 50%; overflow: hidden;">
        <img src="${avatarUrl}" alt="${user.display_name}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
      <div class="mention-item-info">
        <div class="mention-item-name" style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">
          ${user.display_name}
        </div>
        <div class="mention-item-handle" style="font-size: 0.75rem; color: var(--text-secondary);">
          @${user.username}
        </div>
      </div>
    `;
    
    // Add click handler
    item.addEventListener('click', () => {
      this.insertMention(textarea, user.username, mentionStart, query);
    });
    
    // Add hover handler
    item.addEventListener('mouseenter', () => {
      dropdown.querySelectorAll('.mention-item').forEach(i => i.style.background = '');
      item.style.background = 'var(--tertiary-bg)';
      this.selectedMentionIndex = index;
    });
    
    dropdown.appendChild(item);
  });
  
  // Position dropdown
  this.positionMentionDropdown(dropdown, textarea, mentionStart);
  
  // Add to DOM
  document.body.appendChild(dropdown);
  
  // Store references
  this.currentMentionDropdown = dropdown;
  this.currentMentionTextarea = textarea;
  this.currentMentionStart = mentionStart;
  this.selectedMentionIndex = 0;
  
  console.log('✅ Mention dropdown created and positioned');
}

async getMentionableUsers(query = '') {
  try {
    debugLog('🔍 getMentionableUsers called with query:', query);
    
    // Check if user is authenticated
    if (!this.isAuthenticated || !this.currentUser) {
      console.log('❌ User not authenticated');
      return [];
    }
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('API timeout')), 5000);
    });
    
    // Create API call promise
    const apiCall = async () => {
      let queryBuilder = this.supabase
        .from('profiles')
        .select('id, display_name, avatar_type, avatar_preset_id, avatar_url, is_admin, membership_type')
        .eq('environment', this.environment)
        .eq('is_public', true)
        .neq('id', this.currentUser.id)
        .limit(8);

      if (query && query.length > 0) {
        queryBuilder = queryBuilder.ilike('display_name', `%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      // Format for mention dropdown
      return (data || []).map(profile => ({
        id: profile.id,
        username: profile.display_name?.toLowerCase().replace(/\s+/g, '') || 'user',
        display_name: profile.display_name || 'User',
        avatar_type: profile.avatar_type,
        avatar_preset_id: profile.avatar_preset_id,
        avatar_url: profile.avatar_url,
        is_admin: profile.is_admin,
        membership_type: profile.membership_type
      }));
    };
    
    try {
      const result = await Promise.race([apiCall(), timeoutPromise]);
      console.log('✅ API success:', result);
      return result;
    } catch (apiError) {
      console.log('⚠️ API failed, using fallback data:', apiError.message);
      
      // Fallback mock data for testing
      const mockUsers = [
        { 
          id: 'bb06d43f-279c-478c-b97f-afe8583c460d', 
          username: 'eiza', 
          display_name: 'Eiza', 
          avatar_type: 'preset', 
          avatar_preset_id: 1 
        },
        { 
          id: 'test-user-1', 
          username: 'john', 
          display_name: 'John Doe', 
          avatar_type: 'preset', 
          avatar_preset_id: 2 
        }
      ];
      
      // Filter mock data based on query
      return query 
        ? mockUsers.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.display_name.toLowerCase().includes(query.toLowerCase())
          )
        : mockUsers;
    }
    
  } catch (error) {
    console.error('❌ Error in getMentionableUsers:', error);
    return [];
  }
}

positionMentionDropdown(dropdown, textarea, mentionStart) {
  // Create a temporary span to measure text position
  const textMetrics = this.getTextPosition(textarea, mentionStart);
  const textareaRect = textarea.getBoundingClientRect();
  
  let left = textareaRect.left + textMetrics.left;
  let top = textareaRect.top + textMetrics.top + 20; // 20px below the text
  
  // Adjust if dropdown would go off screen
  if (left + 200 > window.innerWidth) {
    left = window.innerWidth - 220;
  }
  
  if (top + 200 > window.innerHeight) {
    top = textareaRect.top + textMetrics.top - 200; // Above the text
  }
  
  dropdown.style.left = `${left}px`;
  dropdown.style.top = `${top}px`;
}

getTextPosition(textarea, position) {
  // Create a mirror div to measure text position
  const mirror = document.createElement('div');
  const computedStyle = window.getComputedStyle(textarea);
  
  // Copy textarea styles to mirror
  ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 
   'padding', 'border', 'boxSizing', 'whiteSpace', 'wordWrap'].forEach(prop => {
    mirror.style[prop] = computedStyle[prop];
  });
  
  mirror.style.cssText += `
    position: absolute;
    visibility: hidden;
    height: auto;
    width: ${textarea.clientWidth}px;
    top: -9999px;
    white-space: pre-wrap;
    word-wrap: break-word;
  `;
  
  // Add text up to cursor position
  const textBeforeCursor = textarea.value.substring(0, position);
  mirror.textContent = textBeforeCursor;
  
  // Add a span at cursor position
  const cursorSpan = document.createElement('span');
  cursorSpan.textContent = '|';
  mirror.appendChild(cursorSpan);
  
  document.body.appendChild(mirror);
  
  const rect = cursorSpan.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  
  const position_result = {
    left: rect.left - mirrorRect.left,
    top: rect.top - mirrorRect.top
  };
  
  document.body.removeChild(mirror);
  
  return position_result;
}

handleMentionNavigation(e) {
  if (!this.currentMentionDropdown) return;
  
  const items = this.currentMentionDropdown.querySelectorAll('.mention-item');
  
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    this.selectedMentionIndex = Math.min(this.selectedMentionIndex + 1, items.length - 1);
    this.updateMentionSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    this.selectedMentionIndex = Math.max(this.selectedMentionIndex - 1, 0);
    this.updateMentionSelection(items);
  } else if (e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    const selectedItem = items[this.selectedMentionIndex];
    if (selectedItem) {
      const username = selectedItem.dataset.username;
      const query = this.getCurrentMentionQuery();
      this.insertMention(this.currentMentionTextarea, username, this.currentMentionStart, query);
    }
  } else if (e.key === 'Escape') {
    this.closeMentionDropdown();
  }
}

updateMentionSelection(items) {
  items.forEach((item, index) => {
    item.style.backgroundColor = index === this.selectedMentionIndex ? 'var(--hover-bg)' : '';
  });
}

getCurrentMentionQuery() {
  if (!this.currentMentionTextarea) return '';
  
  const cursorPosition = this.currentMentionTextarea.selectionStart;
  const textBeforeCursor = this.currentMentionTextarea.value.substring(0, cursorPosition);
  const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
  
  return mentionMatch ? mentionMatch[1] : '';
}

insertMention(textarea, username, mentionStart, query) {
  const currentValue = textarea.value;
  const mentionText = `@${username} `;
  
  // Replace the @query with @username
  const beforeMention = currentValue.substring(0, mentionStart);
  const afterMention = currentValue.substring(mentionStart + 1 + query.length);
  
  textarea.value = beforeMention + mentionText + afterMention;
  
  // Set cursor after the mention
  const newCursorPosition = mentionStart + mentionText.length;
  textarea.setSelectionRange(newCursorPosition, newCursorPosition);
  
  // Update character count
  const form = textarea.closest('form');
  const charCount = form?.querySelector('.count');
  if (charCount) {
    charCount.textContent = textarea.value.length;
  }
  
  this.closeMentionDropdown();
  textarea.focus();
}

closeMentionDropdown() {
  if (this.currentMentionDropdown) {
    this.currentMentionDropdown.remove();
    this.currentMentionDropdown = null;
    this.currentMentionTextarea = null;
    this.currentMentionStart = -1;
    this.selectedMentionIndex = 0;
  }
}

  // Mock function - replace with actual API call
  async getMentionableUsers(query) {
    try {
      debugLog('🔍 getMentionableUsers called with query:', query);
      
      // Try API first with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API timeout')), 3000);
      });
      
      const apiPromise = this.TinkByteAPI.getMentionableUsers(query);
      
      try {
        const result = await Promise.race([apiPromise, timeoutPromise]);
        
        if (result.success && result.data) {
          console.log('✅ API success:', result.data);
          return result.data;
        }
      } catch (apiError) {
        console.log('⚠️ API failed, using fallback data:', apiError.message);
      }
      
      // Fallback mock data for testing
      const mockUsers = [
        { 
          id: 'bb06d43f-279c-478c-b97f-afe8583c460d', 
          username: 'eiza', 
          display_name: 'Eiza', 
          avatar_type: 'preset', 
          avatar_preset_id: 1 
        },
        { 
          id: 'test-user-1', 
          username: 'john', 
          display_name: 'John Doe', 
          avatar_type: 'preset', 
          avatar_preset_id: 2 
        },
        { 
          id: 'test-user-2', 
          username: 'jane', 
          display_name: 'Jane Smith', 
          avatar_type: 'preset', 
          avatar_preset_id: 3 
        }
      ];
      
      // Filter mock data based on query
      const filteredUsers = query 
        ? mockUsers.filter(user => 
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.display_name.toLowerCase().includes(query.toLowerCase())
          )
        : mockUsers;
      
      debugLog('🔄Using mock data:', filteredUsers);
      return filteredUsers;
      
    } catch (error) {
      console.error('❌ Error in getMentionableUsers:', error);
      return [];
    }
  }

    // Optimized draft management with auth check
    async saveDraft() {
      await this.ensureAuth();
      
      if (!this.isAuthenticated || !this.currentUser) return;
      
      const textarea = document.getElementById('comment-textarea');
      if (!textarea) return;
      
      const content = textarea.value.trim();
      if (!content) return;
      
      clearTimeout(this.draftTimeout);
      this.draftTimeout = setTimeout(async () => {
        try {
          await this.TinkByteAPI.saveCommentDraft(this.articleId, content);
          console.log('Draft saved');
        } catch (error) {
          console.error('Draft save error:', error);
        }
      }, 2000);
    }

    async loadDrafts() {
      if (!this.isAuthenticated) return;
      
      try {
        const result = await this.TinkByteAPI.getCommentDraft(this.articleId);
        
        if (result.success && result.data?.content) {
          const textarea = document.getElementById('comment-textarea');
          if (textarea) {
            textarea.value = result.data.content;
            this.updateCharacterCount();
          }
        }
      } catch (error) {
        console.error('Draft load error:', error);
      }
    }

    clearDraft() {
      if (!this.isAuthenticated) return;
      
      setTimeout(async () => {
        try {
          await this.TinkByteAPI.saveCommentDraft(this.articleId, '');
          console.log('Draft cleared');
        } catch (error) {
          console.error('Draft clear error:', error);
        }
      }, 500);
    }

    // Sorting and pagination
    async sortComments(sortBy) {
      this.currentSort = sortBy;
      const url = new URL(window.location);
      url.searchParams.set('sort', sortBy);
      window.location.href = url.toString();
    }

async loadMoreComments() {
  if (this.isLoadingMore) {
    console.log('⚠️ Already loading more comments');
    return;
  }

  if (this.loadedComments >= this.totalComments) {
    console.log('✅ All comments already loaded');
    this.updateLoadMoreUI();
    return;
  }

  this.isLoadingMore = true;
  const loadMoreBtn = document.getElementById('load-more-btn');
  
  console.log(`🔄 Loading more comments: showing ${this.loadedComments + this.commentsPerPage} of ${this.totalComments}`);

  this.showLoadMoreLoading(loadMoreBtn);

  try {
    // **NEW: Get cached comments from data attribute**
    const commentSection = document.getElementById('comments-section');
    const allCommentsData = commentSection?.dataset.allComments;
    
    if (allCommentsData) {
      const allComments = JSON.parse(allCommentsData);
      console.log('📋 Using cached comments:', allComments.length);
      
      // Get the next batch of comments
      const startIndex = this.loadedComments;
      const endIndex = startIndex + this.commentsPerPage;
      const nextComments = allComments.slice(startIndex, endIndex);
      
      console.log(`📄 Loading comments ${startIndex} to ${endIndex - 1}:`, nextComments.length);
      
      if (nextComments.length > 0) {
        // Add to UI
        this.addCommentsToUI(nextComments);
        
        // Update state
        this.loadedComments += nextComments.length;
        console.log(`📊 Updated state: loaded=${this.loadedComments}, total=${this.totalComments}`);
      } else {
        console.log('ℹ️ No more comments to show');
        this.loadedComments = this.totalComments;
      }
    }

    this.updateLoadMoreUI();

  } catch (error) {
    console.error('❌ Error loading more comments:', error);
    this.showError('Failed to load more comments. Please try again.');
  } finally {
    this.isLoadingMore = false;
    this.hideLoadMoreLoading(loadMoreBtn);
  }
}

// **ADD: Fallback method to manually add comments**
manuallyAddComments(commentTree) {
  console.log('🔧 Using manual comment addition fallback');
  
  const container = document.getElementById('comments-items');
  if (!container) {
    console.error('❌ No comments container found');
    return;
  }

  commentTree.forEach((comment, index) => {
    console.log(`🔧 Manually adding comment ${index + 1}:`, comment.id);
    
    // Create a simple comment element
    const wrapper = document.createElement('div');
    wrapper.className = 'comment-wrapper fade-in-new';
    wrapper.dataset.commentId = comment.id;
    
    const displayName = comment.profiles?.display_name || 'Anonymous';
    const avatarUrl = this.getUserAvatar(comment.profiles);
    const formattedContent = this.formatContent(comment.content);
    
    wrapper.innerHTML = `
      <div class="comment-card" 
           data-comment-id="${comment.id}" 
           data-user-id="${comment.user_id}" 
           data-created-at="${comment.created_at}">
        
        <div class="comment-header">
          <div class="comment-user-info">
            <div class="comment-avatar">
              <img src="${avatarUrl}" alt="${displayName}" loading="lazy" />
            </div>
            <div class="comment-meta">
              <div class="user-details">
                <span class="username">${displayName}</span>
              </div>
              <div class="comment-time-wrapper">
                <span class="comment-time">${this.formatDate(comment.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="comment-content">
          <div class="comment-text">${formattedContent}</div>
        </div>

        <div class="comment-footer">
          <div class="vote-section">
            <button class="vote-btn upvote-btn" data-comment-id="${comment.id}">👍</button>
            <span class="vote-count">${comment.like_count || 0}</span>
          </div>
          
          <div class="comment-actions">
            <button class="action-btn reply-btn" data-comment-id="${comment.id}" data-author="${displayName}">Reply</button>
          </div>
        </div>
      </div>
    `;
    
    container.appendChild(wrapper);
    console.log(`✅ Manually added comment ${comment.id}`);
    
    // Update permissions
    setTimeout(() => {
      this.updateCommentPermissions(comment.id);
    }, 100);
  });
}

    // **NEW: Helper methods for load more UI**
    showLoadMoreLoading(btn) {
      if (!btn) return;
      btn.disabled = true;
      const btnText = btn.querySelector('.btn-text');
      const btnSpinner = btn.querySelector('.btn-spinner');
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'flex';
    }

    hideLoadMoreLoading(btn) {
      if (!btn) return;
      btn.disabled = false;
      const btnText = btn.querySelector('.btn-text');
      const btnSpinner = btn.querySelector('.btn-spinner');
      if (btnText) btnText.style.display = 'flex';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }

    // **NEW: Add multiple comments to UI**
  addCommentsToUI(commentTree) {
    const commentsContainer = document.getElementById('comments-items');
    if (!commentsContainer) {
      console.error('❌ Comments container not found');
      return;
    }

    console.log(`📝 Adding ${commentTree.length} comment trees to UI`);

    commentTree.forEach((comment, index) => {
      console.log(`📝 Processing comment ${index + 1}:`, comment.id);
      
      // **FIXED: Use the existing method that works**
      const commentElement = this.createCommentElementFromData(comment);
      
      if (commentElement) {
        // Add fade-in animation
        commentElement.classList.add('fade-in-new');
        
        // Append to container
        commentsContainer.appendChild(commentElement);
        console.log(`✅ Added comment ${comment.id} to DOM`);
        
        // Update permissions after a short delay
        setTimeout(() => {
          this.updateCommentPermissions(comment.id);
          
          // Also update permissions for replies
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
              this.updateCommentPermissions(reply.id);
            });
          }
        }, 100);
      } else {
        console.error(`❌ Failed to create element for comment: ${comment.id}`);
      }
    });

    console.log('✅ Comments added to UI successfully');
  }

  // **NEW: Add this method to create comment elements properly**
  createCommentElementFromData(comment) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comment-wrapper';
    wrapper.dataset.commentId = comment.id;
    
    const threadLevel = Math.min(comment.thread_level || 0, 4);
    const avatarUrl = this.getUserAvatar(comment.profiles);
    const formattedContent = this.formatContent(comment.content);
    const displayName = comment.profiles?.display_name || 'Anonymous';
    const isAdmin = comment.profiles?.is_admin || false;
    
    wrapper.innerHTML = `
      <div class="comment-card" 
          data-comment-id="${comment.id}" 
          data-user-id="${comment.user_id}" 
          data-created-at="${comment.created_at}" 
          data-thread-level="${threadLevel}">
        
        <div class="comment-header">
          <div class="comment-user-info">
            <div class="comment-avatar">
              <img src="${avatarUrl}" alt="${displayName}" loading="lazy" />
              ${isAdmin ? '<div class="admin-badge">👑</div>' : ''}
            </div>
            <div class="comment-meta">
              <div class="user-details">
                <span class="username ${isAdmin ? 'admin' : ''}">${displayName}</span>
                ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
              </div>
              <div class="comment-time-wrapper">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span class="comment-time" title="${new Date(comment.created_at).toLocaleString()}">
                  ${this.formatDate(comment.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div class="comment-actions-menu">
            <button class="menu-btn" data-comment-id="${comment.id}" title="More options" aria-label="Comment options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            <div class="dropdown-menu" id="dropdown-${comment.id}">
              <button class="dropdown-item edit-comment-btn" data-comment-id="${comment.id}" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit
              </button>
              <button class="dropdown-item delete-comment-btn" data-comment-id="${comment.id}" style="display: none;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete
              </button>
              <button class="dropdown-item report-btn" data-comment-id="${comment.id}" style="display: flex;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                  <line x1="4" y1="22" x2="4" y2="15"></line>
                </svg>
                Report
              </button>
            </div>
          </div>
        </div>

        <div class="comment-content">
          <div class="comment-text">${formattedContent}</div>
        </div>

        <div class="comment-footer">
          <div class="vote-section">
            <button class="vote-btn upvote-btn" data-comment-id="${comment.id}" data-action="upvote" title="Upvote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 14l5-5 5 5"></path>
              </svg>
            </button>
            <span class="vote-count" id="vote-count-${comment.id}">${comment.like_count || 0}</span>
            <button class="vote-btn downvote-btn" data-comment-id="${comment.id}" data-action="downvote" title="Downvote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 10l-5 5-5-5"></path>
              </svg>
            </button>
          </div>
          
          <div class="comment-reactions">
            <button class="reaction-btn" data-reaction="like" data-comment-id="${comment.id}" title="Like">
              <span class="reaction-emoji">👍</span>
              <span class="reaction-count" id="reaction-like-${comment.id}">0</span>
            </button>
            <button class="reaction-btn" data-reaction="love" data-comment-id="${comment.id}" title="Love">
              <span class="reaction-emoji">❤️</span>
              <span class="reaction-count" id="reaction-love-${comment.id}">0</span>
            </button>
          </div>

          <div class="comment-actions">
            <button class="action-btn reply-btn" data-comment-id="${comment.id}" data-author="${displayName}" title="Reply">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9,17 4,12 9,7"></polyline>
                <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
              </svg>
              Reply
            </button>
            <button class="action-btn copy-btn" data-comment-id="${comment.id}" title="Copy">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
        </div>

        <div class="inline-reply-container" data-comment-id="${comment.id}" style="display: none;"></div>
        <div class="inline-edit-container" data-comment-id="${comment.id}" style="display: none;"></div>
      </div>
    `;

    // Add replies if they exist
    if (comment.replies && comment.replies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'replies-container comment-replies';
      
      // Show first 3 replies
      const visibleReplies = comment.replies.slice(0, 3);
      visibleReplies.forEach(reply => {
        const replyElement = this.createReplyElementFromData(reply);
        if (replyElement) {
          repliesContainer.appendChild(replyElement);
        }
      });
      
      wrapper.appendChild(repliesContainer);
      
      // Add "show more replies" button if needed
      if (comment.replies.length > 3) {
        const loadMoreReplies = document.createElement('div');
        loadMoreReplies.className = 'load-more-replies';
        loadMoreReplies.innerHTML = `
          <button class="load-more-replies-btn" 
                  data-comment-id="${comment.id}" 
                  data-loaded="3" 
                  data-total="${comment.replies.length}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
            Show ${comment.replies.length - 3} more replies
          </button>
        `;
        wrapper.appendChild(loadMoreReplies);
      }
    }
    
    return wrapper;
  }

  // **NEW: Helper method for creating reply elements**
  createReplyElementFromData(reply) {
    const wrapper = document.createElement('div');
    wrapper.className = 'comment-wrapper reply-wrapper';
    wrapper.dataset.commentId = reply.id;
    
    const avatarUrl = this.getUserAvatar(reply.profiles);
    const formattedContent = this.formatContent(reply.content);
    const displayName = reply.profiles?.display_name || 'Anonymous';
    const isAdmin = reply.profiles?.is_admin || false;
    
    wrapper.innerHTML = `
      <div class="comment-card reply-card" 
          data-comment-id="${reply.id}" 
          data-user-id="${reply.user_id}" 
          data-created-at="${reply.created_at}">
        <div class="reply-connector"></div>
        
        <div class="comment-header">
          <div class="comment-user-info">
            <div class="comment-avatar">
              <img src="${avatarUrl}" alt="${displayName}" loading="lazy" />
              ${isAdmin ? '<div class="admin-badge">👑</div>' : ''}
            </div>
            <div class="comment-meta">
              <div class="user-details">
                <span class="username ${isAdmin ? 'admin' : ''}">${displayName}</span>
              </div>
              <div class="comment-time-wrapper">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span class="comment-time">${this.formatDate(reply.created_at)}</span>
              </div>
            </div>
          </div>
          
          <div class="comment-actions-menu">
            <button class="menu-btn" data-comment-id="${reply.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
            <div class="dropdown-menu" id="dropdown-${reply.id}">
              <button class="dropdown-item edit-comment-btn" data-comment-id="${reply.id}" style="display: none;">Edit</button>
              <button class="dropdown-item delete-comment-btn" data-comment-id="${reply.id}" style="display: none;">Delete</button>
              <button class="dropdown-item report-btn" data-comment-id="${reply.id}" style="display: flex;">Report</button>
            </div>
          </div>
        </div>

        <div class="comment-content">
          <div class="comment-text">${formattedContent}</div>
        </div>

        <div class="comment-footer">
          <div class="vote-section">
            <button class="vote-btn upvote-btn" data-comment-id="${reply.id}" data-action="upvote">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M7 14l5-5 5 5"></path>
              </svg>
            </button>
            <span class="vote-count">${reply.like_count || 0}</span>
          </div>
          
          <div class="comment-actions">
            <button class="action-btn reply-btn" data-comment-id="${reply.id}" data-author="${displayName}">Reply</button>
            <button class="action-btn copy-btn" data-comment-id="${reply.id}">Copy</button>
          </div>
        </div>

        <div class="inline-reply-container" data-comment-id="${reply.id}" style="display: none;"></div>
        <div class="inline-edit-container" data-comment-id="${reply.id}" style="display: none;"></div>
      </div>
    `;
    
    return wrapper;
  }

// Add this method temporarily for debugging
async debugCommentCounts() {
  console.log('🔍 DEBUG: Checking actual comment counts in database...');
  
  try {
    // Check total root comments
    const { count: totalRoot, error: countError } = await this.supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('article_id', this.articleId)
      .eq('environment', this.environment)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'auto_approved'])
      .is('parent_id', null);

    console.log('📊 Total root comments in DB:', totalRoot);

    // Check what comments exist
    const { data: allComments, error: allError } = await this.supabase
      .from('comments')
      .select('id, content, parent_id, created_at')
      .eq('article_id', this.articleId)
      .eq('environment', this.environment)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'auto_approved'])
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    console.log('📋 All root comments:', allComments);
    console.log('📋 Comment IDs:', allComments?.map(c => c.id));

    // Test the exact query that's failing
    const { data: rangeTest, error: rangeError } = await this.supabase
      .from('comments')
      .select('id, content, created_at')
      .eq('article_id', this.articleId)
      .eq('environment', this.environment)
      .eq('is_deleted', false)
      .in('moderation_status', ['approved', 'auto_approved'])
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range(5, 9);

    console.log('🎯 Range query (5-9) result:', rangeTest);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Add these helper methods
buildCommentTreeWithReplies(rootComments, replies) {
  const commentMap = new Map();
  
  // Add root comments
  rootComments.forEach(comment => {
    comment.replies = [];
    commentMap.set(comment.id, comment);
  });
  
  // Add replies to their parents
  replies.forEach(reply => {
    const parent = commentMap.get(reply.parent_id);
    if (parent) {
      parent.replies.push(reply);
    }
  });
  
  return rootComments;
}

  createCommentElementWithReplies(comment) {
  const wrapper = this.createCommentElement(comment);
  
  // Add replies if they exist
  if (comment.replies && comment.replies.length > 0) {
    const repliesContainer = wrapper.querySelector('.replies-container');
    if (repliesContainer) {
      comment.replies.forEach(reply => {
        const replyElement = this.createReplyElement(reply);
        repliesContainer.appendChild(replyElement);
      });
      
      // Add load more replies button if there are more than 3
      if (comment.replies.length >= 3) {
        const loadMoreReplies = document.createElement('div');
        loadMoreReplies.className = 'load-more-replies';
        loadMoreReplies.innerHTML = `
          <button class="load-more-replies-btn" data-comment-id="${comment.id}" data-loaded="3" data-total="${comment.replies.length}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
            Show more replies
          </button>
        `;
        wrapper.appendChild(loadMoreReplies);
      }
    }
  }
  
  return wrapper;
  }

  async loadMoreReplies(commentId, currentlyLoaded) {
    try {
      debugLog(`🔄 Loading more replies for comment: ${commentId}`);
      
      const { data: replies, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          profiles!inner(
            id,
            display_name,
            avatar_type,
            avatar_preset_id,
            avatar_url,
            reputation_score,
            is_admin,
            membership_type
          ),
          comment_reactions(*),
          comment_likes(*),
          comment_bookmarks(*)
        `)
        .eq('parent_id', commentId)
        .eq('environment', this.environment)
        .eq('is_deleted', false)
        .in('moderation_status', ['approved', 'auto_approved'])
        .order('created_at', { ascending: true })
        .range(currentlyLoaded, currentlyLoaded + 4); // Load 5 more
      
      if (error) throw error;
      
      if (replies && replies.length > 0) {
        // Find the parent comment wrapper
        const parentWrapper = document.querySelector(`[data-comment-id="${commentId}"]`)?.closest('.comment-wrapper');
        const repliesContainer = parentWrapper?.querySelector('.replies-container') || 
                                parentWrapper?.querySelector('.comment-replies');
        
        if (repliesContainer) {
          // Add new replies
          replies.forEach(reply => {
            const replyElement = this.createReplyElement(reply);
            replyElement.classList.add('new-loaded');
            repliesContainer.appendChild(replyElement);
          });
          
          // Update the load more button
          const loadMoreBtn = parentWrapper?.querySelector('.load-more-replies-btn');
          if (loadMoreBtn) {
            const newLoaded = currentlyLoaded + replies.length;
            const totalReplies = parseInt(loadMoreBtn.dataset.total || '0');
            
            loadMoreBtn.dataset.loaded = newLoaded.toString();
            
            if (newLoaded >= totalReplies) {
              // Remove the load more button
              const loadMoreContainer = loadMoreBtn.closest('.load-more-replies');
              if (loadMoreContainer) {
                loadMoreContainer.remove();
              }
            } else {
              // Update button text
              const remaining = totalReplies - newLoaded;
              loadMoreBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
                Show ${remaining} more replies
              `;
            }
          }
        }
        
        console.log(`✅ Loaded ${replies.length} more replies`);
      }
      
    } catch (error) {
      console.error('❌ Error loading more replies:', error);
      this.showError('Failed to load more replies. Please try again.');
    }
  }


}


// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.comment-actions-menu')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

console.log('TinkByte Comments script loaded successfully');