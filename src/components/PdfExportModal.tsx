import React, { useRef } from 'react';
import { X, Download, Printer, CheckCircle, FileText, Calendar, Building, Wallet } from 'lucide-react';
import { Account, Transaction } from '../types';
import { useApp } from '../context/AppContext';
import jsPDF from 'jspdf';

interface PdfExportModalProps {
  account?: Account | null;
  onClose: () => void;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({ account, onClose }) => {
  const { accounts, transactions, addNotification } = useApp();
  const printRef = useRef<HTMLDivElement>(null);

  // If specific account passed, filter for that, otherwise all accounts
  const targetAccount = account || accounts[0];
  const targetTransactions = transactions.filter(
    t => !account || t.accountId === account.id || t.toAccountId === account.id
  );

  // Generate downloadable PDF using jsPDF
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text('BUTCEM - HESAP HAREKETLERI EKSTRESI', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Musteri: Emre Ozgur | Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 14, 27);
      doc.text(`Hesap: ${targetAccount ? targetAccount.name : 'Tum Hesaplar'}`, 14, 32);

      // Summary box
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 37, 182, 18, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      const balanceStr = `Guncel Bakiye: ${targetAccount ? targetAccount.balance.toLocaleString('tr-TR') : '0'} ${targetAccount ? targetAccount.currency : 'TL'}`;
      doc.text(balanceStr, 20, 48);

      // Table Header
      let y = 65;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y - 5, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Tarih', 16, y);
      doc.text('Kategori', 45, y);
      doc.text('Aciklama', 95, y);
      doc.text('Tutar', 170, y);

      // Table Rows
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      targetTransactions.slice(0, 28).forEach((tx, idx) => {
        y += 7;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const cleanDesc = (tx.description || '').substring(0, 35);
        const cleanCat = (tx.category || '').substring(0, 22);
        const amountStr = `${tx.amount >= 0 ? '+' : ''}${tx.amount.toLocaleString('tr-TR')} ${tx.currency}`;

        doc.text(tx.date.substring(0, 10), 16, y);
        doc.text(cleanCat, 45, y);
        doc.text(cleanDesc, 95, y);
        if (tx.amount < 0) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(16, 185, 129);
        }
        doc.text(amountStr, 170, y);
        doc.setTextColor(15, 23, 42);
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Bu belge Butcem mobil portfoy yonetim sistemi tarafindan elektronik olarak uretilmistir.', 14, 288);

      doc.save(`butcem_ekstre_${new Date().toISOString().slice(0, 10)}.pdf`);

      addNotification('PDF Ekstre İndirildi', 'Hesap ekstreniz cihazınıza PDF olarak kaydedildi.', 'system');
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                PDF HESAP EKSTRESİ DIŞA AKTAR
              </h3>
              <p className="text-[11px] text-slate-500">
                Resmi banka & muhasebe standartlarında yazdırılabilir ekstre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>PDF İndir</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              title="Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Statement Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950/60">
          <div
            ref={printRef}
            className="bg-white text-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 font-sans max-w-xl mx-auto space-y-6"
          >
            {/* Statement Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-emerald-600">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xl">
                  <Wallet className="w-6 h-6" />
                  <span>BÜTÇEM</span>
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Kişisel Varlık & Yatırım Yönetim Ekstresi
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-800">Emre Özgür</div>
                <div className="text-slate-500">Müşteri No: 93855976</div>
                <div className="text-slate-400 text-[10px]">Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
              </div>
            </div>

            {/* Account Card in Statement */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">HESAP ADI</span>
                <div className="font-extrabold text-sm text-slate-800">{targetAccount.name}</div>
                <div className="text-slate-500 text-[11px]">{targetAccount.bankName || targetAccount.category || 'Vadesiz Portföy'}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">GÜNCEL BAKİYE</span>
                <div className="font-extrabold text-lg text-emerald-700 tabular-nums">
                  {targetAccount.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {targetAccount.currency === 'TRY' ? '₺' : targetAccount.currency}
                </div>
                {targetAccount.gramWeight && (
                  <div className="text-amber-600 font-bold text-xs">{targetAccount.gramWeight} gr {targetAccount.metalPurity}</div>
                )}
              </div>
            </div>

            {/* Transaction Records Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                HESAP HAREKETLERİ LİSTESİ ({targetTransactions.length} Kayıt)
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tarih</th>
                      <th className="py-2.5 px-2">Kategori</th>
                      <th className="py-2.5 px-2">Açıklama</th>
                      <th className="py-2.5 px-3 text-right">Tutar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 tabular-nums">
                    {targetTransactions.map(t => {
                      const isNeg = t.amount < 0 || t.type === 'gider' || t.type === 'odeme';
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-slate-600 whitespace-nowrap">
                            {t.date.substring(0, 10)}
                          </td>
                          <td className="py-2 px-2 font-bold text-slate-800">
                            {t.category}
                          </td>
                          <td className="py-2 px-2 text-slate-600 max-w-[180px] truncate">
                            {t.description}
                          </td>
                          <td className={`py-2 px-3 text-right font-bold whitespace-nowrap ${
                            isNeg ? 'text-red-600' : 'text-emerald-700'
                          }`}>
                            {isNeg ? '' : '+'}
                            {t.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                            <span className="text-[10px] font-semibold">{t.currency === 'TRY' ? '₺' : t.currency}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Footer Verification */}
            <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
              <div>İşbu ekstre Bütçem sistemi üzerinden şifreli bulut kaydından üretilmiştir.</div>
              <div className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Onaylı Elektronik Belge</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
