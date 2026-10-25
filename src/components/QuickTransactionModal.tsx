import React, { useState } from 'react';
import { X, Check, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';

interface QuickTransactionModalProps {
  type: 'gelir' | 'gider';
  onClose: () => void;
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({ type, onClose }) => {
  const { accounts, categories, addTransaction } = useApp();

  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    type === 'gider' ? 'Yemek / Market' : 'Maaş'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(/,/g, '.'));
    if (!val || val <= 0) return;

    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!acc) return;

    addTransaction({
      accountId: selectedAccountId,
      accountName: acc.name,
      type: type,
      amount: type === 'gider' ? -val : val,
      currency: acc.currency,
      category: selectedCategory,
      description: description.trim() || `${selectedCategory} işlemi`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    });

    onClose();
  };

  const isExpense = type === 'gider';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className={`font-bold text-sm ${isExpense ? 'text-red-600' : 'text-emerald-600'}`}>
            HIZLI {type.toUpperCase()} KAYDI
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Amount Box */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tutar (TL)</label>
            <input
              type="number"
              step="any"
              required
              autoFocus
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2.5 text-xl font-extrabold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden tabular-nums"
            />
          </div>

          {/* Account Selector */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Hesap</label>
            <select
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.balance.toLocaleString('tr-TR')} {a.currency === 'TRY' ? '₺' : a.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Kategori</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            >
              {categories.filter(c => c.type === type).map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Açıklama</label>
            <input
              type="text"
              placeholder="İşlem açıklaması..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all mt-4 ${
              isExpense ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
};
