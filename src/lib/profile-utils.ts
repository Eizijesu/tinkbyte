export class ProfileUtils {
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  }
  
  static formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  
  static generateProfileId(userId: string): string {
    return `#TB${userId.slice(-6).toUpperCase()}`;
  }
  
  static validateDisplayName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  static getAvatarUrl(profile: any): string {
    // Handle Google avatars
    if (profile?.avatar_type === "google" && profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    // Handle uploaded avatars
    if (profile?.avatar_type === "uploaded" && profile?.avatar_url) {
      return profile.avatar_url;
    }
    
    // Handle preset avatars
    return `/images/avatars/preset-${profile?.avatar_preset_id || 1}.svg`;
  }

  static calculateProfileCompletion(profile: any): number {
    const fields = [
      'display_name',
      'bio', 
      'avatar_type',
      'location',
      'website'
    ];
    
    const completed = fields.filter(field => 
      profile[field] && profile[field].trim() !== ''
    ).length;
    
    return Math.round((completed / fields.length) * 100);
  }
}

export const AVATAR_PRESETS = [
  { id: 1, name: 'Builder', icon: '👷', description: 'For builders and makers' },
  { id: 2, name: 'Developer', icon: '👨‍💻', description: 'For developers and coders' },
  { id: 3, name: 'Designer', icon: '🎨', description: 'For designers and creatives' },
  { id: 4, name: 'Product Manager', icon: '📊', description: 'For PMs and strategists' },
  { id: 5, name: 'Founder', icon: '🚀', description: 'For entrepreneurs and founders' }
];

export const ACTIVITY_TYPES = {
  posted_comment: { icon: 'comment', color: '#10b981' },
  followed_topic: { icon: 'heart', color: '#ef4444' },
  liked_article: { icon: 'thumbs-up', color: '#3b82f6' },
  saved_article: { icon: 'bookmark', color: '#f59e0b' },
  read_article: { icon: 'book-open', color: '#8b5cf6' },
  joined: { icon: 'user-plus', color: '#06b6d4' }
};