
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { authManager } from '../../lib/auth';
import { config } from '../../lib/config';
import { COMMENT_CONFIG } from '../../lib/config/comments';
import { Loader2 } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface CommentFormProps {
  articleSlug: string;
  parentId?: string | null;
  replyToAuthor?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  isInline?: boolean;
  placeholder?: string;
  initialContent?: string;
  mode?: 'create' | 'edit';
  commentId?: string;
}

interface MentionUser {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  articleSlug, 
  parentId = null, 
  replyToAuthor,
  onSuccess, 
  onCancel,
  autoFocus = false,
  isInline = false,
  placeholder = "Share your thoughts...",
  initialContent = '',
  mode = 'create',
  commentId
}) => {
  const [content, setContent] = useState(initialContent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(authManager.getUser());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Mentions State
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [cursorPos, setCursorPos] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const checkUser = () => setUser(authManager.getUser());
    checkUser();
    const unsub = authManager.onAuthChange ? authManager.onAuthChange(checkUser) : null;
    return () => { if(unsub) unsub(); }
  }, []);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      const val = textareaRef.current.value;
      textareaRef.current.setSelectionRange(val.length, val.length);
    }
  }, [autoFocus]);

  // Handle Mention Logic
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    const newPos = e.target.selectionStart;
    setContent(newVal);
    setCursorPos(newPos);

    // Detect @ symbol
    const textBeforeCursor = newVal.substring(0, newPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentions(true);
      
      // Fetch users
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .ilike('display_name', `%${query}%`)
        .limit(5);
        
      if (data) {
        setMentionUsers(data.map(u => ({
          id: u.id,
          display_name: u.display_name,
          username: u.display_name.replace(/\s+/g, '').toLowerCase(),
          avatar_url: u.avatar_url
        })));
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (user: MentionUser) => {
    const textBeforeCursor = content.substring(0, cursorPos);
    const textAfterCursor = content.substring(cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const start = textBeforeCursor.substring(0, mentionMatch.index);
      const newContent = `${start}@${user.display_name} ${textAfterCursor}`;
      setContent(newContent);
      setShowMentions(false);
      
      setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.focus();
            const newCursor = start.length + user.display_name.length + 2;
            textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousValue = textarea.value;
    const selectedText = previousValue.substring(start, end);
    const newValue = previousValue.substring(0, start) + before + selectedText + after + previousValue.substring(end);
    setContent(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertEmoji = (emoji: string) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    const currentUser = authManager.getUser();
    if (!currentUser) {
        window.location.href = '/auth/signin';
        return;
    }

    setIsSubmitting(true);

    try {
      const timestamp = new Date().toISOString();
      const environment = config.environment || 'production';

      if (mode === 'edit' && commentId) {
        const { error } = await supabase
          .from('comments')
          .update({
            content: content,
            is_edited: true,
            updated_at: timestamp
          })
          .eq('id', commentId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
      } else {
        // Calculate thread level from parent if replying
        let threadLevel = 0;
        if (parentId) {
             const { data: parentData } = await supabase
                .from('comments')
                .select('thread_level')
                .eq('id', parentId)
                .single();
             if (parentData) {
                 threadLevel = Math.min((parentData.thread_level || 0) + 1, 4);
             }
        }

        const { error } = await supabase.from('comments').insert({
          content: content,
          article_id: articleSlug,
          user_id: currentUser.id,
          parent_id: parentId,
          thread_level: threadLevel,
          environment: environment,
          created_at: timestamp,
          updated_at: timestamp,
          moderation_status: 'auto_approved',
          like_count: 0
        });

        if (error) throw error;
      }

      setContent('');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Error posting:', err);
      alert('Failed to post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="guest-comment-prompt">
        <div className="guest-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div className="guest-prompt-content">
          <input 
             type="text" 
             className="guest-comment-input" 
             placeholder="Share your thoughts" 
             readOnly
             onClick={() => window.location.href = '/auth/signin'}
          />
          <div className="guest-prompt-text">
             <a href="/auth/signin" className="auth-link">Sign in</a> to join the conversation
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isInline ? "inline-comment-form" : "user-comment-form"}>
      <form onSubmit={handleSubmit} className="comment-form-container relative">
        {/* Formatting Toolbar */}
        <div className="formatting-toolbar">
          <div className="format-buttons">
            <button type="button" className="format-btn" onClick={() => insertText('**', '**')} title="Bold">
                <strong>B</strong>
            </button>
            <button type="button" className="format-btn" onClick={() => insertText('*', '*')} title="Italic">
                <em>I</em>
            </button>
            <button type="button" className="format-btn" onClick={() => insertText('`', '`')} title="Code">
                <code>&lt;/&gt;</code>
            </button>
            <button type="button" className="mention-btn" onClick={() => insertText('@')} title="Mention User">
               <span>@</span>
            </button>
            <div className="relative">
                <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Emoji">
                    <span>😊</span>
                </button>
                {showEmojiPicker && (
                    <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />
                )}
            </div>
          </div>
          <div className="character-count">
             <span className={`count ${content.length > 800 ? 'text-orange-500' : ''}`}>
                {content.length}
             </span>
             /{COMMENT_CONFIG.characterLimits.max}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="comment-textarea"
          placeholder={placeholder}
          value={content}
          onChange={handleContentChange}
          disabled={isSubmitting}
          rows={isInline ? 3 : 4}
          maxLength={COMMENT_CONFIG.characterLimits.max}
        />

        {/* Mention Dropdown */}
        {showMentions && mentionUsers.length > 0 && (
            <div className="mention-suggestions show" style={{ 
                top: 'auto', 
                bottom: '100%', 
                left: 0,
                zIndex: 100
            }}>
                <div className="mention-list">
                    {mentionUsers.map(u => (
                        <div 
                            key={u.id} 
                            className="mention-item"
                            onClick={() => insertMention(u)}
                        >
                            <div className="mention-item-avatar">
                                {u.avatar_url ? <img src={u.avatar_url} /> : <span>{u.display_name[0]}</span>}
                            </div>
                            <div className="mention-item-info">
                                <div className="mention-item-name">{u.display_name}</div>
                                <div className="mention-item-handle">@{u.username}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="form-footer">
          <div className="form-guidelines">
             Please respect our <a href="/legal/terms-of-service#community-guidelines" target="_blank">community guidelines</a>.
          </div>
          
          <div className="form-actions">
             {onCancel && (
               <button type="button" onClick={onCancel} className="cancel-btn">
                 Cancel
               </button>
             )}
             <button
               type="submit"
               disabled={isSubmitting || !content.trim()}
               className="submit-btn"
             >
               {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : (
                  <>
                    <span className="btn-text">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                       </svg>
                       {mode === 'edit' ? 'Save' : isInline ? 'Reply' : 'Post'}
                    </span>
                  </>
               )}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
};
