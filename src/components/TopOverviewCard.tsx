import React from 'react';
import { Calendar, PieChart, BarChart3, Gauge, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';

export type HomeInlineViewType = 'accounts' | 'upcoming' | 'category' | 'periodic' | 'general';

interface TopOverviewCardProps {
  activeInlineView?: HomeInlineViewType;
  onSelectInlineView: (view: HomeInlineViewType) => void;
  onOpenInvestmentHub: () => void;
}

export const TopOverviewCard: React.FC<TopOverviewCardProps> = ({
  activeInlineView = 'accounts',
  onSelectInlineView,
  onOpenInvestmentHub
}) => {
  const { totalAssets, totalReceivables, totalDebts, netWorth, investmentsTotalTRY } = useApp();

  const formattedAssets = totalAssets.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedReceivables = totalReceivables.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedDebts = totalDebts.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedNetWorth = netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Ratio for mini bar
  const totalPositive = (totalAssets + totalReceivables) || 1;
  const totalBar = totalPositive + (totalDebts || 1);
  const assetRatio = Math.max(10, Math.min(90, (totalPositive / totalBar) * 100));
  const debtRatio = 100 - assetRatio;

  return (
    <div className="px-3 pt-2 pb-1">
      <div className="relative bg-gradient-to-b from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm transition-all">
        {/* Left Widget Sidebar & Card Main Body */}
        <div className="flex gap-3">
          {/* 4 Icon shortcut tabs */}
          <div className="flex flex-col gap-1.5 shrink-0 pr-2 border-r border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onSelectInlineView(activeInlineView === 'upcoming' ? 'accounts' : 'upcoming')}
              title="Yaklaşan İşlemler"
              className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                activeInlineView === 'upcoming'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectInlineView(activeInlineView === 'category' ? 'accounts' : 'category')}
              title="Kategori Dağılımı Raporu"
              className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                activeInlineView === 'category'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900'
              }`}
            >
              <PieChart className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectInlineView(activeInlineView === 'periodic' ? 'accounts' : 'periodic')}
              title="Periyodik Rapor"
              className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                activeInlineView === 'periodic'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/40'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectInlineView(activeInlineView === 'general' ? 'accounts' : 'general')}
              title="Genel Durum Analizi"
              className={`p-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                activeInlineView === 'general'
                  ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/40'
                  : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900'
              }`}
            >
              <Gauge className="w-4 h-4" />
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onSelectInlineView('accounts')}
              className="w-full text-center pb-1 group focus:outline-hidden"
              title="Hesaplarım Görünümüne Dön"
            >
              <span className={`text-[11px] font-bold tracking-wider uppercase transition-colors ${
                activeInlineView === 'accounts'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-emerald-600 dark:text-emerald-400 hover:underline'
              }`}>
                HESAPLARIM {activeInlineView !== 'accounts' && '← Dön'}
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {formattedAssets} <span className="text-lg font-bold">₺</span>
              </div>
            </button>

            {/* Alacaklar & Borçlar strip */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <div className="text-left">
                <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                  ALACAKLAR
                </span>
                <div className="font-bold text-slate-700 dark:text-slate-200 tabular-nums text-xs">
                  {formattedReceivables} <span className="text-[10px]">₺</span>
                </div>
              </div>

              {/* Mini Bar indicator */}
              <div className="w-20 sm:w-28 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden flex mx-2 shadow-inner">
                <div
                  style={{ width: `${assetRatio}%` }}
                  className="bg-blue-500 h-full transition-all duration-500"
                  title="Varlık Oranı"
                />
                <div
                  style={{ width: `${debtRatio}%` }}
                  className="bg-red-500 h-full transition-all duration-500"
                  title="Borç Oranı"
                />
              </div>

              <div className="text-right">
                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 tracking-wider">
                  BORÇLAR
                </span>
                <div className="font-bold text-red-600 dark:text-red-400 tabular-nums text-xs">
                  -{formattedDebts} <span className="text-[10px]">₺</span>
                </div>
              </div>
            </div>

            {/* Genel Durum footer inside card */}
            <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <button
                onClick={() => onSelectInlineView(activeInlineView === 'general' ? 'accounts' : 'general')}
                className={`text-[11px] font-bold uppercase transition-colors ${
                  activeInlineView === 'general'
                    ? 'text-purple-600 dark:text-purple-400 underline'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                GENEL DURUM
              </button>
              <div className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                {formattedNetWorth} <span className="text-xs font-bold">₺</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Investment Banner Trigger */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-amber-50/60 dark:bg-amber-950/20 -mx-3.5 -mb-3.5 px-3.5 py-2 rounded-b-2xl">
          <div className="flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-300 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Kıymetli Maden & Döviz Portföyü:</span>
            <span className="font-bold tabular-nums">
              ₺{investmentsTotalTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
            </span>
          </div>
          <button
            onClick={onOpenInvestmentHub}
            className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 hover:underline active:scale-95 transition-all"
          >
            Yatırım Yönetimi & Kurlar →
          </button>
        </div>
      </div>
    </div>
  );
};
