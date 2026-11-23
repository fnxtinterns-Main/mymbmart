import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getHomepageMarkdown } from '@/lib/homepageMarkdown';

/**
 * MegaBachatMart Subdomain & Multi-Tenant Routing Middleware
 *
 * Handles routing for:
 * 1. admin.mymbmart.com -> routes to /admin dashboard
 * 2. partners.mymbmart.com -> routes to /partners hub & shop portal
 * 3. mymbmart.com / localhost -> standard consumer storefront
 * 4. Agent readiness: RFC 8288 Link headers and Accept: text/markdown negotiation
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const acceptHeader = request.headers.get('accept') || '';

  // Extract clean host (removing port for local dev)
  const host = hostname.split(':')[0].toLowerCase();
  const { pathname } = url;

  // AGENT READINESS: Serve high-density Markdown when requested via Accept: text/markdown
  if (acceptHeader.includes('text/markdown') && (pathname === '/' || pathname === '')) {
    const md = getHomepageMarkdown();
    return new NextResponse(md, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Link': '<https://mymbmart.com/llms.txt>; rel="alternate"; type="text/plain", <https://mymbmart.com/>; rel="alternate"; type="text/markdown"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Helper to add RFC 8288 Link header and prevent stale CDN caching on page responses
  const applyAgentHeaders = (res: NextResponse) => {
    res.headers.set(
      'Link',
      '<https://mymbmart.com/llms.txt>; rel="alternate"; type="text/plain", <https://mymbmart.com/>; rel="alternate"; type="text/markdown"'
    );
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    return res;
  };

  // Ignore static assets, Next.js internal files, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // static files like favicon.ico, images, robots.txt, llms.txt
  ) {
    return NextResponse.next();
  }

  // 1. SUBDOMAIN: admin.mymbmart.com (or admin.localhost)
  if (host.startsWith('admin.') || host === 'admin.mymbmart.com') {
    // If user accesses root on admin subdomain, rewrite to /admin
    if (pathname === '/' || pathname === '') {
      url.pathname = '/admin';
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    // If not already prefixed with /admin, prefix it
    if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname}`;
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    return applyAgentHeaders(NextResponse.next());
  }

  // 2. SUBDOMAIN: partners.mymbmart.com (or partners.localhost)
  if (host.startsWith('partners.') || host === 'partners.mymbmart.com') {
    // Root on partners subdomain routes to /partners homepage
    if (pathname === '/' || pathname === '') {
      url.pathname = '/partners';
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    // Direct shortcuts on partners subdomain
    if (pathname === '/login') {
      url.pathname = '/shop/login';
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    if (pathname === '/portal') {
      url.pathname = '/shop/portal';
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    if (pathname === '/register' || pathname === '/apply') {
      url.pathname = '/shop/register';
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    if (!pathname.startsWith('/partners') && !pathname.startsWith('/shop')) {
      url.pathname = `/partners${pathname}`;
      return applyAgentHeaders(NextResponse.rewrite(url));
    }
    return applyAgentHeaders(NextResponse.next());
  }

  // 3. MAIN DOMAIN: mymbmart.com / www.mymbmart.com / localhost
  if (pathname === '/partner/login' || pathname === '/partners/login') {
    url.pathname = '/shop/login';
    return NextResponse.redirect(url);
  }
  if (
    pathname === '/partner/register' ||
    pathname === '/partners/register' ||
    pathname === '/partner/apply' ||
    pathname === '/partners/apply'
  ) {
    url.pathname = '/shop/register';
    return NextResponse.redirect(url);
  }

  return applyAgentHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
