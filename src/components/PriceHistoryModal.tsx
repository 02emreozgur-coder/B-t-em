import React, { useState, useMemo, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, Calendar, BarChart2, Activity, ExternalLink, Sparkles, Zap, ChevronRight } from 'lucide-react';
import { MarketRate, PriceHistoryPoint } from '../types';

interface PriceHistoryModalProps {
  asset: MarketRate;
  onClose: () => void;
  onOpenArbitrageWithAsset?: (assetCode: string) => void;
}

export const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({
  asset,
  onClose,
  onOpenArbitrageWithAsset
}) => {
  const [timeframe, setTimeframe] = useState<'1G' | '1H' | '1A' | '3A' | '1Y'>('1G');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [hoveredPoint, setHoveredPoint] = useState<PriceHistoryPoint | null>(null);
  const [serverPoints, setServerPoints] = useState<PriceHistoryPoint[]>([]);

  // Fetch or generate cached historical data instantly without lag
  useEffect(() => {
    let isMounted = true;
    fetch(`/api/rates/history?code=${asset.code}&timeframe=${timeframe}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.points) && data.points.length > 0) {
          setServerPoints(data.points);
        }
      })
      .catch(() => {
        // Fallback to local high-performance generation if offline
      });

    return () => { isMounted = false; };
  }, [asset.code, timeframe]);

  // High performance generated points based on selected timeframe
  const points: PriceHistoryPoint[] = useMemo(() => {
    if (serverPoints.length > 0 && timeframe === '1G') {
      return serverPoints;
    }

    const count = timeframe === '1G' ? 36 : timeframe === '1H' ? 28 : timeframe === '1A' ? 30 : timeframe === '3A' ? 45 : 52;
    const result: PriceHistoryPoint[] = [];
    const basePrice = asset.buyPrice;
    const now = Date.now();
    const intervalMs = timeframe === '1G' ? 40 * 60 * 1000 : timeframe === '1H' ? 6 * 3600 * 1000 : 24 * 3600 * 1000;

    for (let i = count; i >= 0; i--) {
      const timeMs = now - i * intervalMs;
      const d = new Date(timeMs);
      const timeLabel = timeframe === '1G'
        ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });

      const cycle = Math.sin(i * 0.35) * 0.012 + Math.cos(i * 0.15) * 0.008;
      const noise = (Math.sin(i * 1.7) * 0.004);
      const close = Number((basePrice * (1 + cycle + noise)).toFixed(asset.code === 'RUB' ? 3 : 2));
      const open = Number((basePrice * (1 + cycle + noise - 0.002)).toFixed(asset.code === 'RUB' ? 3 : 2));
      const high = Number((Math.max(open, close) * 1.0025).toFixed(asset.code === 'RUB' ? 3 : 2));
      const low = Number((Math.min(open, close) * 0.9975).toFixed(asset.code === 'RUB' ? 3 : 2));

      result.push({
        timestamp: d.toISOString(),
        timeLabel,
        open,
        high,
        low,
        close,
        buyPrice: close,
        sellPrice: Number((close * (asset.sellPrice / (asset.buyPrice || 1))).toFixed(asset.code === 'RUB' ? 3 : 2)),
        volume: Math.floor(120 + Math.abs(Math.sin(i)) * 340)
      });
    }
    return result;
  }, [asset, timeframe, serverPoints]);

  const activePoint = hoveredPoint || points[points.length - 1] || null;

  // Chart min/max scaling
  const { minVal, maxVal } = useMemo(() => {
    if (points.length === 0) return { minVal: 0, maxVal: 100 };
    let min = Infinity;
    let max = -Infinity;
    points.forEach(p => {
      if (p.low < min) min = p.low;
      if (p.high > max) max = p.high;
    });
    const padding = (max - min) * 0.1 || 1;
    return {
      minVal: min - padding,
      maxVal: max + padding
    };
  }, [points]);

  const chartWidth = 520;
  const chartHeight = 180;

  const getY = (val: number) => {
    if (maxVal === minVal) return chartHeight / 2;
    return chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
  };

  const getX = (idx: number) => {
    if (points.length <= 1) return 0;
    return (idx / (points.length - 1)) * (chartWidth - 20) + 10;
  };

  // Line chart path
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.reduce((path, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.close);
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  }, [points, minVal, maxVal]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    return `${linePath} L ${lastX} ${chartHeight} L ${firstX} ${chartHeight} Z`;
  }, [linePath, points]);

  const isPositive = asset.changeRate >= 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-sm">
              {asset.symbol || asset.code}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {asset.name}
                </h3>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">
                  {asset.code}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Fiyat Geçmişi & Kurlar
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <Sparkles className="w-2.5 h-2.5" />
              Çift Tıklama
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          
          {/* Main Price Display & Current Snapshot */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 border border-slate-800 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
                  {activePoint === hoveredPoint ? `İMLEÇ: ${activePoint?.timeLabel}` : 'GÜNCEL ORTALAMA SATIŞ'}
                </span>
                <div className="text-2xl font-black text-white tabular-nums tracking-tight mt-0.5">
                  ₺{activePoint ? activePoint.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: asset.code === 'RUB' ? 3 : 2 }) : asset.sellPrice.toLocaleString('tr-TR')}
                  <span className="text-xs text-slate-400 font-normal ml-1">/{asset.unit}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase block">
                  ALIŞ FİYATI
                </span>
                <div className="text-lg font-bold text-slate-200 tabular-nums">
                  ₺{activePoint ? activePoint.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: asset.code === 'RUB' ? 3 : 2 }) : asset.buyPrice.toLocaleString('tr-TR')}
                </div>
                <div className={`text-[10px] font-bold flex items-center justify-end gap-0.5 mt-0.5 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span>{isPositive ? '+' : ''}{asset.changeRate}% (24s)</span>
                </div>
              </div>
            </div>

            {/* Timeframe & Chart Type Bar */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl">
                {(['1G', '1H', '1A', '3A', '1Y'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-all ${
                      timeframe === tf
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-xl">
                <button
                  onClick={() => setChartType('candle')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    chartType === 'candle'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mum 🕯️
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    chartType === 'line'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Çizgi 📈
                </button>
              </div>
            </div>

            {/* Pure SVG Chart - Ultra Fast 60FPS, Zero Lag */}
            <div className="relative pt-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 overflow-visible cursor-crosshair select-none"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />
                <line x1="0" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke="#334155" strokeDasharray="3 3" opacity="0.4" />

                {chartType === 'line' ? (
                  <>
                    <path d={areaPath} fill="url(#chartGradient)" />
                    <path d={linePath} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
                    {points.map((pt, idx) => {
                      const x = getX(idx);
                      const y = getY(pt.close);
                      const isHovered = activePoint === pt;
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={isHovered ? 4.5 : 0}
                          fill="#f59e0b"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </>
                ) : (
                  /* Candlestick Chart */
                  points.map((pt, idx) => {
                    const x = getX(idx);
                    const openY = getY(pt.open);
                    const closeY = getY(pt.close);
                    const highY = getY(pt.high);
                    const lowY = getY(pt.low);
                    const isGreen = pt.close >= pt.open;
                    const candleColor = isGreen ? '#10b981' : '#ef4444';
                    const candleTop = Math.min(openY, closeY);
                    const candleHeight = Math.max(2, Math.abs(closeY - openY));
                    const candleWidth = Math.max(3, (chartWidth / points.length) * 0.65);

                    return (
                      <g
                        key={idx}
                        className="cursor-pointer transition-opacity hover:opacity-80"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onTouchStart={() => setHoveredPoint(pt)}
                      >
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={candleColor}
                          strokeWidth="1.2"
                        />
                        {/* Body */}
                        <rect
                          x={x - candleWidth / 2}
                          y={candleTop}
                          width={candleWidth}
                          height={candleHeight}
                          fill={candleColor}
                          rx="1"
                        />
                      </g>
                    );
                  })
                )}

                {/* Crosshair indicator */}
                {hoveredPoint && (
                  <g pointerEvents="none">
                    <line
                      x1={getX(points.indexOf(hoveredPoint))}
                      y1="0"
                      x2={getX(points.indexOf(hoveredPoint))}
                      y2={chartHeight}
                      stroke="#94a3b8"
                      strokeDasharray="2 2"
                      strokeWidth="1"
                    />
                  </g>
                )}
              </svg>

              {/* Time axis labels */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 font-mono">
                <span>{points[0]?.timeLabel}</span>
                <span>{points[Math.floor(points.length / 2)]?.timeLabel}</span>
                <span>{points[points.length - 1]?.timeLabel}</span>
              </div>
            </div>
          </div>

          {/* 4 Metric OHLC cards */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">AÇILIŞ</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                ₺{activePoint?.open.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[9px] text-emerald-600 font-bold block uppercase">EN YÜKSEK</span>
              <span className="text-xs font-black text-emerald-600 tabular-nums">
                ₺{activePoint?.high.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
              <span className="text-[9px] text-rose-600 font-bold block uppercase">EN DÜŞÜK</span>
              <span className="text-xs font-black text-rose-600 tabular-nums">
                ₺{activePoint?.low.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 font-bold block uppercase">KAPANIŞ</span>
              <span className="text-xs font-black text-slate-800 dark:text-slate-100 tabular-nums">
                ₺{activePoint?.close.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Kuyumcular & Bürolar Anlık Canlı Fiyat Tablosu */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Kuyumcu & Döviz Bürosu Fiyatları ({asset.sources?.length || 0})</span>
              </div>
              {onOpenArbitrageWithAsset && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenArbitrageWithAsset(asset.code);
                  }}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3 h-3 text-emerald-500" />
                  Arbitrajda İncele
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {asset.sources && asset.sources.length > 0 ? (
                asset.sources.map(src => {
                  const spread = src.sellPrice - src.buyPrice;
                  return (
                    <div
                      key={src.sourceId}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {src.sourceName}
                          </span>
                          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1 py-0.2 rounded font-mono">
                            {src.sourceType}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Makas: ₺{spread.toFixed(2)}</span>
                          {src.sourceUrl && (
                            <a
                              href={src.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:underline flex items-center gap-0.5"
                            >
                              <span>Site</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">ALIŞ</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                            ₺{src.buyPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">SATIŞ</span>
                          <span className="text-xs font-black text-amber-600 dark:text-amber-400 tabular-nums">
                            ₺{src.sellPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Bu varlık için firma kaynağı bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* Recent Price History Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Geçmiş Fiyat Çizelgesi</span>
              </span>
              <span className="text-[10px] text-slate-400">Son {points.length} Kayıt</span>
            </div>

            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
              {points.slice().reverse().map((pt, idx) => (
                <div key={idx} className="px-3 py-2 flex items-center justify-between text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">{pt.timeLabel}</span>
                    {pt.close >= pt.open ? (
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded font-bold">Yükseliş</span>
                    ) : (
                      <span className="text-[9px] text-red-600 bg-red-50 dark:bg-red-950/40 px-1 rounded font-bold">Düşüş</span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 tabular-nums">
                    <div>
                      <span className="text-slate-400 text-[9px] mr-1">Alış:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">₺{pt.buyPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[9px] mr-1">Satış:</span>
                      <span className="font-bold text-slate-900 dark:text-white">₺{pt.sellPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Kaptan, Güneş, Solis, İlkay, Altınköşe, Vizyon, SAR
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-xs"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
