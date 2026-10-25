import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Transaction } from '../types';

interface TransactionsFeedProps {
  onOpenPdfExport: () => void;
}

export const TransactionsFeed: React.FC<TransactionsFeedProps> = ({ onOpenPdfExport }) => {
  const { transactions, deleteTransaction, accounts } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gider' | 'gelir' | 'transfer'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase()) ||
        t.accountName.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (filterType === 'all') return true;
      if (filterType === 'gider') return t.type === 'gider' || t.type === 'odeme';
      if (filterType === 'gelir') return t.type === 'gelir' || t.type === 'tahsilat';
      if (filterType === 'transfer') return t.type === 'transfer';
      return true;
    });
  }, [transactions, search, filterType]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: { [date: string]: Transaction[] } = {};
    filteredTransactions.forEach(t => {
      const d = t.date.substring(0, 10);
      if (!groups[d]) groups[d] = [];
      groups[d].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  return (
    <div className="px-3 py-2 space-y-3 pb-24">
      {/* Search & Filter Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="İşlemlerde ara (Market, Nakit, Kredi...)"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
            />
          </div>
          <button
            onClick={onOpenPdfExport}
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-100 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 transition-colors"
            title="PDF Ekstre İndir"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex items-center gap-1 pt-1 overflow-x-auto no-scrollbar">
          {(['all', 'gider', 'gelir', 'transfer'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterType === type
                  ? type === 'gider'
                    ? 'bg-red-600 text-white shadow-xs'
                    : type === 'gelir'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : type === 'transfer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {type === 'all' ? 'Tümü' : type.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Feed list */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Arama kriterine uygun işlem bulunamadı.
        </div>
      ) : (
        Object.entries(groupedTransactions).map(([dateStr, items]) => (
          <div key={dateStr} className="space-y-1.5">
            <div className="flex items-center justify-between px-2 pt-1">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider">
                {dateStr}
              </span>
              <span className="text-[10px] text-slate-400">
                {items.length} İşlem
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
              {items.map(t => {
                const isExpense = t.type === 'gider' || t.type === 'odeme';
                const isTransfer = t.type === 'transfer';
                return (
                  <div
                    key={t.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-md ${
                            isExpense
                              ? 'bg-red-100 dark:bg-red-950 text-red-600'
                              : isTransfer
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          }`}
                        >
                          {t.type}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {t.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {t.date.slice(11, 16)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
                        {t.accountName} {t.toAccountName ? `→ ${t.toAccountName}` : ''}
                      </div>
                      {t.userCustomNote && (
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {t.userCustomNote}
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {t.description}
                      </div>
                      {t.autoParityNote && (
                        <div className="mt-1 p-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md text-[10px] text-amber-800 dark:text-amber-300 font-mono break-all">
                          ⚡ {t.autoParityNote}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <div
                          className={`text-sm font-extrabold tabular-nums ${
                            isExpense
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-slate-900 dark:text-emerald-400'
                          }`}
                        >
                          {isExpense ? '' : '+'}
                          {t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                          <span className="text-xs font-bold">{t.currency === 'TRY' ? '₺' : t.currency}</span>
                        </div>
                        {t.metalGram && (
                          <div className="text-[10px] font-bold text-amber-600">
                            {t.metalGram} gr
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="p-1 rounded-md text-slate-300 hover:text-red-500 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
