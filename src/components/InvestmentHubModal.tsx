import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  RefreshCw,
  Clock,
  Gem,
  CircleDot,
  Layers,
  ArrowRightLeft,
  Check,
  Bell,
  Scale,
  DollarSign,
  ExternalLink,
  Volume2,
  VolumeX,
  Zap,
  Building,
  Radio,
  BarChart2,
  Calendar,
  SlidersHorizontal,
  History,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Flame,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { CurrencyCode, MarketRate, ArbitrageOpportunity, SourceQuote } from '../types';
import { useApp } from '../context/AppContext';
import { InvestmentTransferModal } from './InvestmentTransferModal';

interface InvestmentHubModalProps {
  onClose: () => void;
}

export const InvestmentHubModal: React.FC<InvestmentHubModalProps> = ({ onClose }) => {
  const {
    marketRates,
    accounts,
    buySellMetal,
    addNotification,
    investmentsTotalTRY,
    totalGoldGrams,
    totalSilverGrams,
    arbitrageOpportunities,
    arbitrageHistory,
    clearArbitrageHistory,
    setSelectedAssetForHistory,
    audioAlertsEnabled,
    toggleAudioAlerts,
    testAudioAlert
  } = useApp();

  const [activeTab, setActiveTab] = useState<'metals' | 'currencies' | 'karsilastirma' | 'arbitraj' | 'kaynaklar' | 'converter'>('metals');
  const [showParityTransfer, setShowParityTransfer] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketRate>(marketRates[0]); // Default Has Altın
  const [assetDetailSubTab, setAssetDetailSubTab] = useState<'ortalama' | 'firmalar'>('ortalama');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('24h');

  // Arbitraj sub tab: anlık fırsatlar vs stoklanan geçmiş
  const [arbitrageSubTab, setArbitrageSubTab] = useState<'anlik' | 'gecmis'>('anlik');
  const [historyAssetFilter, setHistoryAssetFilter] = useState<string>('ALL');

  // Fast double-tap detection for mobile devices (no lag, 60fps)
  const lastTapRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });
  const handlePriceDoubleTap = (rate: MarketRate) => {
    const now = Date.now();
    if (lastTapRef.current.id === rate.code && now - lastTapRef.current.time < 350) {
      setSelectedAssetForHistory(rate);
      lastTapRef.current = { id: '', time: 0 };
    } else {
      lastTapRef.current = { id: rate.code, time: now };
    }
  };

  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle');
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1G' | '1H' | '1A' | '3A' | '1Y' | 'TUMU' | 'OZEL'>('1G');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-12');
  const [activeCandleHover, setActiveCandleHover] = useState<any | null>(null);

  // Firm quotes view mode
  const [firmViewMode, setFirmViewMode] = useState<'firma_bazli' | 'urun_bazli'>('firma_bazli');
  const [selectedFirmId, setSelectedFirmId] = useState<string>('ilkay-tv');
  const [firmSearchQuery, setFirmSearchQuery] = useState<string>('');

  // List of all unique firms across market rates
  const allFirms = useMemo(() => {
    const map = new Map<string, { id: string; name: string; type: string; url: string }>();
    marketRates.forEach(rate => {
      rate.sources?.forEach(s => {
        if (!map.has(s.sourceId)) {
          map.set(s.sourceId, { id: s.sourceId, name: s.sourceName, type: s.sourceType, url: s.sourceUrl });
        }
      });
    });
    return Array.from(map.values());
  }, [marketRates]);

  // Quotes offered by the currently selected firm
  const selectedFirmQuotes = useMemo(() => {
    const quotes: {
      assetCode: CurrencyCode;
      assetName: string;
      unit: string;
      isMetal?: boolean;
      buyPrice: number;
      sellPrice: number;
      spread: number;
    }[] = [];

    marketRates.forEach(rate => {
      const src = rate.sources?.find(s => s.sourceId === selectedFirmId);
      if (src) {
        quotes.push({
          assetCode: rate.code,
          assetName: rate.name,
          unit: rate.unit,
          isMetal: rate.isMetal,
          buyPrice: src.buyPrice,
          sellPrice: src.sellPrice,
          spread: src.sellPrice - src.buyPrice
        });
      }
    });

    if (!firmSearchQuery.trim()) return quotes;
    const q = firmSearchQuery.toLowerCase();
    return quotes.filter(item =>
      item.assetName.toLowerCase().includes(q) ||
      item.assetCode.toLowerCase().includes(q)
    );
  }, [marketRates, selectedFirmId, firmSearchQuery]);

  // Trade / Converter Form State
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [tradeGrams, setTradeGrams] = useState<string>('5');
  const [selectedSourceAccount, setSelectedSourceAccount] = useState<string>(
    accounts.find(a => a.type === 'nakit' || a.type === 'banka')?.id || ''
  );
  const [selectedTargetAccount, setSelectedTargetAccount] = useState<string>(
    accounts.find(a => a.type === 'birikim')?.id || ''
  );

  // Price Alert state
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCreated, setAlertCreated] = useState<boolean>(false);

  // Arbitrage simulator state
  const [simulatorGrams, setSimulatorGrams] = useState<string>('50');

  // Metals & Currencies lists
  const preciousMetals = useMemo(() => marketRates.filter(r => r.isMetal), [marketRates]);
  const foreignCurrencies = useMemo(() => marketRates.filter(r => !r.isMetal), [marketRates]);

  // Calculated Trade Cost
  const calculatedTradeAmountTRY = useMemo(() => {
    const g = parseFloat(tradeGrams) || 0;
    const price = tradeType === 'buy' ? selectedAsset.sellPrice : selectedAsset.buyPrice;
    return g * price;
  }, [tradeGrams, tradeType, selectedAsset]);

  // Execute Trade
  const handleExecuteTrade = () => {
    const g = parseFloat(tradeGrams);
    if (!g || g <= 0) return;
    if (!selectedSourceAccount || !selectedTargetAccount) {
      addNotification('Hesap Seçimi Gerekli', 'Lütfen kaynak ve hedef hesapları seçiniz.', 'system');
      return;
    }

    const price = tradeType === 'buy' ? selectedAsset.sellPrice : selectedAsset.buyPrice;

    buySellMetal({
      sourceAccountId: selectedSourceAccount,
      targetAccountId: selectedTargetAccount,
      metalCode: selectedAsset.code,
      grams: g,
      pricePerGram: price,
      totalAmountTRY: calculatedTradeAmountTRY,
      isBuy: tradeType === 'buy'
    });

    addNotification(
      'İşlem Başarılı ✅',
      `${tradeType === 'buy' ? 'Alım' : 'Satış'} gerçekleşti: ${g} ${selectedAsset.unit} ${selectedAsset.name} (₺${calculatedTradeAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })})`,
      'price'
    );
  };

  const handleSetAlert = () => {
    const p = parseFloat(alertTargetPrice);
    if (!p) return;
    addNotification(
      'Fiyat Alarmı Kuruldu 🔔',
      `${selectedAsset.name} için ₺${p.toLocaleString('tr-TR')} hedef fiyat alarmı aktif edildi. Fiyat seviyesine ulaşıldığında sesli bildirim alacaksınız.`,
      'price'
    );
    setAlertCreated(true);
    setTimeout(() => setAlertCreated(false), 2500);
    setAlertTargetPrice('');
  };

  // Candles generation for Mum Grafiği (Candlestick) & Fiyat Geçmişleri Tablosu
  const candleData = useMemo(() => {
    const base = selectedAsset.sellPrice;
    const count = selectedTimeframe === '1G' ? 12 : selectedTimeframe === '1H' ? 14 : 16;
    const candles: {
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: string;
      isBullish: boolean;
      changePercent: number;
    }[] = [];

    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * (selectedTimeframe === '1G' ? 2 * 3600 * 1000 : 24 * 3600 * 1000));
      const dateLabel = selectedTimeframe === '1G'
        ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

      const factor = (Math.sin(i * 0.9) * 0.015) + ((Math.random() - 0.48) * 0.012);
      const closeVal = i === 0 ? base : Number((base * (1 - factor)).toFixed(2));
      const openVal = Number((closeVal * (1 + (Math.random() - 0.49) * 0.008)).toFixed(2));
      const maxBody = Math.max(openVal, closeVal);
      const minBody = Math.min(openVal, closeVal);
      const highVal = Number((maxBody + Math.random() * (base * 0.004)).toFixed(2));
      const lowVal = Number((minBody - Math.random() * (base * 0.004)).toFixed(2));
      const isBullish = closeVal >= openVal;
      const chg = Number((((closeVal - openVal) / openVal) * 100).toFixed(2));

      candles.push({
        date: dateLabel,
        open: openVal,
        high: highVal,
        low: lowVal,
        close: closeVal,
        volume: `${(Math.random() * 40 + 10).toFixed(0)} kg`,
        isBullish,
        changePercent: chg
      });
    }
    return candles;
  }, [selectedAsset, selectedTimeframe]);

  const candleMinVal = useMemo(() => Math.min(...candleData.map(c => c.low)) * 0.997, [candleData]);
  const candleMaxVal = useMemo(() => Math.max(...candleData.map(c => c.high)) * 1.003, [candleData]);
  const candleRange = candleMaxVal - candleMinVal || 1;

  // Mock historical points for visual SVG chart
  const chartPoints = useMemo(() => {
    return candleData.map(c => c.close);
  }, [candleData]);

  // Min and Max for SVG scale
  const minVal = candleMinVal;
  const maxVal = candleMaxVal;
  const range = candleRange;

  const svgPath = useMemo(() => {
    const width = 320;
    const height = 120;
    return chartPoints
      .map((val, idx) => {
        const x = (idx / (chartPoints.length - 1)) * width;
        const y = height - ((val - minVal) / range) * height;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }, [chartPoints, minVal, range]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>KURLAR</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Piyasa Fiyatları, Varlık Grafikleri & Arbitraj
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAudioAlerts}
              title={audioAlertsEnabled ? 'Sesli Uyarı Açık' : 'Sesli Uyarı Kapalı'}
              className={`p-2 rounded-xl transition-colors ${
                audioAlertsEnabled
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-around border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-1.5 py-1.5 text-xs font-bold overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab('metals')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'metals'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Metaller
          </button>
          <button
            onClick={() => setActiveTab('currencies')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'currencies'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Dövizler
          </button>
          <button
            onClick={() => setActiveTab('karsilastirma')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'karsilastirma'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/40 hover:text-indigo-900'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Karşılaştırma</span>
          </button>
          <button
            onClick={() => setActiveTab('arbitraj')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'arbitraj'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Arbitraj ({arbitrageOpportunities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('kaynaklar')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'kaynaklar'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Firma Fiyatları
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'converter'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Al-Sat
          </button>
          <button
            onClick={() => setShowParityTransfer(true)}
            className="px-2.5 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white shadow-xs font-bold"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Parite Transferi ⇄</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Asset Live Card (Metals or Currencies) */}
          {(activeTab === 'metals' || activeTab === 'currencies') && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
              {/* Asset Header Info */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs">
                    {selectedAsset.code}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      <span>{selectedAsset.name}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                        TradingView Canlı ✓
                      </span>
                    </h3>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{selectedAsset.sources?.length || 1} Firma Kotasyonu Ortalaması</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xl font-extrabold text-white tabular-nums">
                    ₺{selectedAsset.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: selectedAsset.code === 'RUB' ? 3 : 2 })}
                  </div>
                  <div
                    className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${
                      selectedAsset.changeRate >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {selectedAsset.changeRate >= 0 ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                    <span>%{Math.abs(selectedAsset.changeRate).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* VARLIK GRAFİĞİ & TARİH FİLTRESİ (Piyasa yorumu ve fırsat analizi kaldırıldı) */}
              <div className="space-y-3 animate-in fade-in duration-200">
                {/* Chart Mode Row */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setChartMode('candle')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        chartMode === 'candle'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🕯️ Mum Grafiği
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('line')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        chartMode === 'line'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📈 Çizgi Grafik
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-medium">
                    TradingView Fiyat Akışı
                  </span>
                </div>

                  {/* Kullanıcı Dostu Tarih Filtreleme (1G, 1H, 1A, 3A, 1Y, Tümü, Özel) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>Tarih Filtresi:</span>
                      <span className="text-amber-400 font-bold">{selectedTimeframe} Görünümü</span>
                    </div>

                    <div className="flex gap-1 overflow-x-auto no-scrollbar py-0.5">
                      {(['1G', '1H', '1A', '3A', '1Y', 'TUMU', 'OZEL'] as const).map(tf => (
                        <button
                          key={tf}
                          type="button"
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all border ${
                            selectedTimeframe === tf
                              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                          }`}
                        >
                          {tf === 'TUMU' ? 'TÜMÜ' : tf === 'OZEL' ? '📅 ÖZEL TARİH' : tf}
                        </button>
                      ))}
                    </div>

                    {/* Custom Date Range Picker if OZEL selected */}
                    {selectedTimeframe === 'OZEL' && (
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <label className="text-slate-400 block mb-0.5">Başlangıç:</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-[10px]"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-0.5">Bitiş:</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="w-full bg-slate-900 text-white px-2 py-1 rounded border border-slate-700 text-[10px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hover info tooltip for active candle */}
                  {activeCandleHover && (
                    <div className="p-2 rounded-lg bg-slate-800/95 border border-slate-700 text-[10px] grid grid-cols-4 gap-1 text-center font-mono">
                      <div><span className="text-slate-400 block">Açılış:</span>₺{activeCandleHover.open}</div>
                      <div><span className="text-slate-400 block">Yüksek:</span>₺{activeCandleHover.high}</div>
                      <div><span className="text-slate-400 block">Düşük:</span>₺{activeCandleHover.low}</div>
                      <div>
                        <span className="text-slate-400 block">Kapanış:</span>
                        <span className={activeCandleHover.isBullish ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          ₺{activeCandleHover.close}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Candlestick vs Line SVG Chart */}
                  <div className="relative h-36 w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 flex items-center justify-center">
                    {chartMode === 'candle' ? (
                      <svg viewBox="0 0 320 130" className="w-full h-full overflow-visible">
                        {/* Background Grid Lines */}
                        <line x1="0" y1="20" x2="320" y2="20" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                        <line x1="0" y1="65" x2="320" y2="65" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />
                        <line x1="0" y1="110" x2="320" y2="110" stroke="#334155" strokeDasharray="2 2" strokeWidth="0.5" />

                        {/* Candles */}
                        {candleData.map((c, idx) => {
                          const candleWidth = 14;
                          const spacing = 320 / candleData.length;
                          const xCenter = idx * spacing + spacing / 2;

                          // Scaled Y coords
                          const yHigh = 120 - ((c.high - candleMinVal) / candleRange) * 105;
                          const yLow = 120 - ((c.low - candleMinVal) / candleRange) * 105;
                          const yOpen = 120 - ((c.open - candleMinVal) / candleRange) * 105;
                          const yClose = 120 - ((c.close - candleMinVal) / candleRange) * 105;

                          const yTopBody = Math.min(yOpen, yClose);
                          const bodyHeight = Math.max(3, Math.abs(yClose - yOpen));
                          const color = c.isBullish ? '#10b981' : '#ef4444';

                          return (
                            <g
                              key={idx}
                              onMouseEnter={() => setActiveCandleHover(c)}
                              onTouchStart={() => setActiveCandleHover(c)}
                              className="cursor-pointer transition-opacity hover:opacity-80"
                            >
                              {/* Wick (Fitil) */}
                              <line
                                x1={xCenter}
                                y1={yHigh}
                                x2={xCenter}
                                y2={yLow}
                                stroke={color}
                                strokeWidth="1.5"
                              />
                              {/* Candle Body (Mum Gövdesi) */}
                              <rect
                                x={xCenter - candleWidth / 2}
                                y={yTopBody}
                                width={candleWidth}
                                height={bodyHeight}
                                fill={color}
                                stroke={color}
                                rx="1.5"
                              />
                            </g>
                          );
                        })}
                      </svg>
                    ) : (
                      /* Line Chart */
                      <svg viewBox="0 0 320 120" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradientCandle" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={`${svgPath} L 320 120 L 0 120 Z`} fill="url(#chartGradientCandle)" />
                        <path d={svgPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="320" cy={120 - ((chartPoints[chartPoints.length - 1] - minVal) / range) * 120} r="4" fill="#ffffff" />
                      </svg>
                    )}
                  </div>

                  {/* Toggle History Table Button */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setShowHistoryTable(prev => !prev)}
                      className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{showHistoryTable ? 'Geçmiş Tablosunu Gizle' : '📋 Fiyat Geçmişleri Tablosunu Aç'}</span>
                    </button>

                    <span className="text-[10px] text-slate-400 font-mono">
                      {candleData.length} Mum Verisi (OHLC)
                    </span>
                  </div>

                  {/* Historical OHLC Price Table (Kullanıcı İsteği) */}
                  {showHistoryTable && (
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden text-[10px] max-h-48 overflow-y-auto no-scrollbar animate-in slide-in-from-top-2 duration-150">
                      <div className="px-2.5 py-1.5 bg-slate-800 text-slate-400 font-bold grid grid-cols-6 gap-1 text-center sticky top-0">
                        <span>TARİH</span>
                        <span>AÇILIŞ</span>
                        <span>YÜKSEK</span>
                        <span>DÜŞÜK</span>
                        <span>KAPANIŞ</span>
                        <span>DEĞİŞİM</span>
                      </div>
                      <div className="divide-y divide-slate-850 font-mono tabular-nums">
                        {candleData.map((row, i) => (
                          <div key={i} className="px-2.5 py-1.5 grid grid-cols-6 gap-1 text-center items-center hover:bg-slate-900">
                            <span className="text-slate-300 font-sans">{row.date}</span>
                            <span className="text-slate-300">₺{row.open.toFixed(2)}</span>
                            <span className="text-emerald-400">₺{row.high.toFixed(2)}</span>
                            <span className="text-red-400">₺{row.low.toFixed(2)}</span>
                            <span className="font-bold text-white">₺{row.close.toFixed(2)}</span>
                            <span className={`font-bold ${row.isBullish ? 'text-emerald-400' : 'text-red-400'}`}>
                              {row.isBullish ? '+' : ''}%{row.changePercent}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              {/* Dual View Toggle: Ortalama vs Firma Bazlı Fiyatlar */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800">
                <div className="flex p-0.5 rounded-xl bg-slate-800/80 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setAssetDetailSubTab('ortalama')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      assetDetailSubTab === 'ortalama'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ortalama Piyasa Fiyatı
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssetDetailSubTab('firmalar')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      assetDetailSubTab === 'firmalar'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Firma Bazlı Fiyatlar ({selectedAsset.sources?.length || 0})
                  </button>
                </div>

                <button
                  onClick={() => setActiveTab('karsilastirma')}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Scale className="w-3 h-3" />
                  <span>Karşılaştırma Tablosu →</span>
                </button>
              </div>

              {/* Firma Bazlı Fiyatlar Listesi (Detay) */}
              {assetDetailSubTab === 'firmalar' ? (
                <div className="mt-2.5 space-y-1.5 animate-in fade-in duration-150">
                  <div className="text-[10px] text-slate-400 flex justify-between px-1 font-semibold">
                    <span>FİRMA ADI & KAYNAK</span>
                    <span className="flex gap-4">
                      <span>ALIŞ</span>
                      <span>SATIŞ</span>
                      <span>MAKAS</span>
                    </span>
                  </div>
                  {selectedAsset.sources?.map(src => {
                    const sp = src.sellPrice - src.buyPrice;
                    return (
                      <div
                        key={src.sourceId}
                        className="p-2 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-between text-xs"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{src.sourceName}</span>
                            <span className="text-[9px] bg-slate-700 text-slate-300 px-1 rounded-sm">
                              {src.sourceType}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right font-mono tabular-nums shrink-0">
                          <div>
                            <span className="text-[9px] text-slate-400 block text-right">Alış</span>
                            <span className="font-bold text-emerald-400">₺{src.buyPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block text-right">Satış</span>
                            <span className="font-bold text-white">₺{src.sellPrice.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block text-right">Makas</span>
                            <span className="text-amber-400 text-[11px]">₺{sp.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* TAB: KARŞILAŞTIRMA (COMPARISON TAB - Requested by user) */}
          {activeTab === 'karsilastirma' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Asset Selector Header */}
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    <span>Firma Fiyatları Karşılaştırma Sekmesi</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Kapalıçarşı ve serbest piyasa firmaları arasındaki anlık fiyat farkları
                  </p>
                </div>

                <select
                  value={selectedAsset.code}
                  onChange={e => {
                    const found = marketRates.find(r => r.code === e.target.value);
                    if (found) setSelectedAsset(found);
                  }}
                  className="bg-indigo-50 dark:bg-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-xl text-indigo-950 dark:text-indigo-200 border border-indigo-200 dark:border-slate-700 shadow-2xs"
                >
                  <optgroup label="Kıymetli Madenler">
                    {preciousMetals.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Döviz Kurları">
                    {foreignCurrencies.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Best Ask & Best Bid Highlight Cards */}
              {(() => {
                const sources = selectedAsset.sources || [];
                if (sources.length === 0) return null;

                let bestBuySource = sources[0]; // Lowest sell price
                let bestSellSource = sources[0]; // Highest buy price

                sources.forEach(s => {
                  if (s.sellPrice < bestBuySource.sellPrice) bestBuySource = s;
                  if (s.buyPrice > bestSellSource.buyPrice) bestSellSource = s;
                });

                const spreadGap = bestSellSource.buyPrice - bestBuySource.sellPrice;
                const hasArbitrageGap = spreadGap > 0;

                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Best Buy Card */}
                      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                            EN UCUZ SATAN FİRMA
                          </span>
                          <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Alım İçin En İyi
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {bestBuySource.sourceName}
                        </div>
                        <div className="text-lg font-black text-emerald-600 dark:text-emerald-300 tabular-nums mt-0.5">
                          ₺{bestBuySource.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Ortalamadan ₺{Math.abs(selectedAsset.sellPrice - bestBuySource.sellPrice).toFixed(2)} daha ucuz
                        </div>
                      </div>

                      {/* Best Sell Card */}
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500/70 shadow-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                            EN YÜKSEK ALAN FİRMA
                          </span>
                          <span className="text-[9px] bg-blue-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                            Satım İçin En İyi
                          </span>
                        </div>
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {bestSellSource.sourceName}
                        </div>
                        <div className="text-lg font-black text-blue-600 dark:text-blue-300 tabular-nums mt-0.5">
                          ₺{bestSellSource.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                          Ortalamadan +₺{Math.abs(bestSellSource.buyPrice - selectedAsset.buyPrice).toFixed(2)} daha yüksek
                        </div>
                      </div>
                    </div>

                    {/* Arbitrage Gap Banner */}
                    {hasArbitrageGap && (
                      <div className="p-3 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100 block">
                              ANLIK ARBİTRAJ BOŞLUĞU BULUNDU
                            </span>
                            <div className="font-bold text-xs text-white">
                              {bestBuySource.sourceName}'den alıp {bestSellSource.sourceName}'ye hemen satın
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-amber-200 tabular-nums">
                            +₺{spreadGap.toFixed(2)} /{selectedAsset.unit}
                          </div>
                          <span className="text-[10px] text-emerald-100 font-semibold">Net Risksiz Kâr</span>
                        </div>
                      </div>
                    )}

                    {/* Side-by-Side Detailed Comparison Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                      <div className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                          {selectedAsset.name} — Firma Fiyat Listesi
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Ortalama Satış: ₺{selectedAsset.sellPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {sources.map((src, idx) => {
                          const isBestBuy = src.sourceId === bestBuySource.sourceId;
                          const isBestSell = src.sourceId === bestSellSource.sourceId;
                          const spread = src.sellPrice - src.buyPrice;

                          return (
                            <div
                              key={src.sourceId}
                              className={`p-3 transition-colors ${
                                isBestBuy || isBestSell
                                  ? 'bg-indigo-50/20 dark:bg-indigo-950/20'
                                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                                    {idx + 1}
                                  </div>
                                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {src.sourceName}
                                  </div>
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-md">
                                    {src.sourceType}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {isBestBuy && (
                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold px-1.5 py-0.5 rounded-full">
                                      En Ucuz Satış
                                    </span>
                                  )}
                                  {isBestSell && (
                                    <span className="text-[9px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold px-1.5 py-0.5 rounded-full">
                                      En Yüksek Alış
                                    </span>
                                  )}
                                  <a
                                    href={src.sourceUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    title="Firma canlı ekranına git"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              {/* Price metrics row */}
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className={`p-2 rounded-xl ${isBestSell ? 'bg-blue-100/60 dark:bg-blue-900/40 ring-1 ring-blue-500' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                                  <span className="text-[9px] text-slate-400 font-bold block">ALIŞ (Firmaya Sat)</span>
                                  <span className="font-black text-xs text-blue-600 dark:text-blue-400 tabular-nums">
                                    ₺{src.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className={`p-2 rounded-xl ${isBestBuy ? 'bg-emerald-100/60 dark:bg-emerald-950/60 ring-1 ring-emerald-500' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                                  <span className="text-[9px] text-slate-400 font-bold block">SATIŞ (Firmadan Al)</span>
                                  <span className="font-black text-xs text-emerald-600 dark:text-emerald-400 tabular-nums">
                                    ₺{src.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                                  <span className="text-[9px] text-slate-400 font-bold block">MAKAS FARKI</span>
                                  <span className="font-black text-xs text-amber-600 tabular-nums">
                                    ₺{spread.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB: ARBİTRAJ RADARI (PROFESYONEL & TEMİZ GÖRÜNÜM) */}
          {activeTab === 'arbitraj' && (
            <div className="space-y-3.5">
              {/* Executive Overview Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 text-white shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${audioAlertsEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>Piyasa Arbitraj Radarı</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          CANLI
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        8 firma eşzamanlı izleniyor · Fiyat farkı oluştuğunda bildirilir
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={toggleAudioAlerts}
                      title={audioAlertsEnabled ? 'Sesli Uyarı Açık' : 'Sesli Uyarı Kapalı'}
                      className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                        audioAlertsEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {audioAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </button>
                    {audioAlertsEnabled && (
                      <button
                        type="button"
                        onClick={testAudioAlert}
                        className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                      >
                        Test
                      </button>
                    )}
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80 text-center">
                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">AKTİF FIRSAT</span>
                    <span className="text-sm font-extrabold text-emerald-400 tabular-nums">
                      {arbitrageOpportunities.length} Adet
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">EN YÜKSEK KÂR</span>
                    <span className="text-sm font-extrabold text-amber-300 tabular-nums">
                      {arbitrageOpportunities.length > 0
                        ? `+₺${Math.max(...arbitrageOpportunities.map(o => o.profitPerUnit)).toFixed(2)}`
                        : (arbitrageHistory.length > 0 ? `+₺${Math.max(...arbitrageHistory.map(h => h.profitPerUnit)).toFixed(2)}` : '₺0.00')}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-750">
                    <span className="text-[9px] text-slate-400 block font-semibold uppercase">STOKLANAN ARŞİV</span>
                    <span className="text-sm font-extrabold text-indigo-300 tabular-nums">
                      {arbitrageHistory.length} Kayıt
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Sub-tab Navigation */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setArbitrageSubTab('anlik')}
                  className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    arbitrageSubTab === 'anlik'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Aktif Fırsatlar ({arbitrageOpportunities.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setArbitrageSubTab('gecmis')}
                  className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                    arbitrageSubTab === 'gecmis'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Stoklanan Geçmiş ({arbitrageHistory.length})</span>
                </button>
              </div>

              {/* SUB-VIEW 1: AKTİF FIRSATLAR */}
              {arbitrageSubTab === 'anlik' ? (
                <div className="space-y-3">
                  {arbitrageOpportunities.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                      <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Piyasa Fiyatları Dengede
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        İlkay, Altınköşe, Güneş, Kaptan, Vizyon, SAR ve Solis kurları anlık olarak taranıyor. Şu anda doğrudan risksiz kâr marjı bulunmamaktadır. Fiyat farkı oluştuğunda sistem otomatik listeleyecektir.
                      </p>
                    </div>
                  ) : (
                    arbitrageOpportunities.map((opp) => {
                      const simQty = parseFloat(simulatorGrams) || 100;
                      const calculatedProfit = opp.profitPerUnit * simQty;

                      return (
                        <div
                          key={opp.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500/80 shadow-md space-y-3 animate-in slide-in-from-top duration-200"
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                                {opp.assetCode}
                              </span>
                              <div>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {opp.assetName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">
                                  {opp.timestamp}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">
                                NET BİRİM KÂRI
                              </span>
                              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                +₺{opp.profitPerUnit.toFixed(2)}
                                <span className="text-xs font-normal text-slate-400 ml-0.5">/{opp.unit}</span>
                              </span>
                            </div>
                          </div>

                          {/* 2-Step Route Box */}
                          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 uppercase block">
                                1. ADIM: SATIN AL (Firmadan Satış)
                              </span>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {opp.buyFromSource.sourceName}
                              </div>
                              <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                                ₺{opp.buyFromSource.sellPrice.toFixed(2)}
                              </div>
                            </div>

                            <div className="space-y-0.5 text-right border-l border-slate-200 dark:border-slate-700 pl-2">
                              <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase block">
                                2. ADIM: HEMEN SAT (Firmaya Alış)
                              </span>
                              <div className="font-bold text-slate-900 dark:text-white text-xs">
                                {opp.sellToSource.sourceName}
                              </div>
                              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                ₺{opp.sellToSource.buyPrice.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Quick Interactive Calculator for this Opportunity */}
                          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">İşlem:</span>
                              <input
                                type="number"
                                value={simulatorGrams}
                                onChange={e => setSimulatorGrams(e.target.value)}
                                className="w-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-0.5 text-xs text-center font-bold text-slate-900 dark:text-white"
                              />
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{opp.unit}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Tahmini Risksiz Kâr:</span>
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                                ₺{calculatedProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                /* SUB-VIEW 2: STOKLANAN ARBİTRAJ GEÇMİŞİ */
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Filter & Clear Actions */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                      {['ALL', 'XAU', 'USD', 'EUR', 'GBP'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setHistoryAssetFilter(c)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                            historyAssetFilter === c
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white'
                          }`}
                        >
                          {c === 'ALL' ? 'Tümü' : c}
                        </button>
                      ))}
                    </div>

                    {arbitrageHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={clearArbitrageHistory}
                        className="text-[10px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                      >
                        Geçmişi Temizle
                      </button>
                    )}
                  </div>

                  {/* Historical List */}
                  {arbitrageHistory.length === 0 ? (
                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 shadow-xs">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <p className="font-bold text-slate-700 dark:text-slate-300">
                        Henüz stoklanmış arbitraj kaydı yok
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kuyumcular ve döviz büroları arasındaki karlı fiyat farkları oluştukça otomatik olarak bu arşive stoklanacaktır.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                      {arbitrageHistory
                        .filter(h => historyAssetFilter === 'ALL' || h.assetCode === historyAssetFilter)
                        .map(record => (
                          <div
                            key={record.id}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-extrabold text-[10px]">
                                  {record.assetCode}
                                </span>
                                <div>
                                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                                    {record.assetName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {record.timeFormatted}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-emerald-600 tabular-nums">
                                  +₺{record.profitPerUnit.toFixed(2)} <span className="text-[9px]">/{record.unit}</span>
                                </span>
                                <span className="text-[9px] text-emerald-500 font-bold block">
                                  +%{record.profitPercent}% Kâr
                                </span>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-slate-400 block font-semibold">Alınan:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {record.buyFromSource.sourceName}
                                </span>
                                <span className="text-[10px] text-blue-600 block">
                                  ₺{record.buyFromSource.sellPrice.toFixed(2)}
                                </span>
                              </div>

                              <ArrowRightLeft className="w-4 h-4 text-slate-400 shrink-0" />

                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block font-semibold">Satılan:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {record.sellToSource.sourceName}
                                </span>
                                <span className="text-[10px] text-emerald-600 block">
                                  ₺{record.sellToSource.buyPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: FİRMA KAYNAKLARI (FİRMA BAZLI VE ÜRÜN BAZLI LİSTE) */}
          {activeTab === 'kaynaklar' && (
            <div className="space-y-4">
              {/* Search Bar for Firms & Products */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Firma veya ürün ara (İlkay, Güneş, Kaptan, Altın...)"
                  value={firmSearchQuery}
                  onChange={e => setFirmSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Dual Mode Switcher */}
              <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFirmViewMode('firma_bazli')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    firmViewMode === 'firma_bazli'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Firma Bazlı Fiyat Listesi
                </button>
                <button
                  type="button"
                  onClick={() => setFirmViewMode('urun_bazli')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    firmViewMode === 'urun_bazli'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ürün Bazlı Firma Dağılımı
                </button>
              </div>

              {/* MODE 1: FIRMA BAZLI (Kullanıcının talep ettiği: kaynak verilerden çekilen her firma için ayrı ayrı listelenen fiyatlar) */}
              {firmViewMode === 'firma_bazli' ? (
                <div className="space-y-3">
                  {/* Firm Selection Chips */}
                  <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {allFirms.map(f => {
                      const isSelected = f.id === selectedFirmId;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSelectedFirmId(f.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                          }`}
                        >
                          {f.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Firm Header Banner */}
                  {(() => {
                    const firmInfo = allFirms.find(f => f.id === selectedFirmId) || allFirms[0];
                    return (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {firmInfo?.name}
                            </span>
                            <span className="text-[9px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.2 rounded-md font-bold">
                              {firmInfo?.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5 block truncate max-w-[240px]">
                            {firmInfo?.url}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Canlı Veri</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {selectedFirmQuotes.length} Fiyat Kotasyonu
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Complete Price Table for Selected Firm */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 grid grid-cols-12 gap-2">
                      <span className="col-span-5 uppercase">ÜRÜN / MADEN</span>
                      <span className="col-span-2 text-right uppercase">ALIŞ</span>
                      <span className="col-span-3 text-right uppercase">SATIŞ</span>
                      <span className="col-span-2 text-right uppercase">MAKAS</span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {selectedFirmQuotes.map(q => {
                        return (
                          <div
                            key={q.assetCode}
                            className="px-3.5 py-2.5 grid grid-cols-12 gap-2 items-center hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                              <span className="text-base">{q.isMetal ? '🥇' : '💵'}</span>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 dark:text-white block truncate">
                                  {q.assetName}
                                </span>
                                <span className="text-[10px] text-slate-400">{q.assetCode} · {q.unit}</span>
                              </div>
                            </div>

                            <div className="col-span-2 text-right font-extrabold text-slate-700 dark:text-slate-300 tabular-nums">
                              ₺{q.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: q.assetCode === 'RUB' ? 3 : 2 })}
                            </div>

                            <div className="col-span-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₺{q.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: q.assetCode === 'RUB' ? 3 : 2 })}
                            </div>

                            <div className="col-span-2 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums text-[11px]">
                              ₺{q.spread.toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* MODE 2: ÜRÜN BAZLI (Seçilen ürün için tüm firmalar) */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {selectedAsset.name} İÇİN TÜM FİRMALAR
                      </h3>
                      <span className="text-[10px] text-slate-400">Doğrulanmış kuyumcu ve döviz büroları kaynakları</span>
                    </div>
                    <select
                      value={selectedAsset.code}
                      onChange={e => {
                        const found = marketRates.find(r => r.code === e.target.value);
                        if (found) setSelectedAsset(found);
                      }}
                      className="bg-slate-100 dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                      {marketRates.map(r => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Overall Average Card */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-extrabold uppercase tracking-wider block">
                        KAYNAK VERİLERİ ORTALAMASI (ANA EKRAN)
                      </span>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {selectedAsset.sources?.length || 1} Farklı Firma Ortalaması
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 tabular-nums">
                        ₺{selectedAsset.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        Alış: ₺{selectedAsset.buyPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Individual Firms List */}
                  <div className="space-y-2">
                    {selectedAsset.sources?.map((src, idx) => {
                      const spread = src.sellPrice - src.buyPrice;
                      return (
                        <div
                          key={src.sourceId}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{src.sourceName}</span>
                                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-md font-medium">
                                    {src.sourceType}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                  {src.sourceUrl}
                                </div>
                              </div>
                            </div>

                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Firma Kaynak Ekranını Aç"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                              <span className="text-[9px] text-slate-400 font-bold block">ALIŞ</span>
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white tabular-nums">
                                ₺{src.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                              <span className="text-[9px] text-slate-400 font-bold block">SATIŞ</span>
                              <span className="font-extrabold text-xs text-slate-900 dark:text-white tabular-nums">
                                ₺{src.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
                              <span className="text-[9px] text-slate-400 font-bold block">MAKAS (SPREAD)</span>
                              <span className="font-extrabold text-xs text-amber-600 tabular-nums">
                                ₺{spread.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: METALLER LİSTESİ */}
          {activeTab === 'metals' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                KIYMETLİ MADENLER (FİRMA ORTALAMALARI)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {preciousMetals.map(metal => {
                  const isSelected = selectedAsset.code === metal.code;
                  const isPos = metal.changeRate >= 0;
                  return (
                    <button
                      key={metal.code}
                      onClick={() => setSelectedAsset(metal)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-bold text-xs">
                          {metal.code === 'XAU' ? '🥇' : metal.code === 'XAG' ? '🥈' : metal.code === 'XPT' ? '⚙️' : '💎'}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {metal.name}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Ort. Alış: ₺{metal.buyPrice.toLocaleString('tr-TR')} · {metal.sources?.length} Kaynak
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                          ₺{metal.sellPrice.toLocaleString('tr-TR')}
                        </div>
                        <div className={`text-[10px] font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}%{metal.changeRate.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: DÖVİZLER LİSTESİ */}
          {activeTab === 'currencies' && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                DÖVİZ KURLARI (FİRMA ORTALAMALARI)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {foreignCurrencies.map(curr => {
                  const isSelected = selectedAsset.code === curr.code;
                  const isPos = curr.changeRate >= 0;
                  return (
                    <button
                      key={curr.code}
                      onClick={() => setSelectedAsset(curr)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center">
                          {curr.symbol}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900 dark:text-white">
                            {curr.name} ({curr.code})
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Ort. Alış: ₺{curr.buyPrice.toFixed(curr.code === 'RUB' ? 3 : 2)} · {curr.sources?.length} Kaynak
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                          ₺{curr.sellPrice.toFixed(curr.code === 'RUB' ? 3 : 2)}
                        </div>
                        <div className={`text-[10px] font-bold ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                          {isPos ? '+' : ''}%{curr.changeRate.toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: AL-SAT CONVERTER */}
          {activeTab === 'converter' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  ANLIK İŞLEM & DÖNÜŞTÜRÜCÜ
                </h3>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setTradeType('buy')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      tradeType === 'buy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    AL (Varlık Ekle)
                  </button>
                  <button
                    onClick={() => setTradeType('sell')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      tradeType === 'sell' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    SAT (Nakte Çevir)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Varlık Seçin:
                </label>
                <select
                  value={selectedAsset.code}
                  onChange={e => {
                    const match = marketRates.find(r => r.code === e.target.value);
                    if (match) setSelectedAsset(match);
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                >
                  {marketRates.map(m => (
                    <option key={m.code} value={m.code}>
                      {m.name} (Ortalama: ₺{m.sellPrice.toLocaleString('tr-TR')} / {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Miktar ({selectedAsset.unit}):
                </label>
                <input
                  type="number"
                  step="any"
                  value={tradeGrams}
                  onChange={e => setTradeGrams(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-base font-extrabold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">TL Hesabı:</label>
                  <select
                    value={selectedSourceAccount}
                    onChange={e => setSelectedSourceAccount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-1.5 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    {accounts.filter(a => a.type === 'nakit' || a.type === 'banka').map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance.toLocaleString('tr-TR')} ₺)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-1">Yatırım Hesabı:</label>
                  <select
                    value={selectedTargetAccount}
                    onChange={e => setSelectedTargetAccount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2 py-1.5 font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    {accounts.filter(a => a.type === 'birikim').map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Toplam Tutar (Ortalama Kur):</span>
                  <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                    ₺{calculatedTradeAmountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={handleExecuteTrade}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  İşlemi Gerçekleştir
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showParityTransfer && (
        <InvestmentTransferModal onClose={() => setShowParityTransfer(false)} />
      )}
    </div>
  );
};
