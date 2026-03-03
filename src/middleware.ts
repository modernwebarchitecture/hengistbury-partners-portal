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

  const supabase = createSupabaseServerClient(context.request, cookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/portal/login');
  }

  if (isAdminRoute) {
    const { data: role } = await supabase.rpc('get_current_user_role');
    if (role !== 'admin') {
      return redirect('/portal');
    }
  }

  return next();
});
