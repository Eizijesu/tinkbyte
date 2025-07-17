// src/scripts/comments.js - Pure Client-Side Version
import { supabase, TinkByteAPI, AuthState } from '../lib/supabase.js';

class TinkByteCommentSystem {
  constructor() {
    this.authState = AuthState.getInstance();
    this.currentUser = null;
    this.profile = null;
    this.articleId = null;
    this.isAuthenticated = false;
    this.replyingTo = null;
    this.editingComment = null;
    this.currentSort = 'newest';
    this.currentPage = 1;
    this.hasMoreComments = false;
    this.draftTimeout = null;
    
    this.init();
  }

  async init() {
    const commentSection = document.getElementById('comments-section');
    if (!commentSection) return;
    
    this.articleId = commentSection.dataset.articleId;
    
    // Initialize auth state first
    await this.authState.initialize();
    await this.checkAuth();
    
    this.initializeUI();
    this.setupEventListeners();
    this.setupModalHandlers();
    this.setupInlineHandlers();
    
    if (this.isAuthenticated) {
      await this.loadDrafts();
    }
  }

  async checkAuth() {
    try {
      this.currentUser = this.authState.getUser();
      this.profile = this.authState.getProfile();
      this.isAuthenticated = !!this.currentUser;
      
      if (this.isAuthenticated) {
        this.showUserForm();
        console.log('✅ User authenticated:', this.currentUser.email);
      } else {
        console.log('❌ No user session found');
        this.showGuestPrompt();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      this.showGuestPrompt();
    }
  }

  initializeUI() {
    if (this.isAuthenticated) {
      this.updateUserInfo();
      this.showUserForm();
      this.updateCommentPermissions();
    } else {
      this.showGuestPrompt();
    }
  }

  showGuestPrompt() {
    const guestPrompt = document.getElementById('guest-comment-prompt');
    const userForm = document.getElementById('user-comment-form');
    
    if (guestPrompt) guestPrompt.style.display = 'flex';
    if (userForm) userForm.style.display = 'none';
  }

  showUserForm() {
    const guestPrompt = document.getElementById('guest-comment-prompt');
    const userForm = document.getElementById('user-comment-form');
    
    if (guestPrompt) guestPrompt.style.display = 'none';
    if (userForm) userForm.style.display = 'block';
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

  updateCommentPermissions() {
    if (!this.currentUser) return;

    document.querySelectorAll('.comment-card').forEach(card => {
      const userId = card.dataset.userId;
      const isOwner = userId === this.currentUser.id;
      
      const editBtn = card.querySelector('.edit-comment-btn');
      const deleteBtn = card.querySelector('.delete-comment-btn');
      
      if (editBtn) editBtn.style.display = isOwner ? 'flex' : 'none';
      if (deleteBtn) deleteBtn.style.display = isOwner ? 'flex' : 'none';
    });
  }

  getUserAvatar(profile) {
    if (profile.avatar_type === 'google' && profile.avatar_url) {
      return profile.avatar_url;
    }
    if (profile.avatar_type === 'uploaded' && profile.avatar_url) {
      return profile.avatar_url;
    }
    const presetId = profile.avatar_preset_id || 1;
    return `/images/avatars/preset-${presetId}.svg`;
  }

  setupEventListeners() {
    // Main comment form
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
      commentForm.addEventListener('submit', this.handleCommentSubmit.bind(this));
    }

    // Character count and drafts
    const textarea = document.getElementById('comment-textarea');
    if (textarea) {
      textarea.addEventListener('input', this.updateCharacterCount.bind(this));
      textarea.addEventListener('input', this.saveDraft.bind(this));
    }

    // Formatting and emoji
    this.setupFormattingButtons();
    this.setupEmojiPicker();
    this.setupCommentActions();
    this.setupSorting();
    this.setupLoadMore();

    // Cancel reply
    const cancelReplyBtn = document.getElementById('cancel-reply');
    if (cancelReplyBtn) {
      cancelReplyBtn.addEventListener('click', this.cancelReply.bind(this));
    }

    // Account management
    const accountBtn = document.getElementById('tinkbyte-account-btn');
    if (accountBtn) {
      accountBtn.addEventListener('click', () => {
        window.location.href = '/auth/signin';
      });
    }
  }

  setupModalHandlers() {
    // Delete modal handlers
    const closeDeleteModal = document.getElementById('close-delete-modal');
    const cancelDelete = document.getElementById('cancel-delete');
    const confirmDelete = document.getElementById('confirm-delete');

    if (closeDeleteModal) {
      closeDeleteModal.addEventListener('click', () => this.hideModal('delete-modal'));
    }
    
    if (cancelDelete) {
      cancelDelete.addEventListener('click', () => this.hideModal('delete-modal'));
    }
    
    if (confirmDelete) {
      confirmDelete.addEventListener('click', this.confirmDelete.bind(this));
    }

    // Report modal handlers
    const closeReportModal = document.getElementById('close-report-modal');
    const cancelReport = document.getElementById('cancel-report');
    const confirmReport = document.getElementById('confirm-report');

    if (closeReportModal) {
      closeReportModal.addEventListener('click', () => this.hideModal('report-modal'));
    }
    
    if (cancelReport) {
      cancelReport.addEventListener('click', () => this.hideModal('report-modal'));
    }
    
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
    // Inline reply handlers
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-inline-reply')) {
        const container = e.target.closest('.inline-reply-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
        }
      }
    });

    // Inline edit handlers
    document.addEventListener('click', (e) => {
      if (e.target.closest('.cancel-edit-inline')) {
        const container = e.target.closest('.inline-edit-container');
        if (container) {
          container.style.display = 'none';
          container.innerHTML = '';
        }
      }
    });

    // Inline form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.classList.contains('inline-comment-form')) {
        e.preventDefault();
        this.handleInlineReply(e.target);
      }
      
      if (e.target.classList.contains('edit-comment-form-inline')) {
        e.preventDefault();
        this.handleInlineEdit(e.target);
      }
    });
  }

  setupFormattingButtons() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.format-btn, .inline-format-btn, .edit-format-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.format-btn, .inline-format-btn, .edit-format-btn');
        const format = btn.dataset.format;
        const form = btn.closest('form');
        const textarea = form.querySelector('textarea');
        this.applyFormatting(format, textarea);
      }
    });
  }

  setupEmojiPicker() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.emoji-btn, .inline-emoji-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.emoji-btn, .inline-emoji-btn');
        const form = btn.closest('form') || btn.closest('.comment-form-container');
        const picker = form.querySelector('.emoji-picker, .inline-emoji-picker');
        
        if (picker) {
          picker.classList.toggle('show');
        }
      }

      if (e.target.closest('.emoji-option')) {
        e.preventDefault();
        const option = e.target.closest('.emoji-option');
        const emoji = option.dataset.emoji;
        const form = option.closest('form') || option.closest('.comment-form-container');
        const textarea = form.querySelector('textarea');
        this.insertEmoji(emoji, textarea);
        
        const picker = form.querySelector('.emoji-picker, .inline-emoji-picker');
        if (picker) {
          picker.classList.remove('show');
        }
      }
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.emoji-picker, .inline-emoji-picker, .emoji-btn, .inline-emoji-btn')) {
        document.querySelectorAll('.emoji-picker.show, .inline-emoji-picker.show').forEach(picker => {
          picker.classList.remove('show');
        });
      }
    });
  }

  setupCommentActions() {
    document.addEventListener('click', (e) => {
      // Reply buttons
      if (e.target.closest('.reply-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.reply-btn');
        const commentId = btn.dataset.commentId;
        const author = btn.dataset.author;
        this.handleInlineReplySetup(commentId, author);
      }

      // Vote buttons (like/unlike)
      if (e.target.closest('.vote-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.vote-btn');
        const commentId = btn.dataset.commentId;
        this.handleVote(commentId);
      }

      // Bookmark buttons
      if (e.target.closest('.bookmark-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.bookmark-btn');
        const commentId = btn.dataset.commentId;
        this.handleBookmark(commentId);
      }

      // Copy buttons
      if (e.target.closest('.copy-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.copy-btn');
        const commentId = btn.dataset.commentId;
        this.handleCopy(commentId);
      }

      // Menu buttons
      if (e.target.closest('.menu-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.menu-btn');
        const commentId = btn.dataset.commentId;
        this.toggleDropdown(commentId);
      }

      // Edit buttons
      if (e.target.closest('.edit-comment-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.edit-comment-btn');
        const commentId = btn.dataset.commentId;
        this.handleInlineEditSetup(commentId);
      }

      // Delete buttons
      if (e.target.closest('.delete-comment-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.delete-comment-btn');
        const commentId = btn.dataset.commentId;
        this.handleDeleteSetup(commentId);
      }

      // Report buttons
      if (e.target.closest('.report-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.report-btn');
        const commentId = btn.dataset.commentId;
        this.handleReportSetup(commentId);
      }
    });
  }

  setupSorting() {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortComments(this.currentSort);
      });
    }
  }

  setupLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', this.loadMoreComments.bind(this));
    }
  }

  // Comment submission using TinkByteAPI
  async handleCommentSubmit(e) {
    e.preventDefault();
    
    if (!this.isAuthenticated) {
      this.showError('Please sign in to comment');
      return;
    }

    const form = e.target;
    const formData = new FormData(form);
    const content = formData.get('content').trim();

    if (!this.validateComment(content)) return;

    this.showLoading(form);

    try {
      const result = await TinkByteAPI.addComment(
        this.articleId, 
        content, 
        this.replyingTo?.id || null
      );

      if (result.success) {
        this.showSuccess('Comment posted successfully!');
        this.resetForm(form);
        this.addCommentToUI(result.data);
        this.clearDraft();
        this.updateCommentCount(1);
        
        if (this.replyingTo) {
          this.cancelReply();
        }
      } else {
        this.showError(result.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(form);
    }
  }

  // Inline reply setup
  async handleInlineReplySetup(commentId, author) {
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

  // Inline reply submission using TinkByteAPI
  async handleInlineReply(form) {
    if (!this.isAuthenticated) return;

    const formData = new FormData(form);
    const content = formData.get('content').trim();
    const commentId = form.dataset.commentId;

    if (!this.validateComment(content)) return;

    this.showLoading(form);

    try {
      const result = await TinkByteAPI.addComment(
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

  // Inline edit setup
  async handleInlineEditSetup(commentId) {
    if (!this.isAuthenticated) return;

    const container = document.querySelector(`[data-comment-id="${commentId}"] .inline-edit-container`);
    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
    
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

  // Inline edit submission using TinkByteAPI
  async handleInlineEdit(form) {
    if (!this.isAuthenticated) return;

    const formData = new FormData(form);
    const content = formData.get('content').trim();
    const editReason = formData.get('edit_reason');
    const commentId = form.dataset.commentId;

    if (!this.validateComment(content)) return;

    this.showLoading(form);

    try {
      const result = await TinkByteAPI.updateComment(commentId, content, editReason);

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

  // Vote handling using TinkByteAPI
  async handleVote(commentId) {
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      const result = await TinkByteAPI.toggleCommentLike(commentId);
      
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

  // Bookmark handling
  async handleBookmark(commentId) {
    if (!this.isAuthenticated) {
      window.location.href = '/auth/signin';
      return;
    }

    try {
      // You can implement this in TinkByteAPI if needed
      this.showSuccess('Bookmark feature coming soon!');
    } catch (error) {
      console.error('Bookmark error:', error);
      this.showError('Network error. Please try again.');
    }
  }

  // Copy handling
  async handleCopy(commentId) {
    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
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

    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
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

  // Delete confirmation using TinkByteAPI
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
      const result = await TinkByteAPI.deleteComment(commentId);

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
      // You can implement this in TinkByteAPI if needed
      this.showSuccess('Comment reported successfully!');
      this.hideModal('report-modal');
    } catch (error) {
      console.error('Report error:', error);
      this.showError('Network error. Please try again.');
    } finally {
      this.hideLoading(confirmBtn.closest('.modal-actions'));
    }
  }

  // UI Update Methods
  updateVoteUI(commentId, voteData) {
    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentCard) return;

    const voteBtn = commentCard.querySelector('.vote-btn');
    const voteCount = commentCard.querySelector('.vote-count');

    if (voteBtn) {
      voteBtn.classList.toggle('active', voteData.liked);
    }

    if (voteCount) {
      // You'll need to get the actual count from your API response
      const currentCount = parseInt(voteCount.textContent) || 0;
      voteCount.textContent = voteData.liked ? currentCount + 1 : currentCount - 1;
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
    // For now, just reload to show new comment
    // In a full implementation, you'd dynamically add the comment
    window.location.reload();
  }

  addReplyToUI(replyData, parentId) {
    // For now, just reload to show new reply
    // In a full implementation, you'd dynamically add the reply
    window.location.reload();
  }

  removeCommentFromUI(commentId) {
    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
    const commentWrapper = commentCard?.closest('.comment-wrapper');
    
    if (commentWrapper) {
      commentWrapper.remove();
    } else if (commentCard) {
      commentCard.remove();
    }
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
    const countElement = document.getElementById('character-count');
    
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
    const submitBtn = container.querySelector('.submit-btn, .submit-inline-btn, .save-edit-btn, .btn-danger');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = true;
      if (btnText) btnText.style.display = 'none';
      if (btnSpinner) btnSpinner.style.display = 'flex';
    }
  }

  hideLoading(container) {
    const submitBtn = container.querySelector('.submit-btn, .submit-inline-btn, .save-edit-btn, .btn-danger');
    const btnText = submitBtn?.querySelector('.btn-text');
    const btnSpinner = submitBtn?.querySelector('.btn-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'flex';
      if (btnSpinner) btnSpinner.style.display = 'none';
    }
  }

  // Notifications
  showError(message) {
    const errorElement = document.getElementById('error-message');
    const errorText = errorElement?.querySelector('.error-text');
    
    if (errorElement && errorText) {
      errorText.textContent = message;
      errorElement.style.display = 'flex';
      
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    }
  }

  showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'comment-success-indicator';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--success-color);
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

  // Form management
  resetForm(form) {
    const textarea = form.querySelector('textarea');
    if (textarea) {
      textarea.value = '';
      this.updateCharacterCount();
    }
    
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  }

  cancelReply() {
    this.replyingTo = null;
    const replyContext = document.getElementById('reply-context');
    if (replyContext) {
      replyContext.style.display = 'none';
    }
  }

  toggleDropdown(commentId) {
    const dropdown = document.getElementById(`dropdown-${commentId}`);
    if (!dropdown) return;

    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      if (menu !== dropdown) {
        menu.classList.remove('show');
      }
    });

    dropdown.classList.toggle('show');

    if (dropdown.classList.contains('show')) {
      this.updateDropdownPermissions(commentId);
    }
  }

  updateDropdownPermissions(commentId) {
    const dropdown = document.getElementById(`dropdown-${commentId}`);
    const commentCard = document.querySelector(`[data-comment-id="${commentId}"]`);
    
    if (!dropdown || !commentCard) return;

    const editBtn = dropdown.querySelector('.edit-comment-btn');
    const deleteBtn = dropdown.querySelector('.delete-comment-btn');
    
    const isOwner = commentCard.dataset.userId === this.currentUser?.id;
    
    if (editBtn) editBtn.style.display = isOwner ? 'flex' : 'none';
    if (deleteBtn) deleteBtn.style.display = isOwner ? 'flex' : 'none';
  }

  // Draft management using TinkByteAPI
  async saveDraft() {
    if (!this.isAuthenticated) return;
    
    const textarea = document.getElementById('comment-textarea');
    if (!textarea) return;
    
    const content = textarea.value.trim();
    if (!content) return;
    
    clearTimeout(this.draftTimeout);
    this.draftTimeout = setTimeout(async () => {
      try {
        await TinkByteAPI.saveCommentDraft(this.articleId, content);
      } catch (error) {
        console.error('Draft save error:', error);
      }
    }, 2000); // 2 second delay
  }

  async loadDrafts() {
    if (!this.isAuthenticated) return;
    
    try {
      const result = await TinkByteAPI.getCommentDraft(this.articleId);
      
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
        await TinkByteAPI.saveCommentDraft(this.articleId, '');
      } catch (error) {
        console.error('Draft clear error:', error);
      }
    }, 1000);
  }

  // Sorting and pagination
  async sortComments(sortBy) {
    const url = new URL(window.location);
    url.searchParams.set('sort', sortBy);
    window.location.href = url.toString();
  }

  async loadMoreComments() {
    console.log('Load more comments - implement pagination');
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TinkByteCommentSystem();
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.comment-actions-menu')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});