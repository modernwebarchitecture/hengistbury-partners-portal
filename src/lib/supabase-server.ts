import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Server client — used in Astro pages and middleware.
// Requires the raw Request so we can read the Cookie header correctly.
export function createSupabaseServerClient(request: Request, cookies: AstroCookies) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}

// Utility: get authenticated user from server context
export async function getUser(request: Request, cookies: AstroCookies) {
  const supabase = createSupabaseServerClient(request, cookies);
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// Utility: get user profile with role.
// Uses a security definer RPC to avoid recursive RLS on the profiles table.
export async function getUserProfile(request: Request, cookies: AstroCookies) {
  const { supabase, user } = await getUser(request, cookies);
  if (!user) return { supabase, user: null, profile: null };

  const { data: role } = await supabase.rpc('get_current_user_role');

  const profile = {
    id: user.id,
    email: user.email ?? '',
    full_name: (user.user_metadata?.full_name as string) ?? null,
    role: ((role as string) ?? 'investor') as 'investor' | 'admin',
    created_at: '',
  };

  return { supabase, user, profile };
}
