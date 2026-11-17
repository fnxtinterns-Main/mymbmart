'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Smartphone, 
  CheckCircle2, 
  X, 
  Share2, 
  PlusSquare, 
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('ANDROID');

  useEffect(() => {
    // Detect if already installed / standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect user platform
    const userAgent = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      setPlatform('IOS');
    } else if (/Android/.test(userAgent)) {
      setPlatform('ANDROID');
    } else {
      setPlatform('DESKTOP');
    }

    // Capture standard PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Direct instruction if prompt isn't supported
      alert('To install: Tap your browser menu (⋮ or Share) and select "Install app" or "Add to Home Screen".');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in duration-150">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Install MegaBachatMart</h3>
            <p className="text-xs text-slate-500">Fast 20-min quick grocery delivery on your device</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-slate-900 text-sm">App Already Installed!</h4>
            <p className="text-xs text-slate-600">
              MegaBachatMart is already added to your home screen. Launch it directly from your device apps.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Install Button (Chrome / Android / Desktop) */}
            <button
              onClick={handleInstallClick}
              className="w-full bg-[#064E3B] hover:bg-emerald-950 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-emerald-950/20 text-xs sm:text-sm transition flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Smartphone className="w-5 h-5 text-emerald-300" />
              <span>Install Official App (1-Click)</span>
            </button>

            {/* Platform Specific Instructions */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                How to Add on Any Device
              </span>

              {platform === 'IOS' ? (
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">1.</span>
                    <span>Tap the <strong>Share</strong> button at the bottom of Safari (<Share2 className="w-3.5 h-3.5 inline text-blue-600" />).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">2.</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-slate-700" />).</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">3.</span>
                    <span>Tap <strong>"Add"</strong> in the top right.</span>
                  </div>
                </div>
              ) : platform === 'ANDROID' ? (
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">1.</span>
                    <span>Tap the 3 dots menu (<strong>⋮</strong>) in the top right of Chrome/Brave.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">2.</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="font-bold text-slate-900">3.</span>
                    <span>Confirm by tapping <strong>Install</strong>.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 text-slate-600">
                  <div className="flex items-start space-x-2">
                    <Laptop className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <span>On Chrome/Edge/Brave, click the <strong>Install</strong> icon in the address bar (top right) to install as a native desktop application.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Play Store / APK info */}
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-slate-700 space-y-1">
              <span className="font-bold text-[#064E3B] flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Storage Overhead</span>
              </span>
              <p>
                Uses lightweight Progressive Web App architecture (under 1 MB). Loads instantly, receives live price updates, and works offline.
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
