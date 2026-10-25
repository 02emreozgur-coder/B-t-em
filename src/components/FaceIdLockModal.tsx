import React, { useState, useEffect, useRef } from 'react';
import { Shield, ScanFace, Check, KeyRound, Camera, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const FaceIdLockModal: React.FC = () => {
  const { unlockApp } = useApp();
  const [scanState, setScanState] = useState<'scanning' | 'success' | 'failed' | 'pin'>('scanning');
  const [pinInput, setPinInput] = useState<string>('');
  const [useRealCamera, setUseRealCamera] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto trigger face scan on mount
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanState === 'scanning') {
      timer = setTimeout(() => {
        setScanState('success');
        setTimeout(() => {
          unlockApp();
        }, 900);
      }, 1800);
    }
    return () => clearTimeout(timer);
  }, [scanState, unlockApp]);

  // Handle camera stream if requested
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useRealCamera && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.warn('Camera access denied or unavailable', err);
          setUseRealCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [useRealCamera]);

  const handleManualScan = () => {
    setScanState('scanning');
  };

  const handlePinInput = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      if (next.length === 4) {
        // Any 4 digits or 1234
        setTimeout(() => {
          unlockApp();
        }, 300);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300 text-white">
      {/* Top iOS Lock status */}
      <div className="pt-10 flex flex-col items-center">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
          <Shield className="w-4 h-4 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Bütçem Güvenli Kilit</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {scanState === 'pin' ? 'Giriş için 4 haneli PIN girin' : 'Yüz Tanıma ile Güvenli Giriş'}
        </p>
      </div>

      {/* Center Biometric Face ID Scanner */}
      {scanState !== 'pin' ? (
        <div className="flex flex-col items-center justify-center my-auto">
          <div className="relative w-44 h-44 rounded-3xl flex items-center justify-center bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            {/* Real Camera Preview if toggled */}
            {useRealCamera && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-60"
              />
            )}

            {/* Sweep Scan line */}
            {scanState === 'scanning' && (
              <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-line shadow-[0_0_15px_#10b981]" />
            )}

            {/* Face ID Glyphs */}
            {scanState === 'success' ? (
              <div className="flex flex-col items-center animate-in zoom-in-75 duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center">
                  <Check className="w-10 h-10 text-emerald-400 stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-emerald-400 mt-2">Yüz Doğrulandı</span>
              </div>
            ) : (
              <div className="flex flex-col items-center animate-faceid">
                <div className="w-20 h-20 border-2 border-emerald-500/70 rounded-2xl flex items-center justify-center p-2 relative">
                  <ScanFace className="w-14 h-14 text-emerald-400" />
                  {/* Outer corner brackets */}
                  <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400" />
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400" />
                  <span className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400" />
                  <span className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400" />
                </div>
                <span className="text-[11px] font-semibold text-slate-300 mt-2.5">
                  Yüzünüz taranıyor...
                </span>
              </div>
            )}
          </div>

          {/* Toggle Camera button */}
          <button
            onClick={() => setUseRealCamera(prev => !prev)}
            className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors border border-slate-700/60"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>{useRealCamera ? 'Simülasyon Moduna Geç' : 'Canlı Kamerayı Kullan'}</span>
          </button>
        </div>
      ) : (
        /* PIN Code Fallback Screen */
        <div className="flex flex-col items-center justify-center my-auto w-full max-w-xs">
          {/* PIN Dots */}
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map(idx => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border border-slate-500 transition-all ${
                  pinInput.length > idx ? 'bg-emerald-400 border-emerald-400 scale-110' : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
              <button
                key={digit}
                onClick={() => handlePinInput(digit)}
                className="w-16 h-16 mx-auto rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white flex items-center justify-center border border-slate-700 transition-all"
              >
                {digit}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinInput('0')}
              className="w-16 h-16 mx-auto rounded-full bg-slate-800/90 hover:bg-slate-700 active:scale-95 text-xl font-bold text-white flex items-center justify-center border border-slate-700 transition-all"
            >
              0
            </button>
            <button
              onClick={() => setPinInput(prev => prev.slice(0, -1))}
              className="w-16 h-16 mx-auto rounded-full bg-slate-800/40 hover:bg-slate-700 active:scale-95 text-xs font-bold text-slate-400 flex items-center justify-center transition-all"
            >
              Sil
            </button>
          </div>
        </div>
      )}

      {/* Bottom Option Switcher */}
      <div className="pb-8 flex flex-col items-center gap-2">
        {scanState !== 'pin' ? (
          <button
            onClick={() => setScanState('pin')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN Kodu ile Giriş Yap</span>
          </button>
        ) : (
          <button
            onClick={() => setScanState('scanning')}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline transition-colors"
          >
            <ScanFace className="w-3.5 h-3.5" />
            <span>Yüz Tanıma (Face ID) ile Devam Et</span>
          </button>
        )}

        <button
          onClick={unlockApp}
          className="text-[11px] text-slate-500 hover:text-slate-300 mt-1"
        >
          Doğrulamayı Geç (Hızlı Giriş)
        </button>
      </div>
    </div>
  );
};
