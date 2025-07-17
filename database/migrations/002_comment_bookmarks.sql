-- Comment bookmarks for users
CREATE TABLE IF NOT EXISTS public.comment_bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, comment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_bookmarks_user_id 
ON public.comment_bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_comment_bookmarks_comment_id 
ON public.comment_bookmarks(comment_id);

-- RLS policies
ALTER TABLE public.comment_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" 
ON public.comment_bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.comment_bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.comment_bookmarks FOR DELETE 
USING (auth.uid() = user_id);