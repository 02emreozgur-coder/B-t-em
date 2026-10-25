/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { RefreshCw, CheckCircle2, ChevronDown } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { IPhoneFrame } from './components/IPhoneFrame';
import { Header } from './components/Header';
import { TopOverviewCard, HomeInlineViewType } from './components/TopOverviewCard';
import { HomeInlineViews } from './components/HomeInlineViews';
import { LiveRatesTicker } from './components/LiveRatesTicker';
import { AccountGroupList } from './components/AccountGroupList';
import { TransactionsFeed } from './components/TransactionsFeed';
import { BottomNavBar } from './components/BottomNavBar';
import { AccountDetailModal } from './components/AccountDetailModal';
import { InvestmentHubModal } from './components/InvestmentHubModal';
import { ReportsModal } from './components/ReportsModal';
import { PdfExportModal } from './components/PdfExportModal';
import { FaceIdLockModal } from './components/FaceIdLockModal';
import { SidebarMenu } from './components/SidebarMenu';
import { SettingsModal } from './components/SettingsModal';
import { NotificationsModal } from './components/NotificationsModal';
import { UpcomingPaymentsModal } from './components/UpcomingPaymentsModal';
import { NewAccountModal } from './components/NewAccountModal';
import { QuickTransactionModal } from './components/QuickTransactionModal';
import { PriceHistoryModal } from './components/PriceHistoryModal';
import { KurlarArbitrajView } from './components/KurlarArbitrajView';
import { InvestmentTransferModal } from './components/InvestmentTransferModal';
import { Account, AccountType } from './types';

const MainAppContent: React.FC = () => {
  const {
    isLocked,
    faceIdEnabled,
    refreshMarketRates,
    selectedAssetForHistory,
    setSelectedAssetForHistory,
    arbitrageOpportunities
  } = useApp();

  // Navigation tab: 'hesaplar' | 'islemler' | 'yatirim'
  const [currentTab, setCurrentTab] = useState<'hesaplar' | 'islemler' | 'yatirim'>('hesaplar');

  // Home Main Section: 'hesaplar' (Hesaplarım listesi) | 'kurlar' (Tüm firmaların canlı kurları) | 'arbitraj' (Arbitraj fırsatları)
  const [homeMainSection, setHomeMainSection] = useState<'hesaplar' | 'kurlar' | 'arbitraj'>('hesaplar');

  // Inline view on home page: 'accounts' | 'upcoming' | 'category' | 'periodic' | 'general'
  const [homeInlineView, setHomeInlineView] = useState<HomeInlineViewType>('accounts');

  // Parity investment transfer modal state
  const [showParityTransferModal, setShowParityTransferModal] = useState<boolean>(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Sheets
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newAccountConfig, setNewAccountConfig] = useState<{
    isOpen: boolean;
    accountType?: AccountType;
    parentAccountId?: string;
    isSupplementary?: boolean;
  }>({ isOpen: false });
  const [showInvestmentHub, setShowInvestmentHub] = useState(false);
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);
  const [pdfAccount, setPdfAccount] = useState<Account | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [reportsConfig, setReportsConfig] = useState<{
    isOpen: boolean;
    type?: 'kategori' | 'periyodik' | 'genel' | 'butce';
    accountName?: string;
  }>({ isOpen: false });

  // Quick Income / Expense
  const [quickTransactionType, setQuickTransactionType] = useState<'gelir' | 'gider' | null>(null);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const touchStartY = useRef(0);
  const isDraggingMouse = useRef(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainScrollRef.current && mainScrollRef.current.scrollTop <= 2) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current > 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY.current;
      if (diff > 0 && mainScrollRef.current && mainScrollRef.current.scrollTop <= 2) {
        setPullY(Math.min(75, diff * 0.45));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullY >= 48 && !isRefreshing) {
      setIsRefreshing(true);
      setPullY(50);
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
        await refreshMarketRates();
        setRefreshSuccess(true);
        setTimeout(() => setRefreshSuccess(false), 2200);
      } finally {
        setIsRefreshing(false);
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
    touchStartY.current = 0;
  };

  // Mouse drag support for testing pull-to-refresh on desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mainScrollRef.current && mainScrollRef.current.scrollTop <= 2) {
      isDraggingMouse.current = true;
      touchStartY.current = e.clientY;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMouse.current && touchStartY.current > 0 && !isRefreshing) {
      const diff = e.clientY - touchStartY.current;
      if (diff > 0 && mainScrollRef.current && mainScrollRef.current.scrollTop <= 2) {
        setPullY(Math.min(75, diff * 0.45));
      }
    }
  };

  const handleMouseUp = async () => {
    if (isDraggingMouse.current) {
      isDraggingMouse.current = false;
      await handleTouchEnd();
    }
  };

  // If locked with Face ID, display Face ID lock screen
  if (isLocked && faceIdEnabled) {
    return <FaceIdLockModal />;
  }

  return (
    <IPhoneFrame>
      {/* Top Header */}
      <Header
        onOpenMenu={() => setShowMenu(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenNewAccount={() => setNewAccountConfig({ isOpen: true, accountType: 'birikim', isSupplementary: false })}
        onOpenSearch={() => setIsSearching(prev => !prev)}
      />

      {/* Quick Search bar if opened from header */}
      {isSearching && (
        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top duration-150">
          <input
            type="text"
            autoFocus
            placeholder="Hesaplarda ara (Nakit, Altın, Garanti, ING...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-hidden"
          />
        </div>
      )}

      {/* Main Viewport Content with Pull-To-Refresh */}
      <main
        ref={mainScrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-y-auto no-scrollbar relative select-none"
      >
        {/* iOS Pull to Refresh Indicator */}
        {(pullY > 0 || isRefreshing || refreshSuccess) && (
          <div
            style={{ height: `${pullY}px` }}
            className="flex items-center justify-center transition-all duration-150 overflow-hidden bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800/50"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 py-2">
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                  <span>Kurlar ve Hesaplar Güncelleniyor...</span>
                </>
              ) : refreshSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 dark:text-emerald-400">Veriler Başarıyla Yenilendi ✓</span>
                </>
              ) : (
                <>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform ${
                      pullY >= 48 ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                  <span>{pullY >= 48 ? 'Bırakın ve Yenilensin' : 'Yenilemek İçin Aşağı Çekin'}</span>
                </>
              )}
            </div>
          </div>
        )}

        {currentTab === 'hesaplar' && (
          <>
            {/* Top Overview KPI Card matching Video */}
            <TopOverviewCard
              activeInlineView={homeInlineView}
              onSelectInlineView={view => {
                setHomeMainSection('hesaplar');
                setHomeInlineView(view);
              }}
              onOpenInvestmentHub={() => setHomeMainSection('kurlar')}
            />

            {/* Live Precious Metals & Currencies Ticker Strip */}
            <LiveRatesTicker onOpenInvestmentHub={() => setHomeMainSection('kurlar')} />

            {/* Main Ana Sayfa Segment Switcher: HESAPLARIM / KURLAR & FİRMALAR / ARBİTRAJ */}
            <div className="px-3 pt-1 pb-2">
              <div className="bg-slate-200/80 dark:bg-slate-800/80 p-1 rounded-2xl flex items-center justify-between text-xs font-bold shadow-inner">
                <button
                  type="button"
                  onClick={() => setHomeMainSection('hesaplar')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    homeMainSection === 'hesaplar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>💳 Hesaplarım</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHomeMainSection('kurlar')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    homeMainSection === 'kurlar'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>📈 Kurlar & Firmalar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHomeMainSection('arbitraj')}
                  className={`flex-1 py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    homeMainSection === 'arbitraj'
                      ? 'bg-amber-500 text-white shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>⚡ Arbitraj</span>
                  {arbitrageOpportunities.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                      {arbitrageOpportunities.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* If homeMainSection is kurlar or arbitraj, render KurlarArbitrajView directly on Home */}
            {homeMainSection === 'kurlar' || homeMainSection === 'arbitraj' ? (
              <div className="px-3 pb-6">
                <KurlarArbitrajView
                  initialTab={homeMainSection === 'arbitraj' ? 'arbitraj' : 'kurlar'}
                  onOpenParityTransfer={() => setShowParityTransferModal(true)}
                  onOpenHistoryModal={rate => setSelectedAssetForHistory(rate)}
                />
              </div>
            ) : homeInlineView === 'accounts' ? (
              <AccountGroupList
                onSelectAccount={acc => setSelectedAccountForDetail(acc)}
                searchQuery={searchQuery}
                onOpenAddSupplementaryCard={parentCard =>
                  setNewAccountConfig({
                    isOpen: true,
                    accountType: 'kredi_karti',
                    isSupplementary: true,
                    parentAccountId: parentCard?.id
                  })
                }
              />
            ) : (
              <HomeInlineViews
                activeView={homeInlineView}
                onBackToAccounts={() => setHomeInlineView('accounts')}
                onOpenPdfExport={() => {
                  setPdfAccount(null);
                  setShowPdfModal(true);
                }}
              />
            )}
          </>
        )}

        {currentTab === 'islemler' && (
          <TransactionsFeed
            onOpenPdfExport={() => {
              setPdfAccount(null);
              setShowPdfModal(true);
            }}
          />
        )}

        {currentTab === 'yatirim' && (
          <div className="p-3">
            {/* Direct Investment hub rendered in tab or triggers modal */}
            <InvestmentHubModal onClose={() => setCurrentTab('hesaplar')} />
          </div>
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <BottomNavBar
        currentTab={currentTab}
        onChangeTab={tab => {
          if (tab === 'yatirim') {
            setCurrentTab('hesaplar');
            setHomeMainSection('kurlar');
          } else {
            setCurrentTab(tab);
          }
        }}
        onQuickIncome={() => setQuickTransactionType('gelir')}
        onQuickExpense={() => setQuickTransactionType('gider')}
      />

      {/* MODALS */}
      {/* 1. Account Detail Modal */}
      {selectedAccountForDetail && (
        <AccountDetailModal
          account={selectedAccountForDetail}
          onClose={() => setSelectedAccountForDetail(null)}
          onOpenPdfExport={acc => {
            setPdfAccount(acc);
            setShowPdfModal(true);
          }}
          onOpenCategoryReport={name => setReportsConfig({ isOpen: true, type: 'kategori', accountName: name })}
          onOpenPeriodicReport={name => setReportsConfig({ isOpen: true, type: 'periyodik', accountName: name })}
        />
      )}

      {/* 2. Investment & Precious Metals Hub Modal */}
      {showInvestmentHub && (
        <InvestmentHubModal onClose={() => setShowInvestmentHub(false)} />
      )}

      {/* 3. Reports Modal (Kategori Dağılımı, Periyodik Rapor, Genel Durum, Bütçe Planlama) */}
      {reportsConfig.isOpen && (
        <ReportsModal
          initialReportType={reportsConfig.type}
          filterAccountName={reportsConfig.accountName}
          onClose={() => setReportsConfig({ isOpen: false })}
          onOpenPdfExport={() => {
            setReportsConfig({ isOpen: false });
            setShowPdfModal(true);
          }}
        />
      )}

      {/* 4. PDF Statement Export Modal */}
      {showPdfModal && (
        <PdfExportModal
          account={pdfAccount}
          onClose={() => {
            setShowPdfModal(false);
            setPdfAccount(null);
          }}
        />
      )}

      {/* 5. Sidebar Menu */}
      <SidebarMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onNavigate={view => {
          if (view === 'accounts') {
            setCurrentTab('hesaplar');
            setHomeInlineView('accounts');
          } else if (view === 'transactions') {
            setCurrentTab('islemler');
          } else if (view === 'budget') {
            setReportsConfig({ isOpen: true, type: 'butce' });
          } else if (view === 'categories') {
            setCurrentTab('hesaplar');
            setHomeInlineView('category');
          } else if (view === 'contacts') {
            setCurrentTab('hesaplar');
            setHomeInlineView('accounts');
          }
        }}
        onOpenSettings={() => setShowSettings(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenInvestmentHub={() => setShowInvestmentHub(true)}
        onOpenReports={() => {
          setCurrentTab('hesaplar');
          setHomeInlineView('periodic');
        }}
        onOpenUpcoming={() => {
          setCurrentTab('hesaplar');
          setHomeInlineView('upcoming');
        }}
      />

      {/* 6. Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          onOpenPdfExport={() => {
            setShowSettings(false);
            setShowPdfModal(true);
          }}
        />
      )}

      {/* 7. Notifications Modal */}
      {showNotifications && (
        <NotificationsModal
          onClose={() => setShowNotifications(false)}
          onOpenInvestmentHub={() => {
            setShowNotifications(false);
            setShowInvestmentHub(true);
          }}
        />
      )}

      {/* 8. Upcoming Payments Modal */}
      {showUpcoming && (
        <UpcomingPaymentsModal onClose={() => setShowUpcoming(false)} />
      )}

      {/* 9. New Account Modal */}
      {newAccountConfig.isOpen && (
        <NewAccountModal
          initialAccountType={newAccountConfig.accountType}
          initialParentAccountId={newAccountConfig.parentAccountId}
          initialIsSupplementary={newAccountConfig.isSupplementary}
          onClose={() => setNewAccountConfig({ isOpen: false })}
        />
      )}

      {/* 10. Quick Income / Expense Modal */}
      {quickTransactionType && (
        <QuickTransactionModal
          type={quickTransactionType}
          onClose={() => setQuickTransactionType(null)}
        />
      )}

      {/* 11. Instant Double-Press Price History Modal */}
      {selectedAssetForHistory && (
        <PriceHistoryModal
          asset={selectedAssetForHistory}
          onClose={() => setSelectedAssetForHistory(null)}
          onOpenArbitrageWithAsset={() => {
            setSelectedAssetForHistory(null);
            setShowInvestmentHub(true);
          }}
        />
      )}

      {/* 12. Parity Investment Transfer Modal */}
      {showParityTransferModal && (
        <InvestmentTransferModal onClose={() => setShowParityTransferModal(false)} />
      )}
    </IPhoneFrame>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
