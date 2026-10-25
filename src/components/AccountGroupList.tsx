import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  Coins,
  Scale,
  Landmark,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Gem,
  CircleDot,
  Layers,
  Sparkles,
  DollarSign,
  GraduationCap,
  Home,
  UserMinus,
  CheckCircle2,
  FileText,
  Calendar,
  Clock,
  RotateCcw,
  CornerDownRight,
  Plus,
  Archive
} from 'lucide-react';
import { Account, AccountType } from '../types';
import { useApp } from '../context/AppContext';

interface AccountGroupListProps {
  onSelectAccount: (account: Account) => void;
  searchQuery?: string;
  onOpenAddSupplementaryCard?: (parentAccount?: Account) => void;
}

export const AccountGroupList: React.FC<AccountGroupListProps> = ({
  onSelectAccount,
  searchQuery = '',
  onOpenAddSupplementaryCard
}) => {
  const { accounts, marketRates, addTransaction, toggleArchiveAccount } = useApp();

  const [showArchivedSection, setShowArchivedSection] = useState(false);

  // Collapsible state for groups
  const [collapsed, setCollapsed] = useState<Record<AccountType, boolean>>({
    nakit: false,
    banka: false,
    kredi_karti: false,
    birikim: false,
    borc_alacak: false
  });

  const toggleGroup = (type: AccountType) => {
    setCollapsed(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Helper for credit card cut-off and due dates
  const getCardDateInfo = (day?: number) => {
    if (!day) return null;
    const now = new Date();
    const currentDay = now.getDate();
    let daysLeft = day - currentDay;
    if (daysLeft < 0) {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      daysLeft = daysInMonth - currentDay + day;
    }
    return {
      day,
      daysLeft,
      label: daysLeft === 0 ? 'Bugün' : daysLeft === 1 ? 'Yarın' : `${daysLeft} gün kaldı`
    };
  };

  // Helper for debt due date
  const getDebtDueDateInfo = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        formattedDate: due.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        diffDays,
        isOverdue: diffDays < 0,
        isToday: diffDays === 0,
        badgeText:
          diffDays < 0
            ? `${Math.abs(diffDays)} gün gecikti!`
            : diffDays === 0
            ? 'Bugün Son Gün! ⚠️'
            : diffDays === 1
            ? 'Yarın Vade'
            : `${diffDays} gün kaldı`
      };
    } catch {
      return null;
    }
  };

  const getAccountIcon = (acc: Account) => {
    switch (acc.icon) {
      case 'Wallet': return <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Scale': return <Scale className="w-4 h-4 text-slate-500" />;
      case 'Building2': return <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Landmark': return <Landmark className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'Coins': return <Coins className="w-4 h-4 text-amber-500" />;
      case 'Gem': return <Gem className="w-4 h-4 text-amber-500" />;
      case 'CircleDot': return <CircleDot className="w-4 h-4 text-slate-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-sky-500" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-indigo-500" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'GraduationCap': return <GraduationCap className="w-4 h-4 text-red-500" />;
      case 'Home': return <Home className="w-4 h-4 text-red-600" />;
      case 'UserMinus': return <UserMinus className="w-4 h-4 text-red-700" />;
      case 'CheckCircle2': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'FileText': return <FileText className="w-4 h-4 text-red-600" />;
      default: return <Wallet className="w-4 h-4 text-slate-500" />;
    }
  };

  // Group definitions
  const groups: {
    type: AccountType;
    title: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'nakit',
      title: 'NAKİT',
      icon: <Wallet className="w-4 h-4 text-emerald-600" />,
      color: 'emerald'
    },
    {
      type: 'banka',
      title: 'BANKA',
      icon: <Building2 className="w-4 h-4 text-blue-600" />,
      color: 'blue'
    },
    {
      type: 'kredi_karti',
      title: 'KREDİ KARTI',
      icon: <CreditCard className="w-4 h-4 text-red-600" />,
      color: 'red'
    },
    {
      type: 'birikim',
      title: 'BİRİKİM / YATIRIM (Emtia & Döviz)',
      icon: <Coins className="w-4 h-4 text-amber-500" />,
      color: 'amber'
    },
    {
      type: 'borc_alacak',
      title: 'BORÇ / ALACAK',
      icon: <Scale className="w-4 h-4 text-purple-600" />,
      color: 'purple'
    }
  ];

  // Filter accounts by search query
  const filteredAccounts = searchQuery.trim()
    ? accounts.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.note?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : accounts;

  // Arşivlenen hesapları normal ana listeden ayır (Kullanıcı İsteği)
  const activeAccounts = filteredAccounts.filter(a => !a.isArchived);
  const archivedAccounts = accounts.filter(a => a.isArchived);

  return (
    <div className="px-3 py-2 space-y-3 pb-24">
      {groups.map(group => {
        const groupAccounts = activeAccounts.filter(a => a.type === group.type);
        if (groupAccounts.length === 0 && searchQuery) return null;

        // Calculate total for this group in TRY
        const groupTotalTRY = groupAccounts.reduce((sum, acc) => {
          let val = acc.balance;
          if (acc.currency !== 'TRY') {
            const r = marketRates.find(m => m.code === acc.currency)?.sellPrice || 1;
            val = (acc.gramWeight !== undefined && acc.gramWeight !== 0) ? acc.gramWeight * r : acc.balance * r;
          }
          return sum + val;
        }, 0);

        const isGroupCollapsed = collapsed[group.type];
        const isNegative = groupTotalTRY < 0;

        // Credit Card Group Calculations
        const isCreditCardGroup = group.type === 'kredi_karti';
        const totalCardDebt = isCreditCardGroup
          ? groupAccounts.reduce((sum, a) => sum + Math.abs(a.balance), 0)
          : 0;

        const mainCards = isCreditCardGroup
          ? groupAccounts.filter(a => !a.isSupplementary && !a.parentAccountId)
          : [];

        // Ek kart limitleri toplam limite ve kullanılabilir limite dahil edilmez (yalnızca ana kart limitleri toplanır)
        const totalCardLimit = isCreditCardGroup
          ? mainCards.reduce((sum, a) => sum + (a.limit || 0), 0)
          : 0;
        const totalAvailableLimit = Math.max(0, totalCardLimit - totalCardDebt);

        // Build strict supplementary card mapping for each main card
        const supplementaryMap = new Map<string, Account[]>();
        mainCards.forEach(m => supplementaryMap.set(m.id, []));
        const orphanSupplementaryCards: Account[] = [];

        if (isCreditCardGroup) {
          groupAccounts.filter(a => a.isSupplementary || !!a.parentAccountId).forEach(supp => {
            if (supp.parentAccountId && supplementaryMap.has(supp.parentAccountId)) {
              supplementaryMap.get(supp.parentAccountId)!.push(supp);
            } else if (!supp.parentAccountId) {
              // Legacy unlinked fallback: only match if parent card has distinctive product word like 'free'/'axess'
              // Never match generic bank names (e.g., 'akbank', 'avans', 'hesap', 'kredi')
              const matchedMain = mainCards.find(m => {
                const distinctiveWords = m.name.toLowerCase().split(/\s+/).filter(w =>
                  w.length > 2 && !['bank', 'banka', 'kart', 'kredi', 'hesap', 'akbank', 'garanti', 'yapı', 'finansbank', 'vakıfbank', 'avans', 'ihtiyaç'].includes(w)
                );
                return distinctiveWords.length > 0 && distinctiveWords.some(w => supp.name.toLowerCase().includes(w));
              });

              if (matchedMain) {
                supplementaryMap.get(matchedMain.id)!.push(supp);
              } else {
                orphanSupplementaryCards.push(supp);
              }
            } else {
              orphanSupplementaryCards.push(supp);
            }
          });
        }

        return (
          <div
            key={group.type}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.type)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-left active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-white dark:bg-slate-700 shadow-2xs">
                  {group.icon}
                </span>
                <span className="text-xs font-bold tracking-wider text-slate-700 dark:text-slate-200 uppercase">
                  {group.title}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({groupAccounts.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-xs font-bold tabular-nums ${
                    isCreditCardGroup || isNegative
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {isCreditCardGroup
                    ? `-${totalCardDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`
                    : `${groupTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`}
                </span>
                {isGroupCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* Account Rows */}
            {!isGroupCollapsed && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {/* 1. CREDIT CARDS HIERARCHICAL RENDERING */}
                {isCreditCardGroup ? (
                  <>
                    {mainCards.map(mainCard => {
                      const supplementaryOfThisCard = supplementaryMap.get(mainCard.id) || [];
                      const cutoffInfo = getCardDateInfo(mainCard.cardCutoffDay);
                      const dueInfo = getCardDateInfo(mainCard.cardPaymentDueDay);
                      const cardDebt = Math.abs(mainCard.balance);
                      const cardLimit = mainCard.limit || 0;
                      const cardAvail = Math.max(0, cardLimit - cardDebt);
                      const minPayment = (cardDebt * (mainCard.minPaymentPercent || 20)) / 100;
                      const isExcluded = mainCard.includeInGeneralStatus === false;

                      return (
                        <div key={mainCard.id} className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                          {/* Main Card Row */}
                          <div
                            onClick={() => onSelectAccount(mainCard)}
                            className={`p-3.5 cursor-pointer transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                              isExcluded ? 'opacity-50 grayscale-[50%]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              {/* Left Info */}
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {mainCard.name}
                                    </span>
                                    <span className="text-[9px] bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 font-extrabold px-1.5 py-0.2 rounded-md">
                                      Ana Kart
                                    </span>
                                    {isExcluded && (
                                      <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded-sm">
                                        Hariç
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                      {mainCard.cardHolder || 'Emre Özgür'}
                                    </span>
                                    {mainCard.cardLast4 && (
                                      <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                        •••• {mainCard.cardLast4}
                                      </span>
                                    )}
                                    <span>· Limit: ₺{cardLimit.toLocaleString('tr-TR')}</span>
                                  </div>

                                  {/* Ekstre Kesim & Son Ödeme Tarihi Rozetleri */}
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {cutoffInfo && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 px-2 py-0.5 rounded-md font-semibold">
                                        <Calendar className="w-3 h-3 text-amber-600" />
                                        <span>Ekstre: Ayın {cutoffInfo.day}'i ({cutoffInfo.label})</span>
                                      </span>
                                    )}
                                    {dueInfo && (
                                      <span className="inline-flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 px-2 py-0.5 rounded-md font-bold">
                                        <Clock className="w-3 h-3 text-rose-600" />
                                        <span>Son Ödeme: Ayın {dueInfo.day}'i ({dueInfo.label})</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right Balances */}
                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 font-bold block uppercase">GÜNCEL BORÇ</span>
                                <div className="text-sm font-black text-red-600 dark:text-red-400 tabular-nums">
                                  -₺{cardDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums mt-0.5">
                                  Kalan: ₺{cardAvail.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                                </div>
                                {cardDebt > 0 && (
                                  <div className="text-[9px] text-slate-400 tabular-nums mt-0.5">
                                    Asgari: ₺{minPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Supplementary Cards Directly Underneath */}
                          {supplementaryOfThisCard.length > 0 && (
                            <div className="bg-red-50/25 dark:bg-red-950/15 border-t border-slate-100 dark:border-slate-800/60 pl-6 pr-3 py-1 space-y-1">
                              {supplementaryOfThisCard.map(suppCard => {
                                const suppDebt = Math.abs(suppCard.balance);
                                const suppLimit = suppCard.limit || 0;
                                const isSuppExcluded = suppCard.includeInGeneralStatus === false;

                                return (
                                  <div
                                    key={suppCard.id}
                                    onClick={() => onSelectAccount(suppCard)}
                                    className={`py-2 px-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors hover:bg-red-50/60 dark:hover:bg-red-900/30 ${
                                      isSuppExcluded ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <CornerDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                            {suppCard.name}
                                          </span>
                                          <span className="text-[9px] bg-red-200/80 dark:bg-red-900/80 text-red-800 dark:text-red-200 font-extrabold px-1.5 py-0.2 rounded-md">
                                            Ek Kart
                                          </span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                          <span className="text-red-600 dark:text-red-400 font-semibold">
                                            Kart Sahibi: {suppCard.supplementaryCardHolder || suppCard.cardHolder || 'Ahmet Özgür'}
                                          </span>
                                          {suppCard.cardLast4 && <span>(•••• {suppCard.cardLast4})</span>}
                                          {suppLimit > 0 && <span>· Limit: ₺{suppLimit.toLocaleString('tr-TR')}</span>}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                                        -₺{suppDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </div>
                                      <span className="text-[9px] text-slate-400">Ek Kart Harcaması</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Orphan Supplementary Cards if any */}
                    {orphanSupplementaryCards.map(orphanCard => (
                      <div
                        key={orphanCard.id}
                        onClick={() => onSelectAccount(orphanCard)}
                        className="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-red-500" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{orphanCard.name}</span>
                            <span className="text-[10px] text-slate-400 block">{orphanCard.supplementaryCardHolder || 'Ek Kart'}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs font-bold text-red-600">
                          -₺{Math.abs(orphanCard.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}

                    {/* CONSOLIDATED TOTAL CREDIT CARD FOOTER SUMMARY CARD */}
                    <div className="p-3.5 bg-gradient-to-r from-red-50 via-slate-50 to-red-50 dark:from-red-950/40 dark:via-slate-900 dark:to-red-950/40 border-t border-red-200/60 dark:border-red-900/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-red-800 dark:text-red-300 uppercase tracking-wider flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-red-600" />
                          <span>KREDİ KARTLARI KONSOLİDE DURUM</span>
                        </span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-bold px-2 py-0.5 rounded-full">
                          {groupAccounts.length} Kart (Ana + Ek)
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-red-100 dark:border-slate-700 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">TOPLAM BORÇ</span>
                          <span className="text-xs font-black text-red-600 dark:text-red-400 tabular-nums">
                            ₺{totalCardDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">KULLANILABİLİR</span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                            ₺{totalAvailableLimit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-2xs">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">TOPLAM LİMİT</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">
                            ₺{totalCardLimit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : group.type === 'borc_alacak' ? (
                  /* 2. ENHANCED BORÇ / ALACAK WITH DUE DATES & RECURRING BADGES */
                  groupAccounts.map(account => {
                    const isAccNeg = account.balance < 0 || account.debtDirection === 'borc';
                    const isExcluded = account.includeInGeneralStatus === false;
                    const dueInfo = getDebtDueDateInfo(account.dueDate);

                    return (
                      <div
                        key={account.id}
                        className={`p-3.5 transition-all hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                          isExcluded ? 'opacity-45 grayscale-[60%] bg-slate-100/60 dark:bg-slate-800/30' : ''
                        }`}
                      >
                        <div
                          onClick={() => onSelectAccount(account)}
                          className="flex items-start justify-between gap-2 cursor-pointer"
                        >
                          {/* Left: Contact/Loan info */}
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl ${isAccNeg ? 'bg-red-100 dark:bg-red-950/60 text-red-600' : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600'} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                              <Scale className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-sm font-bold text-slate-900 dark:text-slate-100 truncate ${isExcluded ? 'line-through' : ''}`}>
                                  {account.name}
                                </span>
                                <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                  isAccNeg
                                    ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                                    : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                }`}>
                                  {isAccNeg ? 'ÖDENECEK BORÇ' : 'TAHSİL EDİLECEK ALACAK'}
                                </span>
                                {account.institutionType && (
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                                    {account.institutionType === 'resmi' ? '🏛️ Resmi Kurum (KYK/GİB)' :
                                     account.institutionType === 'ozel' ? '🏦 Banka Kredisi' :
                                     account.institutionType === 'ticari' ? '🏪 Ticari' : '👤 Şahıs'}
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                {account.institutionName && <span className="font-semibold text-slate-700 dark:text-slate-300">{account.institutionName} ·</span>}
                                {account.contactPhone && <span>Tel: {account.contactPhone}</span>}
                                {account.note && <span>· {account.note}</span>}
                              </div>

                              {/* Due Date & Recurring Badges */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {dueInfo && (
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                    dueInfo.isOverdue
                                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 animate-pulse'
                                      : dueInfo.isToday
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}>
                                    <Calendar className="w-3 h-3" />
                                    <span>Vade: {dueInfo.formattedDate} ({dueInfo.badgeText})</span>
                                  </span>
                                )}

                                {account.isRecurringDebt && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md font-bold">
                                    <RotateCcw className="w-3 h-3 text-purple-600" />
                                    <span>Tekrar Eden ({account.recurringInterval || 'Aylık'})</span>
                                  </span>
                                )}

                                {account.totalInstallments && (
                                  <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 px-2 py-0.5 rounded-md font-semibold">
                                    <span>Taksit: {account.remainingInstallments || 1}/{account.totalInstallments}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Amount */}
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">
                              {isAccNeg ? 'KALAN BORÇ' : 'KALAN ALACAK'}
                            </span>
                            <div className={`text-sm font-black tabular-nums ${isAccNeg ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                              {isAccNeg ? '-' : '+'}₺{Math.abs(account.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {account.originalLoanAmount && (
                              <div className="text-[9px] text-slate-400 tabular-nums mt-0.5">
                                Toplam: ₺{account.originalLoanAmount.toLocaleString('tr-TR')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Buttons for One-Click Collection or Payment */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onSelectAccount(account);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition-colors"
                          >
                            Detay & Plan
                          </button>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              const amt = Math.abs(account.balance);
                              if (amt <= 0) return;
                              addTransaction({
                                accountId: account.id,
                                accountName: account.name,
                                type: isAccNeg ? 'odeme' : 'tahsilat',
                                amount: amt,
                                currency: 'TRY',
                                category: 'Borç / Alacak',
                                description: isAccNeg ? `${account.name} borç ödemesi` : `${account.name} alacak tahsilatı`,
                                date: new Date().toISOString()
                              });
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold text-white transition-all active:scale-95 shadow-2xs ${
                              isAccNeg
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                          >
                            {isAccNeg ? 'Borç Öde 💳' : 'Tahsil Et ✓'}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  /* 3. STANDARD ACCOUNTS (Nakit, Banka, Birikim) */
                  groupAccounts.map(account => {
                    const isAccNeg = account.balance < 0;
                    const isExcluded = account.includeInGeneralStatus === false;

                    return (
                      <button
                        key={account.id}
                        onClick={() => onSelectAccount(account)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 text-left transition-all group ${
                          isExcluded
                            ? 'opacity-45 grayscale-[60%] bg-slate-100/60 dark:bg-slate-800/30 border-l-3 border-slate-400 dark:border-slate-600'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800'
                        }`}
                      >
                        {/* Left: Account title & metadata note */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className={`w-7 h-7 rounded-lg ${isExcluded ? 'bg-slate-200 dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                            {getAccountIcon(account)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5 flex-wrap">
                              <span className={isExcluded ? 'line-through decoration-slate-400 dark:decoration-slate-500' : ''}>
                                {account.name}
                              </span>
                              {isExcluded && (
                                <span className="text-[9px] bg-slate-200/90 dark:bg-slate-700/90 text-slate-600 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded-md">
                                  Genel Duruma Dahil Değil
                                </span>
                              )}
                            </div>
                            {(account.note || account.limit !== undefined || account.metalPurity || (account.holdingLots && account.holdingLots.length > 0)) && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                                {account.limit !== undefined && (
                                  <span>₺{account.limit.toLocaleString('tr-TR')} {account.type === 'banka' ? '+para' : 'Limit'}</span>
                                )}
                                {account.metalPurity && <span>· {account.metalPurity}</span>}
                                {account.holdingLots && account.holdingLots.length > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                                    · {account.holdingLots.length} Alış Partisi
                                  </span>
                                )}
                                {account.note && <span>· {account.note}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right: Balances & Grams */}
                        <div className="text-right shrink-0">
                          {account.gramWeight !== undefined ? (
                            <>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {account.gramWeight.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} {account.unitLabel || 'gr'}
                              </div>
                              <div className={`text-[11px] tabular-nums font-semibold ${isAccNeg ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                              </div>
                            </>
                          ) : account.currency !== 'TRY' ? (
                            <>
                              <div className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {account.unitLabel || account.currency}
                              </div>
                              {(() => {
                                const r = marketRates.find(m => m.code === account.currency)?.sellPrice;
                                const valTRY = r ? account.balance * r : null;
                                return valTRY !== null ? (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                                    ≈ ₺{valTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                ) : null;
                              })()}
                            </>
                          ) : (
                            <div
                              className={`text-sm font-bold tabular-nums ${
                                isAccNeg
                                  ? 'text-red-600 dark:text-red-400'
                                  : account.balance === 0
                                  ? 'text-slate-400 dark:text-slate-500'
                                  : 'text-slate-900 dark:text-slate-100'
                              }`}
                            >
                              {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ARŞİVLENEN HESAPLAR BÖLÜMÜ (Kullanıcı İsteği) */}
      {archivedAccounts.length > 0 && (
        <div className="mt-4 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-100/90 dark:bg-slate-800/80 rounded-2xl p-3 border border-slate-200/90 dark:border-slate-700">
            <div
              onClick={() => setShowArchivedSection(prev => !prev)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Archive className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                    Arşivlenen Hesaplar ({archivedAccounts.length})
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    Genel durum ve toplam varlığa dahil edilmez
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  showArchivedSection ? 'rotate-180' : ''
                }`}
              />
            </div>

            {showArchivedSection && (
              <div className="mt-3 space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                {archivedAccounts.map(acc => (
                  <div
                    key={acc.id}
                    className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                  >
                    <div
                      onClick={() => onSelectAccount(acc)}
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                    >
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        {getAccountIcon(acc)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {acc.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                          <span>{acc.currency}</span>
                          <span>·</span>
                          <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                            {acc.currency === 'TRY' ? '₺' : ''}
                            {acc.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {acc.unitLabel || ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchiveAccount(acc.id);
                      }}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-amber-100 active:scale-95 transition-all shrink-0"
                      title="Hesabı Arşivden Çıkar"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Arşivden Çıkar</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
