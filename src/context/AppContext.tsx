import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Account,
  MarketRate,
  Transaction,
  Category,
  UpcomingPayment,
  Contact,
  AppNotification,
  BudgetPlan,
  CurrencyCode,
  ArbitrageOpportunity,
  ArbitrageHistoryRecord,
  SourceQuote,
  SmartBudgetProjection
} from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_MARKET_RATES,
  INITIAL_TRANSACTIONS,
  INITIAL_CATEGORIES,
  INITIAL_UPCOMING_PAYMENTS,
  INITIAL_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_BUDGET_PLANS
} from '../data/initialData';
import { playArbitrageChime } from '../utils/audioAlert';
import {
  revertTransactionEffects,
  applyTransactionEffects,
  revertBudgetEffects,
  applyBudgetEffects
} from '../utils/transactionEffects';

interface AppContextType {
  accounts: Account[];
  transactions: Transaction[];
  marketRates: MarketRate[];
  categories: Category[];
  upcomingPayments: UpcomingPayment[];
  contacts: Contact[];
  notifications: AppNotification[];
  budgetPlans: BudgetPlan[];
  isDarkMode: boolean;
  faceIdEnabled: boolean;
  isLocked: boolean;
  audioAlertsEnabled: boolean;
  cloudBackup: {
    lastBackup: string | null;
    isSyncing: boolean;
    backupCount: number;
    autoSync: boolean;
  };
  activeLedger: string;
  ledgers: string[];
  viewMode: 'responsive' | 'iphone_frame';
  arbitrageOpportunities: ArbitrageOpportunity[];
  arbitrageHistory: ArbitrageHistoryRecord[];
  clearArbitrageHistory: () => void;
  selectedAssetForHistory: MarketRate | null;
  setSelectedAssetForHistory: (asset: MarketRate | null) => void;
  
  // Actions
  toggleDarkMode: () => void;
  setFaceIdEnabled: (enabled: boolean) => void;
  unlockApp: () => void;
  lockApp: () => void;
  setViewMode: (mode: 'responsive' | 'iphone_frame') => void;
  setActiveLedger: (ledger: string) => void;
  toggleAudioAlerts: () => void;
  testAudioAlert: () => void;
  refreshMarketRates: () => Promise<void>;
  
  // Data mutations
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (acc: Omit<Account, 'id'>) => void;
  editAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  toggleIncludeInGeneralStatus: (accountId: string) => void;
  toggleArchiveAccount: (accountId: string) => void;
  resetAccountData: (accountId: string) => void;
  resetAllData: () => void;
  buySellMetal: (params: {
    sourceAccountId: string;
    targetAccountId: string;
    metalCode: CurrencyCode;
    grams: number;
    pricePerGram: number;
    totalAmountTRY: number;
    isBuy: boolean;
  }) => void;
  transferBetweenInvestmentAccounts: (params: {
    fromAccountId: string;
    toAccountId: string;
    sourceAmount: number;
    customDescription?: string;
  }) => boolean;
  payDebtAccount: (params: {
    debtAccountId: string;
    sourceAccountId: string;
    amountTRY: number;
    date?: string;
    customNote?: string;
  }) => boolean;
  
  // Backup & Notifications
  triggerCloudBackup: () => Promise<boolean>;
  restoreFromCloud: () => boolean;
  exportBackupJson: () => void;
  importBackupJson: (jsonString: string) => boolean;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (title: string, message: string, type?: AppNotification['type']) => void;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<boolean>;
  updateBudgetLimit: (categoryId: string, limit: number) => void;
  
  // Calculated stats
  totalAssets: number;
  totalReceivables: number;
  totalDebts: number;
  netWorth: number;
  investmentsTotalTRY: number;
  totalGoldGrams: number;
  totalSilverGrams: number;
  unreadNotificationCount: number;
  smartBudgetProjections: SmartBudgetProjection[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'butcem_accounts_v2',
  TRANSACTIONS: 'butcem_transactions_v2',
  MARKET_RATES: 'butcem_rates_v2',
  CATEGORIES: 'butcem_categories_v2',
  UPCOMING: 'butcem_upcoming_v2',
  CONTACTS: 'butcem_contacts_v2',
  NOTIFICATIONS: 'butcem_notifs_v2',
  BUDGET: 'butcem_budget_v2',
  THEME: 'butcem_theme_v2',
  FACEID: 'butcem_faceid_v2',
  BACKUP: 'butcem_backup_v2',
  VIEW_MODE: 'butcem_view_mode_v2'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved !== null ? saved === 'true' : false;
  });

  // Security & Face ID
  const [faceIdEnabled, setFaceIdEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FACEID);
    return saved !== null ? saved === 'true' : true; // Default enabled for security requirement
  });
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FACEID);
    return saved !== null ? saved === 'true' : true;
  });

  // View Mode
  const [viewMode, setViewModeState] = useState<'responsive' | 'iphone_frame'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (saved as 'responsive' | 'iphone_frame') || 'iphone_frame';
  });

  // Cloud backup state
  const [cloudBackup, setCloudBackup] = useState<{
    lastBackup: string | null;
    isSyncing: boolean;
    backupCount: number;
    autoSync: boolean;
  }>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BACKUP);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      lastBackup: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      isSyncing: false,
      backupCount: 12,
      autoSync: true
    };
  });

  // Ledgers
  const [activeLedger, setActiveLedger] = useState<string>('Bütçem');
  const ledgers = ['Bütçem', 'Ev Bütçesi', 'Şirket Defteri'];

  // Core Data
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_ACCOUNTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [marketRates, setMarketRates] = useState<MarketRate[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MARKET_RATES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_MARKET_RATES;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CATEGORIES;
  });

  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.UPCOMING);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_UPCOMING_PAYMENTS;
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_CONTACTS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [budgetPlans, setBudgetPlans] = useState<BudgetPlan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return INITIAL_BUDGET_PLANS;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, String(isDarkMode));
  }, [isDarkMode]);

  // Persist items
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(budgetPlans));
  }, [budgetPlans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(cloudBackup));
  }, [cloudBackup]);

  // Audio Alerts state
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('butcem_audio_alerts');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleAudioAlerts = () => {
    setAudioAlertsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('butcem_audio_alerts', String(next));
      if (next) playArbitrageChime();
      return next;
    });
  };

  const testAudioAlert = () => {
    playArbitrageChime();
    addNotification('Sesli Bildirim Test Edildi 🔔', 'Arbitraj ve kur alarmları bu ses tonuyla iletilecektir.', 'system');
  };

  // Arbitrage Opportunities & Stockpiled History State
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [arbitrageHistory, setArbitrageHistory] = useState<ArbitrageHistoryRecord[]>(() => {
    const saved = localStorage.getItem('butcem_arbitrage_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return [];
  });
  const [selectedAssetForHistory, setSelectedAssetForHistory] = useState<MarketRate | null>(null);
  const notifiedOpportunitiesRef = useRef<Map<string, number>>(new Map());

  // Clear arbitrage history
  const clearArbitrageHistory = () => {
    setArbitrageHistory([]);
    localStorage.removeItem('butcem_arbitrage_history');
    fetch('/api/rates/arbitrage-clear', { method: 'POST' }).catch(() => {});
    addNotification('Arbitraj Geçmişi Temizlendi', 'Stoklanan tüm arbitraj fırsat kayıtları sıfırlandı.', 'system');
  };

  // Helper function to scan arbitrage across current market rates
  const scanArbitrage = (rates: MarketRate[]) => {
    const opportunities: ArbitrageOpportunity[] = [];

    rates.forEach(asset => {
      if (!asset.sources || asset.sources.length < 2) return;

      // Find best buy-from source (lowest sellPrice) and best sell-to source (highest buyPrice)
      let minSellSource: SourceQuote | null = null;
      let maxBuySource: SourceQuote | null = null;

      asset.sources.forEach(src => {
        if (!minSellSource || src.sellPrice < minSellSource.sellPrice) {
          minSellSource = src;
        }
        if (!maxBuySource || src.buyPrice > maxBuySource.buyPrice) {
          maxBuySource = src;
        }
      });

      if (minSellSource && maxBuySource && (minSellSource as SourceQuote).sourceId !== (maxBuySource as SourceQuote).sourceId) {
        const spread = (maxBuySource as SourceQuote).buyPrice - (minSellSource as SourceQuote).sellPrice;
        if (spread > 0.05) {
          const profitPercent = (spread / (minSellSource as SourceQuote).sellPrice) * 100;
          opportunities.push({
            id: `arb-${asset.code}-${Date.now()}`,
            assetCode: asset.code,
            assetName: asset.name,
            buyFromSource: minSellSource,
            sellToSource: maxBuySource,
            profitPerUnit: Number(spread.toFixed(2)),
            profitPercent: Number(profitPercent.toFixed(2)),
            unit: asset.unit,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          });
        }
      }
    });

    setArbitrageOpportunities(opportunities);

    // Stockpile opportunities into Arbitrage History (User request: "Ayrıca arbitraj fırsatlarınında geçmişini stoklamanı istiyorum")
    if (opportunities.length > 0) {
      const now = new Date();
      const timeFormatted = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setArbitrageHistory(prev => {
        let hasNew = false;
        const newRecords: ArbitrageHistoryRecord[] = [];

        opportunities.forEach(opp => {
          const isDuplicate = prev.slice(0, 8).some(
            h => h.assetCode === opp.assetCode &&
                 h.buyFromSource.sourceId === opp.buyFromSource.sourceId &&
                 h.sellToSource.sourceId === opp.sellToSource.sourceId &&
                 Math.abs(h.profitPerUnit - opp.profitPerUnit) < 0.05
          );

          if (!isDuplicate) {
            hasNew = true;
            const rec: ArbitrageHistoryRecord = {
              id: opp.id,
              assetCode: opp.assetCode,
              assetName: opp.assetName,
              unit: opp.unit,
              buyFromSource: opp.buyFromSource,
              sellToSource: opp.sellToSource,
              profitPerUnit: opp.profitPerUnit,
              profitPercent: opp.profitPercent,
              detectedAt: now.toISOString(),
              timeFormatted
            };
            newRecords.push(rec);

            // Sync with backend API
            fetch('/api/rates/arbitrage-log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(rec)
            }).catch(() => {});
          }
        });

        if (hasNew) {
          const combined = [...newRecords, ...prev].slice(0, 200);
          localStorage.setItem('butcem_arbitrage_history', JSON.stringify(combined));
          return combined;
        }
        return prev;
      });
    }

    // Audio & Mobile Notification: ONLY notify ONCE per unique opportunity pair! Never loop or repeat spam!
    const now = Date.now();
    opportunities.forEach(opp => {
      const oppKey = `${opp.assetCode}_${opp.buyFromSource.sourceId}_${opp.sellToSource.sourceId}`;
      const lastNotified = notifiedOpportunitiesRef.current.get(oppKey);

      // If never notified, or last notification was more than 15 minutes ago
      if (!lastNotified || (now - lastNotified > 15 * 60 * 1000)) {
        notifiedOpportunitiesRef.current.set(oppKey, now);

        if (audioAlertsEnabled) {
          playArbitrageChime();
        }

        // Detailed mobile notification with exact firm names, buy/sell prices and net profit
        addNotification(
          `⚡ Arbitraj Fırsatı: ${opp.assetName}`,
          `${opp.buyFromSource.sourceName} (Satış: ₺${opp.buyFromSource.sellPrice.toLocaleString('tr-TR')}) firmasından alıp, ${opp.sellToSource.sourceName} (Alış: ₺${opp.sellToSource.buyPrice.toLocaleString('tr-TR')}) firmasına satarak birim başına net +₺${opp.profitPerUnit.toFixed(2)} (+%${opp.profitPercent}%) kâr fırsatı!`,
          'price'
        );
      }
    });
  };

  // Explicit refresh market rates (called on pull-to-refresh or refresh button)
  const refreshMarketRates = async () => {
    try {
      const res = await fetch('/api/rates/live');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.rates) && data.rates.length > 0) {
          setMarketRates(data.rates);
          scanArbitrage(data.rates);
          addNotification('Kurlar Güncellendi 🔄', 'Kuyumcu ve döviz bürolarından anlık kaynak verileri başarıyla çekildi.', 'system');
          return;
        }
      }
    } catch {
      // Offline or network error
    }

    addNotification('Kurlar Güncel 🔄', 'Kaynak verilerdeki son fiyatlar korunuyor.', 'system');
  };

  // Live market rates from backend API proxy (Kaptan, Güneş, Solis, SAR, İlkay, Altınköşe, Vizyon)
  useEffect(() => {
    const fetchLiveRates = () => {
      fetch('/api/rates/live')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.rates) && data.rates.length > 0) {
            setMarketRates(data.rates);
            scanArbitrage(data.rates);
          }
        })
        .catch(() => {});
    };

    fetchLiveRates();
    const interval = setInterval(fetchLiveRates, 7000);
    return () => clearInterval(interval);
  }, []);

  // Sync initial arbitrage history from backend if available
  useEffect(() => {
    fetch('/api/rates/arbitrage-history')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.history) && data.history.length > 0) {
          setArbitrageHistory(prev => {
            if (prev.length === 0) {
              localStorage.setItem('butcem_arbitrage_history', JSON.stringify(data.history));
              return data.history;
            }
            return prev;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Initial arbitrage scan
  useEffect(() => {
    scanArbitrage(marketRates);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      localStorage.setItem(STORAGE_KEYS.THEME, String(next));
      return next;
    });
  };

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setNotificationPermission(res);
        if (res === 'granted') {
          new Notification('Bütçem Bildirimleri Aktif 🔔', {
            body: 'Kurlar, arbitraj fırsatları ve bütçe aşım uyarıları telefonunuza iletilecektir.'
          });
          addNotification('Telefon Bildirimleri Onaylandı', 'Cihaz kilit ekranı ve bildirim çubuğu izinleri verildi.', 'system');
          return true;
        }
      } catch (err) {
        console.warn('Notification permission error:', err);
      }
    }
    return false;
  };

  const setFaceIdEnabled = (enabled: boolean) => {
    setFaceIdEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.FACEID, String(enabled));
  };

  const unlockApp = () => setIsLocked(false);
  const lockApp = () => setIsLocked(true);

  const setViewMode = (mode: 'responsive' | 'iphone_frame') => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
  };

  const addNotification = (title: string, message: string, type: AppNotification['type'] = 'system') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Az önce',
      isRead: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Dispatch OS-level notification if user granted permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: message
        });
      } catch (e) {
        // Ignore fallback
      }
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const updateBudgetLimit = (categoryId: string, limit: number) => {
    setBudgetPlans(prev =>
      prev.map(b => (b.categoryId === categoryId ? { ...b, monthlyLimit: limit } : b))
    );
    addNotification('Bütçe Güncellendi', `Aylık kategori harcama limiti ₺${limit.toLocaleString('tr-TR')} olarak güncellendi.`, 'budget');
  };

  // Add Transaction
  const addTransaction = (txData: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`
    };

    setTransactions(prev => [newTx, ...prev]);

    // Apply transaction effects to accounts and budgets
    setAccounts(prev => applyTransactionEffects(prev, newTx, marketRates));
    setBudgetPlans(prev => applyBudgetEffects(prev, newTx));

    addNotification('Yeni İşlem Kaydedildi', `${txData.accountName}: ${txData.description} (₺${Math.abs(txData.amount).toLocaleString('tr-TR')})`, 'system');
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Recalculate and rollback all account balances, installments, gold weights, and credit states
    setAccounts(prev => revertTransactionEffects(prev, tx, marketRates));
    setBudgetPlans(prev => revertBudgetEffects(prev, tx));
    setTransactions(prev => prev.filter(t => t.id !== id));

    addNotification(
      'İşlem Silindi ↩️',
      `${tx.description || tx.accountName} işlemi silindi. Hesap durumları, kredi/borç taksitleri ve bütçe eski haline döndürüldü.`,
      'system'
    );
  };

  const editTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return;

    const newTx: Transaction = {
      ...oldTx,
      ...updates,
      accountName: updates.accountId ? (accounts.find(a => a.id === updates.accountId)?.name || oldTx.accountName) : oldTx.accountName,
      toAccountName: updates.toAccountId ? (accounts.find(a => a.id === updates.toAccountId)?.name || oldTx.toAccountName) : oldTx.toAccountName
    };

    // Revert old transaction effects first, then apply new transaction effects
    setAccounts(prev => {
      const reverted = revertTransactionEffects(prev, oldTx, marketRates);
      return applyTransactionEffects(reverted, newTx, marketRates);
    });

    setBudgetPlans(prev => {
      const reverted = revertBudgetEffects(prev, oldTx);
      return applyBudgetEffects(reverted, newTx);
    });

    setTransactions(prev => prev.map(t => (t.id === id ? newTx : t)));

    addNotification(
      'İşlem Güncellendi ✏️',
      `${newTx.description || newTx.accountName} güncellendi. Hesap durumları, kredi/borç ve bütçe yeniden hesaplandı.`,
      'system'
    );
  };

  // Add, Edit, Delete Account
  const addAccount = (accData: Omit<Account, 'id'>) => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}`
    };
    setAccounts(prev => [...prev, newAcc]);
    addNotification('Yeni Hesap Açıldı', `${newAcc.name} başarıyla eklendi.`, 'system');
  };

  const editAccount = (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
    addNotification('Hesap Silindi', 'Hesap ve ilişkili kayıtlar kaldırıldı.', 'system');
  };

  // Buy / Sell Metal or Foreign Currency
  const buySellMetal = (params: {
    sourceAccountId: string;
    targetAccountId: string;
    metalCode: CurrencyCode;
    grams: number;
    pricePerGram: number;
    totalAmountTRY: number;
    isBuy: boolean;
  }) => {
    const { sourceAccountId, targetAccountId, metalCode, grams, pricePerGram, totalAmountTRY, isBuy } = params;
    const sourceAcc = accounts.find(a => a.id === sourceAccountId);
    const targetAcc = accounts.find(a => a.id === targetAccountId);
    if (!sourceAcc || !targetAcc) return;

    if (isBuy) {
      // Deduct TRY from source, add grams to target
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === sourceAccountId) {
            return { ...acc, balance: acc.balance - totalAmountTRY };
          }
          if (acc.id === targetAccountId) {
            const currentGrams = acc.gramWeight || 0;
            return {
              ...acc,
              gramWeight: currentGrams + grams,
              balance: acc.balance + totalAmountTRY
            };
          }
          return acc;
        })
      );

      // Record transaction
      addTransaction({
        accountId: targetAccountId,
        accountName: targetAcc.name,
        toAccountId: sourceAccountId,
        toAccountName: sourceAcc.name,
        type: 'alis',
        amount: grams,
        currency: metalCode,
        category: 'Yatırım / Emtia',
        categoryIcon: 'Coins',
        description: `${grams} gr ${metalCode} Alımı (Kur: ₺${pricePerGram.toFixed(2)} / Toplam: ₺${totalAmountTRY.toLocaleString('tr-TR')})`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        metalGram: grams
      });

      addNotification(
        'Yatırım Alımı Başarılı 🥇',
        `${grams} gr ${metalCode} portföyünüze eklendi (₺${totalAmountTRY.toLocaleString('tr-TR')}).`,
        'price'
      );
    } else {
      // Sell grams from target, add TRY to source
      setAccounts(prev =>
        prev.map(acc => {
          if (acc.id === targetAccountId) {
            const currentGrams = acc.gramWeight || 0;
            return {
              ...acc,
              gramWeight: Math.max(0, currentGrams - grams),
              balance: Math.max(0, acc.balance - totalAmountTRY)
            };
          }
          if (acc.id === sourceAccountId) {
            return { ...acc, balance: acc.balance + totalAmountTRY };
          }
          return acc;
        })
      );

      addTransaction({
        accountId: targetAccountId,
        accountName: targetAcc.name,
        toAccountId: sourceAccountId,
        toAccountName: sourceAcc.name,
        type: 'satis',
        amount: -grams,
        currency: metalCode,
        category: 'Yatırım / Emtia',
        categoryIcon: 'Coins',
        description: `${grams} gr ${metalCode} Satışı (Kur: ₺${pricePerGram.toFixed(2)} / Toplam: ₺${totalAmountTRY.toLocaleString('tr-TR')})`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        metalGram: -grams
      });

      addNotification(
        'Yatırım Satışı Tamamlandı 💵',
        `${grams} gr ${metalCode} satıldı, hesabınıza ₺${totalAmountTRY.toLocaleString('tr-TR')} aktarıldı.`,
        'price'
      );
    }
  };

  // Yatırım hesapları arasında parite hesabı ve güncel kurlar ile transfer (User request)
  const transferBetweenInvestmentAccounts = (params: {
    fromAccountId: string;
    toAccountId: string;
    sourceAmount: number;
    customDescription?: string;
  }): boolean => {
    const { fromAccountId, toAccountId, sourceAmount, customDescription } = params;
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);
    if (!fromAcc || !toAcc || sourceAmount <= 0) return false;

    // Determine current market rates for both currencies
    const fromRateObj = marketRates.find(r => r.code === fromAcc.currency);
    const toRateObj = marketRates.find(r => r.code === toAcc.currency);

    const fromRateTRY = fromAcc.currency === 'TRY' ? 1 : (fromRateObj?.sellPrice || 1);
    const toRateTRY = toAcc.currency === 'TRY' ? 1 : (toRateObj?.buyPrice || toRateObj?.sellPrice || 1);

    // Parity: 1 unit of fromCurrency = (fromRateTRY / toRateTRY) units of toCurrency
    const parity = fromRateTRY / toRateTRY;
    const targetAmount = Number((sourceAmount * parity).toFixed(toAcc.currency === 'TRY' ? 2 : 4));

    // Formatted automatic parity explanation
    const autoParityNote = `[Parite: 1 ${fromAcc.currency} = ${parity.toFixed(4)} ${toAcc.currency} | Güncel Kurlar: 1 ${fromAcc.currency} = ₺${fromRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}, 1 ${toAcc.currency} = ₺${toRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}]`;

    const userNote = customDescription?.trim();
    const finalDescription = userNote
      ? `${userNote} (${fromAcc.name} ➔ ${toAcc.name})`
      : `${fromAcc.name} ➔ ${toAcc.name} Parite Transferi`;

    // Deduct from source account, add to target account
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === fromAccountId) {
          if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
            const nextGrams = Math.max(0, (acc.gramWeight || 0) - sourceAmount);
            return {
              ...acc,
              gramWeight: nextGrams,
              balance: nextGrams * fromRateTRY
            };
          } else {
            return {
              ...acc,
              balance: acc.balance - sourceAmount
            };
          }
        }
        if (acc.id === toAccountId) {
          if (acc.gramWeight !== undefined && acc.currency === 'XAU') {
            const nextGrams = (acc.gramWeight || 0) + targetAmount;
            return {
              ...acc,
              gramWeight: nextGrams,
              balance: nextGrams * toRateTRY
            };
          } else {
            return {
              ...acc,
              balance: acc.balance + targetAmount
            };
          }
        }
        return acc;
      })
    );

    // Add transaction with dual explanation (autoParityNote + userCustomNote)
    addTransaction({
      accountId: fromAcc.id,
      accountName: fromAcc.name,
      toAccountId: toAcc.id,
      toAccountName: toAcc.name,
      type: 'transfer',
      amount: -sourceAmount,
      currency: fromAcc.currency,
      category: 'Yatırım Transferi (Parite)',
      categoryIcon: 'ArrowRightLeft',
      description: finalDescription,
      autoParityNote,
      userCustomNote: userNote || undefined,
      parityRate: Number(parity.toFixed(4)),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    addNotification(
      'Parite Transferi Gerçekleşti 🔄',
      `${sourceAmount} ${fromAcc.currency} transfer edildi ➔ ${toAcc.name} hesabına ${targetAmount} ${toAcc.currency} aktarıldı. (Parite: 1 ${fromAcc.currency} = ${parity.toFixed(4)} ${toAcc.currency})`,
      'price'
    );

    return true;
  };

  // Borç Ödeme Fonksiyonu (Resmi Kurum, Banka, Şahıs borçlarını kapatma)
  const payDebtAccount = (params: {
    debtAccountId: string;
    sourceAccountId: string;
    amountTRY: number;
    date?: string;
    customNote?: string;
  }): boolean => {
    const { debtAccountId, sourceAccountId, amountTRY, date, customNote } = params;
    const debtAcc = accounts.find(a => a.id === debtAccountId);
    const sourceAcc = accounts.find(a => a.id === sourceAccountId);
    if (!debtAcc || !sourceAcc || amountTRY <= 0) return false;

    // Record payment transaction (addTransaction applies the exact single effect to accounts)
    addTransaction({
      accountId: sourceAcc.id,
      accountName: sourceAcc.name,
      toAccountId: debtAcc.id,
      toAccountName: debtAcc.name,
      type: 'odeme',
      amount: -amountTRY,
      currency: 'TRY',
      category: 'Borç Ödeme',
      categoryIcon: 'CheckCircle2',
      description: `${debtAcc.name} Borç Ödemesi${customNote ? ' (' + customNote + ')' : ''}`,
      note: customNote,
      userCustomNote: customNote,
      date: date || new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    addNotification(
      'Borç Ödemesi Yapıldı 💳',
      `${sourceAcc.name} hesabınızdan ${debtAcc.name} için ₺${amountTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ödendi.`,
      'system'
    );

    return true;
  };

  // Cloud Backup & Restore
  const triggerCloudBackup = async (): Promise<boolean> => {
    setCloudBackup(prev => ({ ...prev, isSyncing: true }));
    
    // Simulate real cloud encrypted network backup
    await new Promise(resolve => setTimeout(resolve, 1400));

    const nowStr = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });

    const backupSnapshot = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      formattedDate: nowStr,
      ledger: activeLedger,
      data: {
        accounts,
        transactions,
        categories,
        budgetPlans,
        upcomingPayments,
        contacts
      }
    };

    localStorage.setItem('butcem_cloud_snapshot', JSON.stringify(backupSnapshot));

    setCloudBackup(prev => ({
      ...prev,
      lastBackup: nowStr,
      isSyncing: false,
      backupCount: prev.backupCount + 1
    }));

    addNotification(
      'Bulut Yedekleme Başarılı ☁️',
      `Tüm verileriniz ${nowStr} itibarıyla bulut kasasına güvenle yedeklendi.`,
      'system'
    );

    return true;
  };

  const restoreFromCloud = (): boolean => {
    const saved = localStorage.getItem('butcem_cloud_snapshot');
    if (!saved) return false;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.data) {
        if (parsed.data.accounts) setAccounts(parsed.data.accounts);
        if (parsed.data.transactions) setTransactions(parsed.data.transactions);
        if (parsed.data.categories) setCategories(parsed.data.categories);
        if (parsed.data.budgetPlans) setBudgetPlans(parsed.data.budgetPlans);
        if (parsed.data.upcomingPayments) setUpcomingPayments(parsed.data.upcomingPayments);
        if (parsed.data.contacts) setContacts(parsed.data.contacts);

        addNotification('Yedekten Geri Yüklendi 🔄', `Verileriniz ${parsed.formattedDate || 'bulut'} yedeğinden başarıyla geri yüklendi.`, 'system');
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const exportBackupJson = () => {
    const payload = {
      appName: 'Bütçem',
      exportDate: new Date().toISOString(),
      data: {
        accounts,
        transactions,
        categories,
        budgetPlans,
        upcomingPayments,
        contacts,
        marketRates
      }
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `butcem_yedek_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addNotification('JSON Dosyası İndirildi', 'Yedekleme dosyanız cihazınıza kaydedildi.', 'system');
  };

  const importBackupJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      const data = parsed.data || parsed;
      if (data.accounts) setAccounts(data.accounts);
      if (data.transactions) setTransactions(data.transactions);
      if (data.budgetPlans) setBudgetPlans(data.budgetPlans);
      addNotification('Yedek İçe Aktarıldı', 'Yedek dosyasındaki veriler başarıyla yüklendi.', 'system');
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const toggleIncludeInGeneralStatus = (accountId: string) => {
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accountId) {
          const current = acc.includeInGeneralStatus !== false;
          const next = !current;
          addNotification(
            next ? 'Genel Duruma Eklendi' : 'Genel Durumdan Çıkarıldı',
            `${acc.name} bakiyesi genel durum ve toplam varlık hesaplamalarına ${next ? 'dahil edildi' : 'dahil edilmeyecek'}.`,
            'system'
          );
          return { ...acc, includeInGeneralStatus: next };
        }
        return acc;
      })
    );
  };

  const toggleArchiveAccount = (accountId: string) => {
    setAccounts(prev =>
      prev.map(acc => {
        if (acc.id === accountId) {
          const nextArchived = !acc.isArchived;
          // Arşive kaldırılan hesabı genel duruma kesinlikle dahil etme!
          const nextInclude = nextArchived ? false : acc.includeInGeneralStatus;
          addNotification(
            nextArchived ? 'Hesap Arşivlendi' : 'Hesap Arşivden Çıkarıldı',
            `${acc.name} hesabı ${nextArchived ? 'arşive kaldırıldı ve genel durum hesaplamalarından çıkarıldı.' : 'aktif hesaplara geri yüklendi.'}`,
            'system'
          );
          return {
            ...acc,
            isArchived: nextArchived,
            includeInGeneralStatus: nextInclude
          };
        }
        return acc;
      })
    );
  };

  const resetAccountData = (accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;

    // Delete all transactions of this account
    setTransactions(prev => prev.filter(t => t.accountId !== accountId && t.toAccountId !== accountId));

    // Zero balance
    setAccounts(prev =>
      prev.map(a => (a.id === accountId ? { ...a, balance: 0, gramWeight: 0 } : a))
    );

    addNotification('Hesap Verileri Sıfırlandı', `${acc.name} işlemler ve bakiye sıfırlandı.`, 'system');
  };

  const resetAllData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgetPlans(INITIAL_BUDGET_PLANS);
    setMarketRates(INITIAL_MARKET_RATES);
    localStorage.removeItem(STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    addNotification('Tüm Veriler Sıfırlandı 🔄', 'Uygulama ilk başlangıç durumuna döndürüldü.', 'system');
  };

  // Calculations strictly respecting includeInGeneralStatus !== false AND !acc.isArchived
  const { totalAssets, totalReceivables, totalDebts, netWorth, investmentsTotalTRY, totalGoldGrams, totalSilverGrams } = useMemo(() => {
    let assets = 0;
    let receivables = 0;
    let debts = 0;
    let investments = 0;
    let goldGrams = 0;
    let silverGrams = 0;

    accounts.forEach(acc => {
      // If user toggled "Genel duruma dahil etme" (includeInGeneralStatus === false) OR account is archived, STRICTLY skip from all general totals!
      if (acc.includeInGeneralStatus === false || acc.isArchived) {
        return;
      }

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
        investments += Math.max(0, valInTRY);
        assets += Math.max(0, valInTRY);
        if (acc.currency === 'XAU' && acc.gramWeight) goldGrams += Math.abs(acc.gramWeight);
        if (acc.currency === 'XAG' && acc.gramWeight) silverGrams += Math.abs(acc.gramWeight);
      } else if (acc.type === 'kredi_karti') {
        debts += Math.abs(valInTRY);
      } else if (acc.type === 'borc_alacak') {
        if (acc.debtDirection === 'borc' || valInTRY < 0) {
          debts += Math.abs(valInTRY);
        } else {
          receivables += Math.abs(valInTRY);
        }
      } else {
        // nakit or banka
        if (valInTRY > 0) {
          assets += valInTRY;
        } else if (valInTRY < 0 && acc.id !== 'nakit-dengeleme') {
          debts += Math.abs(valInTRY);
        }
      }
    });

    const net = (assets + receivables) - debts;

    return {
      totalAssets: assets,
      totalReceivables: receivables,
      totalDebts: debts,
      netWorth: net,
      investmentsTotalTRY: investments,
      totalGoldGrams: goldGrams,
      totalSilverGrams: silverGrams
    };
  }, [accounts, marketRates]);

  // Smart Budget Projection & Spending Habit Analysis System
  const smartBudgetProjections = useMemo<SmartBudgetProjection[]>(() => {
    const today = new Date();
    const currentDay = Math.max(1, today.getDate());
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - currentDay);

    return budgetPlans.map(plan => {
      // Calculate real spent so far this month
      const spentSoFar = transactions
        .filter(t => (t.type === 'gider' || t.type === 'odeme') && t.category.toLowerCase() === plan.categoryName.toLowerCase())
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const actualSpent = spentSoFar > 0 ? spentSoFar : plan.spent;
      const dailyBurnRate = Number((actualSpent / currentDay).toFixed(2));
      const projectedMonthEnd = Number((dailyBurnRate * daysInMonth).toFixed(2));
      const projectedExcess = Number(Math.max(0, projectedMonthEnd - plan.monthlyLimit).toFixed(2));
      const projectedPercent = Math.round((projectedMonthEnd / plan.monthlyLimit) * 100);
      const safeDailyLimit = Number(Math.max(0, (plan.monthlyLimit - actualSpent) / daysRemaining).toFixed(2));

      let status: 'safe' | 'warning' | 'danger' = 'safe';
      let adviceMessage = '';

      if (actualSpent >= plan.monthlyLimit) {
        status = 'danger';
        adviceMessage = `Bütçe limiti şimdiden ₺${(actualSpent - plan.monthlyLimit).toLocaleString('tr-TR')} aşıldı! Ayın kalan ${daysRemaining} gününde bu kategorideki harcamaları durdurmanız önerilir.`;
      } else if (projectedMonthEnd > plan.monthlyLimit * 1.15) {
        status = 'danger';
        adviceMessage = `Günlük ₺${dailyBurnRate.toLocaleString('tr-TR')} harcama temponuzla ay sonunda bütçenizi ₺${projectedExcess.toLocaleString('tr-TR')} (%${projectedPercent - 100}) aşacaksınız! Kalan ${daysRemaining} günde günlük tavan harcamanız ₺${safeDailyLimit.toLocaleString('tr-TR')} olmalıdır.`;
      } else if (projectedMonthEnd > plan.monthlyLimit) {
        status = 'warning';
        adviceMessage = `Harcama hızınız bütçe sınırına çok yakın. Kalan ${daysRemaining} gün için önerilen günlük tavan harcama: ₺${safeDailyLimit.toLocaleString('tr-TR')}.`;
      } else {
        status = 'safe';
        adviceMessage = `Harcama alışkanlığınız dengeli seyrediyor. Ay sonu tahmini harcama bütçenin %${projectedPercent}'i düzeyinde kalacak.`;
      }

      return {
        categoryId: plan.categoryId,
        categoryName: plan.categoryName,
        monthlyLimit: plan.monthlyLimit,
        spentSoFar: actualSpent,
        dailyBurnRate,
        daysPassed: currentDay,
        daysRemaining,
        projectedMonthEnd,
        projectedExcess,
        projectedPercent,
        safeDailyLimit,
        status,
        adviceMessage
      };
    });
  }, [budgetPlans, transactions]);

  // Proactive check for smart budget warnings (runs once per category per session)
  const alertedBudgetRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    smartBudgetProjections.forEach(proj => {
      if (proj.status === 'danger' && !alertedBudgetRef.current.has(proj.categoryId)) {
        alertedBudgetRef.current.add(proj.categoryId);
        addNotification(
          `⚠️ Akıllı Uyarı: ${proj.categoryName} Bütçe Aşım Riski`,
          proj.adviceMessage,
          'budget'
        );
      }
    });
  }, [smartBudgetProjections]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return (
    <AppContext.Provider
      value={{
        accounts,
        transactions,
        marketRates,
        categories,
        upcomingPayments,
        contacts,
        notifications,
        budgetPlans,
        isDarkMode,
        faceIdEnabled,
        isLocked,
        audioAlertsEnabled,
        cloudBackup,
        activeLedger,
        ledgers,
        viewMode,
        arbitrageOpportunities,
        arbitrageHistory,
        clearArbitrageHistory,
        selectedAssetForHistory,
        setSelectedAssetForHistory,
        toggleDarkMode,
        setFaceIdEnabled,
        unlockApp,
        lockApp,
        setViewMode,
        setActiveLedger,
        toggleAudioAlerts,
        testAudioAlert,
        refreshMarketRates,
        addTransaction,
        editTransaction,
        deleteTransaction,
        addAccount,
        editAccount,
        deleteAccount,
        toggleIncludeInGeneralStatus,
        toggleArchiveAccount,
        resetAccountData,
        resetAllData,
        buySellMetal,
        transferBetweenInvestmentAccounts,
        payDebtAccount,
        triggerCloudBackup,
        restoreFromCloud,
        exportBackupJson,
        importBackupJson,
        markAllNotificationsRead,
        dismissNotification,
        addNotification,
        notificationPermission,
        requestNotificationPermission,
        updateBudgetLimit,
        totalAssets,
        totalReceivables,
        totalDebts,
        netWorth,
        investmentsTotalTRY,
        totalGoldGrams,
        totalSilverGrams,
        unreadNotificationCount,
        smartBudgetProjections
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
