import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Calendar,
  FileSpreadsheet,
  FileText,
  Trash2,
  Edit3,
  Archive,
  PieChart,
  BarChart3,
  Filter,
  Check,
  Plus,
  Minus,
  Coins,
  CreditCard,
  Building,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Phone,
  Layers,
  Sparkles,
  ArrowRightLeft,
  X,
  Clock,
  ShieldCheck,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { Account, AccountType, CurrencyCode, Transaction, TransactionType, AssetHoldingLot } from '../types';
import { useApp } from '../context/AppContext';
import { DebtPaymentModal } from './DebtPaymentModal';
import { InvestmentTransferModal } from './InvestmentTransferModal';

interface AccountDetailModalProps {
  account: Account;
  onClose: () => void;
  onOpenPdfExport: (account: Account) => void;
  onOpenCategoryReport: (accountName?: string) => void;
  onOpenPeriodicReport: (accountName?: string) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account: initialAccount,
  onClose,
  onOpenPdfExport,
  onOpenCategoryReport,
  onOpenPeriodicReport
}) => {
  const {
    transactions,
    addTransaction,
    editTransaction,
    deleteTransaction,
    deleteAccount,
    editAccount,
    categories,
    accounts,
    marketRates,
    toggleIncludeInGeneralStatus,
    toggleArchiveAccount,
    resetAccountData,
    addNotification
  } = useApp();

  // Dynamically keep account reference updated with context state
  const account = accounts.find(a => a.id === initialAccount.id) || initialAccount;

  // Menu states
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'gider' | 'gelir'>('all');

  // In-App Confirm Dialog state (Replaces blocked window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmButtonColor: 'red' | 'amber';
    actionType: 'reset_data' | 'delete_account' | 'delete_transaction';
    targetTxId?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmButtonColor: 'red',
    actionType: 'delete_account'
  });

  // Transaction Editing states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editTxAmount, setEditTxAmount] = useState<string>('');
  const [editTxDescription, setEditTxDescription] = useState<string>('');
  const [editTxCategory, setEditTxCategory] = useState<string>('');
  const [editTxDate, setEditTxDate] = useState<string>('');
  const [editTxToAccountId, setEditTxToAccountId] = useState<string>('');
  const [editTxNote, setEditTxNote] = useState<string>('');

  // Edit form comprehensive state (Matching user request)
  const [editName, setEditName] = useState(account.name);
  const [editNote, setEditNote] = useState(account.note || '');
  const [editType, setEditType] = useState<AccountType>(account.type);
  const [editCurrency, setEditCurrency] = useState<CurrencyCode>(account.currency);
  const [editBalance, setEditBalance] = useState<string>(String(account.balance));
  const [editLimit, setEditLimit] = useState<string>(account.limit ? String(account.limit) : '');
  const [editCardCutoffDay, setEditCardCutoffDay] = useState<string>(account.cardCutoffDay ? String(account.cardCutoffDay) : '15');
  const [editCardPaymentDueDay, setEditCardPaymentDueDay] = useState<string>(account.cardPaymentDueDay ? String(account.cardPaymentDueDay) : '25');
  const [editCardLast4, setEditCardLast4] = useState<string>(account.cardLast4 || '');
  const [editCardHolder, setEditCardHolder] = useState<string>(account.cardHolder || account.supplementaryCardHolder || '');
  const [editIsSupplementary, setEditIsSupplementary] = useState<boolean>(account.isSupplementary || false);
  const [editParentAccountId, setEditParentAccountId] = useState<string>(account.parentAccountId || '');
  const [editGramWeight, setEditGramWeight] = useState<string>(account.gramWeight !== undefined ? String(account.gramWeight) : '');
  const [editCostPricePerUnit, setEditCostPricePerUnit] = useState<string>(account.costPricePerUnit ? String(account.costPricePerUnit) : '');
  const [editMetalPurity, setEditMetalPurity] = useState<string>(account.metalPurity || 'Has Altın 995/1000');
  const [editDebtDirection, setEditDebtDirection] = useState<'alacak' | 'borc'>(account.debtDirection || (account.balance < 0 ? 'borc' : 'alacak'));
  const [editInstitutionType, setEditInstitutionType] = useState<'resmi' | 'ozel' | 'sahis' | 'ticari'>(
    account.institutionType || (account.id.includes('kyk') ? 'resmi' : account.id.includes('bank') ? 'ozel' : 'sahis')
  );
  const [editInstitutionName, setEditInstitutionName] = useState<string>(account.institutionName || account.name);
  const [editContactPhone, setEditContactPhone] = useState<string>(account.contactPhone || '');
  const [editDueDate, setEditDueDate] = useState<string>(account.dueDate || '');
  const [editOriginalLoanAmount, setEditOriginalLoanAmount] = useState<string>(account.originalLoanAmount ? String(account.originalLoanAmount) : '');
  const [includeInGeneral, setIncludeInGeneral] = useState(account.includeInGeneralStatus !== false);
  const [editIsArchived, setEditIsArchived] = useState<boolean>(account.isArchived || false);
  const [showDebtPaymentModal, setShowDebtPaymentModal] = useState<boolean>(false);
  const [showParityTransferModal, setShowParityTransferModal] = useState<boolean>(false);

  // Holding lots state (User requested: "daha önceden elimde bulunan varlıklarımı ekleyebileceğim özellik güncellemesi yap; gr br fiyat toplam fiyat ve açıklama gibi detayları da ekleyebilmek istiyorum")
  const [holdingLots, setHoldingLots] = useState<AssetHoldingLot[]>(account.holdingLots || []);
  const [newLotGram, setNewLotGram] = useState<string>('');
  const [newLotUnitPrice, setNewLotUnitPrice] = useState<string>('');
  const [newLotTotalCost, setNewLotTotalCost] = useState<string>('');
  const [newLotNote, setNewLotNote] = useState<string>('');
  const [newLotDate, setNewLotDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Auto calculate total cost or unit price on change
  const handleLotGramChange = (val: string) => {
    setNewLotGram(val);
    const g = parseFloat(val);
    const u = parseFloat(newLotUnitPrice);
    if (g && u) {
      setNewLotTotalCost((g * u).toFixed(2));
    }
  };

  const handleLotUnitPriceChange = (val: string) => {
    setNewLotUnitPrice(val);
    const u = parseFloat(val);
    const g = parseFloat(newLotGram);
    if (g && u) {
      setNewLotTotalCost((g * u).toFixed(2));
    }
  };

  const handleLotTotalCostChange = (val: string) => {
    setNewLotTotalCost(val);
    const t = parseFloat(val);
    const g = parseFloat(newLotGram);
    if (g && g > 0 && t) {
      setNewLotUnitPrice((t / g).toFixed(2));
    }
  };

  const handleAddLot = () => {
    const g = parseFloat(newLotGram);
    const u = parseFloat(newLotUnitPrice);
    const t = parseFloat(newLotTotalCost) || (g && u ? g * u : 0);
    if (!g || g <= 0) return;

    const newLot: AssetHoldingLot = {
      id: `lot-${Date.now()}`,
      gramWeight: g,
      unitPriceTRY: u || (t / g),
      totalCostTRY: t,
      note: newLotNote.trim() || undefined,
      date: newLotDate || new Date().toISOString().slice(0, 10)
    };

    const updated = [...holdingLots, newLot];
    setHoldingLots(updated);

    // Auto-update total grams & average cost
    const totalG = updated.reduce((s, l) => s + l.gramWeight, 0);
    const totalCost = updated.reduce((s, l) => s + l.totalCostTRY, 0);
    const avgCost = totalG > 0 ? totalCost / totalG : 0;

    setEditGramWeight(String(totalG));
    setEditCostPricePerUnit(avgCost.toFixed(2));
    setEditBalance(String(totalCost));

    setNewLotGram('');
    setNewLotUnitPrice('');
    setNewLotTotalCost('');
    setNewLotNote('');
  };

  const handleRemoveLot = (id: string) => {
    const updated = holdingLots.filter(l => l.id !== id);
    setHoldingLots(updated);
    const totalG = updated.reduce((s, l) => s + l.gramWeight, 0);
    const totalCost = updated.reduce((s, l) => s + l.totalCostTRY, 0);
    const avgCost = totalG > 0 ? totalCost / totalG : 0;
    setEditGramWeight(String(totalG));
    setEditCostPricePerUnit(avgCost > 0 ? avgCost.toFixed(2) : '');
  };

  // Live market rate for this account's currency / metal
  const currentRate = useMemo(() => {
    return marketRates.find(r => r.code === account.currency);
  }, [marketRates, account.currency]);

  // Live price per unit
  const livePricePerUnit = useMemo(() => {
    if (account.currency === 'TRY') return 1;
    if (currentRate) return currentRate.sellPrice;
    // Fallback estimates if rate lookup empty
    if (account.currency === 'USD') return 49.34;
    if (account.currency === 'EUR') return 55.19;
    if (account.currency === 'XAU') return 6646.67;
    if (account.currency === 'XAG') return 96.67;
    if (account.currency === 'XPT') return 2687.50;
    if (account.currency === 'XPD') return 1855.00;
    return 1;
  }, [currentRate, account.currency]);

  // Live TRY value for investment / foreign currency account
  const liveTotalValueTRY = useMemo(() => {
    if (account.currency === 'TRY') return account.balance;
    const quantity = account.gramWeight !== undefined ? account.gramWeight : account.balance;
    return quantity * livePricePerUnit;
  }, [account.currency, account.balance, account.gramWeight, livePricePerUnit]);

  // Calculated preview in Edit Modal
  const editPreviewPricePerUnit = useMemo(() => {
    if (editCurrency === 'TRY') return 1;
    const r = marketRates.find(m => m.code === editCurrency);
    if (r) return r.sellPrice;
    if (editCurrency === 'USD') return 49.34;
    if (editCurrency === 'EUR') return 55.19;
    if (editCurrency === 'XAU') return 6646.67;
    if (editCurrency === 'XAG') return 96.67;
    return 1;
  }, [marketRates, editCurrency]);

  const editPreviewTotalTRY = useMemo(() => {
    if (editCurrency === 'TRY') return parseFloat(editBalance) || 0;
    const qty = editGramWeight ? parseFloat(editGramWeight) : (parseFloat(editBalance) || 0);
    return qty * editPreviewPricePerUnit;
  }, [editCurrency, editBalance, editGramWeight, editPreviewPricePerUnit]);

  // Available tabs depending on account type
  const availableTabs: { type: TransactionType; label: string }[] = useMemo(() => {
    if (account.type === 'birikim') {
      return [
        { type: 'alis', label: 'AL (ALIŞ)' },
        { type: 'satis', label: 'SAT (SATIŞ)' },
        { type: 'transfer', label: 'TRANSFER' },
        { type: 'giris', label: 'GİRİŞ' },
        { type: 'cikis', label: 'ÇIKIŞ' },
        { type: 'odeme', label: 'ÖDEME' },
        { type: 'tahsilat', label: 'TAHSİLAT' }
      ];
    } else if (account.type === 'kredi_karti') {
      return [
        { type: 'gider', label: 'GİDER / HARCAMA' },
        { type: 'odeme', label: 'BORÇ ÖDEME' },
        { type: 'transfer', label: 'NAKİT AVANS' },
        { type: 'donem_borcu', label: 'DÖNEM BORCU' }
      ];
    } else if (account.type === 'borc_alacak') {
      const isDebt = account.debtDirection === 'borc' || account.balance < 0;
      return isDebt ? [
        { type: 'odeme', label: 'BORÇ ÖDE' },
        { type: 'gider', label: 'YENİ BORÇ EKLE' },
        { type: 'transfer', label: 'TRANSFER' }
      ] : [
        { type: 'tahsilat', label: 'TAHSİLAT YAP' },
        { type: 'gelir', label: 'YENİ ALACAK EKLE' },
        { type: 'transfer', label: 'TRANSFER' }
      ];
    }
    return [
      { type: 'gider', label: 'GİDER' },
      { type: 'gelir', label: 'GELİR' },
      { type: 'transfer', label: 'TRANSFER' },
      { type: 'baslangic_bakiyesi', label: 'BAŞLANGIÇ' }
    ];
  }, [account.type]);

  // Keypad & Transaction State
  const [activeTab, setActiveTab] = useState<TransactionType>(availableTabs[0]?.type || 'gider');
  const [inputValue, setInputValue] = useState<string>('0');
  const [description, setDescription] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Genel');
  const [linkedAccountId, setLinkedAccountId] = useState<string>(
    accounts.find(a => a.id !== account.id && (a.type === 'banka' || a.type === 'nakit'))?.id || ''
  );
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);
  const [showKeypad, setShowKeypad] = useState<boolean>(true);

  // Keypad input handlers
  const handleKeypadPress = (val: string) => {
    if (inputValue === '0' && val !== ',') {
      setInputValue(val);
    } else {
      setInputValue(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    if (inputValue.length <= 1) {
      setInputValue('0');
    } else {
      setInputValue(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setInputValue('0');
  };

  const evaluateInput = (): number => {
    try {
      const sanitized = inputValue.replace(/,/g, '.');
      // eslint-disable-next-line no-eval
      const result = eval(sanitized);
      return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch {
      return parseFloat(inputValue.replace(/,/g, '.')) || 0;
    }
  };

  // Execute transaction based on type
  const handleSaveTransaction = () => {
    const rawVal = evaluateInput();
    if (rawVal <= 0) return;

    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const linkedAcc = accounts.find(a => a.id === linkedAccountId);

    if (account.type === 'birikim') {
      // Yatırım Hesabı İşlemleri: AL, SAT, Transfer, Giriş, Çıkış, Ödeme, Tahsilat
      if (activeTab === 'alis') {
        // Alış: Hedef hesaba gram/döviz ekle, kaynak banka/nakit hesaptan TL düş
        const totalCostTRY = rawVal * livePricePerUnit;
        if (!linkedAcc) {
          addNotification('Kaynak Hesap Gerekli', 'Lütfen ödemenin yapılacağı nakit/banka hesabını seçiniz.', 'system');
          return;
        }

        // Deduct TRY from linked source account
        editAccount(linkedAcc.id, { balance: linkedAcc.balance - totalCostTRY });

        // Add grams & balance to this investment account
        const curGram = account.gramWeight !== undefined ? account.gramWeight : 0;
        editAccount(account.id, {
          gramWeight: curGram + rawVal,
          balance: account.balance + totalCostTRY
        });

        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAcc.id,
          toAccountName: linkedAcc.name,
          type: 'alis',
          amount: rawVal,
          currency: account.currency,
          category: 'Yatırım / Emtia',
          categoryIcon: 'Coins',
          description: description.trim() || `${rawVal} ${account.unitLabel || account.currency} Alımı (Kur: ₺${livePricePerUnit.toFixed(2)} - Ödeme: ${linkedAcc.name})`,
          date: dateStr,
          metalGram: account.gramWeight !== undefined ? rawVal : undefined
        });

        addNotification(
          'Yatırım Alımı Kaydedildi 📈',
          `${rawVal} ${account.unitLabel || account.currency} ${account.name} hesabına eklendi. ${linkedAcc.name} hesabından ₺${totalCostTRY.toLocaleString('tr-TR')} düşüldü.`,
          'price'
        );
      } else if (activeTab === 'satis') {
        // Satış: Bu hesaptan gram/döviz düş, hedef banka/nakit hesaba TL aktar
        const totalGainTRY = rawVal * livePricePerUnit;
        if (!linkedAcc) {
          addNotification('Hedef Hesap Gerekli', 'Lütfen satış gelirinin aktarılacağı hedef banka/nakit hesabını seçiniz.', 'system');
          return;
        }

        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAcc.id,
          toAccountName: linkedAcc.name,
          type: 'satis',
          amount: -rawVal,
          currency: account.currency,
          category: 'Yatırım / Emtia',
          categoryIcon: 'Coins',
          description: description.trim() || `${rawVal} ${account.unitLabel || account.currency} Satışı (Kur: ₺${livePricePerUnit.toFixed(2)} - Gelir: ${linkedAcc.name})`,
          date: dateStr,
          metalGram: account.gramWeight !== undefined ? -rawVal : undefined
        });

        addNotification(
          'Yatırım Satışı Tamamlandı 💵',
          `${rawVal} ${account.unitLabel || account.currency} satıldı. ${linkedAcc.name} hesabına ₺${totalGainTRY.toLocaleString('tr-TR')} aktarıldı.`,
          'price'
        );
      } else if (activeTab === 'giris') {
        // Doğrudan fiziki/manuel varlık girişi
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          type: 'giris',
          amount: rawVal,
          currency: account.currency,
          category: 'Fiziki Giriş',
          description: description.trim() || `${rawVal} ${account.unitLabel || account.currency} Varlık Girişi`,
          date: dateStr
        });
      } else if (activeTab === 'cikis') {
        // Doğrudan fiziki/manuel varlık çıkışı
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          type: 'cikis',
          amount: -rawVal,
          currency: account.currency,
          category: 'Fiziki Çıkış',
          description: description.trim() || `${rawVal} ${account.unitLabel || account.currency} Varlık Çıkışı`,
          date: dateStr
        });
      } else {
        // Transfer / Odeme / Tahsilat
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAccountId || undefined,
          toAccountName: linkedAcc?.name,
          type: activeTab,
          amount: activeTab === 'odeme' ? -rawVal : rawVal,
          currency: account.currency,
          category: selectedCategory,
          description: description.trim() || `${account.name} ${activeTab} işlemi`,
          date: dateStr
        });
      }
    } else if (account.type === 'kredi_karti') {
      if (activeTab === 'odeme') {
        // Kredi kartı borç ödeme
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAcc?.id,
          toAccountName: linkedAcc?.name,
          type: 'odeme',
          amount: rawVal,
          currency: account.currency,
          category: 'Kredi Kartı Ödemesi',
          description: description.trim() || `${account.name} borç ödemesi (${linkedAcc?.name || 'Hesap'})`,
          date: dateStr
        });

        addNotification(
          'Kart Borcu Ödendi 💳',
          `${account.name} için ₺${rawVal.toLocaleString('tr-TR')} ödeme yapıldı.`,
          'system'
        );
      } else {
        // Harcama / Nakit avans
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          type: activeTab,
          amount: -rawVal,
          currency: account.currency,
          category: selectedCategory,
          description: description.trim() || `${account.name} harcama`,
          date: dateStr
        });
      }
    } else if (account.type === 'borc_alacak') {
      if (activeTab === 'tahsilat') {
        // Alacak tahsilatı
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAcc?.id,
          toAccountName: linkedAcc?.name,
          type: 'tahsilat',
          amount: rawVal,
          currency: account.currency,
          category: 'Alacak Tahsilatı',
          description: description.trim() || `${account.name} alacak tahsil edildi (${linkedAcc?.name || 'Nakit Kasa'})`,
          date: dateStr
        });

        addNotification('Tahsilat Alındı 💰', `${account.name} kişisinden ₺${rawVal.toLocaleString('tr-TR')} tahsil edildi.`, 'system');
      } else if (activeTab === 'odeme') {
        // Borç ödemesi: Borç tutarı düşürülür, kaynak hesaptan düşülür
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          toAccountId: linkedAcc?.id,
          toAccountName: linkedAcc?.name,
          type: 'odeme',
          amount: -rawVal,
          currency: account.currency,
          category: 'Borç Ödemesi',
          description: description.trim() || `${account.name} borç ödendi (${linkedAcc?.name || 'Hesap'})`,
          date: dateStr
        });

        addNotification('Borç Ödendi 🤝', `${account.name} kişisine ₺${rawVal.toLocaleString('tr-TR')} borç ödendi.`, 'system');
      } else {
        addTransaction({
          accountId: account.id,
          accountName: account.name,
          type: activeTab,
          amount: activeTab === 'gider' ? -rawVal : rawVal,
          currency: account.currency,
          category: selectedCategory,
          description: description.trim() || `${account.name} işlemi`,
          date: dateStr
        });
      }
    } else {
      // Nakit / Banka hesabı
      const isNegative = activeTab === 'gider' || activeTab === 'odeme';
      const signedAmount = isNegative ? -rawVal : rawVal;

      addTransaction({
        accountId: account.id,
        accountName: account.name,
        toAccountId: activeTab === 'transfer' ? linkedAccountId : undefined,
        toAccountName: activeTab === 'transfer' ? linkedAcc?.name : undefined,
        type: activeTab,
        amount: signedAmount,
        currency: account.currency,
        category: selectedCategory,
        description: description.trim() || `${account.name} işlemi`,
        date: dateStr
      });
    }

    // Reset input
    setInputValue('0');
    setDescription('');
    setIsFormExpanded(false);
  };

  // Filter transactions
  const accountTransactions = useMemo(() => {
    return transactions
      .filter(t => t.accountId === account.id || t.toAccountId === account.id)
      .filter(t => {
        if (filterType === 'all') return true;
        if (filterType === 'gider') return t.type === 'gider' || t.type === 'odeme' || t.type === 'cikis';
        if (filterType === 'gelir') return t.type === 'gelir' || t.type === 'tahsilat' || t.type === 'giris';
        return true;
      });
  }, [transactions, account.id, filterType]);

  const isNegBalance = account.balance < 0;

  // Credit Card usage ratio
  const creditLimit = account.limit || 50000;
  const currentCardDebt = Math.abs(account.balance);
  const availableCreditLimit = Math.max(0, creditLimit - currentCardDebt);
  const creditUsedPercent = Math.min(100, Math.round((currentCardDebt / creditLimit) * 100));

  // Save changes from Edit Modal
  const handleSaveAccountEdits = () => {
    const balNum = parseFloat(editBalance) || 0;
    const limitNum = editLimit ? parseFloat(editLimit) : undefined;
    const gramNum = editGramWeight ? parseFloat(editGramWeight) : undefined;
    const costNum = editCostPricePerUnit ? parseFloat(editCostPricePerUnit) : undefined;
    const cutoffNum = editCardCutoffDay ? parseInt(editCardCutoffDay, 10) : undefined;
    const dueNum = editCardPaymentDueDay ? parseInt(editCardPaymentDueDay, 10) : undefined;
    const origLoanNum = editOriginalLoanAmount ? parseFloat(editOriginalLoanAmount) : undefined;

    editAccount(account.id, {
      name: editName.trim() || account.name,
      note: editNote.trim(),
      type: editType,
      currency: editCurrency,
      balance: balNum,
      limit: limitNum,
      cardCutoffDay: cutoffNum,
      cardPaymentDueDay: dueNum,
      cardLast4: editCardLast4.trim(),
      cardHolder: editCardHolder.trim(),
      supplementaryCardHolder: editIsSupplementary ? editCardHolder.trim() : undefined,
      isSupplementary: editIsSupplementary,
      parentAccountId: editIsSupplementary ? editParentAccountId : undefined,
      gramWeight: gramNum,
      costPricePerUnit: costNum,
      holdingLots: holdingLots.length > 0 ? holdingLots : undefined,
      metalPurity: editMetalPurity,
      debtDirection: editDebtDirection,
      institutionType: editInstitutionType,
      institutionName: editInstitutionName.trim() || undefined,
      contactPhone: editContactPhone.trim(),
      dueDate: editDueDate,
      originalLoanAmount: origLoanNum,
      isArchived: editIsArchived,
      includeInGeneralStatus: editIsArchived ? false : includeInGeneral
    });

    if (editIsArchived && !account.isArchived) {
      addNotification('Hesap Arşivlendi', `${editName} arşive kaldırıldı ve genel durumdan çıkarıldı.`, 'system');
    } else if (!editIsArchived && account.isArchived) {
      addNotification('Hesap Arşivden Çıkarıldı', `${editName} aktif hesaplara geri yüklendi.`, 'system');
    } else {
      addNotification('Hesap Güncellendi', `${editName} ayarları başarıyla kaydedildi.`, 'system');
    }
    setShowEditModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center">
      <div className="w-full sm:max-w-md h-full sm:h-[92vh] bg-slate-50 dark:bg-slate-950 flex flex-col shadow-2xl sm:rounded-3xl overflow-hidden animate-in slide-in-from-bottom duration-200">
        
        {/* Top Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all text-slate-700 dark:text-slate-200"
              aria-label="Geri"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                  {account.name}
                </h2>
                {account.isSupplementary && (
                  <span className="text-[9px] bg-red-100 dark:bg-red-950/60 text-red-600 px-1.5 py-0.2 rounded-md font-extrabold">
                    EK KART
                  </span>
                )}
                {account.includeInGeneralStatus === false && (
                  <span className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded-md font-semibold">
                    Hariç
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {account.type === 'kredi_karti' ? 'Kredi Kartı' :
                 account.type === 'birikim' ? 'Yatırım / Emtia' :
                 account.type === 'borc_alacak' ? 'Borç & Alacak' :
                 account.type === 'banka' ? 'Banka Hesabı' : 'Nakit Cüzdan'} · {account.currency}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              title="Paylaş & PDF"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowOptionsMenu(prev => !prev)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
              title="Seçenekler"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Options Dropdown Menu */}
        {showOptionsMenu && (
          <>
            <div
              className="fixed inset-0 z-25 bg-transparent"
              onClick={() => setShowOptionsMenu(false)}
            />
            <div className="absolute top-14 right-3 z-30 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 text-xs divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-150">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowEditModal(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  <span>Hesabı Düzenle & Ayarlar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    toggleIncludeInGeneralStatus(account.id);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-blue-600" />
                    <span>Genel Duruma Dahil</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    account.includeInGeneralStatus !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {account.includeInGeneralStatus !== false ? 'Dahil' : 'Hariç'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    toggleArchiveAccount(account.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <div className="flex items-center gap-2.5">
                    {account.isArchived ? (
                      <RotateCcw className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Archive className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{account.isArchived ? 'Arşivden Çıkar' : 'Hesabı Arşive Kaldır'}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    account.isArchived ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {account.isArchived ? 'Arşivde' : 'Arşivle'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenCategoryReport(account.name);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <PieChart className="w-4 h-4 text-emerald-600" />
                  <span>Kategori Dağılımı</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenPeriodicReport(account.name);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Periyodik Rapor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenPdfExport(account);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>PDF Hesap Ekstresi</span>
                </button>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Hesap Verilerini Sıfırla',
                      message: `"${account.name}" hesabının tüm geçmiş hareketleri silinecek ve bakiyesi sıfırlanacaktır. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
                      confirmText: 'Evet, Sıfırla',
                      confirmButtonColor: 'amber',
                      actionType: 'reset_data'
                    });
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 font-medium transition-colors"
                >
                  <Archive className="w-4 h-4" />
                  <span>Verileri Sıfırla</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Hesabı Kalıcı Olarak Sil',
                      message: `"${account.name}" hesabı ve bu hesaba ait tüm geçmiş işlemler kalıcı olarak silinecektir. Genel durum dahil her yerden kaldırılacaktır. Devam etmek istiyor musunuz?`,
                      confirmText: 'Evet, Hesabı Sil',
                      confirmButtonColor: 'red',
                      actionType: 'delete_account'
                    });
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hesabı Sil</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* FULL PROFESSIONAL EDIT ACCOUNT MODAL (User Requested) */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4">
            <div className="w-full max-w-md max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col space-y-4 animate-in slide-in-from-bottom duration-200 overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Vazgeç
                </button>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Hesap Ayarlarını Düzenle
                </h3>
                <button
                  type="button"
                  onClick={handleSaveAccountEdits}
                  className="text-xs font-bold px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                >
                  Kaydet
                </button>
              </div>

              {/* Scrollable Edit Form Body */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
                {/* Account Name */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hesap Adı</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                {/* Account Type & Currency Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hesap Türü</label>
                    <select
                      value={editType}
                      onChange={e => setEditType(e.target.value as AccountType)}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      <option value="nakit">Nakit / Cüzdan</option>
                      <option value="banka">Banka Hesabı</option>
                      <option value="kredi_karti">Kredi Kartı</option>
                      <option value="birikim">Yatırım / Emtia</option>
                      <option value="borc_alacak">Borç / Alacak</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Döviz / Maden Birimi</label>
                    <select
                      value={editCurrency}
                      onChange={e => setEditCurrency(e.target.value as CurrencyCode)}
                      className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold"
                    >
                      <option value="TRY">TRY - Türk Lirası (₺)</option>
                      <option value="USD">USD - Amerikan Doları ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="GBP">GBP - İngiliz Sterlini (£)</option>
                      <option value="CHF">CHF - İsviçre Frangı</option>
                      <option value="XAU">XAU - Has Altın (Gram)</option>
                      <option value="XAG">XAG - Gümüş (Gram)</option>
                      <option value="XPT">XPT - Platin (Gram)</option>
                      <option value="XPD">XPD - Paladyum (Gram)</option>
                      <option value="RUB">RUB - Rus Rublesi</option>
                      <option value="SAR">SAR - Suudi Arabistan Riyali</option>
                    </select>
                  </div>
                </div>

                {/* Balance / Initial Balance */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Başlangıç Bakiyesi ({editCurrency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editBalance}
                    onChange={e => setEditBalance(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                {/* Investment / Metal Specific Fields */}
                {editType === 'birikim' && (
                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>Yatırım & Kıymetli Maden Detayları</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Gramaj / Miktar
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Örn: 50.00"
                          value={editGramWeight}
                          onChange={e => setEditGramWeight(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Birim Alış Maliyeti (₺)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Örn: 6500.00"
                          value={editCostPricePerUnit}
                          onChange={e => setEditCostPricePerUnit(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    {/* Live Market Price Auto-Calculation Preview */}
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-300/60 dark:border-amber-800/60 text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-semibold">
                        <span>Anlık Piyasa Ortalaması:</span>
                        <span className="font-bold text-amber-700 dark:text-amber-300">₺{editPreviewPricePerUnit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-900 dark:text-white font-extrabold">
                        <span>Toplam Tahmini Değer (TL):</span>
                        <span className="text-emerald-600 dark:text-emerald-400">₺{editPreviewTotalTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* ÖNCEDEN ELDE BULUNAN VARLIKLAR / ALIŞ PARTİLERİ EKLEME (Kullanıcı İsteği: "daha önceden elimde bulunan varlıklarımı ekleyebileceğim özellik güncellemesi yap; gr br fiyat toplam fiyat ve açıklama gibi detayları da ekleyebilmek istiyorum") */}
                    <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          <span>Eldeki Varlık Girişi / Geçmiş Alışlar</span>
                        </span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          {holdingLots.length} Varlık Kaydı
                        </span>
                      </div>

                      {/* Add Lot Form */}
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-amber-800/50 space-y-2 text-[11px]">
                        <div className="grid grid-cols-3 gap-1.5">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Miktar / Gr</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Örn: 10"
                              value={newLotGram}
                              onChange={e => handleLotGramChange(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Birim Fiyat (₺)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Örn: 6500"
                              value={newLotUnitPrice}
                              onChange={e => handleLotUnitPriceChange(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Toplam Fiyat (₺)</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Örn: 65000"
                              value={newLotTotalCost}
                              onChange={e => handleLotTotalCostChange(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Açıklama / Detay</label>
                            <input
                              type="text"
                              placeholder="Örn: Çeyrek / Bilezik / Kuyumcu"
                              value={newLotNote}
                              onChange={e => setNewLotNote(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Alış Tarihi</label>
                            <input
                              type="date"
                              value={newLotDate}
                              onChange={e => setNewLotDate(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddLot}
                          disabled={!newLotGram || parseFloat(newLotGram) <= 0}
                          className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Bu Varlığı / Partiyi Listeye Ekle</span>
                        </button>
                      </div>

                      {/* Existing Lots List */}
                      {holdingLots.length > 0 && (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                          {holdingLots.map(lot => (
                            <div
                              key={lot.id}
                              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between text-[11px]"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{lot.gramWeight} {editCurrency === 'TRY' ? 'Adet' : 'gr'}</span>
                                  <span className="text-[10px] text-slate-400">@ ₺{lot.unitPriceTRY.toFixed(2)}/gr</span>
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 truncate">
                                  {lot.note && <span className="font-semibold text-amber-700 dark:text-amber-400">{lot.note} · </span>}
                                  <span>{lot.date || 'Geçmiş'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-extrabold text-xs text-slate-900 dark:text-white tabular-nums">
                                  ₺{lot.totalCostTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLot(lot.id)}
                                  className="p-1 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  title="Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Credit Card Specific Fields */}
                {editType === 'kredi_karti' && (
                  <div className="p-3 bg-red-50/60 dark:bg-red-950/20 rounded-2xl border border-red-200/80 dark:border-red-900/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-red-800 dark:text-red-300 font-bold text-xs">
                      <CreditCard className="w-4 h-4 text-red-600" />
                      <span>Kredi Kartı Limit & Tarih Bilgileri</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Kart Limiti (₺)
                        </label>
                        <input
                          type="number"
                          placeholder="Örn: 100000"
                          value={editLimit}
                          onChange={e => setEditLimit(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Son 4 Hane
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          placeholder="Örn: 4022"
                          value={editCardLast4}
                          onChange={e => setEditCardLast4(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Hesap Kesim Günü (1-31)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editCardCutoffDay}
                          onChange={e => setEditCardCutoffDay(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Son Ödeme Günü (1-31)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={editCardPaymentDueDay}
                          onChange={e => setEditCardPaymentDueDay(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                        Kart Sahibinin Adı
                      </label>
                      <input
                        type="text"
                        placeholder="Örn: Emre Özgür"
                        value={editCardHolder}
                        onChange={e => setEditCardHolder(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>

                    {/* Ek Kart Seçimi */}
                    <div className="pt-1.5 border-t border-red-200/50 dark:border-red-900/50 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editIsSupplementary}
                          onChange={e => setEditIsSupplementary(e.target.checked)}
                          className="w-4 h-4 text-red-600 rounded-sm"
                        />
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          Bu Bir Ek Karttır (Ek Kart Tanımla)
                        </span>
                      </label>

                      {editIsSupplementary && (
                        <div>
                          <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                            Bağlı Olduğu Ana Kart
                          </label>
                          <select
                            value={editParentAccountId}
                            onChange={e => setEditParentAccountId(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                          >
                            <option value="">-- Ana Kart Seçiniz --</option>
                            {accounts
                              .filter(a => a.type === 'kredi_karti' && a.id !== account.id && !a.isSupplementary)
                              .map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.name} (Limit: ₺{c.limit?.toLocaleString('tr-TR')})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Borç / Alacak Specific Fields */}
                {editType === 'borc_alacak' && (
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold text-xs">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                      <span>Borç / Alacak Detayları</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Borç / Alacak Yönü
                        </label>
                        <select
                          value={editDebtDirection}
                          onChange={e => setEditDebtDirection(e.target.value as 'alacak' | 'borc')}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold"
                        >
                          <option value="borc">Ödenecek Borç (Biz Borçluyuz)</option>
                          <option value="alacak">Tahsil Edilecek Alacak (Alacaklıyız)</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Kuruluş / Karşı Taraf Türü
                        </label>
                        <select
                          value={editInstitutionType}
                          onChange={e => setEditInstitutionType(e.target.value as 'resmi' | 'ozel' | 'sahis' | 'ticari')}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 font-semibold"
                        >
                          <option value="resmi">🏛️ Resmi Kuruluş (KYK, SGK, Vergi vb.)</option>
                          <option value="ozel">🏦 Özel Kuruluş / Banka (Kredi vb.)</option>
                          <option value="sahis">👤 Bireysel Şahıs</option>
                          <option value="ticari">🏪 Ticari İşletme / Esnaf</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Kurum / Karşı Taraf Adı
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: KYK Genel Müdürlüğü, İş Bankası..."
                          value={editInstitutionName}
                          onChange={e => setEditInstitutionName(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Telefon Numarası
                        </label>
                        <input
                          type="tel"
                          placeholder="0532..."
                          value={editContactPhone}
                          onChange={e => setEditContactPhone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Vade Tarihi
                        </label>
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[11px] text-slate-600 dark:text-slate-300 block mb-0.5">
                          Toplam Anapara (₺)
                        </label>
                        <input
                          type="number"
                          placeholder="Örn: 25000"
                          value={editOriginalLoanAmount}
                          onChange={e => setEditOriginalLoanAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Note / Description */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Açıklama / Not</label>
                  <input
                    type="text"
                    placeholder="Açıklama girin..."
                    value={editNote}
                    onChange={e => setEditNote(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                  />
                </div>

                {/* Genel Duruma Dahil Etme Toggle */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Genel Duruma Dahil Et</div>
                      <div className="text-[10px] text-slate-400">
                        Bu hesabı ana ekrandaki Genel Durum ve Toplam Varlık hesaplamasına dahil et
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={editIsArchived}
                      onClick={() => setIncludeInGeneral(!includeInGeneral)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        editIsArchived
                          ? 'bg-slate-200 dark:bg-slate-700 opacity-50 cursor-not-allowed justify-start'
                          : includeInGeneral ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Arşivleme Seçeneği (User Requested) */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Archive className="w-3.5 h-3.5 text-amber-600" />
                        <span>Hesabı Arşivle</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Görmek istemediğiniz hesabı arşive kaldırın. Arşivlenen hesap genel duruma dahil edilmez.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !editIsArchived;
                        setEditIsArchived(next);
                        if (next) {
                          setIncludeInGeneral(false);
                        }
                      }}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                        editIsArchived ? 'bg-amber-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  {/* Hesabı Kalıcı Sil Butonu */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditModal(false);
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Hesabı Kalıcı Olarak Sil',
                          message: `"${account.name}" hesabı ve bu hesaba ait tüm geçmiş işlemler kalıcı olarak silinecektir. Devam etmek istiyor musunuz?`,
                          confirmText: 'Evet, Hesabı Sil',
                          confirmButtonColor: 'red',
                          actionType: 'delete_account'
                        });
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Bu Hesabı Kalıcı Olarak Sil</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Share Modal Sheet */}
        {showShareModal && (
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs flex items-end sm:items-center justify-center p-3">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">HESAP DÖKÜMÜ & PAYLAŞ</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 pt-3">
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    onOpenPdfExport(account);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800/40 text-left transition-all"
                >
                  <div className="p-2 bg-emerald-600 text-white rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100">PDF Hesap Ekstresi</div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400">
                      Tüm hareketlerin resmi dökümünü PDF formatında kaydedin
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowShareModal(false);
                    addNotification('Excel (CSV) Aktarımı', 'Hesap hareketleri dökümü CSV formatında dışa aktarıldı.', 'system');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-100 dark:border-blue-800/40 text-left transition-all"
                >
                  <div className="p-2 bg-blue-600 text-white rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-blue-950 dark:text-blue-100">Excel (CSV) Aktarımı</div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      Verileri elektronik tablo olarak dışa aktarın
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-3 py-2.5 rounded-xl text-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* ACCOUNT HERO BANNER & REAL-TIME STATS (Credit Card / Investment / Borç-Alacak specialized) */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          {/* Investment Account Special Banner */}
          {account.type === 'birikim' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                    PORTFÖY MİKTARI
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {account.gramWeight !== undefined ? account.gramWeight.toLocaleString('tr-TR') : account.balance.toLocaleString('tr-TR')}{' '}
                    <span className="text-sm font-bold text-amber-600">{account.unitLabel || account.currency}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                    CANLI PİYASA DEĞERİ
                  </span>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    ₺{liveTotalValueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Live Market Average ticker ribbon */}
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Canlı Piyasa Ortalaması ({currentRate?.sources?.length || 5} Firma):</span>
                </div>
                <div className="font-extrabold text-amber-900 dark:text-amber-200 tabular-nums">
                  ₺{livePricePerUnit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} / {account.unitLabel || 'Birim'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowParityTransferModal(true)}
                className="w-full mt-1.5 py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/50 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Parite ile Yatırım Transferi Yap ⇄</span>
              </button>
            </div>
          ) : account.type === 'kredi_karti' ? (
            /* Credit Card Professional Banner */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                    GÜNCEL DÖNEM BORCU
                  </span>
                  <div className="text-xl font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                    ₺{currentCardDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    KULLANILABİLİR LİMİT
                  </span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    ₺{availableCreditLimit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Progress Limit Usage Bar */}
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-500 mb-1">
                  <span>Limit Kullanımı (%{creditUsedPercent})</span>
                  <span>Toplam Limit: ₺{creditLimit.toLocaleString('tr-TR')}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${creditUsedPercent}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      creditUsedPercent > 80 ? 'bg-red-500' : creditUsedPercent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>
              </div>

              {/* Details strip */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] text-center">
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block font-medium">Kesim Günü</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">Her Ayın {account.cardCutoffDay || 15}'i</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block font-medium">Son Ödeme</span>
                  <span className="font-bold text-red-600 dark:text-red-400">Her Ayın {account.cardPaymentDueDay || 25}'i</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <span className="text-slate-400 block font-medium">Son 4 Hane</span>
                  <span className="font-bold text-slate-700 dark:text-slate-200">•••• {account.cardLast4 || '4022'}</span>
                </div>
              </div>
            </div>
          ) : account.type === 'borc_alacak' ? (
            /* Borç & Alacak Professional Banner */
            (() => {
              const isWeOweDebt = account.debtDirection === 'borc' || account.balance < 0;
              return (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isWeOweDebt
                            ? 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        }`}>
                          {isWeOweDebt ? 'ÖDENECEK BORÇ' : 'TAHSİL EDİLECEK ALACAK'}
                        </span>
                        {account.institutionType && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                            {account.institutionType === 'resmi' ? '🏛️ Resmi Kuruluş (Devlet / KYK)' :
                             account.institutionType === 'ozel' ? '🏦 Özel Finans / Banka Kredisi' :
                             account.institutionType === 'ticari' ? '🏪 Ticari / Esnaf' : '👤 Bireysel Şahıs'}
                          </span>
                        )}
                      </div>
                      <div className={`text-2xl font-black tabular-nums mt-1 ${isWeOweDebt ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {isWeOweDebt ? '-' : '+'}₺{Math.abs(account.balance).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                      {account.currency === 'XAU' && (
                        <span className="text-xs font-bold text-amber-600 block">
                          Altın Karşılığı: {Math.abs(account.gramWeight || 0)} gr
                        </span>
                      )}
                    </div>

                    <div className="text-right space-y-1.5">
                      {isWeOweDebt && (
                        <button
                          type="button"
                          onClick={() => setShowDebtPaymentModal(true)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>BORÇ ÖDE</span>
                        </button>
                      )}
                      {!isWeOweDebt && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('tahsilat')}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center gap-1.5 ml-auto"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>TAHSİLAT YAP</span>
                        </button>
                      )}
                      {account.dueDate && (
                        <span className="text-[10px] text-slate-400 block">
                          Vade: <strong className="text-slate-700 dark:text-slate-300">{account.dueDate}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {account.institutionName && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span>Kurum: {account.institutionName}</span>
                      {account.remainingInstallments && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
                          {account.remainingInstallments}/{account.totalInstallments} Taksit
                        </span>
                      )}
                    </div>
                  )}

                  {account.contactPhone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>İletişim: {account.contactPhone}</span>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            /* Standard Banka / Nakit Banner */
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  GÜNCEL BAKİYE
                </span>
                <div className="text-xs text-slate-400 font-medium">
                  {account.currency !== 'TRY' ? `Anlık Değer: ₺${liveTotalValueTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}` : 'Kullanılabilir Tutar'}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-xl font-extrabold tabular-nums ${isNegBalance ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>
                  {account.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} <span className="text-sm font-bold">{account.currency === 'TRY' ? '₺' : account.currency}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Transaction List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
          {accountTransactions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Bu hesapta henüz kayıtlı işlem bulunmuyor.
              <div className="mt-1 text-slate-500 font-medium">Aşağıdaki paneli kullanarak yeni işlem kaydedebilirsiniz.</div>
            </div>
          ) : (
            accountTransactions.map(tx => {
              const isExpense = tx.type === 'gider' || tx.type === 'odeme' || tx.type === 'cikis';
              const isTransfer = tx.type === 'transfer';
              const isBuy = tx.type === 'alis';
              const isSell = tx.type === 'satis';

              return (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          isExpense ? 'text-red-500' :
                          isBuy ? 'text-amber-500' :
                          isSell ? 'text-emerald-500' :
                          isTransfer ? 'text-blue-500' : 'text-emerald-600'
                        }`}
                      >
                        {tx.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">· {tx.date}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                      {tx.category}
                    </div>
                    {tx.userCustomNote && (
                      <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {tx.userCustomNote}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {tx.description}
                    </div>
                    {tx.autoParityNote && (
                      <div className="mt-1 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md text-[10px] text-amber-800 dark:text-amber-300 font-mono break-all">
                        ⚡ {tx.autoParityNote}
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div
                        className={`text-sm font-extrabold tabular-nums ${
                          isExpense ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-emerald-400'
                        }`}
                      >
                        {isExpense ? '' : '+'}
                        {tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                        <span className="text-xs font-bold">{tx.currency === 'TRY' ? '₺' : tx.currency}</span>
                      </div>
                      {tx.metalGram && (
                        <div className="text-[10px] font-semibold text-amber-600">
                          {tx.metalGram > 0 ? `+${tx.metalGram}` : tx.metalGram} gr
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTransaction(tx);
                          setEditTxAmount(String(Math.abs(tx.amount)));
                          setEditTxDescription(tx.description || '');
                          setEditTxCategory(tx.category || '');
                          setEditTxDate(tx.date || new Date().toISOString().slice(0, 10));
                          setEditTxToAccountId(tx.toAccountId || '');
                          setEditTxNote(tx.userCustomNote || tx.note || '');
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="İşlemi Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'İşlemi Sil ve Geri Al',
                            message: `"${tx.description || tx.category}" (${Math.abs(tx.amount).toLocaleString('tr-TR')} ${tx.currency}) işlemi silindiğinde, ilgili hesap bakiyeleri (kredi/borç kalan taksitleri ve ödeme tutarları) işlem yapılmamış gibi eski haline döndürülecektir. Devam etmek istiyor musunuz?`,
                            confirmText: 'Evet, Sil ve Geri Al',
                            confirmButtonColor: 'red',
                            actionType: 'delete_transaction',
                            targetTxId: tx.id
                          });
                        }}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="İşlemi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DOCKED OPERATION KEYPAD & ACTION BAR */}
        <div className="sticky bottom-0 z-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg pb-safe">
          {/* Operation Tabs Strip */}
          <div className="flex items-center px-2 pt-1.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1">
            {availableTabs.map(tab => {
              const isActive = activeTab === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => setActiveTab(tab.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? tab.type === 'alis'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : tab.type === 'satis'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : tab.type === 'gider' || tab.type === 'cikis'
                        ? 'bg-red-600 text-white shadow-xs'
                        : tab.type === 'gelir' || tab.type === 'giris' || tab.type === 'tahsilat'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Special Linked Account Selector for Buy / Sell / Transfer / Payment */}
          {(account.type === 'birikim' || activeTab === 'transfer' || activeTab === 'odeme' || activeTab === 'tahsilat') && (
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {activeTab === 'alis' || activeTab === 'odeme' ? 'Kaynak Hesap (Ödeme):' : 'Hedef Hesap (Gelir):'}
              </span>
              <select
                value={linkedAccountId}
                onChange={e => setLinkedAccountId(e.target.value)}
                className="bg-white dark:bg-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 max-w-[200px] truncate"
              >
                {accounts
                  .filter(a => a.id !== account.id)
                  .map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.balance.toLocaleString('tr-TR')} ₺)
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Calculator Input Bar */}
          <div className="p-2 flex items-center gap-2">
            <button
              onClick={() => setIsFormExpanded(prev => !prev)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all shrink-0"
              title="Açıklama & Kategori Ekle"
            >
              <Calendar className="w-4 h-4" />
            </button>

            {/* Amount & Expression Box */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-2 flex items-center justify-between border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-bold text-slate-400">
                {account.type === 'birikim' && (activeTab === 'alis' || activeTab === 'satis' || activeTab === 'giris' || activeTab === 'cikis')
                  ? `${account.unitLabel || account.currency} Miktar:`
                  : `${account.currency === 'TRY' ? '₺' : account.currency}:`}
              </span>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {inputValue}
              </span>
            </div>

            {/* KAYDET Button */}
            <button
              onClick={handleSaveTransaction}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>KAYDET</span>
            </button>
          </div>

          {/* Optional Expanded Drawer for Description & Category */}
          {isFormExpanded && (
            <div className="px-3 pb-2 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-150">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="İşlem açıklaması girin..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                />
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Keypad Grid (3x4 digits) */}
          {showKeypad && (
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200/60 dark:border-slate-800">
              {['1', '2', '3'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-10 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white shadow-2xs border border-slate-200/50 dark:border-slate-700/50 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('+')}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-base font-bold hover:bg-slate-300 active:scale-95 transition-all"
              >
                +
              </button>

              {['4', '5', '6'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-10 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white shadow-2xs border border-slate-200/50 dark:border-slate-700/50 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleKeypadPress('-')}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-base font-bold hover:bg-slate-300 active:scale-95 transition-all"
              >
                -
              </button>

              {['7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypadPress(num)}
                  className="h-10 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white shadow-2xs border border-slate-200/50 dark:border-slate-700/50 transition-all"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm font-bold hover:bg-slate-300 active:scale-95 transition-all flex items-center justify-center"
              >
                ⌫
              </button>

              <button
                onClick={() => handleKeypadPress(',')}
                className="h-10 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white shadow-2xs border border-slate-200/50 dark:border-slate-700/50 transition-all"
              >
                ,
              </button>
              <button
                onClick={() => handleKeypadPress('0')}
                className="h-10 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 text-base font-bold text-slate-900 dark:text-white shadow-2xs border border-slate-200/50 dark:border-slate-700/50 transition-all"
              >
                0
              </button>
              <button
                onClick={handleClear}
                className="h-10 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-slate-300 active:scale-95 transition-all"
              >
                C
              </button>
              <button
                onClick={() => {
                  const res = evaluateInput();
                  setInputValue(String(res));
                }}
                className="h-10 rounded-lg bg-emerald-700 text-white text-base font-bold hover:bg-emerald-600 active:scale-95 transition-all"
              >
                =
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Debt Payment Modal Trigger */}
      {showDebtPaymentModal && (
        <DebtPaymentModal
          debtAccount={account}
          onClose={() => setShowDebtPaymentModal(false)}
        />
      )}

      {/* Parity Investment Transfer Modal Trigger */}
      {showParityTransferModal && (
        <InvestmentTransferModal
          defaultFromAccountId={account.id}
          onClose={() => setShowParityTransferModal(false)}
        />
      )}

      {/* In-App Confirmation Dialog (Replaces blocked window.confirm) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmDialog.confirmButtonColor === 'red'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                }`}
              >
                {confirmDialog.confirmButtonColor === 'red' ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.actionType === 'delete_account') {
                    deleteAccount(account.id);
                    addNotification('Hesap Silindi', `"${account.name}" hesabı başarıyla silindi.`, 'system');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                    onClose();
                  } else if (confirmDialog.actionType === 'reset_data') {
                    resetAccountData(account.id);
                    addNotification('Veriler Sıfırlandı', `"${account.name}" hesabının hareketleri ve bakiyesi sıfırlandı.`, 'system');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  } else if (confirmDialog.actionType === 'delete_transaction' && confirmDialog.targetTxId) {
                    deleteTransaction(confirmDialog.targetTxId);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 ${
                  confirmDialog.confirmButtonColor === 'red'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal Sheet */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">İşlemi Düzenle</h3>
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {editingTransaction.type.toUpperCase()} · {account.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info notice about automatic recalculation */}
            <div className="p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 flex items-start gap-2 text-[11px] text-blue-900 dark:text-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                Tutarı veya hesabı güncellediğinizde, ilgili kredi/borç taksitleri, kart limitleri ve bütçe durumu otomatik olarak baştan hesaplanır.
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Tutar */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  İşlem Tutarı ({editingTransaction.currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={editTxAmount}
                    onChange={e => setEditTxAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    placeholder="0.00"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    {editingTransaction.currency}
                  </span>
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Açıklama</label>
                <input
                  type="text"
                  value={editTxDescription}
                  onChange={e => setEditTxDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  placeholder="Örn: Kredi taksit ödemesi"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori</label>
                <select
                  value={editTxCategory}
                  onChange={e => setEditTxCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Hedef / Kaynak Hesap (Varsa) */}
              {editingTransaction.toAccountId && (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    İlişkili Hesap (Ödeme Kaynağı / Hedef)
                  </label>
                  <select
                    value={editTxToAccountId}
                    onChange={e => setEditTxToAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  >
                    {accounts.filter(a => a.id !== editingTransaction.accountId).map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.balance.toLocaleString('tr-TR')} {a.currency})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tarih */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">İşlem Tarihi</label>
                <input
                  type="text"
                  value={editTxDate}
                  onChange={e => setEditTxDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  placeholder="YYYY-MM-DD"
                />
              </div>

              {/* Özel Not */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Özel Not (Opsiyonel)</label>
                <input
                  type="text"
                  value={editTxNote}
                  onChange={e => setEditTxNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                  placeholder="Kişisel not veya dekont detayı"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseFloat(editTxAmount);
                  if (!parsed || parsed <= 0) return;

                  const isNeg = editingTransaction.amount < 0;
                  const signedAmount = isNeg ? -parsed : parsed;

                  editTransaction(editingTransaction.id, {
                    amount: signedAmount,
                    description: editTxDescription.trim() || editingTransaction.description,
                    category: editTxCategory || editingTransaction.category,
                    date: editTxDate.trim() || editingTransaction.date,
                    toAccountId: editTxToAccountId || editingTransaction.toAccountId,
                    userCustomNote: editTxNote.trim() || undefined
                  });

                  setEditingTransaction(null);
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Kaydet & Hesapları Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
