-- Enhanced comments table with new features
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending' 
    CHECK (moderation_status = ANY (ARRAY['pending', 'approved', 'flagged', 'hidden', 'auto_approved']));

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS auto_approved_reason text;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS mention_users uuid[] DEFAULT '{}';

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS reaction_counts jsonb DEFAULT '{}';

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 0;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS thread_level integer DEFAULT 0;

ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS reply_to_user uuid REFERENCES auth.users(id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_moderation_status 
ON public.comments(moderation_status);

CREATE INDEX IF NOT EXISTS idx_comments_thread_level 
ON public.comments(thread_level);

CREATE INDEX IF NOT EXISTS idx_comments_article_status 
ON public.comments(article_id, moderation_status);

-- Update existing comments to approved status
UPDATE public.comments 
SET moderation_status = 'approved' 
WHERE moderation_status IS NULL;