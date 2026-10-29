import React from 'react';
import {
  X,
  Keyboard,
  Save,
  Undo2,
  Redo2,
  Trash2,
  Edit3,
  Move,
  Type,
  PlusCircle,
  Eye,
  Layers,
  ArrowRight,
  HardDrive,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  items: {
    keys: string[];
    description: string;
    note?: string;
  }[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Dosya & Kaydetme (PC Yerel)',
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
      items: [
        {
          keys: ['Ctrl', 'S'],
          description: 'Görseli doğrudan bilgisayarınıza yüksek kalitede kaydedin / indirin',
          note: 'Tarayıcı varsayılanı engellenir, direkt resim dışa aktarılır',
        },
        {
          keys: ['Ctrl', 'V'],
          description: 'Panodan kopyalanmış resmi doğrudan uygulamaya yapıştırın',
          note: 'Herhangi bir yerden kopyaladığınız resim anında açılır',
        },
        {
          keys: ['N'],
          description: 'Yeni konuşma balonu / metin kutusu ekleyin',
          note: 'İnternetsiz çevrimdışı modda da tam çalışır',
        },
      ],
    },
    {
      title: 'Geri Al & Yinele (Geçmiş)',
      icon: <Undo2 className="w-4 h-4 text-cyan-400" />,
      items: [
        {
          keys: ['Ctrl', 'Z'],
          description: 'Son yapılan işlemi geri al (Metin, taşıma, boyut, silme)',
        },
        {
          keys: ['Ctrl', 'Y'],
          description: 'Geri alınan işlemi yinele',
        },
        {
          keys: ['Ctrl', 'Shift', 'Z'],
          description: 'Alternatif yineleme kısayolu',
        },
      ],
    },
    {
      title: 'Balon Seçimi & Gezinme',
      icon: <Layers className="w-4 h-4 text-amber-400" />,
      items: [
        {
          keys: ['Tab'],
          description: 'Sonraki konuşma balonuna / metin kutusuna odaklan',
        },
        {
          keys: ['Shift', 'Tab'],
          description: 'Önceki konuşma balonuna odaklan',
        },
        {
          keys: ['Esc'],
          description: 'Seçili balonu bırak veya açık pencereyi kapat',
        },
        {
          keys: ['Enter'],
          description: 'Seçili balonun metin düzenleme penceresini aç',
        },
        {
          keys: ['Delete'],
          description: 'Seçili konuşma balonunu sil (Ctrl+Z ile geri alınabilir)',
        },
      ],
    },
    {
      title: 'Hassas Taşıma (Ok Tuşları)',
      icon: <Move className="w-4 h-4 text-indigo-400" />,
      items: [
        {
          keys: ['↑', '↓', '←', '→'],
          description: 'Seçili balonu fare kullanmadan görsel üzerinde kaydır',
          note: 'Her basışta 10 piksel adım',
        },
        {
          keys: ['Shift', '↑ / ↓ / ← / →'],
          description: 'Hassas piksel piksel taşıma (ince ayar için)',
          note: 'Her basışta 2 piksel mikro adım',
        },
      ],
    },
    {
      title: 'Tipografi & Yazı Boyutu',
      icon: <Type className="w-4 h-4 text-pink-400" />,
      items: [
        {
          keys: ['+'],
          description: 'Seçili balonun yazı boyutunu 2px büyüt',
        },
        {
          keys: ['-'],
          description: 'Seçili balonun yazı boyutunu 2px küçült',
        },
        {
          keys: ['Ctrl', 'B'],
          description: 'Kalın yazı stilini aç / kapat (Bold)',
        },
        {
          keys: ['Ctrl', 'I'],
          description: 'İtalik yazı stilini aç / kapat',
        },
      ],
    },
    {
      title: 'Görüntüleme & Karşılaştırma',
      icon: <Eye className="w-4 h-4 text-teal-400" />,
      items: [
        {
          keys: ['Boşluk'],
          description: 'Basılı tut: Orijinal yabancı görseli anlık olarak göster',
          note: 'Tuşu bıraktığınızda Türkçe çeviri geri gelir',
        },
        {
          keys: ['C'],
          description: 'Alternatif orijinal görsel önizleme tuşu',
        },
        {
          keys: ['F1', 'veya', '?'],
          description: 'Bu klavye kısayolları kılavuzunu aç / kapat',
        },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <span>Klavye Kısayolları Kılavuzu</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Faresiz Hızlı Düzenleme
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Tüm düzenlemeleri klavyenizden hızlı ve pratik şekilde yapabilirsiniz
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts Content List */}
        <div className="p-6 overflow-y-auto space-y-5 divide-y divide-slate-800/60 max-h-[70vh]">
          {shortcutGroups.map((group, groupIdx) => (
            <div key={groupIdx} className={groupIdx > 0 ? 'pt-5' : ''}>
              <div className="flex items-center gap-2 mb-3">
                {group.icon}
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {group.title}
                </h4>
              </div>

              <div className="space-y-2.5">
                {group.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="text-xs">
                      <span className="text-slate-200 font-medium">{item.description}</span>
                      {item.note && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.note}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 self-start sm:self-center shrink-0">
                      {item.keys.map((k, kIdx) =>
                        k === 'veya' ? (
                          <span key={kIdx} className="text-[10px] text-slate-500 px-1 font-sans">
                            veya
                          </span>
                        ) : (
                          <kbd
                            key={kIdx}
                            className="px-2 py-1 rounded-lg bg-slate-800 text-slate-200 font-mono text-[11px] font-bold border border-slate-700 shadow-sm"
                          >
                            {k}
                          </kbd>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>100% Çevrimdışı & Yerel PC Uygulama Modu</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Anladım, Kapat (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
