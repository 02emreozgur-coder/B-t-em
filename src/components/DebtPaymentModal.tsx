import React, { useState } from 'react';
import { X, Check, Landmark, Building2, User, Store, AlertCircle, ArrowDownCircle, Wallet, Calendar, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Account } from '../types';

interface DebtPaymentModalProps {
  debtAccount: Account;
  onClose: () => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({ debtAccount, onClose }) => {
  const { accounts, payDebtAccount, marketRates } = useApp();

  // All eligible source accounts (Nakit and Banka accounts that are not archived)
  const sourceAccounts = accounts.filter(
    a => a.id !== debtAccount.id && !a.isArchived && (a.type === 'nakit' || a.type === 'banka')
  );

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    sourceAccounts.find(a => a.balance > 0)?.id || sourceAccounts[0]?.id || ''
  );

  // Total debt in TRY
  const xauRate = marketRates.find(r => r.code === 'XAU')?.sellPrice || 6640;
  const totalDebtTRY = debtAccount.currency === 'XAU'
    ? Math.abs(debtAccount.gramWeight || 0) * xauRate
    : Math.abs(debtAccount.balance);

  // Monthly installment estimate with exact 2-decimal precision
  const installmentEstimate = debtAccount.installmentAmount
    ? debtAccount.installmentAmount
    : (debtAccount.totalInstallments && debtAccount.remainingInstallments && debtAccount.remainingInstallments > 0
      ? Number((totalDebtTRY / debtAccount.remainingInstallments).toFixed(2))
      : (debtAccount.id === 'borc-gizem-kyk' ? 470 : debtAccount.id === 'borc-is-bankasi-kredi' ? 36910.59 : null));

  const [paymentMode, setPaymentMode] = useState<'taksit' | 'tam' | 'ozel'>(
    installmentEstimate ? 'taksit' : 'tam'
  );

  const [customAmount, setCustomAmount] = useState<string>(
    installmentEstimate ? installmentEstimate.toFixed(2) : totalDebtTRY.toFixed(2)
  );

  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const [customNote, setCustomNote] = useState<string>('');

  const selectedSourceAccount = accounts.find(a => a.id === selectedSourceId);

  // Active payment amount
  const parsedAmount = parseFloat(customAmount.replace(/,/g, '.')) || 0;
  const activePaymentAmount = paymentMode === 'tam'
    ? Number(totalDebtTRY.toFixed(2))
    : paymentMode === 'taksit' && installmentEstimate
    ? Number(installmentEstimate.toFixed(2))
    : Number(parsedAmount.toFixed(2));

  // Projected balances after payment
  const projectedRemainingDebt = Math.max(0, Number((totalDebtTRY - activePaymentAmount).toFixed(2)));
  const projectedRemainingInstallments = debtAccount.remainingInstallments !== undefined && debtAccount.remainingInstallments > 0
    ? (activePaymentAmount >= totalDebtTRY ? 0 : Math.max(0, debtAccount.remainingInstallments - 1))
    : undefined;
  const projectedSourceBalance = selectedSourceAccount
    ? Number((selectedSourceAccount.balance - activePaymentAmount).toFixed(2))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentAmount || activePaymentAmount <= 0) return;

    payDebtAccount({
      debtAccountId: debtAccount.id,
      sourceAccountId: selectedSourceId,
      amountTRY: activePaymentAmount,
      date: paymentDate,
      customNote: customNote.trim() || undefined
    });

    onClose();
  };

  const getInstitutionBadge = () => {
    switch (debtAccount.institutionType) {
      case 'resmi':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
            <Landmark className="w-3 h-3 text-amber-600" />
            <span>Resmi Kuruluş (Kamu / Devlet)</span>
          </span>
        );
      case 'ozel':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-800">
            <Building2 className="w-3 h-3 text-blue-600" />
            <span>Özel Finans / Banka Kredisi</span>
          </span>
        );
      case 'ticari':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-800">
            <Store className="w-3 h-3 text-purple-600" />
            <span>Ticari İşletme / Esnaf</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-800">
            <User className="w-3 h-3 text-rose-600" />
            <span>Şahıs Borcu (Bireysel)</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-red-600 dark:text-red-400">
                BORÇ / KREDİ ÖDEME
              </h3>
              <p className="text-[10px] text-slate-500">
                {debtAccount.name}
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

        {/* Debt Target Card */}
        <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              ÖDENECEK KURUM / HESAP
            </span>
            {getInstitutionBadge()}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                {debtAccount.institutionName || debtAccount.name}
              </div>
              {debtAccount.dueDate && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Vade: <span className="font-semibold text-slate-700 dark:text-slate-300">{debtAccount.dueDate}</span>
                  {debtAccount.remainingInstallments !== undefined && (
                    <span className="ml-1.5 font-bold text-red-600 dark:text-red-400">
                      ({debtAccount.remainingInstallments}{debtAccount.totalInstallments ? `/${debtAccount.totalInstallments}` : ''} Taksit Kaldı)
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase block">
                KALAN TOPLAM BORÇ
              </span>
              <div className="text-lg font-black text-red-600 dark:text-red-400 tabular-nums">
                -₺{totalDebtTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {debtAccount.currency === 'XAU' && (
                <span className="text-[10px] text-slate-400 tabular-nums block">
                  ({Math.abs(debtAccount.gramWeight || 0)} gr Altın)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs overflow-y-auto">
          {/* Source Account Selection */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ödemenin Yapılacağı Kaynak Hesap:
            </label>
            <select
              value={selectedSourceId}
              onChange={e => setSelectedSourceId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            >
              {sourceAccounts.length === 0 ? (
                <option value="">Kullanılabilir banka/nakit hesabı bulunamadı</option>
              ) : (
                sourceAccounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} — Bakiye: ₺{a.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </option>
                ))
              )}
            </select>
            {selectedSourceAccount && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Mevcut Bakiye: <strong className={selectedSourceAccount.balance >= activePaymentAmount ? 'text-emerald-600' : 'text-amber-600'}>₺{selectedSourceAccount.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></span>
                <span>Ödeme Sonrası: <strong className={projectedSourceBalance >= 0 ? 'text-slate-700 dark:text-slate-300' : 'text-red-500'}>₺{projectedSourceBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong></span>
              </div>
            )}
          </div>

          {/* Payment Amount Preset Buttons */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Ödeme Tutarı Seçeneği:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {installmentEstimate && (
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMode('taksit');
                    setCustomAmount(installmentEstimate.toFixed(2));
                  }}
                  className={`p-2.5 rounded-xl text-center border font-bold text-xs transition-all ${
                    paymentMode === 'taksit'
                      ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block text-[9px] uppercase opacity-80">1 Taksit Öde</span>
                  <span className="tabular-nums font-black text-xs">
                    ₺{installmentEstimate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setPaymentMode('tam');
                  setCustomAmount(totalDebtTRY.toFixed(2));
                }}
                className={`p-2.5 rounded-xl text-center border font-bold text-xs transition-all ${
                  paymentMode === 'tam'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-[9px] uppercase opacity-80">Tamamını Kapat</span>
                <span className="tabular-nums font-black text-xs">
                  ₺{totalDebtTRY.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('ozel')}
                className={`p-2.5 rounded-xl text-center border font-bold text-xs transition-all ${
                  paymentMode === 'ozel'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400/30'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="block text-[9px] uppercase opacity-80">Özel Tutar</span>
                <span className="font-semibold text-xs">Manuel</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Ödenecek Tutar (₺):
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={customAmount}
              onChange={e => {
                setCustomAmount(e.target.value);
                setPaymentMode('ozel');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xl font-black text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden tabular-nums"
            />
          </div>

          {/* Live Impact Preview Card */}
          <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-2xl border border-red-200/60 dark:border-red-900/40 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
              <span>İşlem Özeti:</span>
              <span className="text-red-600 dark:text-red-400">₺{activePaymentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} Düşülecek</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-red-100 dark:border-red-900/30 text-[11px]">
              <div>
                <span className="text-slate-400 block text-[10px]">Ödeme Sonrası Borç:</span>
                <span className="font-extrabold text-red-600 dark:text-red-400 tabular-nums">
                  -₺{projectedRemainingDebt.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {projectedRemainingInstallments !== undefined && (
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Kalan Taksit:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {projectedRemainingInstallments}{debtAccount.totalInstallments ? `/${debtAccount.totalInstallments}` : ''} Taksit
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Ödeme Tarihi:
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                İsteğe Bağlı Not:
              </label>
              <input
                type="text"
                placeholder="Örn: Ekim taksiti"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={activePaymentAmount <= 0}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>BORÇ ÖDEMESİNİ ONAYLA (₺{activePaymentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
