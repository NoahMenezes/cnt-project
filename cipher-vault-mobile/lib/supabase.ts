import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yeqmskzlpdntcnqjwdon.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllcW1za3pscGRudGNucWp3ZG9uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTYyODMsImV4cCI6MjA5NTQzMjI4M30.8tfUUIgt_5JywSJqXA_3BqYFAgBiY6BRvf_Y4CdWMdU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

// ── DB Types ──────────────────────────────────────────────────────────────────
export interface DeviceRecord {
  id: string;
  user_id: string;
  device_name: string;
  public_key: string;
  created_at: string;
}

export interface EphemeralTransfer {
  id: string;
  device_id: string;
  encrypted_payload: string;
  encrypted_session_key: string;
  aes_iv: string;
  aes_mode: string;
  document_name: string;
  created_at: string;
}
