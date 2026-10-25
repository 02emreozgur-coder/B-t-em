import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Cloud,
  Moon,
  Sun,
  Crown,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  FileText,
  Lock,
  Globe,
  Bell,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface SettingsModalProps {
  onClose: () => void;
  onOpenPdfExport: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenPdfExport }) => {
  const {
    isDarkMode,
    toggleDarkMode,
    faceIdEnabled,
    setFaceIdEnabled,
    cloudBackup,
    triggerCloudBackup,
    restoreFromCloud,
    exportBackupJson,
    importBackupJson,
    viewMode,
    setViewMode,
    resetAllData,
    audioAlertsEnabled,
    toggleAudioAlerts,
    testAudioAlert,
    addNotification
  } = useApp();

  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmButtonColor: 'red' | 'blue';
    actionType: 'restore' | 'reset_all';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmButtonColor: 'red',
    actionType: 'reset_all'
  });

  const handleBackupNow = async () => {
    const success = await triggerCloudBackup();
    if (success) {
      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    }
  };

  const handleRestoreNow = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Buluttan Yedek Geri Yükle',
      message: 'Buluttaki en son yedeği geri yüklemek istediğinize emin misiniz? Mevcut verileriniz yedek içeriğiyle güncellenecektir.',
      confirmText: 'Yedekten Geri Yükle',
      confirmButtonColor: 'blue',
      actionType: 'restore'
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
        addNotification('Yedek Yüklendi ✅', 'Yedek dosyası başarıyla içe aktarıldı!', 'system');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md h-[92vh] bg-slate-50 dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Ayarlar</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Section 1: Kullanıcı Bilgileri (Matching Video 05:09) */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              KULLANICI BİLGİLERİ
            </h4>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">İsim</span>
                <span className="font-bold text-slate-900 dark:text-white">Emre Özgür</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Cep no</span>
                <span className="font-bold text-slate-900 dark:text-white">+905395661898</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Email</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">02emreozgur@gmail.com</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Parola</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 cursor-pointer">Değiştir</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Time Zone</span>
                <span className="font-bold text-slate-900 dark:text-white">00:00 (GMT+3)</span>
              </div>
            </div>
          </div>

          {/* Section 2: Abonelik */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                <Crown className="w-4 h-4 fill-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900 dark:text-white">PRO Abonelik</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">16 Mayıs 2027 tarihine kadar aktif</div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
              AKTİF
            </span>
          </div>

          {/* Section 3: Güvenlik & Yüz Tanıma (Face ID) */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              GÜVENLİK & GİRİŞ SEÇENEKLERİ
            </h4>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Yüz Tanıma (Face ID) ile Giriş
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Uygulama açılışında biyometrik yüz doğrulaması iste
                    </div>
                  </div>
                </div>

                {/* Face ID Toggle */}
                <button
                  onClick={() => setFaceIdEnabled(!faceIdEnabled)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    faceIdEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                <span>PIN Kodu Koruması:</span>
                <span className="text-emerald-600 font-bold">Aktif (1234)</span>
              </div>
            </div>
          </div>

          {/* Section 4: Bulut Yedekleme (Cloud Backup & Restore) */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              BULUT YEDEKLEME & VERİ KORUMA
            </h4>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      Otomatik Bulut Yedekleme
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Son yedek: {cloudBackup.lastBackup || 'Henüz alınmadı'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleBackupNow}
                  disabled={cloudBackup.isSyncing}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cloudBackup.isSyncing ? 'animate-spin' : ''}`} />
                  <span>{cloudBackup.isSyncing ? 'Yedekleniyor' : 'Yedekle'}</span>
                </button>
              </div>

              {backupSuccess && (
                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Tüm portföy, metal ve işlem verileriniz buluta başarıyla yedeklendi!</span>
                </div>
              )}

              {restoreSuccess && (
                <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Yedek başarıyla geri yüklendi!</span>
                </div>
              )}

              {/* Action Buttons: JSON Export, Restore */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={exportBackupJson}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON Dışa Aktar</span>
                </button>

                <button
                  onClick={handleRestoreNow}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Buluttan Yükle</span>
                </button>
              </div>

              {/* Hidden File input for JSON import */}
              <label className="block text-center text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer pt-1">
                <span>Cihazdan JSON Dosyası Yükle</span>
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>

              {/* Verileri Sıfırla button in settings */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Tüm Verileri Sıfırla (Fabrika Ayarları)',
                      message: 'DİKKAT: Tüm hesap hareketleri, kurlar, bütçe planları ve işlemler tamamen sıfırlanıp fabrika ayarlarına döndürülecektir. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
                      confirmText: 'Tüm Verileri Sıfırla',
                      confirmButtonColor: 'red',
                      actionType: 'reset_all'
                    });
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 font-bold text-xs border border-red-200 dark:border-red-900/40 hover:bg-red-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Tüm Verileri Sıfırla (Fabrika Ayarlarına Dön)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Görünüm & Ses & Cihaz Ayarları */}
          <div className="space-y-1">
            <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
              GÖRÜNÜM & SESLİ BİLDİRİM AYARLARI
            </h4>
            <div className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
              {/* Arbitrage Audio toggle */}
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Arbitraj Sesli Bildirimi</div>
                  <div className="text-[11px] text-slate-500">Kuyumcu & döviz arbitraj farkında ses çal</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={testAudioAlert}
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Test Et
                  </button>
                  <button
                    onClick={toggleAudioAlerts}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                      audioAlertsEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>
              </div>

              {/* Dark mode switch */}
              <div className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 rounded-xl">
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">Gece Modu (Dark Mode)</div>
                    <div className="text-[11px] text-slate-500">Göz yorgunluğunu azaltan koyu tema</div>
                  </div>
                </div>

                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isDarkMode ? 'bg-emerald-600 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              {/* iPhone Frame vs Full-screen responsive */}
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">Görünüm Çerçevesi</div>
                  <div className="text-[11px] text-slate-500">Masaüstünde iPhone 16 Pro çerçevesi göster</div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg font-bold">
                  <button
                    onClick={() => setViewMode('iphone_frame')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'iphone_frame' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    iPhone
                  </button>
                  <button
                    onClick={() => setViewMode('responsive')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      viewMode === 'responsive' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-400'
                    }`}
                  >
                    Geniş
                  </button>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between p-3.5">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Tercih Edilen Dil</span>
                <span className="font-bold text-slate-900 dark:text-white">Türkçe (TR)</span>
              </div>
            </div>
          </div>

          {/* Section 6: PDF Rapor ve Ekstre Dışa Aktarma */}
          <div className="pt-2">
            <button
              onClick={() => {
                onClose();
                onOpenPdfExport();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Tüm Hesap Ekstresini PDF Olarak İndir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings In-App Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  confirmDialog.confirmButtonColor === 'red'
                    ? 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
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
                  if (confirmDialog.actionType === 'reset_all') {
                    resetAllData();
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  } else if (confirmDialog.actionType === 'restore') {
                    const ok = restoreFromCloud();
                    if (ok) {
                      setRestoreSuccess(true);
                      setTimeout(() => setRestoreSuccess(false), 3000);
                      addNotification('Yedek Geri Yüklendi ✅', 'Buluttaki yedek başarıyla yüklendi.', 'system');
                    } else {
                      addNotification('Yedek Bulunamadı', 'Henüz bulutta kayıtlı yedek bulunamadı. Lütfen önce "Şimdi Yedekle" butonunu kullanın.', 'system');
                    }
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }
                }}
                className={`flex-1 py-2.5 px-3 rounded-xl text-white text-xs font-bold transition-all shadow-md active:scale-95 ${
                  confirmDialog.confirmButtonColor === 'red'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
