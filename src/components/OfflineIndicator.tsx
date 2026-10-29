import React, { useState } from 'react';
import {
  WifiOff,
  Wifi,
  HardDrive,
  Download,
  Upload,
  Sparkles,
  Info,
  CheckCircle2,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { exportAllProjectsToFile, importProjectsFromFile } from '../utils/localDB';

interface OfflineIndicatorProps {
  isOnline: boolean;
  wasOffline: boolean;
  onAddManualBubble?: () => void;
  onRefreshProjects?: () => void;
  hasActiveImage: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  wasOffline,
  onAddManualBubble,
  onRefreshProjects,
  hasActiveImage,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      await exportAllProjectsToFile();
      setBackupMessage('Tüm çeviri ve görseller PC indirilenler klasörünüze yedeklendi!');
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      setBackupMessage('Yedekleme sırasında hata oluştu.');
      setTimeout(() => setBackupMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const count = await importProjectsFromFile(file);
      setBackupMessage(`${count} adet çeviri projesi PC'nize başarıyla aktarıldı!`);
      onRefreshProjects?.();
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      setBackupMessage('Dosya yüklenirken hata oluştu. Lütfen geçerli bir JSON yedek seçin.');
      setTimeout(() => setBackupMessage(null), 4000);
    }
    e.target.value = '';
  };

  if (isOnline && !wasOffline && !backupMessage) {
    return null;
  }

  return (
    <div className="w-full transition-all duration-300">
      {/* Just reconnected message */}
      {isOnline && wasOffline && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg mb-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">İnternet bağlantısı yeniden kuruldu. Yapay zeka otomatik çeviri servisi aktif.</span>
          </div>
          <span className="text-[11px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">Çevrimiçi</span>
        </div>
      )}

      {/* Backup message notice */}
      {backupMessage && (
        <div className="bg-cyan-950/90 border border-cyan-500/40 text-cyan-200 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg mb-3 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold">{backupMessage}</span>
        </div>
      )}

      {/* Offline Mode Banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900/90 to-amber-950/90 border border-amber-500/50 text-slate-200 text-xs p-3.5 rounded-2xl shadow-xl mb-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 text-sm">Çevrimdışı Çalışma Modu Aktif</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold uppercase tracking-wider">
                    İnternetsiz PC Modu
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tüm dosyalar ve arayüz bilgisayarınızda yerel çalışıyor. Görsel üzerinde manuel balon ekleme, font düzenleme ve yüksek çözünürlüklü çıktı alma özelliklerini internetsiz kullanabilirsiniz.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {hasActiveImage && onAddManualBubble && (
                <button
                  type="button"
                  onClick={onAddManualBubble}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Çevrimdışı Balon / Metin Ekle</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Tüm kayıtlı projeleri ve görselleri bilgisayarınıza JSON dosyası olarak indirir"
              >
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>PC'ye Yedekle</span>
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Yedekten Aç</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
