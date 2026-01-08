-- Add current user as an author
-- User ID: da8ee08f-0a59-49a1-8929-34d61e2d1281

INSERT INTO authors (
  id,
  slug,
  name,
  bio,
  avatar,
  role,
  email,
  social,
  featured,
  follower_count,
  article_count,
  is_verified,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'da8ee08f-0a59-49a1-8929-34d61e2d1281',
  'user-' || 'da8ee08f',  -- Generate a slug from user ID
  'User',  -- Default name, can be updated later
  'Content creator and contributor',  -- Default bio
  NULL,  -- No avatar yet
  'Contributor',  -- Default role
  NULL,  -- Email can be added later
  '{}',  -- Empty social object
  false,  -- Not featured
  0,  -- No followers yet
  0,  -- No articles yet
  false,  -- Not verified
  true,  -- Active
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW(),
  is_active = true;
