// src/lib/admin/comment-utils.ts
import type { CommentWithProfile } from '../types/comments.js';
import type { ModerationAction, ModerationStats } from '../types/moderation.js';

export class CommentRenderer {
  static renderCard(comment: CommentWithProfile, availableActions: string[] = []): string {
    const isGuest = !comment.user_id;
    const displayName = this.getDisplayName(comment);
    const avatarContent = this.getAvatarContent(comment, displayName);
    const waitTime = this.calculateWaitTime(comment.created_at);
    const isUrgent = this.isCommentUrgent(comment.created_at);

    return `
      <div class="comment-card ${isUrgent ? 'urgent' : ''}" data-comment-id="${comment.id}">
        <div class="comment-header">
          ${availableActions.includes('select') ? `
            <div class="comment-select-container">
              <input type="checkbox" class="comment-select" value="${comment.id}" />
            </div>
          ` : ''}
          <div class="user-info">
            <div class="user-avatar">
              ${avatarContent}
            </div>
            <div class="user-details">
              <span class="user-name">
                ${displayName}
                ${comment.profiles?.is_admin ? '<span class="admin-badge">ADMIN</span>' : ''}
                ${isGuest ? '<span class="guest-badge">GUEST</span>' : ''}
              </span>
              <span class="user-meta">
                ${this.getUserMeta(comment)}
              </span>
            </div>
          </div>
          <div class="comment-meta">
            <span class="wait-time ${isUrgent ? 'urgent' : ''}">
              <i class="fas fa-clock"></i>
              Waiting ${waitTime}
            </span>
            <span class="article-info">
              <i class="fas fa-file-alt"></i>
              ${(comment as any).articles?.title || 'Unknown Article'}
            </span>
            <span class="comment-date">
              ${new Date(comment.created_at).toLocaleDateString()} at ${new Date(comment.created_at).toLocaleTimeString()}
            </span>
          </div>
        </div>

        <div class="comment-content">
          <p>${this.escapeHtml(comment.content)}</p>
          ${comment.mention_users?.length ? `
            <div class="mentions">
              <i class="fas fa-at"></i>
              <span>Mentions ${comment.mention_users.length} user${comment.mention_users.length > 1 ? 's' : ''}</span>
            </div>
          ` : ''}
          ${comment.moderation_reason ? `
            <div class="moderation-reason">
              <i class="fas fa-info-circle"></i>
              <span>Reason: ${comment.moderation_reason}</span>
            </div>
          ` : ''}
        </div>

        <div class="comment-actions">
          ${this.renderActionButtons(comment, availableActions)}
        </div>
      </div>
    `;
  }

  static getDisplayName(comment: CommentWithProfile): string {
    return comment.profiles?.display_name || 
           comment.user_profile?.display_name || 
           comment.guest_name || 
           'Anonymous';
  }

  static getAvatarContent(comment: CommentWithProfile, displayName: string): string {
    const profile = comment.profiles || comment.user_profile;
    
    if (profile?.avatar_url) {
      return `<img src="${profile.avatar_url}" alt="${displayName}" />`;
    }
    
    const isGuest = !comment.user_id;
    const cssClass = isGuest ? 'avatar-preset guest' : 'avatar-preset';
    
    return `<div class="${cssClass}">${displayName.charAt(0).toUpperCase()}</div>`;
  }

  static getUserMeta(comment: CommentWithProfile): string {
    const isGuest = !comment.user_id;
    
    if (isGuest) {
      return `Email: ${comment.guest_email || 'Not provided'}`;
    }
    
    const profile = comment.profiles || comment.user_profile;
    return `Rep: ${profile?.reputation_score || 0}`;
  }

  static renderActionButtons(comment: CommentWithProfile, availableActions: string[]): string {
    const status = comment.moderation_status || comment.status;
    let buttons = '';

    if (availableActions.includes('approve') && (status === 'pending' || status === 'flagged')) {
      buttons += `
        <button class="action-btn approve" data-action="approve" data-comment-id="${comment.id}">
          <div class="btn-spinner" style="display: none;">
            <div class="spinner-square small"></div>
          </div>
          <i class="fas fa-check"></i>
          ${status === 'flagged' ? 'Restore' : 'Approve'}
        </button>
      `;
    }

    if (availableActions.includes('reject') && (status === 'pending' || status === 'approved')) {
      buttons += `
        <button class="action-btn reject" data-action="reject" data-comment-id="${comment.id}">
          <div class="btn-spinner" style="display: none;">
            <div class="spinner-square small"></div>
          </div>
          <i class="fas fa-times"></i>
          ${status === 'approved' ? 'Hide' : 'Reject'}
        </button>
      `;
    }

    if (availableActions.includes('flag') && status !== 'flagged') {
      buttons += `
        <button class="action-btn flag" data-action="flag" data-comment-id="${comment.id}">
          <div class="btn-spinner" style="display: none;">
            <div class="spinner-square small"></div>
          </div>
          <i class="fas fa-flag"></i>
          Flag
        </button>
      `;
    }

    if (availableActions.includes('delete')) {
      buttons += `
        <button class="action-btn delete" data-action="hide" data-comment-id="${comment.id}">
          <div class="btn-spinner" style="display: none;">
            <div class="spinner-square small"></div>
          </div>
          <i class="fas fa-trash"></i>
          Delete
        </button>
      `;
    }

    if (availableActions.includes('view-article')) {
      const articleSlug = (comment as any).articles?.slug;
      if (articleSlug) {
        buttons += `
          <button class="action-btn view-article" data-article-slug="${articleSlug}" title="View Article">
            <i class="fas fa-external-link-alt"></i>
            View Article
          </button>
        `;
      }
    }

    return buttons;
  }

  static calculateWaitTime(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${Math.max(1, diffMinutes)} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  }

  static isCommentUrgent(createdAt: string): boolean {
    const waitTime = this.calculateWaitTime(createdAt);
    return waitTime.includes('day') || parseInt(waitTime) > 12;
  }

  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export class NotificationManager {
  private static notifications: HTMLElement[] = [];

  static show(message: string, type: 'success' | 'error' | 'warning' = 'success', duration = 4000): void {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    const colors = {
      success: '#238636',
      error: '#da3633',
      warning: '#fb8500'
    };

    notification.style.cssText = `
      position: fixed;
      top: ${20 + (this.notifications.length * 60)}px;
      right: 20px;
      padding: 1rem 1.5rem;
      color: white;
      font-weight: 500;
      z-index: 10000;
      background: ${colors[type]};
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease;
      max-width: 400px;
      word-wrap: break-word;
    `;

    document.body.appendChild(notification);
    this.notifications.push(notification);

    setTimeout(() => {
      this.remove(notification);
    }, duration);
  }

  private static remove(notification: HTMLElement): void {
    const index = this.notifications.indexOf(notification);
    if (index > -1) {
      this.notifications.splice(index, 1);
      notification.remove();
      
      // Reposition remaining notifications
      this.notifications.forEach((notif, i) => {
        notif.style.top = `${20 + (i * 60)}px`;
      });
    }
  }

  static clear(): void {
    this.notifications.forEach(notif => notif.remove());
    this.notifications = [];
  }
}

export class UIHelpers {
  static showLoading(elementId = 'loading-overlay'): void {
    const element = document.getElementById(elementId);
    if (element) {
      (element as HTMLElement).style.display = 'flex';
    }
  }

  static hideLoading(elementId = 'loading-overlay'): void {
    const element = document.getElementById(elementId);
    if (element) {
      (element as HTMLElement).style.display = 'none';
    }
  }

  static showError(message: string, bannerId = 'error-banner', messageId = 'error-message'): void {
    const banner = document.getElementById(bannerId);
    const messageEl = document.getElementById(messageId);
    
    if (banner && messageEl) {
      messageEl.textContent = message;
      (banner as HTMLElement).style.display = 'flex';
    }
  }

  static hideError(bannerId = 'error-banner'): void {
    const banner = document.getElementById(bannerId);
    if (banner) {
      (banner as HTMLElement).style.display = 'none';
    }
  }

  static updateButtonLoading(button: HTMLButtonElement, isLoading: boolean, originalContent?: string): void {
    const spinner = button.querySelector('.btn-spinner') as HTMLElement;
    const icon = button.querySelector('i') as HTMLElement;
    
    button.disabled = isLoading;
    
    if (isLoading) {
      if (spinner) spinner.style.display = 'flex';
      if (icon) icon.style.display = 'none';
    } else {
      if (spinner) spinner.style.display = 'none';
      if (icon) icon.style.display = 'inline';
      if (originalContent) button.innerHTML = originalContent;
    }
  }

  static debounce(func: Function, wait: number): Function {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  static renderPagination(
    pagination: any, 
    containerId: string, 
    onPageChange: (page: number) => void
  ): void {
    const container = document.getElementById(containerId);
    if (!container || !pagination) return;

    if (pagination.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHtml = `
      <div class="pagination-info">
        Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} items
      </div>
      <div class="pagination-buttons">
    `;

    if (pagination.hasPrev || pagination.page > 1) {
      paginationHtml += `<button class="pagination-btn" data-page="${pagination.page - 1}">Previous</button>`;
    }

    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === pagination.page;
      paginationHtml += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (pagination.hasNext || pagination.page < pagination.totalPages) {
      paginationHtml += `<button class="pagination-btn" data-page="${pagination.page + 1}">Next</button>`;
    }

    paginationHtml += '</div>';
    container.innerHTML = paginationHtml;

    // Attach event listeners
    container.querySelectorAll('.pagination-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = parseInt((e.target as HTMLElement).dataset.page || '1');
        onPageChange(page);
      });
    });
  }
}