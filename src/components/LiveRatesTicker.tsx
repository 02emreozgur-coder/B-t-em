import React, { useRef } from 'react';
import { ArrowUpRight, ArrowDownRight, RefreshCw, Sparkles, Zap, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarketRate } from '../types';

interface LiveRatesTickerProps {
  onOpenInvestmentHub: () => void;
}

export const LiveRatesTicker: React.FC<LiveRatesTickerProps> = ({ onOpenInvestmentHub }) => {
  const { marketRates, arbitrageOpportunities, setSelectedAssetForHistory } = useApp();

  // Mobile double-tap tracking without lag
  const tapMap = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  const handleCardClick = (rate: MarketRate) => {
    onOpenInvestmentHub();
  };

  const handleTouchEnd = (rate: MarketRate, e: React.TouchEvent) => {
    const now = Date.now();
    if (tapMap.current.id === rate.code && now - tapMap.current.time < 350) {
      e.preventDefault();
      setSelectedAssetForHistory(rate);
      tapMap.current = { id: '', time: 0 };
    } else {
      tapMap.current = { id: rate.code, time: now };
    }
  };

  return (
    <div className="px-3 py-1">
      <div className="bg-slate-900 text-white rounded-xl p-2.5 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KURLAR</span>
          </div>

          <div className="flex items-center gap-1.5">
            {arbitrageOpportunities.length > 0 && (
              <button
                onClick={onOpenInvestmentHub}
                className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 animate-pulse"
              >
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Arbitraj!</span>
              </button>
            )}

            <button
              onClick={onOpenInvestmentHub}
              className="text-[10px] text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-md transition-colors"
            >
              <span>Detaylı Kurlar</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll ticker */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pt-2 pb-0.5">
          {marketRates.map(rate => {
            const isPositive = rate.changeRate >= 0;
            return (
              <div
                key={rate.code}
                onClick={() => handleCardClick(rate)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setSelectedAssetForHistory(rate);
                }}
                onTouchEnd={(e) => handleTouchEnd(rate, e)}
                title="Fiyat geçmişi için çift tıklayın / dokunun"
                className="shrink-0 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-left transition-all active:scale-95 cursor-pointer select-none group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                    {rate.symbol} {rate.name.split(' ')[0]}
                  </span>
                  <span
                    className={`text-[9px] font-bold flex items-center ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                    %{Math.abs(rate.changeRate).toFixed(2)}
                  </span>
                </div>
                <div className="text-xs font-extrabold text-white tabular-nums mt-0.5">
                  ₺{rate.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: rate.code === 'RUB' ? 3 : 2 })}
                  <span className="text-[9px] font-normal text-slate-400 ml-1">/{rate.unit}</span>
                </div>
                <div className="text-[8px] text-slate-500 flex items-center gap-0.5 mt-0.5 opacity-70 group-hover:opacity-100">
                  <Clock className="w-2 h-2" />
                  <span>Çift tıkla: Geçmiş</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
