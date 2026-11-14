import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-mint text-brand-green flex items-center justify-center mx-auto text-2xl font-black">
          404
        </div>
        <h2 className="text-2xl font-black text-slate-900">Page Not Found</h2>
        <p className="text-xs sm:text-sm text-slate-600">
          The page you are looking for might have been moved or doesn't exist.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-brand-forest hover:bg-emerald-900 text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/shop"
            className="bg-brand-orange hover:bg-brand-orange-hover text-white font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>Explore Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
