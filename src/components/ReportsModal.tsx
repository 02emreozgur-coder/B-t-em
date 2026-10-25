import React, { useState, useMemo } from 'react';
import {
  X,
  PieChart,
  BarChart3,
  Gauge,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  AlertCircle,
  FileText,
  Sliders,
  DollarSign,
  Sparkles,
  AlertTriangle,
  TrendingDown,
  Send,
  ShieldCheck,
  Scale,
  Building,
  Landmark,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ReportsModalProps {
  initialReportType?: 'kategori' | 'periyodik' | 'genel' | 'butce';
  filterAccountName?: string;
  onClose: () => void;
  onOpenPdfExport: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({
  initialReportType = 'kategori',
  filterAccountName,
  onClose,
  onOpenPdfExport
}) => {
  const {
    budgetPlans,
    updateBudgetLimit,
    accounts,
    transactions,
    marketRates,
    totalAssets,
    totalReceivables,
    totalDebts,
    netWorth,
    smartBudgetProjections,
    addNotification
  } = useApp();

  const [activeReport, setActiveReport] = useState<'kategori' | 'periyodik' | 'genel' | 'butce'>(
    initialReportType
  );

  // Kategori Dağılımı state
  const [categoryType, setCategoryType] = useState<'gider' | 'gelir'>('gider');
  const [selectedMonth, setSelectedMonth] = useState<string>('1-31 Ekim 2026');
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<string | null>(null);

  // Periyodik Rapor state
  const [periodicMode, setPeriodicMode] = useState<'donemsel' | 'toplam'>('donemsel');

  // Dynamic Category breakdown calculated from actual transactions
  const categoryData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; color: string }>();

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

    transactions.forEach(t => {
      // If filtering by specific account
      if (filterAccountName && t.accountName !== filterAccountName && t.toAccountName !== filterAccountName) {
        return;
      }

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

    if (map.size > 0) {
      const totalSum = Array.from(map.values()).reduce((s, c) => s + c.total, 0) || 1;
      return Array.from(map.entries())
        .map(([name, data]) => ({
          name: name.toUpperCase(),
          total: data.total,
          count: data.count,
          percent: Math.round((data.total / totalSum) * 100),
          color: data.color
        }))
        .sort((a, b) => b.total - a.total);
    }

    // Baseline fallbacks if no transactions exist yet
    if (categoryType === 'gider') {
      return [
        { name: 'YEMEK / MARKET', total: 7541.32, count: 12, percent: 41, color: '#ef4444' },
        { name: 'GİYİM', total: 5352.32, count: 4, percent: 29, color: '#f59e0b' },
        { name: 'ALIŞVERİŞ', total: 2194.55, count: 4, percent: 12, color: '#3b82f6' },
        { name: 'KİŞİSEL BAKIM', total: 900.00, count: 1, percent: 5, color: '#ec4899' },
        { name: 'ARAÇ YAKIT', total: 682.19, count: 2, percent: 4, color: '#dc2626' },
      ];
    } else {
      return [
        { name: 'MAAŞ', total: 55000.00, count: 1, percent: 45, color: '#10b981' },
        { name: 'PRİM', total: 46200.00, count: 1, percent: 38, color: '#059669' },
        { name: 'A A YATIRIM', total: 20212.00, count: 2, percent: 17, color: '#0284c7' },
      ];
    }
  }, [categoryType, transactions, filterAccountName]);

  const totalCategoryAmount = useMemo(() => {
    return categoryData.reduce((acc, c) => acc + c.total, 0);
  }, [categoryData]);

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedCategoryDetail) return [];
    return transactions.filter(t => {
      const isMatch = categoryType === 'gider'
        ? (t.type === 'gider' || t.type === 'odeme')
        : (t.type === 'gelir' || t.type === 'tahsilat');
      return isMatch && (t.category?.toUpperCase() === selectedCategoryDetail.toUpperCase());
    });
  }, [transactions, selectedCategoryDetail, categoryType]);

  const generalStatusBreakdown = useMemo(() => {
    const activeAccounts = accounts.filter(a => a.includeInGeneralStatus !== false);

    let cashTRY = 0;
    let bankDepositTRY = 0;
    let metalTRY = 0;
    let foreignCurrencyTRY = 0;
    let receivablesTRY = 0;

    let creditCardDebtTRY = 0;
    let bankLoanDebtTRY = 0;
    let officialInstitutionalDebtTRY = 0;
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

  // Periodic Report with live dynamic calculations for current month (Eki 2026)
  const periodicMonths = useMemo(() => {
    const liveIncome = transactions
      .filter(t => t.type === 'gelir' || t.type === 'tahsilat')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const liveExpense = transactions
      .filter(t => t.type === 'gider' || t.type === 'odeme')
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const liveNet = liveIncome - liveExpense;

    return [
      { period: 'Eki 2025', income: 44305, expense: -44330.50, net: -25.5, cum: -25.5 },
      { period: 'Kas 2025', income: 71947.28, expense: -71486.78, net: 460.5, cum: 435.0 },
      { period: 'Ara 2025', income: 93281.25, expense: -93466.25, net: -185.0, cum: 250.0 },
      { period: 'Oca 2026', income: 520, expense: -565.00, net: -45.0, cum: 205.0 },
      { period: 'Şub 2026', income: 65035, expense: -64880.00, net: 155.0, cum: 360.0 },
      { period: 'Mar 2026', income: 220160, expense: -220140.00, net: 20.0, cum: 380.0 },
      { period: 'Nis 2026', income: 8000, expense: -8090.00, net: -90.0, cum: 290.0 },
      { period: 'May 2026', income: 28400, expense: -27525.00, net: 875.0, cum: 1165.0 },
      { period: 'Haz 2026', income: 5555, expense: -6190.00, net: -635.0, cum: 530.0 },
      { period: 'Tem 2026', income: 52050, expense: -51477.50, net: 572.5, cum: 1102.5 },
      { period: 'Ağu 2026', income: 7850, expense: -8240.00, net: -390.0, cum: 712.5 },
      { period: 'Eyl 2026', income: 202862, expense: -201730.00, net: 1132.0, cum: 1844.5 },
      {
        period: 'Eki 2026',
        income: liveIncome > 0 ? liveIncome : 121774.52,
        expense: liveExpense > 0 ? -liveExpense : -18186.38,
        net: liveIncome > 0 || liveExpense > 0 ? liveNet : 103588.14,
        cum: liveIncome > 0 || liveExpense > 0 ? 1844.5 + liveNet : 105432.64
      },
    ];
  }, [transactions]);

  // Dynamic live budget plans
  const dynamicBudgetPlans = useMemo(() => {
    return budgetPlans.map(plan => {
      // Calculate real spent from transactions for this category
      const realSpent = transactions
        .filter(t => (t.type === 'gider' || t.type === 'odeme') && t.category.toLowerCase() === plan.categoryName.toLowerCase())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const actualSpent = realSpent > 0 ? realSpent : plan.spent;
      return {
        ...plan,
        spent: actualSpent
      };
    });
  }, [budgetPlans, transactions]);

  // Dynamic currency and precious metals breakdown
  const currencyBreakdown = useMemo(() => {
    const breakdown: { code: string; name: string; amount: number; unit: string; tryEquivalent: number; colorClass: string }[] = [];

    const activeAccounts = accounts.filter(a => a.includeInGeneralStatus !== false);

    // TRY
    const tryTotal = activeAccounts
      .filter(a => a.currency === 'TRY' && a.type !== 'kredi_karti')
      .reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0);
    breakdown.push({ code: 'TRY', name: 'Türk Lirası (TRY)', amount: tryTotal, unit: '₺', tryEquivalent: tryTotal, colorClass: 'text-slate-900 dark:text-white' });

    // Currencies & Metals
    const currencies = [
      { code: 'EUR', name: 'Euro (EUR)', unit: '€', colorClass: 'text-blue-500' },
      { code: 'USD', name: 'Amerikan Doları (USD)', unit: '$', colorClass: 'text-emerald-500' },
      { code: 'XAU', name: 'Has Altın (XAU)', unit: 'gr', colorClass: 'text-amber-500 font-bold' },
      { code: 'XAG', name: 'Gümüş (XAG)', unit: 'gr', colorClass: 'text-slate-400 font-bold' },
      { code: 'XPT', name: 'Platin (XPT)', unit: 'gr', colorClass: 'text-sky-500 font-bold' },
      { code: 'XPD', name: 'Paladyum (XPD)', unit: 'gr', colorClass: 'text-indigo-400 font-bold' },
      { code: 'GBP', name: 'İngiliz Sterlini (GBP)', unit: '£', colorClass: 'text-purple-500' },
    ];

    currencies.forEach(curr => {
      const rate = marketRates.find(r => r.code === curr.code)?.sellPrice || 1;
      const accs = activeAccounts.filter(a => a.currency === curr.code);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {activeReport === 'kategori' && 'Kategori Dağılımı'}
              {activeReport === 'periyodik' && 'Periyodik Rapor'}
              {activeReport === 'genel' && 'Genel Durum'}
              {activeReport === 'butce' && 'Bütçe Planlama Analizi'}
            </h2>
            {filterAccountName && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                {filterAccountName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPdfExport}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Döküm</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center justify-around border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-2 py-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveReport('kategori')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeReport === 'kategori'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Kategori Dağılımı
          </button>
          <button
            onClick={() => setActiveReport('periyodik')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeReport === 'periyodik'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Periyodik Rapor
          </button>
          <button
            onClick={() => setActiveReport('butce')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeReport === 'butce'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Bütçe Planlama
          </button>
          <button
            onClick={() => setActiveReport('genel')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              activeReport === 'genel'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Genel Durum
          </button>
        </div>

        {/* Report Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: Kategori Dağılımı */}
          {activeReport === 'kategori' && (
            <div className="space-y-4">
              {selectedCategoryDetail ? (
                /* Category Drilldown Detail View */
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setSelectedCategoryDetail(null)}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Tüm Kategorilere Dön</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Kategori Detay Analizi
                    </span>
                  </div>

                  {(() => {
                    const catInfo = categoryData.find(c => c.name.toUpperCase() === selectedCategoryDetail.toUpperCase());
                    const total = catInfo?.total || 0;
                    const count = selectedCategoryTransactions.length || catInfo?.count || 1;
                    const avg = total / Math.max(1, count);
                    const color = catInfo?.color || '#3b82f6';

                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
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

                        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-200 dark:border-slate-700">
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
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto no-scrollbar border border-slate-200 dark:border-slate-800 rounded-xl">
                        {selectedCategoryTransactions.map(tx => (
                          <div key={tx.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
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
                      <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        Bu kategoriye ait işlem kaydı bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Main Category Donut & Clickable List */
                <>
                  {/* Date & Income/Expense Summary Strip */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <ChevronLeft className="w-4 h-4 text-slate-400 cursor-pointer" />
                      <span>{selectedMonth}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-emerald-600 font-bold block">GELİR</span>
                        <span className="font-extrabold tabular-nums">₺121.774,52</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-red-600 font-bold block">GİDER</span>
                        <span className="font-extrabold tabular-nums text-red-600">₺18.186,38</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Gelir vs Gider */}
                  <div className="flex justify-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setCategoryType('gider')}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          categoryType === 'gider'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        GİDER
                      </button>
                      <button
                        onClick={() => setCategoryType('gelir')}
                        className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                  <div className="relative flex items-center justify-center py-4">
                    <div className="w-48 h-48 relative flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Ring background */}
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="16"
                          className="text-slate-100 dark:text-slate-800"
                        />
                        {/* Segments */}
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
                              strokeWidth="16"
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
                      {/* Center Text */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {categoryType === 'gider' ? 'GİDER' : 'GELİR'}
                        </span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-white tabular-nums">
                          ₺{totalCategoryAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Table with Click to Drilldown */}
                  <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold px-1 pb-1">
                      <span>KATEGORİ (Detay için dokunun)</span>
                      <span>TUTAR & PAY</span>
                    </div>
                    {categoryData.map(cat => (
                      <div
                        key={cat.name}
                        onClick={() => setSelectedCategoryDetail(cat.name)}
                        className="flex items-center justify-between pt-2 p-1.5 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {cat.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            ({cat.count})
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                            ₺{cat.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] font-semibold text-slate-400">
                            %{cat.percent}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Periyodik Rapor */}
          {activeReport === 'periyodik' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Son 12 Ay (Eki 2025 - Eki 2026)
                </span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    onClick={() => setPeriodicMode('donemsel')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      periodicMode === 'donemsel'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Dönemsel
                  </button>
                  <button
                    onClick={() => setPeriodicMode('toplam')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      periodicMode === 'toplam'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Toplam
                  </button>
                </div>
              </div>

              {/* Dual Bar Chart (Mavi Artı, Kırmızı Eksi) */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-blue-600" /> Artı (Gelir)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-xs bg-red-600" /> Eksi (Gider)
                    </span>
                  </div>
                  <span className="text-emerald-600 font-extrabold">Net Trend (₺)</span>
                </div>

                {/* Bars representation */}
                <div className="h-36 flex items-end justify-between gap-1 pt-2 pb-1 border-b border-slate-200 dark:border-slate-700">
                  {periodicMonths.slice(-10).map((m, idx) => {
                    const maxVal = 250000;
                    const heightIncome = Math.min(100, Math.max(10, (m.income / maxVal) * 100));
                    const heightExpense = Math.min(100, Math.max(10, (Math.abs(m.expense) / maxVal) * 100));
                    return (
                      <div key={m.period} className="flex-1 flex flex-col items-center gap-0.5 group">
                        <div className="w-full flex items-end justify-center gap-0.5 h-28">
                          <div
                            style={{ height: `${heightIncome}%` }}
                            className="w-2 bg-blue-600 rounded-t-xs hover:bg-blue-500 transition-all"
                            title={`Gelir: ₺${m.income}`}
                          />
                          <div
                            style={{ height: `${heightExpense}%` }}
                            className="w-2 bg-red-600 rounded-t-xs hover:bg-red-500 transition-all"
                            title={`Gider: ₺${Math.abs(m.expense)}`}
                          />
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap mt-1">
                          {m.period.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Periodic Table - Fits mobile screen width cleanly without horizontal scroll */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs w-full">
                <table className="w-full text-left table-fixed">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-2 px-2 w-[28%] truncate">Dönemler</th>
                      <th className="py-2 px-1 text-right text-blue-600 w-[24%] truncate">Gelir (+)</th>
                      <th className="py-2 px-1 text-right text-red-600 w-[24%] truncate">Gider (-)</th>
                      <th className="py-2 px-2 text-right w-[24%] truncate">Net (₺)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums text-[11px]">
                    {periodicMonths.slice(-6).map(row => (
                      <tr key={row.period} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2 font-bold text-slate-800 dark:text-slate-200 truncate">{row.period}</td>
                        <td className="py-2 px-1 text-right text-blue-600 font-medium truncate">₺{Math.round(row.income).toLocaleString('tr-TR')}</td>
                        <td className="py-2 px-1 text-right text-red-600 font-medium truncate">₺{Math.round(Math.abs(row.expense)).toLocaleString('tr-TR')}</td>
                        <td className={`py-2 px-2 text-right font-bold truncate ${row.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          ₺{Math.round(row.net).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Bütçe Planlama Analizi (Requested feature!) */}
          {activeReport === 'butce' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                      AYLIK TASARRUF HEDEFİ
                    </span>
                    <div className="text-2xl font-black tabular-nums mt-0.5">
                      ₺45.000 / Ay
                    </div>
                  </div>
                  <div className="p-2.5 bg-white/20 rounded-2xl">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-emerald-500/60 text-xs flex items-center justify-between">
                  <span>Bu Ayki Tasarruf Oranı:</span>
                  <span className="font-extrabold text-sm text-emerald-200">%85 Gerçekleşti 🎉</span>
                </div>
              </div>

              {/* Smart Budget Warning & Projections System (User requested: "Akıllı Uyarı bildirimleri ve ay sonu harcama projeksiyonu") */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 dark:text-slate-100">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>AKILLI UYARI & AY SONU PROJEKSİYONU</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Yapay zeka bütçe rehberi</span>
                </div>

                <div className="space-y-2">
                  {smartBudgetProjections.map(proj => {
                    const isDanger = proj.status === 'danger';
                    const isWarning = proj.status === 'warning';

                    return (
                      <div
                        key={proj.categoryId}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isDanger
                            ? 'bg-red-50/70 dark:bg-red-950/20 border-red-300 dark:border-red-800/60'
                            : isWarning
                            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                            : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {isDanger ? (
                              <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
                            ) : isWarning ? (
                              <AlertCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                            )}
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {proj.categoryName}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                isDanger
                                  ? 'bg-red-600 text-white'
                                  : isWarning
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {isDanger ? 'AŞIM RİSKİ' : isWarning ? 'DİKKAT' : 'GÜVENLİ'}
                            </span>
                          </div>

                          <div className="text-right text-[11px]">
                            <span className="text-slate-400">Ay Sonu Tahmini: </span>
                            <span
                              className={`font-extrabold tabular-nums ${
                                isDanger ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              ₺{proj.projectedMonthEnd.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </div>

                        {/* Advice Message & Guidance */}
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                          {proj.adviceMessage}
                        </p>

                        {/* Projection Metrics Strip */}
                        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800 text-[10px]">
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 text-center">
                            <span className="text-slate-400 block">Günlük Harcama</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-200 tabular-nums">
                              ₺{proj.dailyBurnRate}/gün
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 text-center">
                            <span className="text-slate-400 block">Güvenli Tavan</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                              ₺{proj.safeDailyLimit}/gün
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/70 dark:bg-slate-900/60 text-center">
                            <span className="text-slate-400 block">Tahmini Aşım</span>
                            <span
                              className={`font-extrabold tabular-nums ${
                                proj.projectedExcess > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'
                              }`}
                            >
                              {proj.projectedExcess > 0 ? `+₺${proj.projectedExcess}` : 'Yok'}
                            </span>
                          </div>
                        </div>

                        {/* Action to trigger real notification */}
                        {isDanger && (
                          <div className="mt-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                addNotification(
                                  `⚠️ Akıllı Uyarı: ${proj.categoryName} Aşım Riski!`,
                                  proj.adviceMessage,
                                  'budget'
                                );
                              }}
                              className="text-[10px] font-bold text-red-600 hover:text-red-700 dark:text-red-400 underline inline-flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Bildirim Olarak Gönder</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Category Budget Limits & Progress Bars */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    KATEGORİ HARCAMA LİMİTLERİ VE GERÇEKLEŞME
                  </h4>
                  <span className="text-[10px] text-slate-400">Limitleri düzenleyebilirsiniz</span>
                </div>

                {dynamicBudgetPlans.map(plan => {
                  const percent = Math.min(100, Math.round((plan.spent / plan.monthlyLimit) * 100));
                  const isExceeded = plan.spent > plan.monthlyLimit;
                  const isWarning = percent >= 75;

                  return (
                    <div
                      key={plan.categoryId}
                      className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span>{plan.categoryName}</span>
                          {isExceeded ? (
                            <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.2 rounded-full">
                              LİMİT AŞILDI
                            </span>
                          ) : isWarning ? (
                            <span className="text-[9px] bg-amber-100 text-amber-700 font-extrabold px-1.5 py-0.2 rounded-full">
                              UYARI
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold tabular-nums">
                            ₺{plan.spent.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-slate-400 font-medium"> / ₺{plan.monthlyLimit.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded
                              ? 'bg-red-600'
                              : isWarning
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>%{percent} kullanıldı</span>
                        <span>Kalan: ₺{Math.max(0, plan.monthlyLimit - plan.spent).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Genel Durum (Professional 360 Financial Dashboard) */}
          {activeReport === 'genel' && (
            <div className="space-y-4">
              {/* Hero Net Worth Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>KONSOLİDE NET PORTFÖY DEĞERİ (NET WORTH)</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Aktif
                  </span>
                </div>
                <div className="text-3xl font-black tabular-nums text-emerald-400 mt-2 tracking-tight">
                  ₺{netWorth.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs text-center">
                  <div>
                    <span className="text-slate-400 text-[10px] font-bold uppercase block">TOPLAM VARLIK</span>
                    <div className="font-bold text-white tabular-nums text-xs mt-0.5">
                      ₺{totalAssets.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-400 text-[10px] font-bold uppercase block">ALACAKLAR</span>
                    <div className="font-bold text-blue-300 tabular-nums text-xs mt-0.5">
                      +₺{totalReceivables.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-400 text-[10px] font-bold uppercase block">TOPLAM BORÇ</span>
                    <div className="font-bold text-red-400 tabular-nums text-xs mt-0.5">
                      -₺{totalDebts.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset & Debt Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Varlık Yapısı */}
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                    <span>VARLIK DAĞILIMI</span>
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">Nakit & Vadesiz Banka</span>
                      <span className="font-bold tabular-nums">₺{(generalStatusBreakdown.cashTRY + generalStatusBreakdown.bankDepositTRY).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">Has Altın & Madenler</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300 tabular-nums">₺{generalStatusBreakdown.metalTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">Tahsil Edilecek Alacaklar</span>
                      <span className="font-bold text-blue-700 dark:text-blue-300 tabular-nums">₺{generalStatusBreakdown.receivablesTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>

                {/* Borç Yapısı */}
                <div className="bg-slate-50 dark:bg-slate-850 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-red-600" />
                    <span>BORÇ VE YÜKÜMLÜLÜK YAPISI</span>
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">🏛️ Resmi Kurum Borçları (KYK/Vergi)</span>
                      <span className="font-bold text-red-600 tabular-nums">₺{generalStatusBreakdown.officialInstitutionalDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">🏦 Banka Kredileri</span>
                      <span className="font-bold text-red-600 tabular-nums">₺{generalStatusBreakdown.bankLoanDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">💳 Kredi Kartı Dönem Borcu</span>
                      <span className="font-bold text-red-600 tabular-nums">₺{generalStatusBreakdown.creditCardDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-600 dark:text-slate-300">👤 Şahıs / Diğer Borçlar</span>
                      <span className="font-bold text-red-600 tabular-nums">₺{generalStatusBreakdown.personalDebtTRY.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi-currency breakdown table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span>Döviz ve Emtia Bazında Portföy Dağılımı</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Kurlar ile Senkron</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {currencyBreakdown.map(curr => (
                    <div key={curr.code} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/40">
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
      </div>
    </div>
  );
};
