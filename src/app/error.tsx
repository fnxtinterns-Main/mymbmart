'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js caught error:', error);
    // If it is a ChunkLoadError from a new deployment, auto-reload once to fetch fresh assets
    if (
      typeof window !== 'undefined' &&
      (error?.message?.includes('Loading chunk') ||
       error?.name === 'ChunkLoadError' ||
       error?.message?.includes('failed to fetch'))
    ) {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        window.location.reload();
      }
    }
  }, [error]);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    } else {
      reset();
    }
  };

  return (
    <div 
      className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center"
      style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
    >
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-100 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto text-2xl font-black">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Something went wrong</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          A new version was just deployed or an unexpected network glitch occurred. Please refresh to load the latest release.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="bg-[#064E3B] hover:bg-emerald-950 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reload & Try Again</span>
          </button>
          <Link
            href="/"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm transition flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
