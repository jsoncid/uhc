-- =====================================================
-- SCRIBBLE_TEXT TABLE – Module 5  (Mobile Notes)
-- =====================================================
-- Stores note stubs created from the web app before
-- handing off to the mobile canvas via deep link.
-- Run this in the Supabase SQL Editor.
--
-- IMPORTANT: This table lives in the "module5" schema.
-- Make sure the schema exists before running:
--   CREATE SCHEMA IF NOT EXISTS module5;
-- =====================================================

-- Ensure the schema exists
CREATE SCHEMA IF NOT EXISTS module5;

-- =====================================================
-- TABLE DEFINITION
-- =====================================================
CREATE TABLE IF NOT EXISTS module5.scribble_text (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id     UUID NOT NULL,
    input_uuid  UUID NOT NULL,
    content     TEXT,

    -- Every row must belong to an authenticated user
    CONSTRAINT fk_scribble_text_user
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scribble_text_user_id    ON module5.scribble_text(user_id);
CREATE INDEX IF NOT EXISTS idx_scribble_text_input_uuid ON module5.scribble_text(input_uuid);
CREATE INDEX IF NOT EXISTS idx_scribble_text_created_at ON module5.scribble_text(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_scribble_text_input_uuid ON module5.scribble_text(input_uuid);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE module5.scribble_text ENABLE ROW LEVEL SECURITY;

-- SELECT – users can only read their own notes
CREATE POLICY "Users can view own scribble_text"
    ON module5.scribble_text
    FOR SELECT
    USING (auth.uid() = user_id);

-- INSERT – authenticated users can create notes, but only for themselves
CREATE POLICY "Authenticated users can insert own scribble_text"
    ON module5.scribble_text
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = user_id
    );

-- UPDATE – users can only update their own notes
CREATE POLICY "Users can update own scribble_text"
    ON module5.scribble_text
    FOR UPDATE
    USING  (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- DELETE – users can only delete their own notes
CREATE POLICY "Users can delete own scribble_text"
    ON module5.scribble_text
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- GRANT USAGE so the Supabase anon/authenticated roles
-- can access the module5 schema via PostgREST
-- =====================================================
GRANT USAGE ON SCHEMA module5 TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA module5 TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA module5 GRANT ALL ON TABLES TO anon, authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE  module5.scribble_text              IS 'Note stubs created on the web before mobile canvas editing';
COMMENT ON COLUMN module5.scribble_text.user_id      IS 'Owner – references auth.users(id)';
COMMENT ON COLUMN module5.scribble_text.input_uuid   IS 'Client-generated UUID passed to mobile app via deep link';
COMMENT ON COLUMN module5.scribble_text.content       IS 'Note body – NULL when first created, populated by mobile app';
