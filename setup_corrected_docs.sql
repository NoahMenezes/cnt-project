CREATE TABLE IF NOT EXISTS public.corrected_documents (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    original_text TEXT,
    corrected_text TEXT,
    document_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS policies
ALTER TABLE public.corrected_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all actions for all users" ON public.corrected_documents
    AS PERMISSIVE FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);
