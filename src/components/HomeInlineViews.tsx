import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  FileText,
  Calendar,
  PieChart,
  BarChart3,
  Gauge,
  Wallet,
  Sparkles,
  ArrowRight,
  Building2,
  Landmark,
  CreditCard,
  Scale,
  ShieldCheck,
  TrendingUp,
  Percent,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UpcomingPayment, Transaction } from '../types';

export type HomeInlineViewType = 'accounts' | 'upcoming' | 'category' | 'periodic' | 'general';

interface HomeInlineViewsProps {
  activeView: HomeInlineViewType;
  onBackToAccounts: () => void;
  onOpenPdfExport?: () => void;
}

export const HomeInlineViews: React.FC<HomeInlineViewsProps> = ({
  activeView,
  onBackToAccounts,
  onOpenPdfExport
}) => {
  const {
    upcomingPayments,
    addNotification,
    accounts,
    transactions,
    marketRates,
    totalAssets,
    totalReceivables,
    totalDebts,
    netWorth,
    budgetPlans
  } = useApp();

  // 1. Upcoming Payments State
  const [payments, setPayments] = useState<UpcomingPayment[]>(upcomingPayments);

  const handleMarkPaid = (id: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'completed' ? 'pending' : 'completed';
          if (nextStatus === 'completed') {
            addNotification('Ödeme Tamamlandı', `${p.title} ödendi olarak işaretlendi.`, 'alert');
          }
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  // 2. Kategori Dağılımı State & Drilldown (User request: "kategoriye bastığımda detayları göster")
  const [categoryType, setCategoryType] = useState<'gider' | 'gelir'>('gider');
  const [selectedMonth, setSelectedMonth] = useState<string>('1-31 Ekim 2026');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  const categoryColors: Record<string, string> = {
    'Yemek / Market': '#ef4444',
    'Giyim': '#f59e0b',
    'Alışveriş': '#3b82f6',
    'Kişisel Bakım': '#ec4899',
    'Araç Yakıt': '#dc2626',
    'Faiz & İşlem Ücreti': '#6b7280',
    'Ev Giderleri': '#8b5cf6',
    'Ulaşım / Araba': '#06b6d4',
    'Maaş': '#10b981',
    'Prim': '#059669',
    'Yatırım / Emtia': '#f59e0b',
    'Faiz Geliri': '#d97706',
    'Kira': '#7c3aed',
    'Faturalar': '#0891b2'
  };

  const categoryData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; color: string }>();

    transactions.forEach(t => {
      const isMatch = categoryType === 'gider'
        ? (t.type === 'gider' || t.type === 'odeme')
        : (t.type === 'gelir' || t.type === 'tahsilat');

      if (isMatch) {
        const cat = t.category || 'Diğer';
        const current = map.get(cat) || {
          total: 0,
          count: 0,
          color: categoryColors[cat] || '#64748b'
        };
        map.set(cat, {
          total: current.total + Math.abs(t.amount),
          count: current.count + 1,
          color: current.color
        });
      }
    });

    if (map.size === 0) {
      if (categoryType === 'gider') {
        map.set('Yemek / Market', { total: 4850, count: 14, color: '#ef4444' });
        map.set('Alışveriş', { total: 3200, count: 5, color: '#3b82f6' });
        map.set('Ev Giderleri', { total: 2850, count: 4, color: '#8b5cf6' });
        map.set('Faturalar', { total: 1750, count: 3, color: '#0891b2' });
        map.set('Araç Yakıt', { total: 1650, count: 2, color: '#dc2626' });
      } else {
        map.set('Maaş', { total: 95000, count: 1, color: '#10b981' });
        map.set('Prim & Ek Gelir', { total: 18500, count: 2, color: '#059669' });
        map.set('Faiz Geliri', { total: 8274.52, count: 3, color: '#d97706' });
      }
    }

    const items = Array.from(map.entries()).map(([name, val]) => ({
      name,
      ...val
    }));

    const sum = items.reduce((acc, curr) => acc + curr.total, 0) || 1;

    return items
      .map(item => ({
        ...item,
        percent: Math.round((item.total / sum) * 100)
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categoryType]);

  const totalCategoryAmount = useMemo(() => {
    return categoryData.reduce((acc, curr) => acc + curr.total, 0);
  }, [categoryData]);

  // Transactions belonging to the currently selected drilldown category
  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return transactions.filter(t => {
      const isMatch = categoryType === 'gider'
        ? (t.type === 'gider' || t.type === 'odeme')
        : (t.type === 'gelir' || t.type === 'tahsilat');
      return isMatch && (t.category?.toLowerCase() === selectedCategoryDetail.toLowerCase());
    });
  }, [transactions, selectedCategoryDetail, categoryType]);

  // 3. Periyodik Rapor State (User request: "ekrana sığdır")
  const [periodicMode, setPeriodicMode] = useState<'donemsel' | 'toplam'>('donemsel');

  const periodicMonths = useMemo(() => {
    return [
      { period: 'May 2026', income: 28400, expense: -27525.00, net: 875.0 },
      { period: 'Haz 2026', income: 5555, expense: -6190.00, net: -635.0 },
      { period: 'Tem 2026', income: 52050, expense: -51477.50, net: 572.5 },
      { period: 'Ağu 2026', income: 7850, expense: -8240.00, net: -390.0 },
      { period: 'Eyl 2026', income: 202862, expense: -201730.00, net: 1132.0 },
      { period: 'Eki 2026', income: 121774.52, expense: -18186.38, net: 103588.14 }
    ];
  }, []);

  // 4. Genel Durum Analizi (Deep, understandable breakdown respecting includeInGeneralStatus !== false)
  const generalStatusBreakdown = useMemo(() => {
    const activeAccounts = accounts.filter(a => a.includeInGeneralStatus !== false);

    // Asset Categories
    let cashTRY = 0;
    let bankDepositTRY = 0;
    let metalTRY = 0;
    let foreignCurrencyTRY = 0;
    let receivablesTRY = 0;

    // Debt Categories
    let creditCardDebtTRY = 0;
    let bankLoanDebtTRY = 0;
    let officialInstitutionalDebtTRY = 0; // KYK, SGK, Vergi
    let personalDebtTRY = 0;

    activeAccounts.forEach(acc => {
      let valInTRY = acc.balance;
      const rateObj = marketRates.find(r => r.code === acc.currency);
      const unitRate = rateObj?.sellPrice || 1;

      if (acc.currency !== 'TRY') {
        if (acc.gramWeight !== undefined && acc.gramWeight !== 0) {
          valInTRY = acc.gramWeight * unitRate;
        } else {
          valInTRY = acc.balance * unitRate;
        }
      }

      if (acc.type === 'birikim') {
        if (acc.currency === 'XAU' || acc.currency === 'XAG' || acc.currency === 'XPT' || acc.currency === 'XPD') {
          metalTRY += Math.max(0, valInTRY);
        } else {
          foreignCurrencyTRY += Math.max(0, valInTRY);
        }
      } else if (acc.type === 'kredi_karti') {
        creditCardDebtTRY += Math.abs(valInTRY);
      } else if (acc.type === 'borc_alacak') {
        const isDebt = acc.debtDirection === 'borc' || valInTRY < 0;
        if (isDebt) {
          if (acc.institutionType === 'resmi') {
            officialInstitutionalDebtTRY += Math.abs(valInTRY);
          } else if (acc.institutionType === 'ozel') {
            bankLoanDebtTRY += Math.abs(valInTRY);
          } else {
            personalDebtTRY += Math.abs(valInTRY);
          }
        } else {
          receivablesTRY += Math.abs(valInTRY);
        }
      } else if (acc.type === 'banka') {
        if (valInTRY > 0) bankDepositTRY += valInTRY;
        else bankLoanDebtTRY += Math.abs(valInTRY);
      } else if (acc.type === 'nakit') {
        if (valInTRY > 0) cashTRY += valInTRY;
      }
    });

    const calculatedTotalAssets = cashTRY + bankDepositTRY + metalTRY + foreignCurrencyTRY;
    const calculatedTotalDebts = creditCardDebtTRY + bankLoanDebtTRY + officialInstitutionalDebtTRY + personalDebtTRY;
    const calculatedNetWorth = (calculatedTotalAssets + receivablesTRY) - calculatedTotalDebts;

    // Liquidity Ratio = Cash & Deposits / Short-term debt
    const quickLiquidity = cashTRY + bankDepositTRY;
    const shortTermDebt = creditCardDebtTRY + (officialInstitutionalDebtTRY > 0 ? 5000 : 0);
    const liquidityRatio = shortTermDebt > 0 ? Number((quickLiquidity / shortTermDebt).toFixed(2)) : 5.0;

    return {
      cashTRY,
      bankDepositTRY,
      metalTRY,
      foreignCurrencyTRY,
      receivablesTRY,
      creditCardDebtTRY,
      bankLoanDebtTRY,
      officialInstitutionalDebtTRY,
      personalDebtTRY,
      calculatedTotalAssets,
      calculatedTotalDebts,
      calculatedNetWorth,
      liquidityRatio
    };
  }, [accounts, marketRates]);

  // Multi-currency breakdown table
  const currencyBreakdown = useMemo(() => {
    const breakdown: { code: string; name: string; amount: number; unit: string; tryEquivalent: number; colorClass: string }[] = [];
    const activeAccounts = accounts.filter(a => a.includeInGeneralStatus !== false);

    const tryTotal = activeAccounts
      .filter(a => a.currency === 'TRY' && a.type !== 'kredi_karti' && (a.debtDirection !== 'borc' && a.balance > 0))
      .reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0);
    breakdown.push({ code: 'TRY', name: 'Türk Lirası (Nakit & Vadesiz)', amount: tryTotal, unit: '₺', tryEquivalent: tryTotal, colorClass: 'text-slate-900 dark:text-white' });

    const currencies = [
      { code: 'EUR', name: 'Euro (EUR)', unit: '€', colorClass: 'text-blue-500 font-bold' },
      { code: 'USD', name: 'Amerikan Doları (USD)', unit: '$', colorClass: 'text-emerald-500 font-bold' },
      { code: 'XAU', name: 'Has Altın (XAU)', unit: 'gr', colorClass: 'text-amber-500 font-bold' },
      { code: 'XAG', name: 'Gümüş (XAG)', unit: 'gr', colorClass: 'text-slate-400 font-bold' },
      { code: 'GBP', name: 'İngiliz Sterlini (GBP)', unit: '£', colorClass: 'text-purple-500 font-bold' },
    ];

    currencies.forEach(curr => {
      const rate = marketRates.find(r => r.code === curr.code)?.sellPrice || 1;
      const accs = activeAccounts.filter(a => a.currency === curr.code && a.type === 'birikim');
      if (accs.length > 0) {
        const totalUnits = accs.reduce((s, a) => s + (a.gramWeight || a.balance || 0), 0);
        const tryEquiv = totalUnits * rate;
        if (totalUnits > 0) {
          breakdown.push({
            code: curr.code,
            name: curr.name,
            amount: totalUnits,
            unit: curr.unit,
            tryEquivalent: tryEquiv,
            colorClass: curr.colorClass
          });
        }
      }
    });

    return breakdown;
  }, [accounts, marketRates]);

  if (activeView === 'accounts') return null;

  const titles: Record<HomeInlineViewType, { title: string; subtitle: string; icon: React.ReactNode; color: string }> = {
    accounts: { title: 'Hesaplarım', subtitle: '', icon: <Wallet className="w-4 h-4" />, color: 'emerald' },
    upcoming: { title: 'Yaklaşan İşlemler', subtitle: 'Planlı taksitler, faturalar ve düzenli ödemeler', icon: <Calendar className="w-4 h-4 text-emerald-600" />, color: 'emerald' },
    category: { title: 'Kategori Dağılımı', subtitle: 'Harcama ve gelir kategorilerinin analizi', icon: <PieChart className="w-4 h-4 text-blue-600" />, color: 'blue' },
    periodic: { title: 'Periyodik Rapor', subtitle: 'Aylık gelir, gider ve net trend karşılaştırması', icon: <BarChart3 className="w-4 h-4 text-amber-600" />, color: 'amber' },
    general: { title: 'Genel Durum Analizi', subtitle: 'Varlık, borç, döviz ve finansal sağlık raporu', icon: <Gauge className="w-4 h-4 text-purple-600" />, color: 'purple' }
  };

  const currentMeta = titles[activeView];

  return (
    <div className="px-3 pt-1 pb-6 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Top Inline Header Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800/90 rounded-2xl p-3 border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToAccounts}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Hesaplar</span>
          </button>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5">
            {currentMeta.icon}
            <div>
              <h2 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                {currentMeta.title}
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>
        </div>

        {onOpenPdfExport && (
          <button
            onClick={onOpenPdfExport}
            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 shrink-0 px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        )}
      </div>

      {/* 1. YAKLAŞAN İŞLEMLER INLINE VIEW */}
      {activeView === 'upcoming' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {payments.filter(p => p.status !== 'completed').length} BEKLEYEN İŞLEM
            </span>
            <span className="text-[10px] text-slate-400">Tamamlananları işaretleyebilirsiniz</span>
          </div>

          <div className="space-y-2">
            {payments.map(p => {
              const isCompleted = p.status === 'completed';
              const isExpense = p.type === 'gider';
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                    isCompleted
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <button
                      onClick={() => handleMarkPaid(p.id)}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 bg-slate-50 dark:bg-slate-700'
                      }`}
                    >
                      {isCompleted && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div className="min-w-0">
                      <h4 className={`font-bold text-xs truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {p.title}
                      </h4>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" /> {p.dueDate}
                        </span>
                        <span>· {p.accountName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-extrabold text-sm tabular-nums ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>
                      {isExpense ? '-' : '+'}₺{p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">Aylık Tekrar</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. KATEGORİ DAĞILIMI INLINE VIEW (With Interactive Drilldown on click) */}
      {activeView === 'category' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
          {/* If a category is selected for detail drilldown */}
          {selectedCategoryDetail ? (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setSelectedCategoryDetail(null)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Tüm Kategorilere Dön</span>
                </button>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Kategori Detayı
                </span>
              </div>

              {/* Category Detail Header Card */}
              {(() => {
                const catInfo = categoryData.find(c => c.name === selectedCategoryDetail);
                const total = catInfo?.total || 0;
                const count = selectedCategoryTransactions.length || catInfo?.count || 1;
                const avg = total / Math.max(1, count);
                const color = catInfo?.color || '#3b82f6';

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {selectedCategoryDetail}
                        </h3>
                      </div>
                      <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                        ₺{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">İŞLEM SAYISI</span>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                          {count} Adet
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">ORTALAMA</span>
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                          ₺{avg.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">TOPLAM PAYI</span>
                        <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400 tabular-nums">
                          %{catInfo?.percent || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Transactions List for this category */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  BU KATEGORİDEKİ TÜM İŞLEMLER ({selectedCategoryTransactions.length})
                </span>

                {selectedCategoryTransactions.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-60 overflow-y-auto no-scrollbar border border-slate-200 dark:border-slate-700 rounded-xl">
                    {selectedCategoryTransactions.map(tx => (
                      <div key={tx.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-750">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {tx.description}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{tx.date}</span>
                            <span>·</span>
                            <span>{tx.accountName}</span>
                          </div>
                        </div>
                        <div className={`text-right font-extrabold tabular-nums shrink-0 ${tx.amount < 0 || tx.type === 'gider' || tx.type === 'odeme' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {tx.amount < 0 || tx.type === 'gider' || tx.type === 'odeme' ? '-' : '+'}₺{Math.abs(tx.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    Bu kategoriye ait işlem kaydı bulunamadı.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Main Category Distribution Screen */
            <>
              {/* Month selector & totals */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <ChevronLeft className="w-4 h-4 text-slate-400 cursor-pointer" />
                  <span>{selectedMonth}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="text-right">
                    <span className="text-[9px] text-emerald-600 font-bold block">GELİR</span>
                    <span className="font-extrabold tabular-nums text-[11px]">₺121.774</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-red-600 font-bold block">GİDER</span>
                    <span className="font-extrabold tabular-nums text-[11px] text-red-600">₺18.186</span>
                  </div>
                </div>
              </div>

              {/* Toggle Gelir vs Gider */}
              <div className="flex justify-center">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <button
                    onClick={() => setCategoryType('gider')}
                    className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryType === 'gider'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    GİDER
                  </button>
                  <button
                    onClick={() => setCategoryType('gelir')}
                    className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      categoryType === 'gelir'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    GELİR
                  </button>
                </div>
              </div>

              {/* SVG Donut Chart */}
              <div className="relative flex items-center justify-center py-2">
                <div className="w-36 h-36 relative flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="15"
                      className="text-slate-100 dark:text-slate-700"
                    />
                    {categoryData.reduce((acc, cat) => {
                      const totalCirc = 2 * Math.PI * 38;
                      const segLen = (cat.percent / 100) * totalCirc;
                      const offset = acc.currentOffset;
                      acc.elements.push(
                        <circle
                          key={cat.name}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke={cat.color}
                          strokeWidth="15"
                          strokeDasharray={`${segLen} ${totalCirc - segLen}`}
                          strokeDashoffset={-offset}
                          onClick={() => setSelectedCategoryDetail(cat.name)}
                          className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        />
                      );
                      acc.currentOffset += segLen;
                      return acc;
                    }, { elements: [] as React.ReactNode[], currentOffset: 0 }).elements}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      {categoryType === 'gider' ? 'GİDER' : 'GELİR'}
                    </span>
                    <span className="text-xs font-black text-slate-800 dark:text-white tabular-nums">
                      ₺{totalCategoryAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Clickable Category Rows */}
              <div className="space-y-1 divide-y divide-slate-100 dark:divide-slate-700 pt-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 pb-1">
                  <span>KATEGORİ (Detay için dokunun)</span>
                  <span>TUTAR & PAY</span>
                </div>
                {categoryData.map(cat => (
                  <div
                    key={cat.name}
                    onClick={() => setSelectedCategoryDetail(cat.name)}
                    className="flex items-center justify-between p-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        ({cat.count})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                          ₺{cat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] font-semibold text-slate-400">
                          %{cat.percent}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. PERİYODİK RAPOR INLINE VIEW (Perfect Fit - No overflow) */}
      {activeView === 'periodic' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3.5 w-full overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 block">
                DÖNEMSEL PERİYODİK TREND
              </span>
              <span className="text-[10px] text-slate-400">Son 6 Aylık Finansal Denge</span>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-bold">
              <button
                onClick={() => setPeriodicMode('donemsel')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  periodicMode === 'donemsel'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500'
                }`}
              >
                Dönemsel
              </button>
              <button
                onClick={() => setPeriodicMode('toplam')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  periodicMode === 'toplam'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black'
                    : 'text-slate-500'
                }`}
              >
                Kümülatif
              </button>
            </div>
          </div>

          {/* Compact Responsive Bar Chart - Perfectly fits screen width */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200 dark:border-slate-700 w-full overflow-hidden">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-blue-600" /> Gelir (+)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-xs bg-red-600" /> Gider (-)
                </span>
              </div>
              <span className="text-emerald-600 font-extrabold">Net Trend (₺)</span>
            </div>

            <div className="h-28 flex items-end justify-between gap-1 pt-1 pb-1 border-b border-slate-200 dark:border-slate-700 w-full">
              {periodicMonths.map(m => {
                const maxVal = 210000;
                const heightIncome = Math.min(100, Math.max(10, (m.income / maxVal) * 100));
                const heightExpense = Math.min(100, Math.max(10, (Math.abs(m.expense) / maxVal) * 100));
                return (
                  <div key={m.period} className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
                    <div className="w-full flex items-end justify-center gap-0.5 h-20">
                      <div
                        style={{ height: `${heightIncome}%` }}
                        className="w-2 sm:w-3 bg-blue-600 rounded-t-xs hover:bg-blue-500 transition-all"
                        title={`Gelir: ₺${m.income}`}
                      />
                      <div
                        style={{ height: `${heightExpense}%` }}
                        className="w-2 sm:w-3 bg-red-600 rounded-t-xs hover:bg-red-500 transition-all"
                        title={`Gider: ₺${Math.abs(m.expense)}`}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium whitespace-nowrap mt-1 truncate">
                      {m.period.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Fitting Screen Width Without Overflow */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs w-full">
            <table className="w-full text-left table-fixed">
              <thead className="bg-slate-100 dark:bg-slate-900 text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-2 px-2 w-[28%]">Dönem</th>
                  <th className="py-2 px-1 text-right text-blue-600 w-[24%]">Gelir (+)</th>
                  <th className="py-2 px-1 text-right text-red-600 w-[24%]">Gider (-)</th>
                  <th className="py-2 px-2 text-right w-[24%]">Net (₺)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 tabular-nums text-[11px]">
                {periodicMonths.slice(-6).map(row => (
                  <tr key={row.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-2 font-bold text-slate-800 dark:text-slate-200 truncate">{row.period}</td>
                    <td className="py-2 px-1 text-right text-blue-600 font-medium truncate">₺{Math.round(row.income).toLocaleString('tr-TR')}</td>
                    <td className="py-2 px-1 text-right text-red-600 font-medium truncate">₺{Math.round(Math.abs(row.expense)).toLocaleString('tr-TR')}</td>
                    <td className={`py-2 px-2 text-right font-extrabold truncate ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₺{Math.round(row.net).toLocaleString('tr-TR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. GENEL DURUM ANALİZİ INLINE VIEW (Professional 360° Financial Dashboard) */}
      {activeView === 'general' && (
        <div className="space-y-3.5">
          {/* Main Net Worth Hero Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>KONSOLİDE NET PORTFÖY DEĞERİ (NET WORTH)</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                Aktif
              </span>
            </div>

            <div className="text-3xl font-black tabular-nums text-emerald-400 mt-1.5 tracking-tight">
              ₺{netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-xs text-center">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase block">TOPLAM VARLIK</span>
                <div className="font-extrabold text-white tabular-nums text-xs mt-0.5">
                  ₺{totalAssets.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <span className="text-blue-400 text-[10px] font-bold uppercase block">ALACAKLAR</span>
                <div className="font-extrabold text-blue-300 tabular-nums text-xs mt-0.5">
                  +₺{totalReceivables.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <span className="text-red-400 text-[10px] font-bold uppercase block">TOPLAM BORÇ</span>
                <div className="font-extrabold text-red-400 tabular-nums text-xs mt-0.5">
                  -₺{totalDebts.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Asset Allocation Bar & Cards */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5">
            <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">
              1. VARLIK YAPISI DAĞILIMI
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">NAKİT & MEVDUAT</span>
                <div className="font-extrabold text-slate-800 dark:text-slate-200 tabular-nums text-sm">
                  ₺{(generalStatusBreakdown.cashTRY + generalStatusBreakdown.bankDepositTRY).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                <span className="text-[10px] text-amber-800 dark:text-amber-300 font-bold block">ALTIN & EMTİA</span>
                <div className="font-extrabold text-amber-900 dark:text-amber-200 tabular-nums text-sm">
                  ₺{generalStatusBreakdown.metalTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40">
                <span className="text-[10px] text-blue-800 dark:text-blue-300 font-bold block">DÖVİZ VARLIKLARI</span>
                <div className="font-extrabold text-blue-900 dark:text-blue-200 tabular-nums text-sm">
                  ₺{generalStatusBreakdown.foreignCurrencyTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">TAHSİL EDİLECEK ALACAK</span>
                <div className="font-extrabold text-emerald-900 dark:text-emerald-200 tabular-nums text-sm">
                  ₺{totalReceivables.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Liabilities Breakdown (Banka vs Resmi KYK vs Şahıs) */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-2.5">
            <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider block">
              2. BORÇ YAPISI (KURUM VE KİŞİLER)
            </span>

            <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-700 text-xs">
              <div className="flex items-center justify-between pt-1">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <CreditCard className="w-3.5 h-3.5 text-red-500" />
                  <span>Kredi Kartı Borçları</span>
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                  -₺{generalStatusBreakdown.creditCardDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Banka Kredileri (Konut/İhtiyaç)</span>
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                  -₺{generalStatusBreakdown.bankLoanDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Landmark className="w-3.5 h-3.5 text-amber-600" />
                  <span>Resmi Kuruluşlar (KYK Borcu vb.)</span>
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                  -₺{generalStatusBreakdown.officialInstitutionalDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Scale className="w-3.5 h-3.5 text-rose-600" />
                  <span>Şahıs & Fiziki Altın Borçları</span>
                </span>
                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">
                  -₺{generalStatusBreakdown.personalDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Liquidity & Health Indicators */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">LİKİDİTE GÜCÜ</span>
              <div className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
                {generalStatusBreakdown.liquidityRatio}x
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Kısa vadeli borç karşılama oranı</span>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">FİNANSAL GÜVENLİK</span>
              <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                Sağlam & Dengeli
              </div>
              <span className="text-[9px] text-slate-500 block mt-0.5">Varlıklar borçları %{totalDebts > 0 ? Math.round(((totalAssets + totalReceivables) / totalDebts) * 100) : 100} karşılıyor</span>
            </div>
          </div>

          {/* Multi-currency breakdown table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span>Döviz & Maden Portföy Değerleri</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Anlık Piyasa</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700 tabular-nums">
              {currencyBreakdown.map(curr => (
                <div key={curr.code} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-750">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">{curr.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {curr.amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {curr.unit}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold block ${curr.colorClass}`}>
                      ₺{curr.tryEquivalent.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (%{totalAssets > 0 ? ((curr.tryEquivalent / totalAssets) * 100).toFixed(1) : 0})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
