
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { authManager } from '../../lib/auth';
import { config } from '../../lib/config'; // Import config for environment
import { CommentForm } from './CommentForm';
import { CommentItem } from './CommentItem';
import type { CommentWithProfile } from '../../lib/types/comments';
import { AlertCircle } from 'lucide-react';
import '../../styles/comments.css';

interface CommentSectionProps {
  articleId: string;
  postSlug?: string;
  postTitle?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ articleId, postSlug, postTitle }) => {
  // FORCE LOG - This should ALWAYS appear if component runs
  console.error('🔥🔥🔥 COMMENT SECTION COMPONENT EXECUTING 🔥🔥🔥', { articleId, postSlug, postTitle });
  
  const activeId = articleId || postSlug || '';
  
  console.log('🎯 CommentSection CLIENT RENDER - activeId:', activeId);
  
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [displayedComments, setDisplayedComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const COMMENTS_PER_PAGE = 5;
  const [loadedCount, setLoadedCount] = useState(COMMENTS_PER_PAGE);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Check if user is logged in
    authManager.initialize().then(() => {
        const user = authManager.getUser();
        setCurrentUser(user);
    });
    
    const unsubscribe = authManager.onAuthChange((user) => {
        setCurrentUser(user);
        // Don't call fetchComments here - it will be triggered by the other useEffect
    });
    return () => {
        if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchComments = useCallback(async () => {
    if (!activeId) {
        console.log('⚠️ No activeId, skipping fetch');
        setIsLoading(false);
        return;
    }

    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
        console.log('⚠️ Fetch already in progress, skipping');
        return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // ✅ In development, look for comments in both environments
      // This ensures comments show up locally even if they were created in production
      const environments = config.environment === 'development' 
        ? ['development', 'production'] 
        : [config.environment];
      
      console.log('🔍 Fetching comments for article:', activeId, 'environments:', environments);
      console.log('🔍 Supabase client available:', !!supabase);
      
      // First, fetch comments without joins to avoid relationship issues
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('article_id', activeId)
        .in('environment', environments)
        .eq('is_deleted', false)
        .in('moderation_status', ['approved', 'auto_approved'])
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('❌ Error fetching comments:', commentsError);
        throw commentsError;
      }

      if (!commentsData || commentsData.length === 0) {
        console.log('✅ No comments found');
        setTotalCount(0);
        setComments([]);
        setDisplayedComments([]);
        return;
      }

      // Fetch profiles separately
      const userIds = [...new Set(commentsData.map(c => c.user_id).filter(Boolean))];
      let profilesMap = new Map();
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, avatar_type, avatar_preset_id, is_admin, reputation_score')
          .in('id', userIds);
        
        if (profilesData) {
          profilesData.forEach(p => profilesMap.set(p.id, p));
        }
      }

      // Fetch reactions, likes, bookmarks separately
      const commentIds = commentsData.map(c => c.id);
      const [reactionsResult, likesResult, bookmarksResult] = await Promise.all([
        supabase.from('comment_reactions').select('comment_id, reaction_type, user_id').in('comment_id', commentIds),
        supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', commentIds),
        supabase.from('comment_bookmarks').select('comment_id, user_id').in('comment_id', commentIds)
      ]);

      // Group interactions by comment_id
      const reactionsMap = new Map();
      (reactionsResult.data || []).forEach(r => {
        if (!reactionsMap.has(r.comment_id)) reactionsMap.set(r.comment_id, []);
        reactionsMap.get(r.comment_id).push(r);
      });

      const likesMap = new Map();
      (likesResult.data || []).forEach(l => {
        if (!likesMap.has(l.comment_id)) likesMap.set(l.comment_id, []);
        likesMap.get(l.comment_id).push(l);
      });

      const bookmarksMap = new Map();
      (bookmarksResult.data || []).forEach(b => {
        if (!bookmarksMap.has(b.comment_id)) bookmarksMap.set(b.comment_id, []);
        bookmarksMap.get(b.comment_id).push(b);
      });

      // Combine data
      const rawData = commentsData.map(c => ({
        ...c,
        profiles: profilesMap.get(c.user_id) || null,
        comment_reactions: reactionsMap.get(c.id) || [],
        comment_likes: likesMap.get(c.id) || [],
        comment_bookmarks: bookmarksMap.get(c.id) || []
      }));
      
      console.log('✅ Comments fetched successfully:', rawData?.length || 0, 'comments');

      const user = authManager.getUser();
      const currentUserId = user?.id;

      // Map Data
      const commentMap = new Map<string, CommentWithProfile>();
      const roots: CommentWithProfile[] = [];
      const flatList: CommentWithProfile[] = [];

      (rawData || []).forEach((c: any) => {
        const rawProfile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
        const likes = c.comment_likes || [];
        const bookmarks = c.comment_bookmarks || [];
        const reactions = c.comment_reactions || [];
        
        const reactionCounts: Record<string, number> = {};
        reactions.forEach((r: any) => {
            reactionCounts[r.reaction_type] = (reactionCounts[r.reaction_type] || 0) + 1;
        });

        const normalized: CommentWithProfile = {
            ...c,
            id: c.id,
            article_id: c.article_id,
            content: c.content || '',
            created_at: c.created_at,
            updated_at: c.updated_at,
            user_id: c.user_id,
            like_count: c.like_count || likes.length,
            reply_count: c.reply_count || 0,
            is_deleted: c.is_deleted || false,
            is_edited: c.is_edited || false,
            thread_level: c.thread_level || 0,
            status: c.moderation_status || 'approved',
            moderation_status: c.moderation_status || 'approved',
            profiles: rawProfile || null,
            user_profile: rawProfile || null,
            comment_reactions: reactions,
            comment_likes: likes,
            comment_bookmarks: bookmarks,
            reaction_counts: reactionCounts,
            replies: [],
            is_liked: currentUserId ? likes.some((l: any) => l.user_id === currentUserId) : false,
            is_bookmarked: currentUserId ? bookmarks.some((b: any) => b.user_id === currentUserId) : false,
            can_edit: currentUserId === c.user_id,
            can_delete: currentUserId === c.user_id
        };
        
        commentMap.set(c.id, normalized);
        flatList.push(normalized);
      });

      // Build Tree
      flatList.forEach(c => {
        if (c.parent_id && commentMap.has(c.parent_id)) {
          const parent = commentMap.get(c.parent_id);
          if (parent) {
            parent.replies = parent.replies || [];
            parent.replies.push(c);
            parent.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
        } else {
          roots.push(c);
        }
      });

      // Sort Roots
      const sortedRoots = roots.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0);
        switch (sortOrder) {
          case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case 'popular': return (b.like_count || 0) - (a.like_count || 0);
          case 'newest': default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
      });

      setTotalCount(flatList.length); 
      setComments(sortedRoots); 
      setDisplayedComments(sortedRoots.slice(0, loadedCount));
      console.log('✅ Comments state updated:', sortedRoots.length, 'root comments');

    } catch (err: any) {
      console.error('❌ Error loading comments:', err);
      setError(err.message || 'Failed to load comments');
    } finally {
      console.log('🏁 fetchComments completed, setting isLoading to false');
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [activeId, sortOrder, loadedCount]);

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchComments for articleId:', activeId);
    fetchComments().catch((err) => {
      console.error('❌ fetchComments failed in useEffect:', err);
    });
  }, [fetchComments]);

  const handleLoadMore = () => {
    const nextCount = loadedCount + COMMENTS_PER_PAGE;
    setLoadedCount(nextCount);
  };

  if (!activeId) return null;

  return (
    <section className="tinkbyte-comment-section" id="comments-section" data-article-id={activeId}>
      {/* Header */}
      <div className="thread-header">
        <div className="thread-header-content">
            <div className="thread-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span className="thread-label">THREAD</span>
                <span className="thread-count">{totalCount}</span>
            </div>
            <div className="header-actions">
                <button className="manage-btn" onClick={() => window.location.href='/auth/profile'}>
                  Manage Your <span className="highlight">TINKBYTE</span> Account
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </button>
            </div>
        </div>
        <div className="thread-subtitle">
            {postTitle ? `Discussion on: ${postTitle}` : 'We want to hear from you! Share your opinions in the thread below.'}
        </div>
      </div>

      <div className="comment-form-section">
         <CommentForm articleSlug={activeId} onSuccess={fetchComments} />
      </div>

      {comments.length > 0 && (
          <div className="sort-section">
              <div className="sort-controls">
                <label>Sort by:</label>
                <select 
                  className="sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Popular</option>
                </select>
              </div>
          </div>
      )}

      <div className="comments-container">
        {isLoading ? (
          <div className="loading-state">
             <div className="loading-spinner"></div>
             <p>Loading discussion...</p>
          </div>
        ) : error ? (
            <div className="error-message">
                <AlertCircle size={24} />
                <p>Unable to load comments. {error}</p>
                <button onClick={fetchComments} className="retry-btn">Retry</button>
            </div>
        ) : displayedComments.length > 0 ? (
          <div className="comments-list">
             {displayedComments.map(comment => (
               <CommentItem 
                 key={comment.id} 
                 comment={comment} 
                 articleSlug={activeId}
                 onRefresh={fetchComments}
                 level={0}
               />
             ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-content">
                <div className="empty-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                </div>
                <h3 className="empty-title">No comments yet</h3>
                <p className="empty-description">Be the first to share your thoughts on this article.</p>
            </div>
          </div>
        )}
      </div>

      {comments.length > displayedComments.length && (
        <div className="load-more-section">
          <div className="load-more-container">
            <div className="load-more-info">
              <span className="showing-count">
                Showing {displayedComments.length} of {comments.length} comments
              </span>
            </div>
            <button className="load-more-btn" onClick={handleLoadMore}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 12,15 18,9"></polyline>
              </svg>
              Load More Comments
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CommentSection;
