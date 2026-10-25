import React from 'react';
import { X, Bell, CheckCheck, TrendingUp, AlertTriangle, Calendar, Shield, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NotificationsModalProps {
  onClose: () => void;
  onOpenInvestmentHub: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  onClose,
  onOpenInvestmentHub
}) => {
  const { notifications, markAllNotificationsRead, dismissNotification } = useApp();

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'price':
        return <TrendingUp className="w-4 h-4 text-amber-500" />;
      case 'budget':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'alert':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      default:
        return <Shield className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[80vh] bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                ANLIK BİLDİRİMLER
              </h3>
              <p className="text-[11px] text-slate-500">
                Piyasa hareketleri, bütçe limitleri ve ödeme alarmları
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

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Yeni bildiriminiz bulunmuyor.
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-2xl border transition-all ${
                  !n.isRead
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 shadow-xs'
                    : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getNotifIcon(n.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {n.timestamp}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title="Kaldır"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {n.type === 'price' && (
                  <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex justify-end">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenInvestmentHub();
                      }}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline"
                    >
                      Piyasayı İncele & Al/Sat Yap →
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Button: Mark all as read */}
        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={markAllNotificationsRead}
              className="w-full py-2.5 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Tümünü okundu olarak işaretle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
