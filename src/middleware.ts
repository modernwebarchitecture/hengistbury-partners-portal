import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase-server';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;
  const path = url.pathname;

  const isPortalRoute =
    path.startsWith('/portal') && path !== '/portal/login';
  const isAdminRoute = path.startsWith('/admin');

  if (!isPortalRoute && !isAdminRoute) {
    return next();
  }

  const supabase = createSupabaseServerClient(cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/portal/login');
  }

  if (isAdminRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return redirect('/portal');
    }
  }

  return next();
});
