-- Rate limiting tracking
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_rate_limits_user_action_time 
ON public.user_rate_limits(user_id, action_type, created_at);

CREATE INDEX IF NOT EXISTS idx_user_rate_limits_cleanup 
ON public.user_rate_limits(created_at);

-- Auto-cleanup function
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_rate_limits 
    WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE public.user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits" 
ON public.user_rate_limits FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert rate limits" 
ON public.user_rate_limits FOR INSERT 
WITH CHECK (true);