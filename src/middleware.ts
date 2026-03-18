import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/src/shared/lib/supabase/middleware';
import { createClient } from '@/src/shared/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // Update session first
  const response = await updateSession(request);

  // Protect routes
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/write') || request.nextUrl.pathname.startsWith('/me');

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
