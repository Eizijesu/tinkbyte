// lib/stores/headerStore.ts
import { authManager } from '../auth';
import { TinkByteAPI } from '../supabase';

interface HeaderState {
  user: any;
  profile: any;
  notifications: any[];
  unreadCount: number;
  desktopDropdownOpen: boolean;
  mobileDropdownOpen: boolean;
  mobileMenuOpen: boolean;
  loading: boolean;
}

class HeaderStore {
  private state: HeaderState = {
    user: null,
    profile: null,
    notifications: [],
    unreadCount: 0,
    desktopDropdownOpen: false,
    mobileDropdownOpen: false,
    mobileMenuOpen: false,
    loading: false
  };

  private listeners = new Set<(state: HeaderState) => void>();
  private notificationInterval: ReturnType<typeof setInterval> | null = null;

  subscribe(listener: (state: HeaderState) => void) {
    this.listeners.add(listener);
    listener(this.state); // Send initial state
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  // User management
  setUser(user: any, profile: any) {
    this.state.user = user;
    this.state.profile = profile;
    this.notify();
    
    if (user) {
      this.startNotificationPolling();
    } else {
      this.stopNotificationPolling();
    }
  }

  // Dropdown management
  toggleDesktopDropdown() {
    this.state.desktopDropdownOpen = !this.state.desktopDropdownOpen;
    if (this.state.desktopDropdownOpen) {
      this.loadNotifications();
    }
    this.notify();
  }

  toggleMobileDropdown() {
    this.state.mobileDropdownOpen = !this.state.mobileDropdownOpen;
    if (this.state.mobileDropdownOpen) {
      this.loadNotifications();
    }
    this.notify();
  }

  toggleMobileMenu() {
    this.state.mobileMenuOpen = !this.state.mobileMenuOpen;
    this.notify();
  }

  closeAllDropdowns() {
    this.state.desktopDropdownOpen = false;
    this.state.mobileDropdownOpen = false;
    this.notify();
  }

  // Notification management
  async loadNotifications() {
    if (!this.state.user) return;

    this.state.loading = true;
    this.notify();

    try {
      const result = await TinkByteAPI.getUserNotifications(10);
      if (result.success && result.data) {
        this.state.notifications = result.data;
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      this.state.loading = false;
      this.notify();
    }
  }

  async loadNotificationCount() {
    if (!this.state.user) return;

    try {
      const result = await TinkByteAPI.getUnreadNotificationCount();
      if (result.success) {
        this.state.unreadCount = result.count || 0;
        this.notify();
      }
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      await TinkByteAPI.markNotificationAsRead(notificationId);
      
      // Update local state
      this.state.notifications = this.state.notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      );
      
      // Reload count
      await this.loadNotificationCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllNotificationsAsRead() {
    try {
      const unreadNotifications = this.state.notifications.filter(n => !n.is_read);
      
      for (const notification of unreadNotifications) {
        await this.markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  private startNotificationPolling() {
    // Load initial count
    this.loadNotificationCount();

    // Poll every 30 seconds
    this.notificationInterval = setInterval(() => {
      this.loadNotificationCount();
    }, 30000);
  }

  private stopNotificationPolling() {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  // Cleanup
  cleanup() {
    this.stopNotificationPolling();
    this.listeners.clear();
  }
}

export const headerStore = new HeaderStore();