import React, { useState, useMemo } from 'react';
import { X, ArrowRightLeft, Sparkles, Check, TrendingUp, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Account } from '../types';

interface InvestmentTransferModalProps {
  onClose: () => void;
  defaultFromAccountId?: string;
}

export const InvestmentTransferModal: React.FC<InvestmentTransferModalProps> = ({
  onClose,
  defaultFromAccountId
}) => {
  const { accounts, marketRates, transferBetweenInvestmentAccounts } = useApp();

  // Investment and foreign currency accounts (birikim type or foreign currency accounts)
  const investmentAccounts = accounts.filter(
    a => a.type === 'birikim' || a.currency !== 'TRY' || a.category?.includes('Yatırım')
  );

  const fallbackAccounts = investmentAccounts.length >= 2 ? investmentAccounts : accounts;

  const [fromAccountId, setFromAccountId] = useState<string>(
    defaultFromAccountId || fallbackAccounts[0]?.id || ''
  );

  const [toAccountId, setToAccountId] = useState<string>(
    fallbackAccounts.find(a => a.id !== fromAccountId)?.id || fallbackAccounts[1]?.id || ''
  );

  const [sourceAmount, setSourceAmount] = useState<string>('10');
  const [customDescription, setCustomDescription] = useState<string>('');

  const fromAcc = accounts.find(a => a.id === fromAccountId);
  const toAcc = accounts.find(a => a.id === toAccountId);

  // Calculate live market rates for both currencies
  const fromRateObj = marketRates.find(r => r.code === fromAcc?.currency);
  const toRateObj = marketRates.find(r => r.code === toAcc?.currency);

  const fromRateTRY = fromAcc?.currency === 'TRY' ? 1 : (fromRateObj?.sellPrice || 1);
  const toRateTRY = toAcc?.currency === 'TRY' ? 1 : (toRateObj?.buyPrice || toRateObj?.sellPrice || 1);

  // Parity: 1 unit of fromCurrency = (fromRateTRY / toRateTRY) units of toCurrency
  const parity = fromRateTRY / toRateTRY;

  const parsedSourceAmount = parseFloat(sourceAmount.replace(/,/g, '.')) || 0;
  const targetReceivedAmount = Number((parsedSourceAmount * parity).toFixed(toAcc?.currency === 'TRY' ? 2 : 4));

  // Auto generated explanation (as requested: "güncel kurları ve parite değerlerini açıklamaya otomatik ekle")
  const autoExplanation = useMemo(() => {
    if (!fromAcc || !toAcc) return '';
    return `[Parite: 1 ${fromAcc.currency} = ${parity.toFixed(4)} ${toAcc.currency} | Güncel Kurlar: 1 ${fromAcc.currency} = ₺${fromRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}, 1 ${toAcc.currency} = ₺${toRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}]`;
  }, [fromAcc, toAcc, parity, fromRateTRY, toRateTRY]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAcc || !toAcc || parsedSourceAmount <= 0) return;

    transferBetweenInvestmentAccounts({
      fromAccountId,
      toAccountId,
      sourceAmount: parsedSourceAmount,
      customDescription: customDescription.trim() || undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                PARİTE İLE YATIRIM TRANSFERİ
              </h3>
              <p className="text-[10px] text-slate-500">
                Altın, Döviz ve Emtia Hesapları Arası Çapraz Kur
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {/* From & To Account Selectors */}
          <div className="space-y-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Çıkış Yapılacak Yatırım Hesabı (Kaynak):
              </label>
              <select
                value={fromAccountId}
                onChange={e => setFromAccountId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                {fallbackAccounts.map(a => (
                  <option key={a.id} value={a.id} disabled={a.id === toAccountId}>
                    {a.name} ({a.currency === 'XAU' ? `${a.gramWeight || 0} gr Altın` : `${a.balance.toLocaleString('tr-TR')} ${a.currency}`})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-1">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300 dark:border-amber-700 shadow-2xs">
                <ArrowRightLeft className="w-3.5 h-3.5 rotate-90" />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Giriş Yapılacak Yatırım Hesabı (Hedef):
              </label>
              <select
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              >
                {fallbackAccounts.map(a => (
                  <option key={a.id} value={a.id} disabled={a.id === fromAccountId}>
                    {a.name} ({a.currency === 'XAU' ? `${a.gramWeight || 0} gr Altın` : `${a.balance.toLocaleString('tr-TR')} ${a.currency}`})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Transfer Edilecek Miktar ({fromAcc?.unitLabel || fromAcc?.currency}):
              </label>
              <span className="text-[10px] text-slate-400">
                Mevcut: {fromAcc?.currency === 'XAU' ? `${fromAcc?.gramWeight || 0} gr` : `${fromAcc?.balance.toLocaleString('tr-TR')} ${fromAcc?.currency}`}
              </span>
            </div>
            <input
              type="number"
              step="any"
              required
              value={sourceAmount}
              onChange={e => setSourceAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden tabular-nums"
            />
          </div>

          {/* Real-time Parity & Conversion Preview Card */}
          <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>CANLI PİYASA PARİTESİ</span>
              </span>
              <span className="text-[10px] bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-extrabold px-1.5 py-0.5 rounded-md tabular-nums">
                1 {fromAcc?.currency} = {parity.toFixed(4)} {toAcc?.currency}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-100 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold uppercase">1 {fromAcc?.currency} KURU</span>
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                  ₺{fromRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-amber-100 dark:border-slate-700">
                <span className="text-[9px] text-slate-400 block font-semibold uppercase">1 {toAcc?.currency} KURU</span>
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                  ₺{toRateTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Target Receives */}
            <div className="mt-1 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-400/40 flex items-center justify-between">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-xs">
                Hedef Hesaba Geçecek:
              </span>
              <div className="text-sm font-black text-amber-950 dark:text-amber-100 tabular-nums">
                +{targetReceivedAmount.toLocaleString('tr-TR', { minimumFractionDigits: toAcc?.currency === 'TRY' ? 2 : 4 })} {toAcc?.unitLabel || toAcc?.currency}
              </div>
            </div>
          </div>

          {/* Dual Explanation Section (Required by user) */}
          <div className="space-y-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Kendi Açıklamanız (İsteğe Bağlı):
              </label>
              <input
                type="text"
                placeholder="Örn: Portföy dengeleme, döviz artışı vb."
                value={customDescription}
                onChange={e => setCustomDescription(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
              />
            </div>

            {/* Auto Generated Explanation Preview */}
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                <Info className="w-3 h-3" />
                <span>Otomatik Eklenecek Parite Açıklaması (Ayrı Görüntülenecektir):</span>
              </div>
              <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-750">
                {autoExplanation}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>PARİTE TRANSFERİNİ GERÇEKLEŞTİR</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
