import React from 'react';
import { Clock, Wallet, Plus, Minus, Coins } from 'lucide-react';

interface BottomNavBarProps {
  currentTab: 'hesaplar' | 'islemler' | 'yatirim';
  onChangeTab: (tab: 'hesaplar' | 'islemler' | 'yatirim') => void;
  onQuickIncome: () => void;
  onQuickExpense: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onChangeTab,
  onQuickIncome,
  onQuickExpense
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 transition-colors pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1">
        {/* Tab 1: İŞLEMLER */}
        <button
          onClick={() => onChangeTab('islemler')}
          className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
            currentTab === 'islemler'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">İŞLEMLER</span>
        </button>

        {/* Tab 2: HESAPLAR */}
        <button
          onClick={() => onChangeTab('hesaplar')}
          className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
            currentTab === 'hesaplar'
              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">HESAPLAR</span>
        </button>

        {/* Tab 3: YATIRIM & EMTİA */}
        <button
          onClick={() => onChangeTab('yatirim')}
          className={`flex flex-col items-center justify-center h-full transition-colors active:scale-95 ${
            currentTab === 'yatirim'
              ? 'text-amber-500 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">YATIRIM</span>
        </button>

        {/* Action 4: GELİR */}
        <button
          onClick={onQuickIncome}
          className="flex flex-col items-center justify-center h-full text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 font-black" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1">GELİR</span>
        </button>

        {/* Action 5: GİDER */}
        <button
          onClick={onQuickExpense}
          className="flex flex-col items-center justify-center h-full text-red-600 dark:text-red-400 active:scale-95 transition-all group"
        >
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Minus className="w-4 h-4 font-black" />
          </div>
          <span className="text-[10px] font-bold tracking-tight mt-1">GİDER</span>
        </button>
      </div>
    </nav>
  );
};
