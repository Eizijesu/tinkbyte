// src/lib/services/commentService.ts - Updated for static sites
import { supabase } from '../supabase';
import { checkRateLimit } from '../utils/rateLimiter';
import { validateComment, extractMentions } from '../helpers/commentHelpers';

export class CommentService {
  
  async createComment(
    articleId: string,
    content: string,
    userId?: string,
    parentId?: string,
    guestData?: { name: string; email: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    
    try {
      // Validate content
      const validation = validateComment(content);
      if (!validation.isValid) {
        return { 
          success: false, 
          error: validation.errors.join(', ') 
        };
      }
      
      // Check rate limits (only for authenticated users)
      if (userId) {
        const rateCheck = await checkRateLimit(userId, 'comment');
        if (!rateCheck.allowed) {
          return { 
            success: false, 
            error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` 
          };
        }
      }
      
      // Use appropriate SQL function based on user type
      let result;
      
      if (userId) {
        // Authenticated user
        result = await supabase.rpc('insert_user_comment', {
          p_article_id: articleId,
          p_user_id: userId,
          p_content: content,
          p_parent_id: parentId || null
        });
      } else if (guestData) {
        // Guest user
        result = await supabase.rpc('insert_guest_comment', {
          p_article_id: articleId,
          p_guest_name: guestData.name,
          p_guest_email: guestData.email,
          p_content: content,
          p_parent_id: parentId || null
        });
      } else {
        return { success: false, error: 'User authentication or guest data required' };
      }
      
      if (result.error) throw result.error;
      
      return { success: true, data: { id: result.data } };
      
    } catch (error) {
      console.error('Comment creation failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create comment' 
      };
    }
  }
}

export const commentService = new CommentService();