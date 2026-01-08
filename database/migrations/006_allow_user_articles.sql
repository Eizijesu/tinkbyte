-- Migration: Allow authenticated users to create and manage their own articles
-- Date: 2026-01-08

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON articles;

-- Create policy to allow users to insert their own articles
CREATE POLICY "Users can insert their own articles"
ON articles
FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Create policy to allow users to update their own articles
CREATE POLICY "Users can update their own articles"
ON articles
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Create policy to allow users to delete their own articles
CREATE POLICY "Users can delete their own articles"
ON articles
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Create policy to allow anyone to view published articles
CREATE POLICY "Anyone can view published articles"
ON articles
FOR SELECT
TO public
USING (is_published = true);

-- Create policy to allow users to view their own draft articles
CREATE POLICY "Users can view their own articles"
ON articles
FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Create policy to allow admins to manage all articles
CREATE POLICY "Admins can manage all articles"
ON articles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
