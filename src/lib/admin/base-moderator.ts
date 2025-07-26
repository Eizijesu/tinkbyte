// src/lib/admin/base-moderator.ts
import { AdminAPI } from '../admin-api.js';
import { CommentRenderer, NotificationManager, UIHelpers } from './comment-utils.js';
import type { CommentWithProfile } from '../types/comments.js';
import type { ModerationStats } from '../types/moderation.js';

export interface ModerationFilters {
  search?: string;
  article?: string;
  userType?: string;
  sortOrder?: string;
  status?: string;
}

export interface ModerationPageConfig {
  pageSize: number;
  enableBulkActions: boolean;
  enableFilters: boolean;
  enableSearch: boolean;
  availableActions: string[];
  showStats: boolean;
}

export abstract class BaseModerationPage {
  protected isLoading = false;
  protected selectedComments = new Set<string>();
  protected currentPage = 1;
  protected totalPages = 1;
  protected currentFilters: ModerationFilters = {};
  protected config: ModerationPageConfig;
  protected comments: CommentWithProfile[] = [];

  constructor(config: Partial<ModerationPageConfig> = {}) {
    this.config = {
      pageSize: 20,
      enableBulkActions: true,
      enableFilters: true,
      enableSearch: true,
      availableActions: ['approve', 'reject', 'flag'],
      showStats: true,
      ...config
    };
  }

  protected async init(): Promise<void> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      await this.loadComments();
      
      if (this.config.showStats) {
        await this.loadStats();
      }
      
      this.setupEventListeners();
      this.hideLoading();
    } catch (error) {
      console.error('Moderation page initialization error:', error);
      this.showError('Failed to load moderation data');
    }
  }

  protected async loadComments(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading();

    try {
      const options = {
        page: this.currentPage,
        limit: this.config.pageSize,
        ...this.currentFilters,
        sortBy: this.getSortField(),
        sortOrder: this.getSortOrder(),
      };

      const result = await AdminAPI.getComments(options);

      if (result.success && result.data) {
        this.comments = result.data;
        this.totalPages = result.pagination?.totalPages || 1;
        this.renderComments();
        this.renderPagination(result.pagination);
      } else {
        throw new Error(result.error || 'Failed to load comments');
      }
    } catch (error) {
      console.error('Load comments error:', error);
      this.showError('Failed to load comments');
    } finally {
      this.isLoading = false;
      this.hideLoading();
    }
  }

  protected renderComments(): void {
    const container = this.getCommentsContainer();
    if (!container) return;

    if (this.comments.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    const actionsToShow = [...this.config.availableActions];
    if (this.config.enableBulkActions) {
      actionsToShow.push('select');
    }

    container.innerHTML = this.comments
      .map(comment => CommentRenderer.renderCard(comment, actionsToShow))
      .join('');

    this.attachCommentEventListeners();
  }

  protected renderPagination(pagination: any): void {
    UIHelpers.renderPagination(
      pagination,
      this.getPaginationContainerId(),
      (page) => this.goToPage(page)
    );
  }

  protected async moderateComment(
    commentId: string,
    action: string,
    reason?: string
  ): Promise<void> {
    try {
      const result = await AdminAPI.moderateComment(commentId, action, reason);

      if (result.success) {
        this.removeCommentFromUI(commentId);
        await this.updateStats();
        NotificationManager.show(
          result.message || `Comment ${action}ed successfully`,
          'success'
        );
      } else {
        throw new Error(result.error || `Failed to ${action} comment`);
      }
    } catch (error) {
      console.error(`Moderation error:`, error);
      NotificationManager.show(`Failed to ${action} comment`, 'error');
    }
  }

  protected async bulkModerateComments(
    commentIds: string[],
    action: string,
    reason?: string
  ): Promise<void> {
    if (commentIds.length === 0) {
      NotificationManager.show('Please select comments to moderate', 'warning');
      return;
    }

    try {
      this.showLoading();

      const result = await AdminAPI.bulkModerateComments(commentIds, action, reason);

      if (result.success) {
        commentIds.forEach(id => {
          this.removeCommentFromUI(id);
          this.selectedComments.delete(id);
        });

        this.updateBulkSelectionBar();
        await this.updateStats();

        NotificationManager.show(
          result.message || `${commentIds.length} comment${commentIds.length > 1 ? 's' : ''} ${action}ed successfully`,
          'success'
        );

        // Reload if no comments left
        if (document.querySelectorAll('.comment-card').length === 0) {
          await this.loadComments();
        }
      } else {
        throw new Error(result.error || `Failed to ${action} comments`);
      }
    } catch (error) {
      console.error(`Bulk moderation error:`, error);
      NotificationManager.show(`Failed to ${action} comments`, 'error');
    } finally {
      this.hideLoading();
    }
  }

  protected removeCommentFromUI(commentId: string): void {
    const element = document.querySelector(`[data-comment-id="${commentId}"]`) as HTMLElement;
    if (element) {
      element.style.opacity = '0.5';
      setTimeout(() => element.remove(), 300);
    }
  }

  protected updateBulkSelectionBar(): void {
    const selectionBar = document.getElementById('bulk-selection-bar');
    const selectedCount = document.getElementById('selected-count');

    if (!selectionBar || !selectedCount) return;

    const count = this.selectedComments.size;

    if (count > 0) {
      (selectionBar as HTMLElement).style.display = 'flex';
      selectedCount.textContent = count.toString();
    } else {
      (selectionBar as HTMLElement).style.display = 'none';
    }
  }

  protected setupEventListeners(): void {
    if (this.config.enableSearch) {
      this.setupSearchListener();
    }

    if (this.config.enableFilters) {
      this.setupFilterListeners();
    }

    if (this.config.enableBulkActions) {
      this.setupBulkActionListeners();
    }

    this.setupCommonListeners();
  }

  protected setupSearchListener(): void {
    const searchInput = document.getElementById('comment-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('input', UIHelpers.debounce(() => {
        this.currentFilters.search = searchInput.value;
        this.currentPage = 1;
        this.loadComments();
      }, 300) as EventListener);
    }
  }

  protected setupFilterListeners(): void {
    const filters = [
      { id: 'article-filter', key: 'article' },
      { id: 'user-type-filter', key: 'userType' },
      { id: 'sort-order', key: 'sortOrder' }
    ];

    filters.forEach(({ id, key }) => {
      const element = document.getElementById(id) as HTMLSelectElement;
      if (element) {
        element.addEventListener('change', () => {
          this.currentFilters[key as keyof ModerationFilters] = element.value;
          this.currentPage = 1;
          this.loadComments();
        });
      }
    });
  }

  protected setupBulkActionListeners(): void {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all-comments') as HTMLInputElement;
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', () => {
        const commentCheckboxes = document.querySelectorAll('.comment-select') as NodeListOf<HTMLInputElement>;
        commentCheckboxes.forEach(checkbox => {
          checkbox.checked = selectAllCheckbox.checked;
          if (selectAllCheckbox.checked) {
            this.selectedComments.add(checkbox.value);
          } else {
            this.selectedComments.delete(checkbox.value);
          }
        });
        this.updateBulkSelectionBar();
      });
    }

    // Bulk action buttons
    const bulkActions = [
      { id: 'bulk-approve-selected', action: 'approve' },
      { id: 'bulk-reject-selected', action: 'reject' },
      { id: 'bulk-flag-selected', action: 'flag' },
      { id: 'bulk-restore', action: 'approve' },
      { id: 'bulk-delete', action: 'hide' }
    ];

    bulkActions.forEach(({ id, action }) => {
      const button = document.getElementById(id) as HTMLButtonElement;
      if (button) {
        button.addEventListener('click', () => this.handleBulkAction(action, button));
      }
    });
  }

  protected setupCommonListeners(): void {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-comments');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadComments();
        if (this.config.showStats) {
          this.loadStats();
        }
      });
    }

    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        this.hideError();
        this.loadComments();
      });
    }
  }

  protected attachCommentEventListeners(): void {
    // Comment selection checkboxes
    if (this.config.enableBulkActions) {
      const checkboxes = document.querySelectorAll('.comment-select') as NodeListOf<HTMLInputElement>;
      checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            this.selectedComments.add(checkbox.value);
          } else {
            this.selectedComments.delete(checkbox.value);
          }
          this.updateBulkSelectionBar();
        });
      });
    }

    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const action = btn.dataset.action;
        const commentId = btn.dataset.commentId;
        const articleSlug = btn.dataset.articleSlug;

        if (action === 'view-article' && articleSlug) {
          window.open(`/blog/${articleSlug}`, '_blank');
          return;
        }

        if (action && commentId) {
          this.handleSingleAction(commentId, action, btn);
        }
      });
    });
  }

  protected async handleSingleAction(
    commentId: string,
    action: string,
    button: HTMLButtonElement
  ): Promise<void> {
    const originalContent = button.innerHTML;
    UIHelpers.updateButtonLoading(button, true);

    try {
      if (action === 'approve') {
        await this.moderateComment(commentId, action);
      } else {
        const reason = this.promptForReason(action);
        if ((action === 'reject' || action === 'flag') && !reason) {
          return;
        }
        await this.moderateComment(commentId, action, reason || undefined);
      }
    } finally {
      UIHelpers.updateButtonLoading(button, false, originalContent);
    }
  }

  protected async handleBulkAction(action: string, button: HTMLButtonElement): Promise<void> {
    const selectedIds = Array.from(this.selectedComments);
    
    if (selectedIds.length === 0) {
      NotificationManager.show('Please select comments to moderate', 'warning');
      return;
    }

    if (action === 'hide' && !confirm('Are you sure you want to delete these comments? This action cannot be undone.')) {
      return;
    }

    const originalContent = button.innerHTML;
    UIHelpers.updateButtonLoading(button, true);

    try {
      let reason: string | undefined;
      
      if (action === 'reject' || action === 'flag') {
        const reasonInput = this.promptForReason(action, true);
        if (!reasonInput) return;
        reason = reasonInput;
      }

      await this.bulkModerateComments(selectedIds, action, reason);
    } finally {
      UIHelpers.updateButtonLoading(button, false, originalContent);
    }
  }

  protected promptForReason(action: string, isBulk = false): string | null {
    const actionText = isBulk ? `bulk ${action}` : action;
    return prompt(`Please provide a reason for ${actionText}ing this comment${isBulk ? 's' : ''}:`);
  }

  public async goToPage(page: number): Promise<void> {
    this.currentPage = page;
    await this.loadComments();
  }

  protected getSortField(): string {
    switch (this.currentFilters.sortOrder) {
      case 'oldest': return 'created_at';
      case 'longest': return 'created_at';
      case 'newest':
      default: return 'created_at';
    }
  }

  protected getSortOrder(): string {
    switch (this.currentFilters.sortOrder) {
      case 'oldest': return 'asc';
      case 'longest': return 'asc';
      case 'newest':
      default: return 'desc';
    }
  }

  // Abstract methods to be implemented by subclasses
  protected abstract getCommentsContainer(): HTMLElement | null;
  protected abstract getPaginationContainerId(): string;
  protected abstract getEmptyStateHTML(): string;
  protected abstract loadStats(): Promise<void>;
  protected abstract updateStats(): Promise<void>;

  // Common UI methods
  protected showLoading(): void {
    UIHelpers.showLoading();
  }

  protected hideLoading(): void {
    UIHelpers.hideLoading();
  }

  protected showError(message: string): void {
    UIHelpers.showError(message);
  }

  protected hideError(): void {
    UIHelpers.hideError();
  }
}