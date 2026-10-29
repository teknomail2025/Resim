import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Copy,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Type,
  Italic,
  Sparkles,
  Sliders,
  Layers,
  CheckCircle2,
  Palette,
} from 'lucide-react';
import { TextBlock, FontCategory } from '../types';
import {
  SYSTEM_FONT_PROFILES,
  analyzeAndMatchFont,
  getResolvedFontFamily,
  getFontSimilarityBadgeClass,
} from '../utils/fontEngine';
import { FontDiagnosticPanel } from './FontDiagnosticPanel';

interface BlockEditorModalProps {
  block: TextBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBlock: (updated: TextBlock) => void;
  onDeleteBlock: (id: string) => void;
}

export const BlockEditorModal: React.FC<BlockEditorModalProps> = ({
  block,
  isOpen,
  onClose,
  onUpdateBlock,
  onDeleteBlock,
}) => {
  if (!isOpen || !block) return null;

  const [originalText, setOriginalText] = useState(block.originalText);
  const [translatedText, setTranslatedText] = useState(block.translatedText);
  const [textColor, setTextColor] = useState(block.customTextColor || block.textColor || '#ffffff');
  const [bgColor, setBgColor] = useState(block.customBgColor || block.backgroundColor || '#1e293b');
  const [fontSize, setFontSize] = useState<number>(block.customFontSize || 18);
  const [fontWeight, setFontWeight] = useState<'bold' | 'normal'>(
    (block.customFontWeight || block.fontWeight) === 'bold' ? 'bold' : 'normal'
  );
  const [fontCategory, setFontCategory] = useState<FontCategory>(
    block.customFontCategory || block.fontCategory || 'sans-serif'
  );
  const [matchedSystemFont, setMatchedSystemFont] = useState<string>(
    block.customMatchedSystemFont || block.matchedSystemFont || 'Segoe UI'
  );
  const [hasStroke, setHasStroke] = useState<boolean>(
    block.customHasStroke ?? block.hasStroke ?? (Boolean(block.strokeColor) || block.fontCategory === 'comic')
  );
  const [strokeColor, setStrokeColor] = useState<string>(
    block.customStrokeColor || block.strokeColor || (block.textColor === '#ffffff' ? '#000000' : '#ffffff')
  );
  const [strokeWidth, setStrokeWidth] = useState<number>(
    block.customStrokeWidth || block.strokeWidth || 2
  );
  const [letterSpacing, setLetterSpacing] = useState<number>(
    block.customLetterSpacing ?? block.letterSpacing ?? 0
  );
  const [isItalic, setIsItalic] = useState<boolean>(block.customIsItalic ?? block.isItalic ?? false);
  const [isUppercase, setIsUppercase] = useState<boolean>(block.customIsUppercase ?? block.isUppercase ?? false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>(block.textAlign || 'center');
  const [activeTab, setActiveTab] = useState<'diagnostics' | 'editor'>('diagnostics');
  const [copied, setCopied] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setOriginalText(block.originalText);
    setTranslatedText(block.translatedText);
    setTextColor(block.customTextColor || block.textColor || '#ffffff');
    setBgColor(block.customBgColor || block.backgroundColor || '#1e293b');
    setFontSize(block.customFontSize || 18);
    setFontWeight((block.customFontWeight || block.fontWeight) === 'bold' ? 'bold' : 'normal');
    setFontCategory(block.customFontCategory || block.fontCategory || 'sans-serif');
    setMatchedSystemFont(block.customMatchedSystemFont || block.matchedSystemFont || 'Segoe UI');
    setHasStroke(block.customHasStroke ?? block.hasStroke ?? (Boolean(block.strokeColor) || block.fontCategory === 'comic'));
    setStrokeColor(block.customStrokeColor || block.strokeColor || (block.textColor === '#ffffff' ? '#000000' : '#ffffff'));
    setStrokeWidth(block.customStrokeWidth || block.strokeWidth || 2);
    setLetterSpacing(block.customLetterSpacing ?? block.letterSpacing ?? 0);
    setIsItalic(block.customIsItalic ?? block.isItalic ?? false);
    setIsUppercase(block.customIsUppercase ?? block.isUppercase ?? false);
    setTextAlign(block.textAlign || 'center');
  }, [block]);

  // Run analytical font matcher
  const fontMatchEval = analyzeAndMatchFont({
    ...block,
    originalText,
    fontCategory,
    customMatchedSystemFont: matchedSystemFont,
    customFontWeight: fontWeight,
    customIsItalic: isItalic,
    customIsUppercase: isUppercase,
    customHasStroke: hasStroke,
    customStrokeColor: strokeColor,
    customStrokeWidth: strokeWidth,
  });

  const resolvedFontFamily = getResolvedFontFamily({
    ...block,
    customMatchedSystemFont: matchedSystemFont,
    customFontCategory: fontCategory,
    fontCategory,
  });

  const badgeStyle = getFontSimilarityBadgeClass(block.fontSimilarityScore || fontMatchEval.similarityScore);

  const handleSave = () => {
    onUpdateBlock({
      ...block,
      originalText,
      translatedText,
      customTextColor: textColor,
      customBgColor: bgColor,
      customFontSize: fontSize,
      customFontWeight: fontWeight,
      customFontCategory: fontCategory,
      customMatchedSystemFont: matchedSystemFont,
      matchedFontStack: resolvedFontFamily,
      customHasStroke: hasStroke,
      customStrokeColor: strokeColor,
      customStrokeWidth: strokeWidth,
      customLetterSpacing: letterSpacing,
      customIsItalic: isItalic,
      customIsUppercase: isUppercase,
      fontWeight,
      textAlign,
    });
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playTTS = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleVisibility = () => {
    onUpdateBlock({
      ...block,
      isVisible: block.isVisible === false ? true : false,
    });
  };

  const handleUpdateDiagnostics = (updates: {
    fontCategory?: FontCategory;
    matchedSystemFont?: string;
    fontWeight?: 'bold' | 'normal';
    isItalic?: boolean;
    isUppercase?: boolean;
    hasStroke?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    letterSpacing?: number;
  }) => {
    if (updates.fontCategory !== undefined) setFontCategory(updates.fontCategory);
    if (updates.matchedSystemFont !== undefined) setMatchedSystemFont(updates.matchedSystemFont);
    if (updates.fontWeight !== undefined) setFontWeight(updates.fontWeight);
    if (updates.isItalic !== undefined) setIsItalic(updates.isItalic);
    if (updates.isUppercase !== undefined) setIsUppercase(updates.isUppercase);
    if (updates.hasStroke !== undefined) setHasStroke(updates.hasStroke);
    if (updates.strokeColor !== undefined) setStrokeColor(updates.strokeColor);
    if (updates.strokeWidth !== undefined) setStrokeWidth(updates.strokeWidth);
    if (updates.letterSpacing !== undefined) setLetterSpacing(updates.letterSpacing);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Metin &amp; Font Düzenleme</h3>
              <p className="text-xs text-slate-400">
                Orijinal görselin yazı stilini koruyun ve Türkçe çeviriyi özelleştirin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Font Tanı (Görsel Liste) vs Metin & Stil Düzenleme */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Font Tanı Paneli (Görsel Liste)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Metin &amp; Stil Düzenleme</span>
          </button>
        </div>

        {/* 1. COMPREHENSIVE FONT DIAGNOSTIC & ACCURACY REFINEMENT PANEL */}
        {activeTab === 'diagnostics' && (
          <FontDiagnosticPanel
            block={block}
            currentFontCategory={fontCategory}
            currentMatchedFont={matchedSystemFont}
            currentFontWeight={fontWeight}
            currentIsItalic={isItalic}
            currentIsUppercase={isUppercase}
            currentHasStroke={hasStroke}
            currentStrokeColor={strokeColor}
            currentStrokeWidth={strokeWidth}
            currentLetterSpacing={letterSpacing}
            onUpdateDiagnostics={handleUpdateDiagnostics}
            previewText={translatedText || 'Örnek Türkçe Metin'}
          />
        )}

        {/* 2. TEXT & DETAILED STYLE EDITORS */}
        {activeTab === 'editor' && (
          <>
            {/* Text Inputs (Original & Turkish) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Original Text */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Orijinal Metin
            </span>
            <input
              type="text"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:border-amber-500 focus:outline-none"
              placeholder="Orijinal yabancı metin..."
            />
          </div>

          {/* Turkish Translated Text */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Türkçe Çeviri
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={playTTS}
                  className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                  title="Seslendir"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'text-emerald-400 animate-pulse' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                  title="Kopyala"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <input
              type="text"
              value={translatedText}
              onChange={(e) => setTranslatedText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-300 font-bold focus:border-emerald-500 focus:outline-none"
              placeholder="Türkçe çeviri metni..."
            />
          </div>
        </div>

        {/* 3. SYSTEM FONT SELECTION CARDS (All 100% Native PC Fonts) */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              Sistem Destekli Yazı Tipi Eşleştirici
            </span>
            <span className="text-[10px] text-slate-400">
              Görselinize en çok benzeyeni seçin
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SYSTEM_FONT_PROFILES.map((profile) => {
              const isSelected = matchedSystemFont === profile.systemFamily && fontCategory === profile.category;
              return (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    setMatchedSystemFont(profile.systemFamily);
                    setFontCategory(profile.category);
                    if (profile.isCondensed) setIsUppercase(true);
                    if (profile.hasDefaultStroke) setHasStroke(true);
                  }}
                  className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md shadow-emerald-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold truncate">{profile.name}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block line-clamp-1 mb-1.5 font-mono">
                      {profile.systemFamily}
                    </span>
                  </div>

                  {/* Visual typography sample preview */}
                  <div
                    className="text-xs font-bold truncate px-1.5 py-1 rounded bg-slate-950/60 border border-slate-800/80 text-emerald-300"
                    style={{
                      fontFamily: profile.stack,
                      fontStyle: isItalic ? 'italic' : 'normal',
                      textTransform: isUppercase ? 'uppercase' : 'none',
                    }}
                  >
                    Türkçe Yazı
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. TYPOGRAPHY STYLING & SLIDERS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Colors */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Yazı Rengi
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-300">{textColor}</span>
              </div>
            </div>

            <div className="w-[1px] h-8 bg-slate-800" />

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">
                Yama / Arka Plan
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-300">{bgColor}</span>
              </div>
            </div>
          </div>

          {/* Stroke / Outline Settings (Crucial for Comics & Manga) */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasStroke}
                  onChange={(e) => setHasStroke(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5 accent-emerald-500"
                />
                <span>Yazı Dış Konturu (Outline / Stroke)</span>
              </label>
              {hasStroke && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={strokeColor}
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="w-5 h-5 rounded border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono text-slate-400">{strokeWidth}px</span>
                </div>
              )}
            </div>

            {hasStroke && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 shrink-0">Kalınlık:</span>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={0.5}
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Font Size Slider */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 sm:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400">
                Yazı Boyutu (Font Size)
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-xs">
                {fontSize} px
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.max(8, prev - 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center justify-center transition-colors shrink-0"
              >
                -
              </button>

              <input
                type="range"
                min={8}
                max={72}
                step={1}
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <button
                type="button"
                onClick={() => setFontSize((prev) => Math.min(72, prev + 1))}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold flex items-center justify-center transition-colors shrink-0"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Style Toggles: Bold, Italic, Uppercase, Alignment */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFontWeight((prev) => (prev === 'bold' ? 'normal' : 'bold'))}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                fontWeight === 'bold'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {fontWeight === 'bold' ? 'Kalın (Bold)' : 'Normal'}
            </button>

            <button
              type="button"
              onClick={() => setIsItalic((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                isItalic
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 italic'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Italic className="w-3 h-3" />
              <span>İtalik</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUppercase((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isUppercase
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title="Büyük harf dönüştürücü"
            >
              BÜYÜK HARF
            </button>
          </div>

          <div className="flex items-center gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                type="button"
                onClick={() => setTextAlign(align)}
                className={`px-2.5 py-1 text-xs rounded border capitalize transition-all cursor-pointer ${
                  textAlign === align
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {align === 'left' ? 'Sol' : align === 'center' ? 'Orta' : 'Sağ'}
              </button>
            ))}
          </div>
        </div>

        {/* 5. LIVE TYPOGRAPHY PREVIEW */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-400">
              Canlı Tipografi Önizlemesi (Görseldeki Gibi):
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              {matchedSystemFont} • {fontSize}px
            </span>
          </div>

          <div
            className="p-4 rounded-xl border border-slate-800 flex items-center justify-center transition-all overflow-auto min-h-[70px] max-h-[140px]"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              fontWeight,
              fontStyle: isItalic ? 'italic' : 'normal',
              textTransform: isUppercase ? 'uppercase' : 'none',
              fontFamily: resolvedFontFamily,
              textAlign,
              fontSize: `${fontSize}px`,
              lineHeight: 1.25,
              WebkitTextStroke: hasStroke ? `${strokeWidth}px ${strokeColor}` : undefined,
              letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
            }}
          >
            <span className="break-words max-w-full">
              {isUppercase
                ? (translatedText || 'METİN GİRİLMEDİ').toLocaleUpperCase('tr-TR')
                : (translatedText || 'Metin girilmedi')}
            </span>
          </div>
        </div>
      </>
    )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVisibility}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {block.isVisible === false ? (
                <>
                  <Eye className="w-4 h-4 text-emerald-400" /> Göster
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-rose-400" /> Gizle
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                onDeleteBlock(block.id);
                onClose();
              }}
              className="px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              Sil
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Kaydet ve Uygula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
