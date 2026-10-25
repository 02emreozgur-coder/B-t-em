import React, { useState } from 'react';
import { X, Calendar, Check, AlertCircle, Plus, Clock, Home, CreditCard, Briefcase } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UpcomingPayment } from '../types';

interface UpcomingPaymentsModalProps {
  onClose: () => void;
}

export const UpcomingPaymentsModal: React.FC<UpcomingPaymentsModalProps> = ({ onClose }) => {
  const { upcomingPayments, addNotification } = useApp();
  const [payments, setPayments] = useState<UpcomingPayment[]>(upcomingPayments);

  const handleMarkPaid = (id: string) => {
    setPayments(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'completed' ? 'pending' : 'completed';
          if (nextStatus === 'completed') {
            addNotification('Ödeme Tamamlandı', `${p.title} ödendi olarak işaretlendi.`, 'alert');
          }
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[80vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                YAKLAŞAN İŞLEMLER
              </h3>
              <p className="text-[11px] text-slate-500">
                Planlı taksitler, faturalar ve düzenli gelirler
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

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {payments.map(p => {
            const isCompleted = p.status === 'completed';
            const isExpense = p.type === 'gider';
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isCompleted
                    ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <button
                    onClick={() => handleMarkPaid(p.id)}
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5" />}
                  </button>

                  <div className="min-w-0">
                    <h4 className={`font-bold text-xs truncate ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                      {p.title}
                    </h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {p.dueDate}
                      </span>
                      <span>· {p.accountName}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`font-extrabold text-sm tabular-nums ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>
                    {isExpense ? '-' : '+'}₺{p.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Aylık Tekrar</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
