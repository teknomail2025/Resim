import React, { useState, useMemo } from 'react';
import {
  X,
  Type,
  Check,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Sliders,
  Layers,
  Wand2,
  BookOpen,
} from 'lucide-react';
import { TextBlock, FontCategory } from '../types';
import {
  TURKISH_FONTS_CATALOG,
  TurkishFontItem,
  applyTurkishFontToAllBlocks,
  applyTurkishFontToBlock,
} from '../utils/turkishFonts';

interface TurkishFontModalProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: TextBlock[];
  selectedBlockId: string | null;
  onApplyBlocks: (updatedBlocks: TextBlock[], message: string) => void;
  defaultFontName?: string;
  onSetDefaultFontName?: (fontName: string) => void;
}

export const TurkishFontModal: React.FC<TurkishFontModalProps> = ({
  isOpen,
  onClose,
  blocks,
  selectedBlockId,
  onApplyBlocks,
  defaultFontName = 'Plus Jakarta Sans',
  onSetDefaultFontName,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customTestText, setCustomTestText] = useState('Pijamalı hasta yağız şoföre çabucak güvendi. ÇĞİÖŞÜ çğıöşü 123');
  const [activePreviewFont, setActivePreviewFont] = useState<TurkishFontItem>(
    TURKISH_FONTS_CATALOG[0]
  );

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId) || null;
  }, [blocks, selectedBlockId]);

  const filteredFonts = useMemo(() => {
    return TURKISH_FONTS_CATALOG.filter((font) => {
      const matchesSearch =
        font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        font.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        font.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || font.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  const handleApplyToAll = (font: TurkishFontItem) => {
    if (blocks.length === 0) return;
    const updated = applyTurkishFontToAllBlocks(blocks, font);
    onApplyBlocks(updated, `🔤 Tüm metinler "${font.name}" fontuna dönüştürüldü`);
    if (onSetDefaultFontName) onSetDefaultFontName(font.name);
    onClose();
  };

  const handleApplyToSingle = (font: TurkishFontItem) => {
    if (!selectedBlock) return;
    const updatedSingle = applyTurkishFontToBlock(selectedBlock, font);
    const updatedList = blocks.map((b) => (b.id === selectedBlock.id ? updatedSingle : b));
    onApplyBlocks(updatedList, `🔤 Seçili balon fontu "${font.name}" olarak değiştirildi`);
    onClose();
  };

  const handleSetAsDefault = (font: TurkishFontItem) => {
    if (onSetDefaultFontName) {
      onSetDefaultFontName(font.name);
    }
    setActivePreviewFont(font);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Type className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Türkçe Font Değiştirici &amp; Tipografi Kataloğu
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  %100 Türkçe Uyumlu
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Görseldeki çevirilerin yazı tipini değiştirin veya tüm balonlara tek tıkla uygulayın
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

        {/* Live Font Tester Banner */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Canlı Türkçe Karakter Test Metni:
            </span>
            <input
              type="text"
              value={customTestText}
              onChange={(e) => setCustomTestText(e.target.value)}
              placeholder="Test etmek istediğiniz Türkçe metni yazın..."
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Quick Stats & Active Target */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 flex items-center gap-3 shrink-0">
            <div>
              <span className="text-[10px] text-slate-400 block">Mevcut Durum</span>
              <span className="text-xs font-bold text-white">
                {selectedBlock ? `Balon Seçili: #${selectedBlock.id.slice(-4)}` : `${blocks.length} Balon Mevcut`}
              </span>
            </div>
            {blocks.length > 0 && (
              <button
                type="button"
                onClick={() => handleApplyToAll(activePreviewFont)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Tümüne Uygula</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Font adı, stil veya etiket ara (ör. Manga, Montserrat, Serif)..."
              className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'sans-serif', label: 'Modern Sans' },
              { id: 'comic', label: 'Çizgi Roman' },
              { id: 'display', label: 'Afiş & Başlık' },
              { id: 'serif', label: 'Klasik Serif' },
              { id: 'handwriting', label: 'El Yazısı' },
              { id: 'monospace', label: 'Kod & Monospace' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Font Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredFonts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Type className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold">Aradığınız kriterlere uygun font bulunamadı.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 text-xs text-emerald-400 underline"
              >
                Filtreleri Temizle
              </button>
            </div>
          ) : (
            filteredFonts.map((font) => {
              const isDefault = defaultFontName === font.name;
              const isPreviewActive = activePreviewFont.id === font.id;

              return (
                <div
                  key={font.id}
                  onClick={() => setActivePreviewFont(font)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 ${
                    isPreviewActive
                      ? 'bg-emerald-500/10 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top line: Font metadata & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                        {font.name}
                        {font.isPopular && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            ★ Çok Tercih Edilen
                          </span>
                        )}
                        {isDefault && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Varsayılan
                          </span>
                        )}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                        {font.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Rendered Live Preview with chosen font */}
                  <div
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-emerald-300 text-sm sm:text-base leading-relaxed break-words"
                    style={{
                      fontFamily: font.fontFamily,
                      fontWeight: font.defaultWeight,
                    }}
                  >
                    {customTestText || font.sampleTurkish}
                  </div>

                  {/* Description & Action buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="text-xs text-slate-400 max-w-md">
                      {font.description}
                    </p>

                    <div className="flex items-center gap-2">
                      {selectedBlock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyToSingle(font);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Seçili Balona Uygula</span>
                        </button>
                      )}

                      {blocks.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyToAll(font);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Tüm Balonlara Uygula</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetAsDefault(font);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                          isDefault
                            ? 'bg-slate-800 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800'
                        }`}
                        title="Yeni eklenecek balonlar ve sonraki çeviriler için varsayılan yap"
                      >
                        {isDefault ? 'Varsayılan Font' : 'Varsayılan Yap'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Katalogdaki tüm fontlar Türkçe özel harflerini (ç, ğ, ı, ö, ş, ü) eksiksiz çizer.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
