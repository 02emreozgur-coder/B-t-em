export type AccountType = 'nakit' | 'banka' | 'kredi_karti' | 'birikim' | 'borc_alacak';

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'CHF' | 'RUB' | 'SAR' | 'AZN' | 'JPY' | 'AUD' | 'CAD' | 'GEL' | 'XAU' | 'CEY' | 'YRM' | 'TAM' | 'ATA' | 'GRM' | 'XAG' | 'XPT' | 'XPD' | (string & {});

export interface SourceQuote {
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  sourceType: string; // e.g. "TV Ekranı", "Döviz Ekranı", "Socket.IO", "Ajax"
  buyPrice: number;
  sellPrice: number;
  updatedAt: string;
}

export interface ArbitrageOpportunity {
  id: string;
  assetCode: CurrencyCode;
  assetName: string;
  buyFromSource: SourceQuote;
  sellToSource: SourceQuote;
  profitPerUnit: number;
  profitPercent: number;
  unit: string;
  timestamp: string;
}

export interface ArbitrageHistoryRecord {
  id: string;
  assetCode: CurrencyCode;
  assetName: string;
  unit: string;
  buyFromSource: SourceQuote;
  sellToSource: SourceQuote;
  profitPerUnit: number;
  profitPercent: number;
  detectedAt: string;
  timeFormatted: string;
}

export interface PriceHistoryPoint {
  timestamp: string;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  buyPrice: number;
  sellPrice: number;
  volume?: number;
}

export interface MarketRate {
  code: CurrencyCode;
  name: string;
  symbol: string;
  buyPrice: number; // Average buy price
  sellPrice: number; // Average sell price
  changeRate: number; // percentage
  unit: string;
  isMetal?: boolean;
  sources: SourceQuote[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number; // In base currency or units
  currency: CurrencyCode;
  unitLabel?: string; // e.g. "gr", "₺", "€", "$"
  limit?: number; // For credit cards or overdraft limits
  usedLimit?: number;
  category?: string;
  bankName?: string;
  note?: string;
  isArchived?: boolean;
  includeInGeneralStatus?: boolean; // Genel duruma dahil et / etme seçeneği
  parentAccountId?: string; // Ana kart ID (Ek kartlar için)
  isSupplementary?: boolean; // Ek kart mı?
  cardHolder?: string; // Kart sahibinin adı (Ana kart veya genel)
  supplementaryCardHolder?: string; // Ek kart sahibi
  cardCutoffDay?: number; // Hesap kesim tarihi (1-31)
  cardPaymentDueDay?: number; // Son ödeme tarihi (1-31)
  cardLast4?: string; // Son 4 hane
  cardExpiry?: string; // SKT (MM/YY)
  color?: string;
  icon?: string;
  minPaymentPercent?: number; // Asgari ödeme oranı (%20, %40 vb.)
  // Kredi Kartı & Finansman specific (Avans hesap, Taksitli avans, Banka kredisi)
  creditCardSubType?: 'standart' | 'avans_hesap' | 'taksitli_avans' | 'kredi';
  interestRate?: number; // Aylık akdi faiz oranı (%5.00 vb.)
  overdraftLimit?: number; // KMH / Avans limiti (₺)
  installmentCount?: number; // Taksit sayısı (Örn: 6 taksit)
  installmentAmount?: number; // Aylık taksit tutarı (₺)
  loanType?: 'ihtiyac' | 'konut' | 'tasit' | 'ticari'; // Kredi türü
  linkedCardId?: string; // Taksitli nakit avansın bağlı olduğu kart ID
  interestAccrualDay?: number; // Faiz tahakkuk günü (1-31)
  // Metal & Investment specific
  metalPurity?: string; // e.g., "Has Altın", "24 Ayar", "999/1000", "Bilezik"
  gramWeight?: number;
  costPricePerUnit?: number; // Birim maliyet / Alış ortalaması (TL)
  holdingLots?: AssetHoldingLot[]; // Geçmişte alınan varlık partileri (gr, br fiyat, toplam fiyat, açıklama)
  // Borç - Alacak specific
  debtDirection?: 'alacak' | 'borc'; // 'alacak' (bize borçlu), 'borc' (biz borçluyuz)
  institutionType?: 'resmi' | 'ozel' | 'sahis' | 'ticari'; // Resmi Kurum (KYK, Vergi, SGK), Özel/Banka (İş Bankası vb.), Şahıs, Ticari
  institutionName?: string; // Kurum adı veya detayı (örn: 'KYK Kredi ve Yurtlar Kurumu', 'İş Bankası')
  contactPhone?: string; // Telefon
  dueDate?: string; // Vade / Geri ödeme tarihi
  originalLoanAmount?: number; // İlk verilen/alınan borç miktarı
  isRecurringDebt?: boolean; // Tekrar eden borç / alacak mı?
  recurringInterval?: 'aylik' | 'haftalik' | 'yillik'; // Tekrar sıklığı
  recurringDay?: number; // Her ayın X'inci günü
  totalInstallments?: number; // Toplam taksit sayısı
  remainingInstallments?: number; // Kalan taksit sayısı
  installments?: DebtInstallment[];
}

export interface AssetHoldingLot {
  id: string;
  gramWeight: number; // gr
  unitPriceTRY: number; // br fiyat
  totalCostTRY: number; // toplam fiyat
  date?: string; // Alış tarihi
  note?: string; // Açıklama
}

export interface DebtInstallment {
  id: string;
  installmentNo: number;
  totalInstallments: number;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
}

export type TransactionType = 'gider' | 'gelir' | 'transfer' | 'tahsilat' | 'odeme' | 'donem_borcu' | 'baslangic_bakiyesi' | 'alis' | 'satis' | 'giris' | 'cikis';

export interface SmartBudgetProjection {
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  spentSoFar: number;
  dailyBurnRate: number;
  daysPassed: number;
  daysRemaining: number;
  projectedMonthEnd: number;
  projectedExcess: number;
  projectedPercent: number;
  safeDailyLimit: number;
  status: 'safe' | 'warning' | 'danger';
  adviceMessage: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  toAccountId?: string;
  toAccountName?: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  originalAmount?: number;
  originalCurrency?: CurrencyCode;
  exchangeRate?: number;
  category: string;
  categoryIcon?: string;
  description: string;
  date: string; // ISO string or formatted YYYY-MM-DD HH:mm
  receiptUrl?: string;
  note?: string;
  autoParityNote?: string; // Otomatik hesaplanan parite ve kurlar açıklaması
  userCustomNote?: string; // Kullanıcının isteğe bağlı yazdığı özel açıklama
  parityRate?: number; // Parite değeri (örn: 133.74)
  isRecurring?: boolean;
  metalGram?: number;
}

export interface FirmPricePoint {
  timestamp: string;
  timeLabel: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'gider' | 'gelir';
  budgetLimit?: number;
}

export interface UpcomingPayment {
  id: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  dueDate: string;
  type: 'gider' | 'gelir';
  category: string;
  accountName: string;
  status: 'pending' | 'completed';
  period: 'monthly' | 'yearly' | 'once';
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'kisi' | 'isletme';
  balance: number; // Alacak (+) veya Borç (-)
  avatar?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'alert' | 'budget' | 'price' | 'system';
}

export interface BudgetPlan {
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  spent: number;
  color: string;
}
