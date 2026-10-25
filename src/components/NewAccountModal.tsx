import React, { useState, useMemo } from 'react';
import { X, Wallet, Building2, CreditCard, Coins, Scale, Check, Zap, Calendar, Landmark, FileText, Percent } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccountType, CurrencyCode } from '../types';

interface NewAccountModalProps {
  onClose: () => void;
  initialAccountType?: AccountType;
  initialParentAccountId?: string;
  initialIsSupplementary?: boolean;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({
  onClose,
  initialAccountType = 'birikim',
  initialParentAccountId,
  initialIsSupplementary = false
}) => {
  const { addAccount, accounts, marketRates } = useApp();

  const [name, setName] = useState(initialIsSupplementary ? 'Ek Kart' : '');
  const [description, setDescription] = useState('');
  const [accountType, setAccountType] = useState<AccountType>(initialAccountType);

  // Kredi Kartı & Finansman Sub-Type
  const [creditCardSubType, setCreditCardSubType] = useState<'standart' | 'avans_hesap' | 'taksitli_avans' | 'kredi'>('standart');

  // Standart Kredi Kartı & Ek Kart
  const [isSupplementary, setIsSupplementary] = useState<boolean>(initialIsSupplementary);
  const [parentAccountId, setParentAccountId] = useState<string>(
    initialParentAccountId || accounts.find(a => a.type === 'kredi_karti' && !a.isSupplementary)?.id || ''
  );
  const [supplementaryHolder, setSupplementaryHolder] = useState<string>('');
  const [cardLast4, setCardLast4] = useState<string>('');
  const [cardCutoffDay, setCardCutoffDay] = useState<string>('15');
  const [cardPaymentDueDay, setCardPaymentDueDay] = useState<string>('25');
  const [limit, setLimit] = useState<string>(initialIsSupplementary ? '30000' : '50000');
  const [currentDebt, setCurrentDebt] = useState<string>('0');

  // Avans Hesap (KMH / Artı Para)
  const [overdraftLimit, setOverdraftLimit] = useState<string>('40000');
  const [overdraftUsed, setOverdraftUsed] = useState<string>('0');
  const [overdraftInterest, setOverdraftInterest] = useState<string>('5.00'); // %5 aylık akdi faiz
  const [interestAccrualDay, setInterestAccrualDay] = useState<string>('30');
  const [linkedBankName, setLinkedBankName] = useState<string>('İş Bankası');

  // Taksitli Nakit Avans
  const [taksitliTutar, setTaksitliTutar] = useState<string>('24000');
  const [taksitVade, setTaksitVade] = useState<string>('6'); // 6 ay
  const [kalanTaksit, setKalanTaksit] = useState<string>('6');
  const [taksitFaizOrani, setTaksitFaizOrani] = useState<string>('4.50'); // %4.5 aylık
  const [linkedCreditCardId, setLinkedCreditCardId] = useState<string>(
    accounts.find(a => a.type === 'kredi_karti')?.id || ''
  );

  // Banka Kredisi (İhtiyaç, Konut, Taşıt)
  const [loanType, setLoanType] = useState<'ihtiyac' | 'konut' | 'tasit' | 'ticari'>('ihtiyac');
  const [krediAnaPara, setKrediAnaPara] = useState<string>('120000');
  const [krediKalanBorc, setKrediKalanBorc] = useState<string>('95000');
  const [krediToplamVade, setKrediToplamVade] = useState<string>('24');
  const [krediKalanVade, setKrediKalanVade] = useState<string>('19');
  const [krediFaizOrani, setKrediFaizOrani] = useState<string>('3.79');
  const [krediAylikTaksit, setKrediAylikTaksit] = useState<string>('7650');
  const [krediVadeGunu, setKrediVadeGunu] = useState<string>('15');

  // Currency & Metal
  const [currency, setCurrency] = useState<CurrencyCode>('XAU');
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const [gramWeight, setGramWeight] = useState<string>('0');
  const [metalPurity, setMetalPurity] = useState<string>('Has Altın 24K');

  const mainCreditCards = accounts.filter(a => a.type === 'kredi_karti' && !a.isSupplementary);

  // Auto-calculated monthly installment for Taksitli Nakit Avans
  const calculatedTaksitliAylik = useMemo(() => {
    const tutar = parseFloat(taksitliTutar) || 0;
    const vade = parseInt(taksitVade) || 1;
    const faiz = parseFloat(taksitFaizOrani) || 0;
    const toplamFaiz = tutar * (faiz / 100) * vade;
    const toplamGeriOdeme = tutar + toplamFaiz;
    return Math.round(toplamGeriOdeme / Math.max(1, vade));
  }, [taksitliTutar, taksitVade, taksitFaizOrani]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (accountType === 'kredi_karti') {
      if (creditCardSubType === 'avans_hesap') {
        const lim = parseFloat(overdraftLimit) || 40000;
        const used = parseFloat(overdraftUsed) || 0;
        addAccount({
          name: name.trim(),
          type: 'kredi_karti',
          creditCardSubType: 'avans_hesap',
          balance: -Math.abs(used),
          currency: 'TRY',
          unitLabel: '₺',
          limit: lim,
          overdraftLimit: lim,
          interestRate: parseFloat(overdraftInterest) || 5.0,
          interestAccrualDay: parseInt(interestAccrualDay) || 30,
          bankName: linkedBankName.trim() || undefined,
          note: `${description ? description + ' · ' : ''}Avans Hesap (KMH) - Faiz: %${overdraftInterest}`,
          icon: 'Landmark',
          color: '#0284c7'
        });
      } else if (creditCardSubType === 'taksitli_avans') {
        const tutar = parseFloat(taksitliTutar) || 0;
        const vade = parseInt(taksitVade) || 6;
        const kalan = parseInt(kalanTaksit) || vade;
        const linkedCard = accounts.find(a => a.id === linkedCreditCardId);
        addAccount({
          name: name.trim(),
          type: 'kredi_karti',
          creditCardSubType: 'taksitli_avans',
          balance: -Math.abs(tutar),
          currency: 'TRY',
          unitLabel: '₺',
          limit: tutar,
          installmentCount: vade,
          totalInstallments: vade,
          remainingInstallments: kalan,
          installmentAmount: calculatedTaksitliAylik,
          interestRate: parseFloat(taksitFaizOrani) || 4.5,
          linkedCardId: linkedCreditCardId,
          note: `${description ? description + ' · ' : ''}Taksitli Nakit Avans (${kalan}/${vade} Taksit) ${linkedCard ? '· ' + linkedCard.name : ''}`,
          icon: 'Calendar',
          color: '#d97706'
        });
      } else if (creditCardSubType === 'kredi') {
        const anaPara = parseFloat(krediAnaPara) || 120000;
        const kalanBorc = parseFloat(krediKalanBorc) || anaPara;
        const toplamVade = parseInt(krediToplamVade) || 24;
        const kalanVadeSayisi = parseInt(krediKalanVade) || toplamVade;
        const taksitTutar = parseFloat(krediAylikTaksit) || 0;
        addAccount({
          name: name.trim(),
          type: 'borc_alacak',
          debtDirection: 'borc',
          institutionType: 'ozel',
          creditCardSubType: 'kredi',
          balance: -Math.abs(kalanBorc),
          currency: 'TRY',
          unitLabel: '₺',
          originalLoanAmount: anaPara,
          totalInstallments: toplamVade,
          remainingInstallments: kalanVadeSayisi,
          installmentAmount: taksitTutar,
          loanType: loanType,
          interestRate: parseFloat(krediFaizOrani) || 3.79,
          dueDate: `Her Ayın ${krediVadeGunu}'i`,
          institutionName: linkedBankName || 'Banka',
          note: `${description ? description + ' · ' : ''}${loanType.toUpperCase()} Kredisi (${kalanVadeSayisi}/${toplamVade} Taksit)`,
          icon: 'Building2',
          color: '#dc2626'
        });
      } else if (isSupplementary) {
        // Ek Kart
        const parentCard = accounts.find(a => a.id === parentAccountId) || mainCreditCards[0];
        const targetParentId = parentAccountId || parentCard?.id;
        const lim = parseFloat(limit) || 25000;
        const debt = parseFloat(currentDebt) || 0;
        addAccount({
          name: name.trim(),
          type: 'kredi_karti',
          creditCardSubType: 'standart',
          balance: -Math.abs(debt),
          currency: 'TRY',
          unitLabel: '₺',
          limit: lim,
          isSupplementary: true,
          parentAccountId: targetParentId,
          supplementaryCardHolder: supplementaryHolder.trim() || undefined,
          cardLast4: cardLast4.trim() || undefined,
          cardCutoffDay: parseInt(cardCutoffDay) || undefined,
          cardPaymentDueDay: parseInt(cardPaymentDueDay) || undefined,
          note: `${parentCard ? parentCard.name + ' bağlı ek kart' : 'Ek Kart'} ${supplementaryHolder ? '(' + supplementaryHolder + ')' : ''}`,
          icon: 'CreditCard',
          color: '#f87171'
        });
      } else {
        // Standart Kredi Kartı
        const lim = parseFloat(limit) || 50000;
        const debt = parseFloat(currentDebt) || 0;
        addAccount({
          name: name.trim(),
          type: 'kredi_karti',
          creditCardSubType: 'standart',
          balance: -Math.abs(debt),
          currency: 'TRY',
          unitLabel: '₺',
          limit: lim,
          cardLast4: cardLast4.trim() || undefined,
          cardCutoffDay: parseInt(cardCutoffDay) || undefined,
          cardPaymentDueDay: parseInt(cardPaymentDueDay) || undefined,
          note: description.trim() || undefined,
          icon: 'CreditCard',
          color: '#ef4444'
        });
      }
    } else {
      // Diğer Hesap Tipleri (Nakit, Banka, Birikim, Borç/Alacak)
      const bal = parseFloat(initialBalance) || 0;
      const gWeight = currency === 'XAU' || currency === 'XAG' || currency === 'XPT' || currency === 'XPD'
        ? parseFloat(gramWeight) || undefined
        : undefined;

      addAccount({
        name: name.trim(),
        type: accountType,
        balance: accountType === 'borc_alacak' ? -Math.abs(bal) : bal,
        currency,
        unitLabel: currency === 'XAU' || currency === 'XAG' || currency === 'XPT' || currency === 'XPD' ? 'gr' : currency === 'TRY' ? '₺' : currency,
        limit: parseFloat(limit) || undefined,
        note: description.trim() || undefined,
        gramWeight: gWeight,
        metalPurity: gWeight ? metalPurity : undefined,
        icon: accountType === 'birikim' ? 'Coins' : accountType === 'banka' ? 'Building2' : accountType === 'borc_alacak' ? 'Scale' : 'Wallet'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md max-h-[92vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Yeni Hesap Ekle</h3>
            <p className="text-[10px] text-slate-500">Banka, Kredi Kartı, Avans veya Yatırım Hesabı</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto flex-1">
          {/* Main Account Type Selection Grid */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">Hesap Tipi Seçin</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'birikim', label: 'BİRİKİM (Altın, Döviz, Maden)', icon: <Coins className="w-4 h-4 text-amber-500" /> },
                { type: 'banka', label: 'BANKA (Vadesiz Hesap)', icon: <Building2 className="w-4 h-4 text-blue-500" /> },
                { type: 'kredi_karti', label: 'KREDİ KARTI & FİNANSMAN', icon: <CreditCard className="w-4 h-4 text-red-500" /> },
                { type: 'nakit', label: 'NAKİT (Cüzdan/Kasa)', icon: <Wallet className="w-4 h-4 text-emerald-500" /> },
                { type: 'borc_alacak', label: 'BORÇ / ALACAK (Kişi/Kurum)', icon: <Scale className="w-4 h-4 text-purple-500" /> },
              ].map(item => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setAccountType(item.type as AccountType)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    accountType === item.type
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100 font-bold ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Kredi Kartı Seçildiğinde: Özel Finansman Sub-Type Seçimi (User Requested) */}
          {accountType === 'kredi_karti' && (
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
              <label className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs">
                Finansman / Kart Türü
              </label>
              
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'standart', label: 'Standart Kart', desc: 'Klasik kredi veya ek kart' },
                  { id: 'avans_hesap', label: 'Avans Hesap (KMH)', desc: 'Kredili mevduat / Artı para' },
                  { id: 'taksitli_avans', label: 'Taksitli Nakit Avans', desc: 'Karttan taksitli nakit çekim' },
                  { id: 'kredi', label: 'Banka Kredisi', desc: 'İhtiyaç, konut, taşıt kredisi' }
                ].map(opt => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => {
                      setCreditCardSubType(opt.id as any);
                      if (opt.id === 'avans_hesap') setName('KMH Avans Hesabı');
                      else if (opt.id === 'taksitli_avans') setName('Taksitli Nakit Avans');
                      else if (opt.id === 'kredi') setName('İhtiyaç Kredisi');
                      else setName('Kredi Kartı');
                    }}
                    className={`p-2 rounded-xl text-left border transition-all ${
                      creditCardSubType === opt.id
                        ? 'bg-red-500 text-white border-red-500 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{opt.label}</div>
                    <div className={`text-[9px] mt-0.5 truncate ${creditCardSubType === opt.id ? 'text-red-100' : 'text-slate-400'}`}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* 1. STANDART KREDİ KARTI VEYA EK KART */}
              {creditCardSubType === 'standart' && (
                <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={isSupplementary}
                      onChange={e => {
                        setIsSupplementary(e.target.checked);
                        if (e.target.checked) setName('Ek Kart');
                      }}
                      className="rounded text-red-600 focus:ring-red-500 w-4 h-4"
                    />
                    <span className="text-xs">Bu bir Ek Kart (Mevcut karta bağlı ikincil kart)</span>
                  </label>

                  {isSupplementary && (
                    <div className="space-y-2">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                          Bağlı Olduğu Ana Kredi Kartı:
                        </label>
                        <select
                          value={parentAccountId}
                          onChange={e => setParentAccountId(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        >
                          {mainCreditCards.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.limit ? `(Limit: ₺${c.limit.toLocaleString('tr-TR')})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                          Ek Kart Sahibi Adı:
                        </label>
                        <input
                          type="text"
                          placeholder="Örn: Seda Özgür"
                          value={supplementaryHolder}
                          onChange={e => setSupplementaryHolder(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Kart Limiti (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 50000"
                        value={limit}
                        onChange={e => setLimit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Güncel Dönem Borcu (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 12500"
                        value={currentDebt}
                        onChange={e => setCurrentDebt(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Son 4 Hane:
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Örn: 4022"
                        value={cardLast4}
                        onChange={e => setCardLast4(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Hesap Kesim Günü:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={cardCutoffDay}
                        onChange={e => setCardCutoffDay(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Son Ödeme Günü:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={cardPaymentDueDay}
                        onChange={e => setCardPaymentDueDay(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. AVANS HESAP (KMH / Artı Para) */}
              {creditCardSubType === 'avans_hesap' && (
                <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                  <div className="p-2 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Vadesiz hesabınıza bağlı Kredili Mevduat / Avans Hesabı</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Avans (KMH) Limiti (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 40000"
                        value={overdraftLimit}
                        onChange={e => setOverdraftLimit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Kullanılan Tutar (Eksi Bakiye):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 8500"
                        value={overdraftUsed}
                        onChange={e => setOverdraftUsed(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-red-600 font-bold border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Aylık Akdi Faiz Oranı (%):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Örn: 5.00"
                        value={overdraftInterest}
                        onChange={e => setOverdraftInterest(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Faiz Tahakkuk Günü:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Örn: 30"
                        value={interestAccrualDay}
                        onChange={e => setInterestAccrualDay(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                      Bağlı Banka Adı:
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: İş Bankası / Garanti BBVA"
                      value={linkedBankName}
                      onChange={e => setLinkedBankName(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                </div>
              )}

              {/* 3. TAKSİTLİ NAKİT AVANS */}
              {creditCardSubType === 'taksitli_avans' && (
                <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                  <div className="p-2 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kredi kartından taksitli nakit çekim planı</span>
                    </span>
                    <span className="font-bold text-amber-700 dark:text-amber-300">
                      Taksit: ₺{calculatedTaksitliAylik.toLocaleString('tr-TR')}/ay
                    </span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                      Bağlı Olduğu Kredi Kartı:
                    </label>
                    <select
                      value={linkedCreditCardId}
                      onChange={e => setLinkedCreditCardId(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                    >
                      {mainCreditCards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Çekilen Tutar (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 24000"
                        value={taksitliTutar}
                        onChange={e => setTaksitliTutar(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Aylık Faiz Oranı (%):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Örn: 4.50"
                        value={taksitFaizOrani}
                        onChange={e => setTaksitFaizOrani(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Toplam Taksit Sayısı:
                      </label>
                      <select
                        value={taksitVade}
                        onChange={e => {
                          setTaksitVade(e.target.value);
                          setKalanTaksit(e.target.value);
                        }}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      >
                        {[3, 6, 9, 12].map(n => (
                          <option key={n} value={n}>{n} Ay Vade</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Kalan Taksit Sayısı:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={parseInt(taksitVade)}
                        value={kalanTaksit}
                        onChange={e => setKalanTaksit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 4. BANKA KREDİSİ (İhtiyaç, Konut, Taşıt) */}
              {creditCardSubType === 'kredi' && (
                <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-150">
                  <div className="p-2 bg-red-50/70 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 text-[11px] text-red-900 dark:text-red-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Bireysel Banka Kredisi ve Taksit Takip Hesabı</span>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                      Kredi Türü:
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { id: 'ihtiyac', label: 'İhtiyaç' },
                        { id: 'konut', label: 'Konut' },
                        { id: 'tasit', label: 'Taşıt' },
                        { id: 'ticari', label: 'Ticari' }
                      ].map(t => (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => {
                            setLoanType(t.id as any);
                            setName(`${t.label} Kredisi`);
                          }}
                          className={`py-1 rounded-lg text-[10px] font-bold border ${
                            loanType === t.id
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        İlk Çekilen Ana Para (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 120000"
                        value={krediAnaPara}
                        onChange={e => setKrediAnaPara(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Kalan Kredi Borcu (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 95000"
                        value={krediKalanBorc}
                        onChange={e => setKrediKalanBorc(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-red-600 font-bold border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Toplam Vade (Ay):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 24"
                        value={krediToplamVade}
                        onChange={e => setKrediToplamVade(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[11px]">
                        Kalan Taksit:
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 19"
                        value={krediKalanVade}
                        onChange={e => setKrediKalanVade(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Aylık Taksit (₺):
                      </label>
                      <input
                        type="number"
                        placeholder="Örn: 7650"
                        value={krediAylikTaksit}
                        onChange={e => setKrediAylikTaksit(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Faiz Oranı (%):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Örn: 3.79"
                        value={krediFaizOrani}
                        onChange={e => setKrediFaizOrani(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5 text-[10px]">
                        Ödeme Günü:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Örn: 15"
                        value={krediVadeGunu}
                        onChange={e => setKrediVadeGunu(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Account Name input */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hesap Adı</label>
            <input
              type="text"
              required
              placeholder="Örn: Garanti Altın Hesabı, Ziraat KMH, İş Bankası Ev Kredisi..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Açıklama / Not</label>
            <input
              type="text"
              placeholder="Örn: 24 Ayar gram altın birikimi veya maaş avans hesabı"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          {/* Currency / Metal selector (Hide for credit card, avans, kredi, supplementary) */}
          {accountType !== 'kredi_karti' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Para/Maden Birimi</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                >
                  <option value="TRY">Türk Lirası (₺)</option>
                  <option value="XAU">Altın (Gram / XAU)</option>
                  <option value="XAG">Gümüş (Gram / XAG)</option>
                  <option value="XPT">Platin (Gram / XPT)</option>
                  <option value="XPD">Paladyum (Gram / XPD)</option>
                  <option value="USD">Amerikan Doları ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">İngiliz Sterlini (£)</option>
                  <option value="CHF">İsviçre Frangı (CHF)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  {currency === 'XAU' || currency === 'XAG' || currency === 'XPT' || currency === 'XPD'
                    ? 'Gram Ağırlığı'
                    : 'Başlangıç Bakiyesi'}
                </label>
                <input
                  type="number"
                  step="any"
                  value={currency === 'XAU' || currency === 'XAG' ? gramWeight : initialBalance}
                  onChange={e => {
                    if (currency === 'XAU' || currency === 'XAG') {
                      setGramWeight(e.target.value);
                      const rate = marketRates.find(r => r.code === currency)?.sellPrice || (currency === 'XAU' ? 6646 : 96.6);
                      setInitialBalance(String((parseFloat(e.target.value) || 0) * rate));
                    } else {
                      setInitialBalance(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all mt-4"
          >
            <Check className="w-4 h-4" />
            <span>Hesabı Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
};
