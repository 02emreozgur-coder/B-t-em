import React, { useState, useEffect } from 'react';
import { Menu, Wallet, Bell, Search, Plus, ShieldCheck, Moon, Sun, ExternalLink, Copy, Check, Volume2, VolumeX, QrCode } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenNewAccount: () => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onOpenNotifications,
  onOpenNewAccount,
  onOpenSearch
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    unreadNotificationCount,
    activeLedger,
    faceIdEnabled,
    lockApp,
    audioAlertsEnabled,
    toggleAudioAlerts,
    testAudioAlert,
    notificationPermission,
    requestNotificationPermission
  } = useApp();

  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if browser notification permission should be prompted
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => setShowNotifPrompt(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    await requestNotificationPermission();
    setShowNotifPrompt(false);
  };

  // App URL from environment or current host
  const appUrl = typeof window !== 'undefined'
    ? window.location.href.split('?')[0]
    : 'https://ais-dev-mzwxur4c6v4gwkccdxl6vj-938559767221.europe-west2.run.app';

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-3.5 py-2.5">
        {/* Left: Menu button */}
        <button
          onClick={onOpenMenu}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-xs font-semibold"
          aria-label="Menü"
        >
          <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span>Menü</span>
        </button>

        {/* Center: Brand & Profile */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/40">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">
                {activeLedger}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
                Emre Özgür
              </div>
            </div>
          </div>

          {/* Small URL Link Icon (User requested: "Uygulamaya ulaşabileceğim URL bilgisini de görmek istiyorum ona bastığımda uygulama açılsın ancak küçük bir ikon şeklinde bunu göster") */}
          <button
            onClick={() => setShowUrlModal(true)}
            title="Uygulama Bağlantı URL'si"
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-600 active:scale-95 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Audio Alarm Mute/Unmute */}
          <button
            onClick={toggleAudioAlerts}
            title={audioAlertsEnabled ? 'Arbitraj Sesli Bildirim Açık (Tıkla Kapat)' : 'Arbitraj Sesli Bildirim Kapalı (Tıkla Aç)'}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              audioAlertsEnabled
                ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Notification bell with badge */}
          <button
            onClick={onOpenNotifications}
            className="relative p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-700 dark:text-slate-200"
            aria-label="Bildirimler"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-1">
          {/* Quick Lock if Face ID is enabled */}
          {faceIdEnabled && (
            <button
              onClick={lockApp}
              title="Ekranı Kilitle"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          {/* Dark Mode toggle button */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Açık Mod' : 'Karanlık Mod'}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Search */}
          <button
            onClick={onOpenSearch}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
            aria-label="Arama"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Add account */}
          <button
            onClick={onOpenNewAccount}
            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all"
            aria-label="Yeni Hesap Ekle"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* App URL Popover Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Uygulama Bağlantısı (URL)</h3>
                  <p className="text-[11px] text-slate-500">iPhone ve tarayıcıda doğrudan erişim</p>
                </div>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* URL Display Box */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">ERİŞİM URL'Sİ:</span>
              <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all select-all">
                {appUrl}
              </p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopyUrl}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
              </button>

              <a
                href={appUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs text-center"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Uygulamayı Aç</span>
              </a>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-normal">
              Bu bağlantıyı iPhone Safari tarayıcınızda açıp <b>"Ana Ekrana Ekle"</b> diyerek gerçek bir iOS uygulaması gibi kullanabilirsiniz.
            </p>
          </div>
        </div>
      )}

      {/* iOS Style Notification Permission Prompt Modal */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Bildirimlere İzin Verin 🔔
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Piyasa arbitraj fırsatları, önemli kur hareketleri ve bütçe aşım riskleri doğrudan iPhone kilit ekranınıza ve bildirim merkezinize iletilecektir.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNotifPrompt(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors"
              >
                Daha Sonra
              </button>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>İzin Ver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
