import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * MegaBachatMart Subdomain & Multi-Tenant Routing Middleware
 *
 * Handles routing for:
 * 1. admin.mymbmart.com -> routes to /admin dashboard
 * 2. partners.mymbmart.com -> routes to /partners hub & shop portal
 * 3. mymbmart.com / localhost -> standard consumer storefront
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Extract clean host (removing port for local dev)
  const host = hostname.split(':')[0].toLowerCase();
  const { pathname } = url;

  // Ignore static assets, Next.js internal files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // static files like favicon.ico, images, robots.txt
  ) {
    return NextResponse.next();
  }

  // 1. SUBDOMAIN: admin.mymbmart.com (or admin.localhost)
  if (host.startsWith('admin.') || host === 'admin.mymbmart.com') {
    // If user accesses root on admin subdomain, rewrite to /admin
    if (pathname === '/' || pathname === '') {
      url.pathname = '/admin';
      return NextResponse.rewrite(url);
    }
    // If not already prefixed with /admin, prefix it
    if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. SUBDOMAIN: partners.mymbmart.com (or partners.localhost)
  if (host.startsWith('partners.') || host === 'partners.mymbmart.com') {
    // Root on partners subdomain routes to /partners homepage
    if (pathname === '/' || pathname === '') {
      url.pathname = '/partners';
      return NextResponse.rewrite(url);
    }
    // Direct shortcuts on partners subdomain
    if (pathname === '/login') {
      url.pathname = '/shop/login';
      return NextResponse.rewrite(url);
    }
    if (pathname === '/portal') {
      url.pathname = '/shop/portal';
      return NextResponse.rewrite(url);
    }
    if (pathname === '/register' || pathname === '/apply') {
      url.pathname = '/shop/register';
      return NextResponse.rewrite(url);
    }
    if (!pathname.startsWith('/partners') && !pathname.startsWith('/shop')) {
      url.pathname = `/partners${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 3. MAIN DOMAIN: mymbmart.com / www.mymbmart.com / localhost
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
