'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export const PageLoader: React.FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stop loader as soon as route commits
  useEffect(() => {
    setNavigating(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [pathname, searchParams]);

  // Listen for internal link clicks to trigger animated loader immediately
  useEffect(() => {
    const startLoader = () => {
      setNavigating(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      // Safety auto-hide if route change is aborted
      timerRef.current = setTimeout(() => setNavigating(false), 6000);
    };

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target && anchor.target !== '_self') return;

      try {
        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.origin !== window.location.origin) return;
        const currentFull = `${window.location.pathname}${window.location.search}`;
        const nextFull = `${targetUrl.pathname}${targetUrl.search}`;
        if (currentFull === nextFull) return;

        startLoader();
      } catch {}
    };

    document.addEventListener('click', handleClick, true);
    window.addEventListener('mbm_nav_start', startLoader);
    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('mbm_nav_start', startLoader);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!navigating) return null;

  return (
    <>
      {/* Top animated progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-emerald-100/80 overflow-hidden z-[9999] pointer-events-none">
        <div className="h-full w-1/2 bg-gradient-to-r from-[#064E3B] via-[#16A34A] to-[#FF5722] animate-[mbm-nav-bar_0.9s_ease-in-out_infinite]" />
      </div>

      {/* Subtle floating animated loading pill */}
      <div
        role="status"
        aria-live="polite"
        className="fixed top-4 right-4 z-[9999] bg-white/95 backdrop-blur-md border border-emerald-200 shadow-xl rounded-full px-3.5 py-2 flex items-center space-x-2.5 pointer-events-none animate-in fade-in duration-150"
      >
        <span className="w-4 h-4 rounded-full border-2 border-emerald-200 border-t-[#16A34A] border-r-[#FF5722] animate-spin" />
        <span className="text-xs font-extrabold text-[#064E3B]">Loading...</span>
      </div>

      <style>{`
        @keyframes mbm-nav-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </>
  );
};
