import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sparkles,
  TrendingUp,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Building,
  RefreshCw,
  Search,
  Filter,
  BarChart2,
  Clock,
  ArrowRightLeft,
  ChevronRight,
  CheckCircle2,
  SlidersHorizontal,
  History,
  Coins,
  DollarSign,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  X,
  Check,
  ChevronDown,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Flame,
  Award
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarketRate, SourceQuote, ArbitrageOpportunity, ArbitrageHistoryRecord, CurrencyCode } from '../types';

interface KurlarArbitrajViewProps {
  initialTab?: 'kurlar' | 'karsilastir' | 'arbitraj' | 'gecmis';
  onOpenParityTransfer?: (defaultAsset?: CurrencyCode) => void;
  onOpenHistoryModal?: (rate: MarketRate) => void;
}

export const KurlarArbitrajView: React.FC<KurlarArbitrajViewProps> = ({
  initialTab = 'kurlar',
  onOpenParityTransfer,
  onOpenHistoryModal
}) => {
  const {
    marketRates,
    arbitrageOpportunities,
    arbitrageHistory,
    clearArbitrageHistory,
    refreshMarketRates,
    audioAlertsEnabled,
    toggleAudioAlerts,
    testAudioAlert
  } = useApp();

  // Navigation tab matching RADAR PRO: 'kurlar' (Ana Sayfa) | 'karsilastir' (Fiyat Karşılaştırma) | 'arbitraj' (Arbitraj Radarı) | 'gecmis' (Fiyat Geçmişi)
  const [activeTab, setActiveTab] = useState<'kurlar' | 'karsilastir' | 'arbitraj' | 'gecmis'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Real-time ticking clock (RADAR PRO header)
  const [timeStr, setTimeStr] = useState<string>(() =>
    new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [assetFilter, setAssetFilter] = useState<'all' | 'gold' | 'currency'>('all');
  const [selectedFirmFilter, setSelectedFirmFilter] = useState<string>('all');

  // Arbitrage Simulator State
  const [simulatorQuantity, setSimulatorQuantity] = useState<number>(50);
  const [selectedOppForSim, setSelectedOppForSim] = useState<ArbitrageOpportunity | null>(null);

  // Arbitrage sub-tab: 'anlik' vs 'gecmis'
  const [arbitrageSubTab, setArbitrageSubTab] = useState<'anlik' | 'gecmis'>('anlik');

  // Firm History State (Default to numerical table as requested)
  const [selectedHistoryFirmId, setSelectedHistoryFirmId] = useState<string>('kaptan');
  const [selectedHistoryAsset, setSelectedHistoryAsset] = useState<string>('XAU');
  const [historyPoints, setHistoryPoints] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Unique list of firms
  const allFirms = useMemo(() => {
    const map = new Map<string, { id: string; name: string; url: string; type: string }>();
    marketRates.forEach(rate => {
      rate.sources?.forEach(s => {
        if (!map.has(s.sourceId)) {
          map.set(s.sourceId, { id: s.sourceId, name: s.sourceName, url: s.sourceUrl, type: s.sourceType });
        }
      });
    });
    return Array.from(map.values());
  }, [marketRates]);

  // Fetch numerical firm history
  useEffect(() => {
    if (activeTab === 'gecmis') {
      setIsLoadingHistory(true);
      fetch(`/api/rates/firm-history?firmId=${selectedHistoryFirmId}&code=${selectedHistoryAsset}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.points)) {
            setHistoryPoints(data.points);
          } else {
            setHistoryPoints([]);
          }
        })
        .catch(() => setHistoryPoints([]))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [activeTab, selectedHistoryFirmId, selectedHistoryAsset]);

  // Filtered market rates
  const filteredRates = useMemo(() => {
    return marketRates.filter(rate => {
      if (assetFilter === 'gold' && !rate.isMetal) return false;
      if (assetFilter === 'currency' && rate.isMetal) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rate.name.toLowerCase().includes(q) || rate.code.toLowerCase().includes(q);
        const matchesFirm = rate.sources?.some(s => s.sourceName.toLowerCase().includes(q));
        if (!matchesName && !matchesFirm) return false;
      }
      return true;
    });
  }, [marketRates, assetFilter, searchQuery]);

  // Default select first arbitrage opportunity for simulator if available
  useEffect(() => {
    if (arbitrageOpportunities.length > 0 && !selectedOppForSim) {
      setSelectedOppForSim(arbitrageOpportunities[0]);
    }
  }, [arbitrageOpportunities, selectedOppForSim]);

  // Refresh handler
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMarketRates();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Best Prices across the market for each asset (for highlighting best buy & sell)
  const marketExtremes = useMemo(() => {
    const map = new Map<string, { maxBuy: number; minSell: number; maxBuyFirm: string; minSellFirm: string }>();
    marketRates.forEach(rate => {
      let maxBuy = -Infinity;
      let minSell = Infinity;
      let maxBuyFirm = '';
      let minSellFirm = '';

      rate.sources?.forEach(s => {
        if (s.buyPrice > maxBuy) {
          maxBuy = s.buyPrice;
          maxBuyFirm = s.sourceName;
        }
        if (s.sellPrice > 0 && s.sellPrice < minSell) {
          minSell = s.sellPrice;
          minSellFirm = s.sourceName;
        }
      });

      if (maxBuy > 0 && minSell < Infinity) {
        map.set(rate.code, { maxBuy, minSell, maxBuyFirm, minSellFirm });
      }
    });
    return map;
  }, [marketRates]);

  // Key KPI assets for summary row (Gold, USD, EUR)
  const goldRate = marketRates.find(r => r.code === 'XAU') || marketRates[0];
  const usdRate = marketRates.find(r => r.code === 'USD');
  const eurRate = marketRates.find(r => r.code === 'EUR');

  return (
    <div className="space-y-3 pb-20 animate-in fade-in duration-200">
      {/* 1. RADAR PRO HEADER & TERMINAL BAR */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Brand & Live Beacon */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 ring-2 ring-slate-900 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white font-mono">RADAR</span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-teal-500 text-slate-950 uppercase tracking-wider">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  Canlı Piyasa Terminali & Arbitraj
                </p>
              </div>
            </div>

            {/* Live Indicator + Clock */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 font-mono text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                CANLI
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-200 tabular-nums font-bold text-[11px]">{timeStr}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {onOpenParityTransfer && (
              <button
                onClick={() => onOpenParityTransfer('XAU')}
                className="px-2.5 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-500/40 text-teal-300 font-bold text-[11px] transition-all flex items-center gap-1 active:scale-95"
                title="Parite Transferi"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-teal-400" />
                <span>Parite</span>
              </button>
            )}

            <button
              onClick={() => {
                toggleAudioAlerts();
                testAudioAlert();
              }}
              className={`p-1.5 rounded-xl border transition-all text-xs flex items-center gap-1 ${
                audioAlertsEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={audioAlertsEnabled ? 'Sesli Arbitraj Alarmı Açık' : 'Sesli Arbitraj Alarmı Kapalı'}
            >
              {audioAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
              title="Fiyatları Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* RADAR PRO Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('kurlar')}
            className={`py-2 px-1 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'kurlar'
                ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="truncate">Ana Sayfa</span>
          </button>

          <button
            onClick={() => setActiveTab('karsilastir')}
            className={`py-2 px-1 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'karsilastir'
                ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span className="truncate">Karşılaştırma</span>
          </button>

          <button
            onClick={() => setActiveTab('arbitraj')}
            className={`py-2 px-1 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === 'arbitraj'
                ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span className="truncate">Arbitraj</span>
            {arbitrageOpportunities.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute top-1.5 right-1.5" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('gecmis')}
            className={`py-2 px-1 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'gecmis'
                ? 'bg-teal-500 text-slate-950 shadow-sm font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="truncate">Fiyat Geçmişi</span>
          </button>
        </div>
      </div>

      {/* 2. RADAR PRO HORIZONTAL TICKER TAPE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 overflow-hidden shadow-xs">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5 text-[11px] font-mono">
          <span className="text-[10px] font-black uppercase text-teal-400 bg-teal-950/80 px-1.5 py-0.5 rounded border border-teal-800 shrink-0">
            PİYASA
          </span>
          {marketRates.slice(0, 10).map(r => {
            const spread = r.sellPrice - r.buyPrice;
            const isPositive = r.changeRate >= 0;
            return (
              <div key={r.code} className="flex items-center gap-1.5 shrink-0 px-2 border-r border-slate-800 last:border-0">
                <span className="font-bold text-slate-300">{r.symbol || r.code}</span>
                <span className="text-slate-400 text-[10px]">A:</span>
                <span className="text-slate-200 tabular-nums">₺{r.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-slate-400 text-[10px]">S:</span>
                <span className="text-slate-200 tabular-nums">₺{r.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? '▲' : '▼'}%{Math.abs(r.changeRate || 0.1).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. RADAR PRO SUMMARY KPI CARDS ROW (sum-row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Has Altın Card */}
        {goldRate && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                ALTIN (HAS 24K)
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">/ gr</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">ALIŞ</span>
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  ₺{goldRate.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">SATIŞ</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400 tabular-nums">
                  ₺{goldRate.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Makas: ₺{(goldRate.sellPrice - goldRate.buyPrice).toFixed(2)}</span>
              <span className="text-emerald-500 font-bold">▲ %{goldRate.changeRate?.toFixed(2) || '1.10'}</span>
            </div>
          </div>
        )}

        {/* Dolar Card */}
        {usdRate && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                DOLAR (USD/TRY)
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">$</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">ALIŞ</span>
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  ₺{usdRate.buyPrice.toFixed(3)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">SATIŞ</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  ₺{usdRate.sellPrice.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Makas: ₺{(usdRate.sellPrice - usdRate.buyPrice).toFixed(3)}</span>
              <span className="text-emerald-500 font-bold">▲ %{usdRate.changeRate?.toFixed(2) || '0.25'}</span>
            </div>
          </div>
        )}

        {/* Euro Card */}
        {eurRate && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                EURO (EUR/TRY)
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">€</span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">ALIŞ</span>
                <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">
                  ₺{eurRate.buyPrice.toFixed(3)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">SATIŞ</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400 tabular-nums">
                  ₺{eurRate.sellPrice.toFixed(3)}
                </span>
              </div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Makas: ₺{(eurRate.sellPrice - eurRate.buyPrice).toFixed(3)}</span>
              <span className="text-emerald-500 font-bold">▲ %{eurRate.changeRate?.toFixed(2) || '0.18'}</span>
            </div>
          </div>
        )}

        {/* Glowing Arbitrage Radar Card */}
        <div
          onClick={() => setActiveTab('arbitraj')}
          className="cursor-pointer bg-gradient-to-br from-teal-900/60 to-slate-900 rounded-2xl p-3 border border-teal-500/40 shadow-xs relative overflow-hidden group hover:border-teal-400 transition-all text-white"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ARBİTRAJ RADARI
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-200">
              {arbitrageOpportunities.length} FIRSAT
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] text-slate-400 block">EN YÜKSEK FARK</span>
              <div className="text-sm font-black text-teal-300 tabular-nums">
                {arbitrageOpportunities[0]
                  ? `+₺${arbitrageOpportunities[0].profitPerUnit.toFixed(2)} / ${arbitrageOpportunities[0].unit}`
                  : 'Fırsat Taranıyor...'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">KÂR ORANI</span>
              <div className="text-sm font-black text-amber-400 tabular-nums">
                {arbitrageOpportunities[0] ? `+%${arbitrageOpportunities[0].profitPercent}` : '%0.00'}
              </div>
            </div>
          </div>
          <div className="mt-1.5 pt-1.5 border-t border-teal-500/20 flex items-center justify-between text-[10px] text-teal-300">
            <span>Fırsatları İncele & Simüle Et</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* 4. RADAR PRO FIRM BAR & SEARCH */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Ürün veya firma ara (örn: Has Altın, Kaptan, Güneş, Dolar)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-teal-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Asset Category Filters */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setAssetFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                assetFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Tümü
            </button>
            <button
              onClick={() => setAssetFilter('gold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                assetFilter === 'gold'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Altın & Metal</span>
            </button>
            <button
              onClick={() => setAssetFilter('currency')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                assetFilter === 'currency'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <DollarSign className="w-3 h-3" />
              <span>Döviz</span>
            </button>
          </div>
        </div>

        {/* Firm Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
            FİRMA:
          </span>
          <button
            onClick={() => setSelectedFirmFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
              selectedFirmFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tüm Firmalar ({allFirms.length})
          </button>
          {allFirms.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFirmFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedFirmFilter === f.id
                  ? 'bg-teal-600 text-white font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/60'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* 5. TAB 1: ANA SAYFA - RADAR PRO FIRM GRID */}
      {activeTab === 'kurlar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allFirms
            .filter(f => selectedFirmFilter === 'all' || selectedFirmFilter === f.id)
            .map(firm => {
              // Extract all rates quoted by this firm
              const firmQuotes: Array<{
                rate: MarketRate;
                quote: SourceQuote;
                isMaxBuy: boolean;
                isMinSell: boolean;
              }> = [];

              filteredRates.forEach(rate => {
                const q = rate.sources?.find(s => s.sourceId === firm.id);
                if (q) {
                  const extremes = marketExtremes.get(rate.code);
                  const isMaxBuy = extremes ? q.buyPrice >= extremes.maxBuy - 0.01 : false;
                  const isMinSell = extremes ? q.sellPrice <= extremes.minSell + 0.01 : false;
                  firmQuotes.push({ rate, quote: q, isMaxBuy, isMinSell });
                }
              });

              if (firmQuotes.length === 0) return null;

              return (
                <div
                  key={firm.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col"
                >
                  {/* Firm Header */}
                  <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-xs">
                        <Building className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {firm.name}
                        </h3>
                        <span className="text-[10px] text-slate-400">
                          {firm.type || 'Piyasa Ekranı'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>CANLI</span>
                    </div>
                  </div>

                  {/* Firm Quotes Table */}
                  <div className="p-2 flex-1 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="pb-1.5 pl-1.5">ÜRÜN</th>
                          <th className="pb-1.5 text-right">ALIŞ</th>
                          <th className="pb-1.5 text-right">SATIŞ</th>
                          <th className="pb-1.5 text-right pr-1.5">MAKAS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                        {firmQuotes.map(({ rate, quote, isMaxBuy, isMinSell }) => {
                          const spread = quote.sellPrice - quote.buyPrice;
                          return (
                            <tr
                              key={rate.code}
                              onClick={() => {
                                if (onOpenHistoryModal) {
                                  onOpenHistoryModal(rate);
                                }
                              }}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                            >
                              <td className="py-2 pl-1.5 font-bold text-slate-900 dark:text-white text-xs">
                                <div>{rate.symbol || rate.name}</div>
                                <div className="text-[9px] text-slate-400 font-normal">{rate.unit}</div>
                              </td>

                              <td className="py-2 text-right">
                                <span className={`tabular-nums font-bold text-xs ${
                                  isMaxBuy ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  ₺{quote.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isMaxBuy && (
                                  <span className="block text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                                    ★ EN İYİ
                                  </span>
                                )}
                              </td>

                              <td className="py-2 text-right">
                                <span className={`tabular-nums font-bold text-xs ${
                                  isMinSell ? 'text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'
                                }`}>
                                  ₺{quote.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                {isMinSell && (
                                  <span className="block text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase">
                                    ★ EN DÜŞÜK
                                  </span>
                                )}
                              </td>

                              <td className="py-2 text-right pr-1.5 text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
                                ₺{spread.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Firm Footer */}
                  <div className="px-3 py-1.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Toplam {firmQuotes.length} Kur</span>
                    {firm.url && (
                      <a
                        href={firm.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                      >
                        <span>Resmi Ekran</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* 6. TAB 2: FIYAT KARŞILAŞTIRMA MATRİSİ (RADAR PRO MATRIX) */}
      {activeTab === 'karsilastir' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-teal-500" />
              <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                FİRMALAR ARASI ANLIK FİYAT KARŞILAŞTIRMA MATRİSİ
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">
              {filteredRates.length} Varlık Karşılaştırılıyor
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10">ÜRÜN</th>
                  <th className="p-2.5 text-center text-teal-700 dark:text-teal-400 bg-teal-50/80 dark:bg-teal-950/30">
                    EN DÜŞÜK SATIŞ (AL)
                  </th>
                  <th className="p-2.5 text-center text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30">
                    EN YÜKSEK ALIŞ (SAT)
                  </th>
                  <th className="p-2.5 text-center">FARK (MAKAS)</th>
                  {allFirms.map(f => (
                    <th key={f.id} className="p-2.5 text-center whitespace-nowrap">
                      {f.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRates.map(rate => {
                  const extremes = marketExtremes.get(rate.code);
                  const spread = extremes ? extremes.minSell - extremes.maxBuy : 0;
                  const hasOpportunity = extremes ? extremes.maxBuy > extremes.minSell : false;

                  return (
                    <tr
                      key={rate.code}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        hasOpportunity ? 'bg-amber-50/30 dark:bg-amber-950/15' : ''
                      }`}
                    >
                      {/* Product Name */}
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800">
                        <div>{rate.name}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{rate.unit}</div>
                      </td>

                      {/* Best Sell (Lowest to Buy from) */}
                      <td className="p-2.5 text-center bg-teal-50/40 dark:bg-teal-950/15 font-bold">
                        {extremes ? (
                          <div>
                            <span className="text-teal-700 dark:text-teal-300 font-extrabold tabular-nums">
                              ₺{extremes.minSell.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[9px] text-slate-400 truncate max-w-[120px] mx-auto">
                              {extremes.minSellFirm}
                            </span>
                          </div>
                        ) : '-'}
                      </td>

                      {/* Best Buy (Highest to Sell to) */}
                      <td className="p-2.5 text-center bg-emerald-50/40 dark:bg-emerald-950/15 font-bold">
                        {extremes ? (
                          <div>
                            <span className="text-emerald-700 dark:text-emerald-300 font-extrabold tabular-nums">
                              ₺{extremes.maxBuy.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className="block text-[9px] text-slate-400 truncate max-w-[120px] mx-auto">
                              {extremes.maxBuyFirm}
                            </span>
                          </div>
                        ) : '-'}
                      </td>

                      {/* Market Spread */}
                      <td className="p-2.5 text-center tabular-nums">
                        {hasOpportunity ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            +₺{Math.abs(spread).toFixed(2)} KÂR
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">
                            ₺{Math.abs(spread).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Each Firm Quote Cell */}
                      {allFirms.map(firm => {
                        const q = rate.sources?.find(s => s.sourceId === firm.id);
                        if (!q) {
                          return (
                            <td key={firm.id} className="p-2.5 text-center text-slate-300 dark:text-slate-600">
                              -
                            </td>
                          );
                        }

                        const isBestBuy = extremes && q.buyPrice >= extremes.maxBuy - 0.01;
                        const isBestSell = extremes && q.sellPrice <= extremes.minSell + 0.01;

                        return (
                          <td key={firm.id} className="p-2 text-center border-l border-slate-100 dark:border-slate-800/60 tabular-nums">
                            <div className={`text-[11px] ${isBestBuy ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-slate-600 dark:text-slate-400'}`}>
                              A: ₺{q.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={`text-[11px] ${isBestSell ? 'text-teal-600 dark:text-teal-400 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                              S: ₺{q.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. TAB 3: ARBİTRAJ RADARI (RADAR PRO DUAL ROW & SIMULATOR) */}
      {activeTab === 'arbitraj' && (
        <div className="space-y-3">
          {/* Sub-tabs: Anlık Fırsatlar vs Geçmiş Log */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setArbitrageSubTab('anlik')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  arbitrageSubTab === 'anlik'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Aktif Arbitraj Fırsatları ({arbitrageOpportunities.length})</span>
              </button>

              <button
                onClick={() => setArbitrageSubTab('gecmis')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  arbitrageSubTab === 'gecmis'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Geçmiş Arbitraj Günlüğü ({arbitrageHistory.length})</span>
              </button>
            </div>

            {arbitrageSubTab === 'gecmis' && arbitrageHistory.length > 0 && (
              <button
                onClick={clearArbitrageHistory}
                className="px-2.5 py-1 text-[11px] font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              >
                Geçmişi Temizle
              </button>
            )}
          </div>

          {/* ACTIVE OPPORTUNITIES */}
          {arbitrageSubTab === 'anlik' && (
            <div className="space-y-3">
              {arbitrageOpportunities.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 mx-auto flex items-center justify-center">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                    Şu Anda Aktif Arbitraj Fırsatı Bulunmuyor
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Kaptan, Güneş, Solis, SAR, İlkay, Altınköşe ve Vizyon kurları saniye saniye izleniyor. Bir firmanın satış fiyatı diğerinin alış fiyatından düşük olduğu anda sistem otomatik alarm verir.
                  </p>
                </div>
              ) : (
                arbitrageOpportunities.map((opp, idx) => {
                  const isSelectedForSim = selectedOppForSim?.id === opp.id;

                  return (
                    <div
                      key={opp.id}
                      className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all overflow-hidden shadow-xs ${
                        isSelectedForSim
                          ? 'border-teal-500 ring-2 ring-teal-500/20'
                          : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      {/* Top Asset Title & Beacon */}
                      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-500 text-slate-950 font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                              {opp.assetName}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                              ({opp.unit})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 animate-pulse">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>NET KÂR: +₺{opp.profitPerUnit.toFixed(2)}</span>
                          </span>

                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(opp.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* RADAR PRO DUAL PANEL (BUY FIRM -> SELL FIRM) */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-11 gap-2.5 items-center">
                        {/* 1. LEFT PANEL: BUY FROM (Lowest Sell Price) */}
                        <div className="sm:col-span-5 p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200/80 dark:border-teal-900/50 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-teal-800 dark:text-teal-300 uppercase">
                            <span>1. ALINACAK FİRMA</span>
                            <span className="bg-teal-200/80 dark:bg-teal-900/80 text-teal-900 dark:text-teal-200 px-1.5 py-0.2 rounded font-black">
                              EN DÜŞÜK SATIŞ
                            </span>
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {opp.buyFromSource.sourceName}
                          </div>
                          <div className="flex items-baseline justify-between pt-1 font-mono">
                            <span className="text-[11px] text-slate-500">Birim Satış:</span>
                            <span className="text-base font-black text-teal-600 dark:text-teal-400 tabular-nums">
                              ₺{opp.buyFromSource.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* MIDDLE SPREAD CONNECTOR */}
                        <div className="sm:col-span-1 flex flex-col items-center justify-center py-1 sm:py-0">
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-teal-600 font-bold shadow-xs">
                            ➔
                          </div>
                          <span className="text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                            +%{opp.profitPercent}%
                          </span>
                        </div>

                        {/* 2. RIGHT PANEL: SELL TO (Highest Buy Price) */}
                        <div className="sm:col-span-5 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                            <span>2. SATILACAK FİRMA</span>
                            <span className="bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 px-1.5 py-0.2 rounded font-black">
                              EN YÜKSEK ALIŞ
                            </span>
                          </div>
                          <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {opp.sellToSource.sourceName}
                          </div>
                          <div className="flex items-baseline justify-between pt-1 font-mono">
                            <span className="text-[11px] text-slate-500">Birim Alış:</span>
                            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₺{opp.sellToSource.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Simulator Trigger Strip */}
                      <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-850/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setSelectedOppForSim(opp)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelectedForSim
                              ? 'bg-teal-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>{isSelectedForSim ? 'Simülatör Açık' : 'Kâr Simülasyonunu Aç'}</span>
                        </button>

                        {onOpenParityTransfer && (
                          <button
                            type="button"
                            onClick={() => onOpenParityTransfer(opp.assetCode)}
                            className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Parite Transferi Başlat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* RADAR PRO INTERACTIVE SIMULATOR */}
              {selectedOppForSim && (
                <div className="bg-slate-900 text-white rounded-2xl p-4 border border-teal-500/40 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-black">
                        ⚡
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">
                          HIZLI ARBİTRAJ KÂR SİMÜLATÖRÜ
                        </h4>
                        <p className="text-[10px] text-teal-300">
                          {selectedOppForSim.assetName} · {selectedOppForSim.buyFromSource.sourceName} ➔ {selectedOppForSim.sellToSource.sourceName}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-800">
                      Birim Kâr: +₺{selectedOppForSim.profitPerUnit.toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Presets */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                      İşlem Miktarı ({selectedOppForSim.unit}):
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {[10, 25, 50, 100, 250, 500].map(qty => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setSimulatorQuantity(qty)}
                          className={`py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${
                            simulatorQuantity === qty
                              ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manual Quantity Input */}
                  <div className="flex items-center gap-2 bg-slate-800/90 rounded-xl px-3 py-2 border border-slate-700">
                    <span className="text-xs text-slate-400 font-bold">Özel Miktar:</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={simulatorQuantity}
                      onChange={e => setSimulatorQuantity(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="flex-1 bg-transparent text-right font-mono text-base font-black text-white focus:outline-hidden"
                    />
                    <span className="text-xs font-mono font-bold text-teal-400">{selectedOppForSim.unit}</span>
                  </div>

                  {/* Calculated Simulation Results */}
                  {(() => {
                    const capitalRequired = simulatorQuantity * selectedOppForSim.buyFromSource.sellPrice;
                    const revenueEarned = simulatorQuantity * selectedOppForSim.sellToSource.buyPrice;
                    const netProfit = revenueEarned - capitalRequired;

                    return (
                      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 space-y-2 font-mono">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Gereken Alış Sermayesi:</span>
                            <span className="font-bold text-slate-200 tabular-nums">
                              ₺{capitalRequired.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block">Satış Geliri:</span>
                            <span className="font-bold text-slate-200 tabular-nums">
                              ₺{revenueEarned.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-300">NET NET ARBİTRAJ KÂRI:</span>
                          <span className="text-lg font-black text-emerald-400 tabular-nums">
                            +₺{netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* ARBITRAGE HISTORY LOG */}
          {arbitrageSubTab === 'gecmis' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
              {arbitrageHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Henüz kaydedilmiş arbitraj geçmişi bulunmuyor. Sistem fırsat tespit ettikçe buraya kronolojik olarak kaydeder.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="p-2.5">ZAMAN</th>
                        <th className="p-2.5">ÜRÜN</th>
                        <th className="p-2.5">ALINAN FİRMA</th>
                        <th className="p-2.5">SATILAN FİRMA</th>
                        <th className="p-2.5 text-right">BİRİM KÂR</th>
                        <th className="p-2.5 text-right pr-3">ORAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {arbitrageHistory.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="p-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                            {rec.timeFormatted || new Date(rec.detectedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                            {rec.assetName}
                          </td>
                          <td className="p-2.5 text-teal-600 dark:text-teal-400">
                            <div>{rec.buyFromSource.sourceName}</div>
                            <div className="text-[10px] text-slate-400">₺{rec.buyFromSource.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                          </td>
                          <td className="p-2.5 text-emerald-600 dark:text-emerald-400">
                            <div>{rec.sellToSource.sourceName}</div>
                            <div className="text-[10px] text-slate-400">₺{rec.sellToSource.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +₺{rec.profitPerUnit.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right pr-3 font-bold text-amber-500 tabular-nums">
                            +%{rec.profitPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 8. TAB 4: FIYAT GEÇMİŞİ (NUMERICAL TABLE AS REQUESTED) */}
      {activeTab === 'gecmis' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden space-y-3 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-teal-500" />
              <div>
                <h3 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  SAYISAL FİYAT DEĞİŞİM GEÇMİŞİ
                </h3>
                <p className="text-[10px] text-slate-400">
                  Fiyatlar değiştikçe kaydedilen alış-satış ve makas rakamları
                </p>
              </div>
            </div>

            {/* Firm & Asset Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedHistoryFirmId}
                onChange={e => setSelectedHistoryFirmId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {allFirms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedHistoryAsset}
                onChange={e => setSelectedHistoryAsset(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700"
              >
                {marketRates.map(r => (
                  <option key={r.code} value={r.code}>
                    {r.name} ({r.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Numerical Table View */}
          {isLoadingHistory ? (
            <div className="py-10 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-500" />
              <span>Kayıtlar yükleniyor...</span>
            </div>
          ) : historyPoints.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-xs">
              Bu firma ve ürün için henüz arşivlenmiş fiyat kaydı bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="p-2.5">ZAMAN</th>
                    <th className="p-2.5">FİRMA</th>
                    <th className="p-2.5 text-right">ALIŞ FİYATI</th>
                    <th className="p-2.5 text-right">SATIŞ FİYATI</th>
                    <th className="p-2.5 text-right">MAKAS</th>
                    <th className="p-2.5 text-right pr-3">DEĞİŞİM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {historyPoints.map((pt, i) => {
                    const prevPt = historyPoints[i + 1];
                    const diff = prevPt ? pt.buyPrice - prevPt.buyPrice : 0;
                    const isUp = diff >= 0;

                    return (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-2.5 text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {pt.timeLabel || pt.timestamp?.slice(11, 16)}
                        </td>
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                          {allFirms.find(f => f.id === selectedHistoryFirmId)?.name || selectedHistoryFirmId}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                          ₺{pt.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right font-bold text-teal-600 dark:text-teal-400 tabular-nums">
                          ₺{pt.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right text-slate-500 tabular-nums">
                          ₺{(pt.sellPrice - pt.buyPrice).toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right pr-3 tabular-nums font-bold">
                          {diff !== 0 ? (
                            <span className={isUp ? 'text-emerald-500' : 'text-red-500'}>
                              {isUp ? '▲ +' : '▼ '}₺{Math.abs(diff).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
