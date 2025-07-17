-- Comment edit history for transparency
CREATE TABLE IF NOT EXISTS public.comment_edit_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
    previous_content text NOT NULL,
    edited_by uuid REFERENCES auth.users(id),
    edited_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_edit_history_comment_id 
ON public.comment_edit_history(comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_edit_history_edited_at 
ON public.comment_edit_history(edited_at);

-- RLS policies
ALTER TABLE public.comment_edit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view edit history" 
ON public.comment_edit_history FOR SELECT 
USING (true);

CREATE POLICY "Users can create edit history for their comments" 
ON public.comment_edit_history FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.comments 
        WHERE id = comment_id AND user_id = auth.uid()
    )
);