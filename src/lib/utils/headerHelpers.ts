// lib/utils/headerHelpers.ts
export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function getAvatarUrl(profile: any): string {
  const defaultAvatar = '/images/avatars/preset-1.svg';
  
  if (!profile) return defaultAvatar;

  if (profile.avatar_type === "uploaded" && profile.avatar_url) {
    return profile.avatar_url;
  }

  if (profile.avatar_type === "google" && profile.avatar_url) {
    return profile.avatar_url;
  }

  const presetId = profile.avatar_preset_id || 1;
  return `/images/avatars/preset-${presetId}.svg`;
}