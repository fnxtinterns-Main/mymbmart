export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="relative flex flex-col items-center space-y-5">
        {/* Top animated progress bar */}
        <div className="fixed top-0 left-0 right-0 h-1 bg-emerald-100 overflow-hidden z-[200]">
          <div className="h-full w-1/2 bg-gradient-to-r from-[#064E3B] via-[#16A34A] to-[#FF5722] animate-[loading-bar_1s_ease-in-out_infinite]" />
        </div>

        {/* Animated branded spinner */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#16A34A] border-r-[#FF5722] animate-spin" />
          <div className="w-9 h-9 rounded-2xl bg-[#064E3B] text-white font-black text-xs flex items-center justify-center shadow-md animate-pulse">
            MBM
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-black text-[#064E3B] tracking-tight">
            MegaBachatMart
          </p>
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            Loading fresh groceries &amp; local stores...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
