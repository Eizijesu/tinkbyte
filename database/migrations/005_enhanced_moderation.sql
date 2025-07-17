-- Enhanced moderation features
ALTER TABLE public.comment_moderation 
ADD COLUMN IF NOT EXISTS auto_flagged boolean DEFAULT false;

ALTER TABLE public.comment_moderation 
ADD COLUMN IF NOT EXISTS severity_level text DEFAULT 'low' 
    CHECK (severity_level = ANY (ARRAY['low', 'medium', 'high', 'critical']));

ALTER TABLE public.comment_moderation 
ADD COLUMN IF NOT EXISTS resolved_at timestamp with time zone;

ALTER TABLE public.comment_moderation 
ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES auth.users(id);

-- Moderation rules table
CREATE TABLE IF NOT EXISTS public.moderation_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name text NOT NULL,
    rule_type text NOT NULL CHECK (rule_type = ANY (ARRAY['keyword', 'pattern', 'length', 'frequency'])),
    rule_config jsonb NOT NULL,
    action text NOT NULL CHECK (action = ANY (ARRAY['flag', 'hide', 'require_approval'])),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Default moderation rules
INSERT INTO public.moderation_rules (rule_name, rule_type, rule_config, action) VALUES
('Profanity Filter', 'keyword', '{"keywords": ["spam", "scam", "fake"], "case_sensitive": false}', 'flag'),
('Long Comments', 'length', '{"max_length": 2000}', 'require_approval'),
('Excessive Mentions', 'frequency', '{"max_mentions": 5}', 'flag'),
('URL Detection', 'pattern', '{"patterns": ["https?://", "www\\.", "\\.com", "\\.org"], "case_sensitive": false}', 'flag');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moderation_rules_active 
ON public.moderation_rules(is_active);

-- RLS policies
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active moderation rules" 
ON public.moderation_rules FOR SELECT 
USING (is_active = true);