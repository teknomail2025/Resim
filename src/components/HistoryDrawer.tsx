import React, { useState } from 'react';
import {
  History,
  X,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Languages,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { HistoryItem } from '../utils/historyStorage';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  historyItems,
  onSelectHistoryItem,
  onDeleteItem,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopySummary = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const content = `GörselÇevir Geçmişi:
Algılanan Dil: ${item.detectedLanguage}
Özet: ${item.summary}
Tarih: ${item.formattedDate}
Metin Sayısı: ${item.blockCount}
----------------------------
${item.textBlocks.map((b, i) => `${i + 1}. [${b.originalText}] -> ${b.translatedText}`).join('\n')}`;

    navigator.clipboard.writeText(content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">Çeviri Geçmişi</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                    {historyItems.length} / 5
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Yerel depolamada saklanan son çevirileriniz
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Clear action */}
          {historyItems.length > 0 && (
            <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">
                Son 5 görsel otomatik kaydedilir
              </span>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-rose-400 text-[11px] font-medium">Emin misiniz?</span>
                  <button
                    onClick={() => {
                      onClearAll();
                      setConfirmClear(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                  >
                    Evet, Sil
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Vazgeç
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-rose-400 hover:text-rose-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Geçmişi Temizle</span>
                </button>
              )}
            </div>
          )}

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {historyItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-center mb-3 text-slate-600">
                  <History className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-semibold text-slate-300 mb-1">
                  Henüz Geçmiş Yok
                </h4>
                <p className="text-xs text-slate-500 max-w-xs">
                  Bir görsel yükleyip çevirdiğinizde son 5 çeviri otomatik olarak bu cihazın yerel hafızasına (localStorage) kaydedilecektir.
                </p>
              </div>
            ) : (
              historyItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  className="group relative bg-slate-950/70 hover:bg-slate-800/60 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-3 cursor-pointer transition-all duration-200 shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-20 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                      <img
                        src={item.thumbnail || item.fullImage}
                        alt="Önizleme"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/80 text-emerald-400">
                        {item.blockCount} metin
                      </span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {item.detectedLanguage}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.formattedDate}
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-2">
                          {item.summary || 'Çevrilmiş Görsel'}
                        </p>
                      </div>

                      {/* Snippet of first translation */}
                      {item.textBlocks?.[0] && (
                        <div className="mt-1 text-[11px] text-slate-400 truncate bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/60">
                          <span className="text-slate-500">→</span>{' '}
                          <span className="text-emerald-300 font-medium">
                            {item.textBlocks[0].translatedText}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Görseli Yeniden Aç</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopySummary(item, e)}
                        className="p-1 px-2 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                        title="Metinleri Kopyala"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === item.id ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteItem(item.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        title="Geçmişten Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PC Local Database Backup & Restore Footer */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">PC Yerel Depolama (IndexedDB)</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Cihazınızda
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tüm çeviriler ve görseller bilgisayarınızın sabit diskinde saklanır. İnternet olmadan da erişebilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
