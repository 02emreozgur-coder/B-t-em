import React from 'react';
import {
  X,
  Wallet,
  Clock,
  Calendar,
  PieChart,
  BarChart3,
  Tags,
  Users,
  Bell,
  Settings,
  HelpCircle,
  MessageSquare,
  Calculator,
  Shield,
  Cloud,
  Moon,
  Sun,
  Coins,
  Target,
  Sparkles,
  ChevronRight,
  Crown
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenSettings: () => void;
  onOpenNotifications: () => void;
  onOpenInvestmentHub: () => void;
  onOpenReports: () => void;
  onOpenUpcoming: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenSettings,
  onOpenNotifications,
  onOpenInvestmentHub,
  onOpenReports,
  onOpenUpcoming
}) => {
  const {
    isDarkMode,
    toggleDarkMode,
    unreadNotificationCount,
    cloudBackup,
    triggerCloudBackup,
    activeLedger,
    setActiveLedger,
    ledgers,
    lockApp,
    faceIdEnabled
  } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex animate-in fade-in duration-200">
      <div className="w-72 max-w-[85vw] h-full bg-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-800 animate-in slide-in-from-left duration-200">
        {/* Top User Profile with PRO Badge */}
        <div className="p-4 bg-gradient-to-b from-slate-800/90 to-slate-900 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center gap-1">
                <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>PRO</span>
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-white">Emre Özgür</h3>
                <p className="text-[10px] text-slate-400">16 Mayıs 2027 · Aktif</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Ledger Switcher */}
          <div className="mt-3 flex items-center justify-between p-2 rounded-xl bg-slate-800/70 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span>{activeLedger}</span>
            </div>
            <select
              value={activeLedger}
              onChange={e => setActiveLedger(e.target.value)}
              className="bg-transparent text-[11px] font-semibold text-emerald-400 focus:outline-hidden cursor-pointer"
            >
              {ledgers.map(l => (
                <option key={l} value={l} className="bg-slate-800 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          <button
            onClick={() => {
              onClose();
              onNavigate('accounts');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Hesaplarım</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenInvestmentHub();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 font-bold transition-colors border border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <Coins className="w-4 h-4 text-amber-400" />
              <span>Kıymetli Maden & Döviz</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-md">
              KURLAR
            </span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('transactions');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Clock className="w-4 h-4 text-blue-400" />
            <span>İşlemler (Geçmiş)</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenUpcoming();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Yaklaşan İşlemler</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenReports();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Raporlar & Analizler</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('budget');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Target className="w-4 h-4 text-teal-400" />
            <span>Bütçe Planlama Analizi</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('categories');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Tags className="w-4 h-4 text-pink-400" />
            <span>Kategoriler</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onNavigate('contacts');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Kişiler & Borç/Alacak</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenNotifications();
            }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Bildirimler</span>
            </div>
            {unreadNotificationCount > 0 && (
              <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                {unreadNotificationCount}
              </span>
            )}
          </button>

          <div className="pt-2 border-t border-slate-800 my-2" />

          {/* Quick Action Toggles */}
          <button
            onClick={() => {
              triggerCloudBackup();
            }}
            disabled={cloudBackup.isSyncing}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <div className="flex items-center gap-3">
              <Cloud className={`w-4 h-4 ${cloudBackup.isSyncing ? 'text-amber-400 animate-spin' : 'text-blue-400'}`} />
              <span>Bulut Yedekleme</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {cloudBackup.isSyncing ? 'Yedekleniyor...' : 'Şimdi Yedekle'}
            </span>
          </button>

          {faceIdEnabled && (
            <button
              onClick={() => {
                onClose();
                lockApp();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Ekranı Kilitle (Face ID)</span>
            </button>
          )}

          {/* Dark Mode Switcher in Menu */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/40 text-slate-200 font-semibold">
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <span>Gece Modu (Dark)</span>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-slate-600 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 font-semibold transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Ayarlar</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>DEFTER 13.1 · Bütçem iOS</span>
          <span className="text-emerald-500 font-bold">Senkronize ✓</span>
        </div>
      </div>
    </div>
  );
};
