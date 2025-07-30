import { supabase } from '../supabase.js';
import { config } from '../config.js';

export class AdminRealtimeManager {
  private subscription: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.subscription || this.isInitialized) return;

    try {
      
      
      this.subscription = supabase
        .channel('admin-dashboard-updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'article_likes' 
          },
          (payload) => this.handleReactionUpdate('like', payload)
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'article_likes' 
          },
          (payload) => this.handleReactionUpdate('unlike', payload)
        )
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'article_saves' 
          },
          (payload) => this.handleReactionUpdate('save', payload)
        )
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'comments',
            filter: `environment=eq.${config.environment}`
          },
          (payload) => this.handleCommentUpdate(payload)
        )
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'comments',
            filter: `environment=eq.${config.environment}`
          },
          (payload) => this.handleCommentModerationUpdate(payload)
        )
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'profiles',
            filter: `environment=eq.${config.environment}`
          },
          (payload) => this.handleUserUpdate('new_user', payload)
        )
        .subscribe((status) => {
          
          this.isInitialized = status === 'SUBSCRIBED';
        });

      
    } catch (error) {
      console.error('❌ Failed to initialize real-time manager:', error);
    }
  }

  private handleReactionUpdate(type: string, payload: any): void {
    
    
    // Update dashboard metrics in real-time
    const event = new CustomEvent('adminMetricsUpdate', {
      detail: { 
        type: 'reaction', 
        subtype: type, 
        data: payload.new || payload.old,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    // Show notification for significant reactions
    if (type === 'like') {
      this.showRealtimeNotification('New article like received', 'success');
    }
  }

  private handleCommentUpdate(payload: any): void {
    
    
    const event = new CustomEvent('adminMetricsUpdate', {
      detail: { 
        type: 'comment', 
        subtype: 'new_comment',
        data: payload.new,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    // Show notification for new comments
    if (payload.new?.moderation_status === 'pending') {
      this.showRealtimeNotification('New comment awaiting moderation', 'warning');
    }
  }

  private handleCommentModerationUpdate(payload: any): void {
    
    
    const event = new CustomEvent('adminMetricsUpdate', {
      detail: { 
        type: 'moderation', 
        subtype: 'status_change',
        data: payload.new,
        oldData: payload.old,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);
  }

  private handleUserUpdate(type: string, payload: any): void {
    
    
    const event = new CustomEvent('adminMetricsUpdate', {
      detail: { 
        type: 'user', 
        subtype: type,
        data: payload.new,
        timestamp: new Date().toISOString()
      }
    });
    window.dispatchEvent(event);

    if (type === 'new_user') {
      this.showRealtimeNotification('New user registered', 'info');
    }
  }

  private showRealtimeNotification(message: string, type: 'success' | 'warning' | 'info' = 'info'): void {
    // Only show notifications if user is on admin pages
    if (!window.location.pathname.startsWith('/admin/')) return;

    const notification = document.createElement('div');
    notification.className = `realtime-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas ${this.getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `;

    const colors = {
      success: '#238636',
      warning: '#f59e0b',
      info: '#0ea5e9'
    };

    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; padding: 0.75rem 1rem;
      background: ${colors[type]}; color: white; font-size: 0.875rem;
      border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10001; animation: slideInRight 0.3s ease;
      display: flex; align-items: center; gap: 0.5rem; max-width: 300px;
    `;

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close') as HTMLElement;
    closeBtn?.addEventListener('click', () => notification.remove());

    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }

  public destroy(): void {
    if (this.subscription) {
      
      supabase.removeChannel(this.subscription);
      this.subscription = null;
      this.isInitialized = false;
      
    }
  }

  public getStatus(): { initialized: boolean; connected: boolean } {
    return {
      initialized: this.isInitialized,
      connected: !!this.subscription
    };
  }
}

// Singleton instance
let realtimeManagerInstance: AdminRealtimeManager | null = null;

export function getAdminRealtimeManager(): AdminRealtimeManager {
  if (!realtimeManagerInstance) {
    realtimeManagerInstance = new AdminRealtimeManager();
  }
  return realtimeManagerInstance;
}

// CSS animations
if (typeof window !== 'undefined' && !document.getElementById('realtime-animations')) {
  const style = document.createElement('style');
  style.id = 'realtime-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    .realtime-notification .notification-close {
      background: none; border: none; color: inherit;
      font-size: 1.2rem; cursor: pointer; padding: 0;
      margin-left: auto; opacity: 0.8;
    }
    .realtime-notification .notification-close:hover {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
}