import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Browser client — used in React islands (client:load)
// Uses createBrowserClient so the session is stored in cookies,
// which the server-side middleware can then read.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'investor' | 'admin';
  created_at: string;
};

export type Letter = {
  id: string;
  title: string;
  date: string;
  description: string | null;
  file_url: string | null;
  status: 'draft' | 'published';
  created_at: string;
};

export type Post = {
  id: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  status: 'draft' | 'published';
  created_at: string;
};
