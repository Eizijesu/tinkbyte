// public/scripts/comments-fix.js

document.addEventListener('DOMContentLoaded', () => {
  console.log('Comments system loading...');
  
  // Check if Supabase is available
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase not loaded');
    return;
  }
  
  // Initialize your comment system here
  console.log('Comments system ready');
});