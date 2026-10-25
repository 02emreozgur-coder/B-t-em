import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface IPhoneFrameProps {
  children: React.ReactNode;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({ children }) => {
  const { viewMode, setViewMode, isDarkMode } = useApp();

  // Detect whether running directly on iPhone or mobile browser
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [detectedModel, setDetectedModel] = useState<string>('iPhone 11');
  const [phoneChassis, setPhoneChassis] = useState<'iphone11' | 'iphone16'>('iphone11');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) || window.innerWidth <= 640;
      setIsMobileDevice(isMobile);

      if (/iPhone/i.test(ua)) {
        // iPhone 11 screen is 414 x 896 points
        if ((window.screen.width === 414 && window.screen.height === 896) || window.innerWidth <= 430) {
          setDetectedModel('iPhone 11');
          setPhoneChassis('iphone11');
        } else {
          setDetectedModel('iPhone 11 (iOS)');
        }
      }
    }
  }, []);

  // When visited on actual mobile / iPhone: Render natively full-screen without desktop borders
  if (isMobileDevice || viewMode === 'responsive') {
    return (
      <div className={`w-full min-h-[100dvh] bg-slate-50 dark:bg-slate-950 flex flex-col relative select-none overflow-x-hidden ${isDarkMode ? 'dark' : ''}`}>
        {/* iOS Native Safe Notch padding on real device */}
        <div className="w-full max-w-md mx-auto min-h-[100dvh] flex flex-col relative bg-white dark:bg-slate-900 shadow-none sm:shadow-2xl">
          {children}
        </div>
      </div>
    );
  }

  // Desktop Simulator mode with iPhone 11 chassis
  return (
    <div className={`min-h-screen bg-slate-950 py-4 sm:py-6 px-2 flex flex-col items-center justify-center ${isDarkMode ? 'dark' : ''}`}>
      {/* Top Helper Bar for switching models on desktop */}
      <div className="hidden sm:flex items-center gap-3 mb-3 text-xs text-slate-400 no-print">
        <div className="flex items-center gap-1.5 bg-slate-800/90 text-emerald-400 px-3 py-1 rounded-full border border-slate-700/60 font-semibold shadow-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{detectedModel} Moduna Uyarlandı (414 × 896 pt)</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl border border-slate-700">
          <button
            onClick={() => setPhoneChassis('iphone11')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              phoneChassis === 'iphone11'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            iPhone 11 (Klasik Çentik)
          </button>
          <button
            onClick={() => setPhoneChassis('iphone16')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              phoneChassis === 'iphone16'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            iPhone 16 Pro (Dinamik Ada)
          </button>
        </div>

        <button
          onClick={() => setViewMode('responsive')}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Tam Ekran Mobil Görünüm</span>
        </button>
      </div>

      {/* iPhone 11 (414x896) Chassis */}
      <div
        className={`w-full sm:w-[414px] h-[100dvh] sm:h-[896px] sm:max-h-[94vh] bg-black sm:rounded-[54px] p-0 sm:p-[12px] shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_0_3px_rgba(255,255,255,0.12)] flex flex-col relative overflow-hidden ring-1 ring-slate-800 transition-all`}
      >
        {/* iPhone 11 Classic Wide Notch vs iPhone 16 Pro Pill */}
        {phoneChassis === 'iphone11' ? (
          /* iPhone 11 Iconic Top Notch */
          <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 z-50 w-44 h-7 bg-black rounded-b-2xl items-center justify-center px-4 shadow-md">
            {/* Speaker bar & Front camera */}
            <div className="w-12 h-1 bg-slate-800 rounded-full mr-2" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          </div>
        ) : (
          /* Dynamic Island */
          <div className="hidden sm:flex absolute top-3.5 left-1/2 -translate-x-1/2 z-50 w-28 h-6 bg-black rounded-full items-center justify-end px-2.5 shadow-md">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
          </div>
        )}

        {/* Screen inner wrapper */}
        <div className="w-full h-full bg-slate-50 dark:bg-slate-950 sm:rounded-[44px] flex flex-col relative overflow-hidden border border-slate-800/30">
          {/* iOS Status Bar */}
          <div className="w-full h-11 px-6 pt-1 shrink-0 flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white select-none z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md">
            {/* Clock matching iPhone 11 */}
            <span className="font-bold tracking-tight text-[13px] ml-1">12:40</span>

            {/* Right Status icons */}
            <div className="flex items-center gap-1.5 text-slate-900 dark:text-white mr-1">
              <Signal className="w-3.5 h-3.5 fill-current" />
              <Wifi className="w-3.5 h-3.5" />
              <div className="flex items-center gap-0.5 font-bold text-[11px] tabular-nums">
                <span>91</span>
                <BatteryMedium className="w-4 h-4 fill-current" />
              </div>
            </div>
          </div>

          {/* App Body Viewport */}
          <div className="flex-1 overflow-y-auto flex flex-col relative no-scrollbar">
            {children}
          </div>

          {/* iOS Bottom Home Bar */}
          <div className="w-full h-4 shrink-0 flex items-center justify-center pb-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs select-none pointer-events-none">
            <div className="w-32 h-1 bg-slate-400/80 dark:bg-slate-600 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
