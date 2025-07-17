-- Function to get comments with user info and stats
CREATE OR REPLACE FUNCTION get_comments_with_stats(article_slug text)
RETURNS TABLE (
    id uuid,
    content text,
    created_at timestamptz,
    updated_at timestamptz,
    is_edited boolean,
    like_count integer,
    parent_id uuid,
    thread_level integer,
    moderation_status text,
    is_pinned boolean,
    reaction_counts jsonb,
    user_id uuid,
    user_display_name text,
    user_avatar_url text,
    is_author boolean,
    reply_to_user uuid,
    reply_to_display_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.created_at,
        c.updated_at,
        c.is_edited,
        c.like_count,
        c.parent_id,
        c.thread_level,
        c.moderation_status,
        c.is_pinned,
        c.reaction_counts,
        c.user_id,
        COALESCE(p.display_name, CONCAT(p.first_name, ' ', p.last_name)) as user_display_name,
        p.avatar_url,
        (a.author_id = c.user_id) as is_author,
        c.reply_to_user,
        COALESCE(rp.display_name, CONCAT(rp.first_name, ' ', rp.last_name)) as reply_to_display_name
    FROM public.comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.profiles rp ON c.reply_to_user = rp.id
    LEFT JOIN public.articles a ON c.article_id = a.slug
    WHERE c.article_id = article_slug 
    AND c.moderation_status IN ('approved', 'auto_approved')
    AND c.is_deleted = false
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate thread level
CREATE OR REPLACE FUNCTION calculate_thread_level(parent_comment_id uuid)
RETURNS integer AS $$
DECLARE
    parent_level integer := 0;
BEGIN
    IF parent_comment_id IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT thread_level INTO parent_level
    FROM public.comments
    WHERE id = parent_comment_id;
    
    RETURN LEAST(parent_level + 1, 3); -- Max 3 levels
END;
$$ LANGUAGE plpgsql;

-- Function to update article comment count
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.articles 
        SET comment_count = comment_count + 1 
        WHERE slug = NEW.article_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.articles 
        SET comment_count = comment_count - 1 
        WHERE slug = OLD.article_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment count updates
DROP TRIGGER IF EXISTS update_article_comment_count_trigger ON public.comments;
CREATE TRIGGER update_article_comment_count_trigger
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_article_comment_count();