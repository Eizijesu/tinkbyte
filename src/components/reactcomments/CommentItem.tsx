
import React, { useState } from 'react';
import { CommentForm } from './CommentForm';
import { supabase } from '../../lib/supabase';
import { authManager } from '../../lib/auth';
import type { CommentWithProfile } from '../../lib/types/comments';
import { REACTION_TYPES } from '../../lib/config/comments';
import { config } from '../../lib/config';

interface CommentItemProps {
  comment: CommentWithProfile;
  articleSlug: string;
  onRefresh: () => void;
  level?: number;
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, articleSlug, onRefresh, level = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const user = authManager.getUser();
  const isOwner = user?.id === comment.user_id;
  
  const profile = comment.profiles || comment.user_profile;
  const displayName = profile?.display_name || comment.guest_name || 'Anonymous';
  
  const getAvatar = () => {
      if (profile?.avatar_url) return profile.avatar_url;
      const presetId = profile?.avatar_preset_id || 1;
      return `/images/avatars/preset-${presetId}.svg`;
  };
  const avatarUrl = getAvatar();
  const isAdmin = profile?.is_admin || false;
  
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString();
  };

  const handleVote = async (action: 'upvote' | 'downvote') => {
      if (!user) return window.location.href = '/auth/signin';
      
      const environment = config.environment || 'production';
      
      try {
          if (comment.is_liked) {
              // Remove like
              await supabase.from('comment_likes')
                .delete()
                .eq('user_id', user.id)
                .eq('comment_id', comment.id)
                .eq('environment', environment);
          } else {
              // Add like
              await supabase.from('comment_likes')
                .insert({ 
                   comment_id: comment.id, 
                   user_id: user.id,
                   environment: environment,
                   created_at: new Date().toISOString()
                });
          }
          // Update local count for immediate feedback (optional) or just refresh
          onRefresh();
      } catch (e) {
          console.error('Vote failed', e);
      }
  };

  const handleReaction = async (type: string) => {
      if (!user) return window.location.href = '/auth/signin';
      
      const environment = config.environment || 'production';

      try {
          // Check if already reacted with this type
          const existingReaction = comment.comment_reactions?.find(r => r.reaction_type === type && r.user_id === user.id);
          
          if (existingReaction) {
             await supabase.from('comment_reactions')
                .delete()
                .eq('id', (existingReaction as any).id); // Ensure ID is available in query
          } else {
             await supabase.from('comment_reactions').insert({
                comment_id: comment.id,
                user_id: user.id,
                reaction_type: type,
                environment: environment,
                created_at: new Date().toISOString()
             });
          }
          onRefresh();
      } catch(e) {
          console.error("Reaction failed", e);
      }
  };

  const handleBookmark = async () => {
    if (!user) return window.location.href = '/auth/signin';
    const environment = config.environment || 'production';
    
    try {
        if (comment.is_bookmarked) {
            await supabase.from('comment_bookmarks')
               .delete()
               .eq('user_id', user.id)
               .eq('comment_id', comment.id)
               .eq('environment', environment);
        } else {
            await supabase.from('comment_bookmarks')
               .insert({
                   user_id: user.id,
                   comment_id: comment.id,
                   environment: environment,
                   created_at: new Date().toISOString()
               });
        }
        onRefresh();
    } catch(e) { console.error(e); }
  };

  const handleCopy = () => {
     navigator.clipboard.writeText(comment.content);
     alert('Comment copied to clipboard');
  };

  const handleDelete = async () => {
      if (!confirm('Are you sure you want to delete this comment?')) return;
      
      const environment = config.environment || 'production';
      
      await supabase.from('comments')
          .update({ 
              is_deleted: true, 
              deleted_at: new Date().toISOString(),
              deleted_by: user?.id 
          })
          .eq('id', comment.id)
          .eq('environment', environment);
          
      onRefresh();
  };

  const formatContent = (text: string) => {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>')
        .replace(/\n/g, '<br>');
  };

  const indentClass = level > 0 ? 'ml-0 md:ml-6' : '';
  const reactionTypes = Object.entries(REACTION_TYPES).map(([name, value]) => ({
      name,
      emoji: (value as any).emoji,
      label: (value as any).label,
  }));

  if (isCollapsed) {
      return (
          <div className={`comment-wrapper ${indentClass} mb-2`}>
             <div className="bg-[var(--tertiary-bg)] p-2 rounded cursor-pointer text-xs text-[var(--text-secondary)] flex items-center gap-2" onClick={() => setIsCollapsed(false)}>
                <span>+</span>
                <span className="font-bold">{displayName}</span>
                <span>{formatDate(comment.created_at)}</span>
                <span className="italic">({(comment.reply_count || 0) + 1} items collapsed)</span>
             </div>
          </div>
      );
  }

  return (
    <div className={`comment-wrapper ${indentClass}`} data-thread-level={level}>
      <div className={`comment-card ${level > 0 ? 'reply-card' : ''}`} data-thread-level={level}>
        {level > 0 && <div className="reply-connector"></div>}
        
        <div className="comment-header">
           <div className="comment-user-info">
               <div className="comment-avatar">
                   <img src={avatarUrl} alt={displayName} loading="lazy" />
                   {isAdmin && <div className="admin-badge">👑</div>}
               </div>
               <div className="comment-meta">
                   <div className="user-details">
                       <span className={`username ${isAdmin ? 'admin' : ''}`}>{displayName}</span>
                       <div className="comment-time-wrapper">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12,6 12,12 16,14"></polyline>
                           </svg>
                           <span className="comment-time" title={new Date(comment.created_at).toLocaleString()}>
                               {formatDate(comment.created_at)}
                           </span>
                       </div>
                       {comment.is_edited && <span className="edit-indicator" title="This comment has been edited">(edited)</span>}
                   </div>
               </div>
           </div>

           <div className="comment-actions-menu">
               <button onClick={() => setShowMenu(!showMenu)} className="menu-btn" title="More options">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                   </svg>
               </button>
               {showMenu && (
                   <>
                   <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                   <div className="dropdown-menu show" style={{display: 'block'}}>
                       <button onClick={() => setIsCollapsed(true)} className="dropdown-item">
                           Collapse Thread
                       </button>
                       {isOwner ? (
                           <>
                            <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="dropdown-item edit-comment-btn">
                                Edit
                            </button>
                            <button onClick={handleDelete} className="dropdown-item delete-comment-btn">
                                Delete
                            </button>
                           </>
                       ) : (
                           <button className="dropdown-item report-btn">Report</button>
                       )}
                   </div>
                   </>
               )}
           </div>
        </div>

        <div className="comment-content">
            {isEditing ? (
                <div className="p-0">
                    <CommentForm 
                        articleSlug={articleSlug}
                        mode="edit"
                        commentId={comment.id}
                        initialContent={comment.content}
                        onSuccess={() => { setIsEditing(false); onRefresh(); }}
                        onCancel={() => setIsEditing(false)}
                        autoFocus
                    />
                </div>
            ) : (
                <div className="comment-text" dangerouslySetInnerHTML={{ __html: formatContent(comment.content) }}></div>
            )}
        </div>

        {!isEditing && (
            <div className="comment-footer">
                <div className="comment-voting">
                    <button onClick={() => handleVote('upvote')} className={`vote-btn upvote-btn ${comment.is_liked ? 'active' : ''}`} title="Upvote">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 14l5-5 5 5"></path></svg>
                    </button>
                    <span className="vote-count">{comment.like_count || 0}</span>
                </div>

                <div className="comment-reactions">
                     {reactionTypes.map(r => (
                        <button key={r.name} className={`reaction-btn ${comment.reaction_counts?.[r.name] ? 'active' : ''}`} title={r.label} onClick={() => handleReaction(r.name)}>
                            <span className="reaction-emoji">{r.emoji}</span>
                            <span className="reaction-count">{comment.reaction_counts?.[r.name] || 0}</span>
                        </button>
                     ))}
                </div>

                <div className="comment-actions">
                    {level < 4 && (
                        <button onClick={() => setIsReplying(!isReplying)} className="action-btn reply-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                            Reply
                        </button>
                    )}
                    <button onClick={handleBookmark} className={`action-btn bookmark-btn ${comment.is_bookmarked ? 'active' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill={comment.is_bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        Save
                    </button>
                    <button onClick={handleCopy} className="action-btn copy-btn">
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path></svg>
                         Copy
                    </button>
                </div>
            </div>
        )}
      </div>

      {isReplying && (
          <div className="inline-reply-container" style={{display: 'block'}}>
              <div className="reply-form-header">
                  <div className="reply-context-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                      <span>Replying to <strong className="reply-author-name">{displayName}</strong></span>
                  </div>
                  <button onClick={() => setIsReplying(false)} className="cancel-inline-reply">×</button>
              </div>
              <CommentForm 
                  articleSlug={articleSlug}
                  parentId={comment.id}
                  replyToAuthor={displayName}
                  isInline={true}
                  onSuccess={() => { setIsReplying(false); onRefresh(); }}
                  onCancel={() => setIsReplying(false)}
                  autoFocus
              />
          </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
          <div className="comment-replies">
              {comment.replies.map(reply => (
                  <CommentItem 
                      key={reply.id}
                      comment={reply}
                      articleSlug={articleSlug}
                      onRefresh={onRefresh}
                      level={level + 1}
                  />
              ))}
          </div>
      )}
    </div>
  );
};
