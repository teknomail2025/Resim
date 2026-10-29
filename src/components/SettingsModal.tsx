import React from 'react';
import {
  X,
  Settings,
  Type,
  History,
  Monitor,
  Keyboard,
  Download,
  Wifi,
  WifiOff,
  Sparkles,
  Layers,
  Database,
  Trash2,
  HardDrive,
  CheckCircle2,
  Sliders,
  ExternalLink,
  RefreshCw,
  FolderDown,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Actions
  onOpenTurkishFonts: () => void;
  onOpenHistory: () => void;
  onOpenCppModal: () => void;
  onOpenShortcuts: () => void;
  onOpenExportModal: () => void;
  // States
  historyCount: number;
  isOnline: boolean;
  isHighQualityMode: boolean;
  onToggleHighQualityMode: () => void;
  defaultFontName: string;
  hasActiveImage: boolean;
  blockCount: number;
  onClearHistory: () => void;
  onClearCache: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenTurkishFonts,
  onOpenHistory,
  onOpenCppModal,
  onOpenShortcuts,
  onOpenExportModal,
  historyCount,
  isOnline,
  isHighQualityMode,
  onToggleHighQualityMode,
  defaultFontName,
  hasActiveImage,
  blockCount,
  onClearHistory,
  onClearCache,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Settings className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Uygulama Ayarları &amp; Araç Merkezi
              </h3>
              <p className="text-xs text-slate-400">
                Tipografi, geçmiş, masaüstü entegrasyonu ve dışa aktarma tercihleri
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Section 1: Türkçe Fontlar & Tipografi */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Türkçe Fontlar &amp; Tipografi</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                %100 Türkçe Uyumlu
              </span>
            </div>

            <p className="text-slate-400">
              Görseldeki tüm çevirilerin yazı tipini tek hamlede değiştirin. Ç, Ğ, İ, Ö, Ş, Ü harfleri kusursuz desteklenir.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="text-slate-300">
                <span className="text-slate-500">Varsayılan Font: </span>
                <span className="font-bold text-emerald-400 font-sans">{defaultFontName}</span>
                {hasActiveImage && (
                  <span className="ml-2 text-[11px] text-slate-400">
                    ({blockCount} aktif metin balonu)
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTurkishFonts();
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Türkçe Fontları Değiştir</span>
              </button>
            </div>
          </div>

          {/* Section 2: Çeviri Geçmişi & Projeler */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-sm">Çeviri Geçmişi &amp; Kayıtlı Projeler</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                {historyCount} Kayıt
              </span>
            </div>

            <p className="text-slate-400">
              Daha önce çevirdiğiniz görsellere ve konuşma balonlarına yerel tarayıcı belleğinizden (IndexedDB) anında ulaşın.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Geçmiş Çekmecesini Aç</span>
              </button>

              {historyCount > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Geçmişi Temizle</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 3: Windows C++ Masaüstü & Klavye */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Windows C++ Native */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Monitor className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-xs sm:text-sm">Windows C++ Masaüstü</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Windows 10/11 için Modern C++20 ve Direct2D GPU hızlandırmalı yerel masaüstü uygulama mimarisi.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCppModal();
                }}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>C++ Kodlarını İncele</span>
              </button>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Keyboard className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-white text-xs sm:text-sm">Klavye Kısayolları</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Tab ile balonlar arası gezinme, Ctrl+Z geri alma, N ile yeni balon ekleme ve hızlı tuşlar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShortcuts();
                }}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Kısayol Kılavuzu (F1)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Kalite, Dışa Aktarma & Çözünürlük */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Görsel İşleme &amp; Çıktı Kalitesi</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
              <div>
                <span className="font-semibold text-slate-200 block">Yüksek Çözünürlük Modu (2x Upscale)</span>
                <span className="text-[11px] text-slate-400">
                  Görseldeki küçük yazıları ve tabelaları daha keskin render eder
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleHighQualityMode}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  isHighQualityMode
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isHighQualityMode ? 'Açık (2x)' : 'Kapalı (1x)'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="font-semibold text-slate-200 block">Dışa Aktarma ve İndirme Seçenekleri</span>
                <span className="text-[11px] text-slate-400">
                  PNG, JPG, WEBP formatları, 1x/2x/4x ölçekleme ve CSV/JSON dökümü
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExportModal();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>İndirme Ayarları</span>
              </button>
            </div>
          </div>

          {/* Section 5: Masaüstü PWA & Çevrimdışı Bellek */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white text-sm">Sistem &amp; Çevrimdışı Durum</span>
              </div>
              <div className="flex items-center gap-1.5">
                {isOnline ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Çevrimiçi
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Çevrimdışı (PC Yerel)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
              <div className="flex items-center gap-2">
                <PWAInstallButton variant="navbar" />
              </div>

              <button
                type="button"
                onClick={onClearCache}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Önbelleği Boşalt
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>GörselÇevir PC Desktop v2.4 • Modern Masaüstü Deneyimi</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
