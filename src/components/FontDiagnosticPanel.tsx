import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Type,
  Bold,
  Italic,
  Maximize2,
  RefreshCw,
  Check,
  ChevronRight,
  ShieldCheck,
  Palette,
  ArrowRight,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import { TextBlock, FontCategory } from '../types';
import {
  getFontDiagnostics,
  getFontSimilarityBadgeClass,
  SYSTEM_FONT_PROFILES,
  SystemFontProfile,
} from '../utils/fontEngine';

interface FontDiagnosticPanelProps {
  block: TextBlock;
  currentFontCategory: FontCategory;
  currentMatchedFont: string;
  currentFontWeight: 'bold' | 'normal';
  currentIsItalic: boolean;
  currentIsUppercase: boolean;
  currentHasStroke: boolean;
  currentStrokeColor: string;
  currentStrokeWidth: number;
  currentLetterSpacing: number;
  onUpdateDiagnostics: (updates: {
    fontCategory?: FontCategory;
    matchedSystemFont?: string;
    fontWeight?: 'bold' | 'normal';
    isItalic?: boolean;
    isUppercase?: boolean;
    hasStroke?: boolean;
    strokeColor?: string;
    strokeWidth?: number;
    letterSpacing?: number;
  }) => void;
  previewText?: string;
}

export const FontDiagnosticPanel: React.FC<FontDiagnosticPanelProps> = ({
  block,
  currentFontCategory,
  currentMatchedFont,
  currentFontWeight,
  currentIsItalic,
  currentIsUppercase,
  currentHasStroke,
  currentStrokeColor,
  currentStrokeWidth,
  currentLetterSpacing,
  onUpdateDiagnostics,
  previewText = 'Örnek Türkçe Çeviri',
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [appliedQuickFix, setAppliedQuickFix] = useState(false);

  // Compute diagnostics using current overrides
  const diagnostics = getFontDiagnostics({
    ...block,
    customFontCategory: currentFontCategory,
    customMatchedSystemFont: currentMatchedFont,
    customFontWeight: currentFontWeight,
    customIsItalic: currentIsItalic,
    customIsUppercase: currentIsUppercase,
    customHasStroke: currentHasStroke,
    customStrokeColor: currentStrokeColor,
    customStrokeWidth: currentStrokeWidth,
    customLetterSpacing: currentLetterSpacing,
  });

  const badgeStyle = getFontSimilarityBadgeClass(diagnostics.similarityScore);

  // Auto-apply all detected AI parameters to manual overrides with 1 click
  const handleAutoAlignWithDetection = () => {
    const isBold = block.fontWeight === 'bold' || block.fontWeight === '700' || block.fontWeight === '800';
    onUpdateDiagnostics({
      fontCategory: block.fontCategory || 'sans-serif',
      matchedSystemFont: block.matchedSystemFont || diagnostics.alternativeProfiles[0]?.profile.systemFamily || 'Segoe UI',
      fontWeight: isBold ? 'bold' : 'normal',
      isItalic: Boolean(block.isItalic),
      isUppercase: Boolean(block.isUppercase),
      hasStroke: Boolean(block.hasStroke || block.strokeColor),
      strokeColor: block.strokeColor || '#000000',
      strokeWidth: block.strokeWidth || 2,
      letterSpacing: block.letterSpacing || 0,
    });
    setAppliedQuickFix(true);
    setTimeout(() => setAppliedQuickFix(false), 2000);
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-xl">
      {/* 1. Header & Font Diagnostics Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Font Diagnostics</span>
                <span className="text-slate-400 font-normal">/ Tipografi Teşhisi</span>
              </h4>
              <span className="px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 text-[10px] font-mono border border-cyan-500/20 font-bold">
                Active Block #{block.id.slice(-4)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Seçili metin blokunun tespit edilen font ailesi, ağırlık, stil nitelikleri ve eşleşme gerekçesi
            </p>
          </div>
        </div>

        {/* Similarity Score & Grade */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} shadow-sm`}>
            <CheckCircle2 className="w-4 h-4" />
            <span>%{diagnostics.similarityScore} Benzerlik Skoru</span>
          </div>
        </div>
      </div>

      {/* 2. Görsel Font Tanı Listesi (Visual Diagnostic List: Family, Weight, Style, Score) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Font Tanı Görsel Listesi (Algılanan Tipografi Parametreleri)</span>
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Aktif Blok Nitelikleri
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Item 1: Font Ailesi (Font Family) */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors flex items-start gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <Type className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Font Ailesi (Family)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] font-mono uppercase font-bold">
                  {diagnostics.detectedCategory}
                </span>
              </div>
              <div className="font-extrabold text-amber-200 text-sm truncate mt-0.5" title={diagnostics.detectedFontFamily}>
                {diagnostics.detectedFontFamily}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Eşleşen Sistem Fontu:</span>
                <span className="text-emerald-400 font-bold font-mono">{diagnostics.currentMatchedFont}</span>
              </div>
            </div>
          </div>

          {/* Item 2: Kalınlık (Weight) */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-start gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Bold className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kalınlık (Weight)
                </span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[9px] font-mono font-bold">
                  {block.fontWeight === 'bold' ? '700' : '400'}
                </span>
              </div>
              <div className="font-extrabold text-emerald-200 text-sm truncate mt-0.5">
                {diagnostics.detectedWeightLabel}
              </div>
              {/* Visual Weight Gauge */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[9px] text-slate-500">Normal</span>
                <div className="flex-1 bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      block.fontWeight === 'bold' ? 'w-full bg-emerald-400' : 'w-1/2 bg-slate-500'
                    }`}
                  />
                </div>
                <span className="text-[9px] text-slate-300 font-bold">Kalın</span>
              </div>
            </div>
          </div>

          {/* Item 3: Stil (Style - İtalik / Normal) */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors flex items-start gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
              <Italic className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Stil (Style: İtalik / Normal)
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${
                  block.isItalic
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {block.isItalic ? 'İtalik Eğik' : 'Normal Düz'}
                </span>
              </div>
              <div className="font-extrabold text-cyan-200 text-sm truncate mt-0.5">
                {block.isItalic ? 'İtalik (Eğik Harf Yapısı)' : 'Normal (Düz Dik Harfler)'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                <span>Harf Düzeni:</span>
                <span className="text-slate-300 font-semibold">{block.isUppercase ? 'Tümü BÜYÜK' : 'Standart Küçük/Büyük'}</span>
              </div>
            </div>
          </div>

          {/* Item 4: Benzerlik Puanı (Similarity Score) with Visual Progress Bar */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-colors flex items-start gap-3 shadow-md">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shrink-0 mt-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Benzerlik Puanı (Similarity)
                </span>
                <span className="text-[10px] font-mono font-extrabold text-emerald-400">
                  {diagnostics.matchGrade}
                </span>
              </div>
              <div className="font-black text-white text-base mt-0.5 flex items-baseline gap-1">
                <span className="text-emerald-400 text-lg">%{diagnostics.similarityScore}</span>
                <span className="text-[11px] text-slate-400 font-normal">/ 100 Uyum</span>
              </div>
              {/* Visual Progress Bar */}
              <div className="mt-2 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, diagnostics.similarityScore))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Why This Font Was Matched? (Eşleştirme Gerekçesi) */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/40 border border-blue-500/30 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center">
            <Lightbulb className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <span>Neden Bu Font Eşleşti?</span>
            <span className="text-[10px] text-blue-300 font-normal lowercase">(Why Was This Font Matched?)</span>
          </span>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
          {diagnostics.whyMatchedReasoning}
        </p>

        {/* Key Match Criteria Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
          {diagnostics.matchFactors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">{factor.label}</span>
                <span className="text-slate-400 text-[10px] leading-tight block mt-0.5">{factor.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Side-by-Side Diagnostic Attribute Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* A. Detected Original Attributes (From Visual OCR) */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-amber-400 flex items-center gap-1.5 text-[11px]">
              <span>📷 Algılanan Orijinal Nitelikler (AI Tespit)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Referans</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Font Ailesi / İsmi:</span>
              <span className="font-bold text-amber-200 truncate max-w-[170px]" title={diagnostics.detectedFontFamily}>
                {diagnostics.detectedFontFamily}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Font Sınıfı (Category):</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono text-[10px] uppercase font-bold">
                {diagnostics.detectedCategory}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kalınlık (Weight):</span>
              <span className="font-semibold text-slate-200">
                {block.fontWeight === 'bold' ? 'Kalın (Bold - 700)' : 'Normal (Regular - 400)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">İtalik / Eğiklik:</span>
              <span className={`font-semibold ${block.isItalic ? 'text-amber-300' : 'text-slate-400'}`}>
                {block.isItalic ? 'Evet (Eğik)' : 'Hayır (Düz)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Büyük Harf / Case:</span>
              <span className={`font-semibold ${block.isUppercase ? 'text-amber-300' : 'text-slate-400'}`}>
                {block.isUppercase ? 'Tümü Büyük (ALL-CAPS)' : 'Standart'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Kenar Çizgisi (Stroke):</span>
              <span className={`font-semibold ${block.hasStroke || block.strokeColor ? 'text-amber-300' : 'text-slate-400'}`}>
                {block.hasStroke || block.strokeColor ? `Var (${block.strokeColor || '#000'}, ${block.strokeWidth || 2}px)` : 'Yok'}
              </span>
            </div>
          </div>
        </div>

        {/* B. Active System Match Attributes */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-emerald-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-[11px]">
              <span>💻 Aktif Eşleşen Sistem Parametreleri</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono font-semibold">Canlı Önizleme</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Eşleşen Sistem Fontu:</span>
              <span className="font-bold text-emerald-300 font-mono">
                {currentMatchedFont}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Aktif Kategori:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono text-[10px] uppercase font-bold">
                {currentFontCategory}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Aktif Kalınlık:</span>
              <span className="font-semibold text-slate-200">
                {currentFontWeight === 'bold' ? 'Kalın (Bold)' : 'Normal'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Aktif İtalik:</span>
              <span className={`font-semibold ${currentIsItalic ? 'text-emerald-300' : 'text-slate-400'}`}>
                {currentIsItalic ? 'Açık (İtalik)' : 'Kapalı'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Büyük Harf:</span>
              <span className={`font-semibold ${currentIsUppercase ? 'text-emerald-300' : 'text-slate-400'}`}>
                {currentIsUppercase ? 'Açık (BÜYÜK)' : 'Kapalı'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Aktif Kontur:</span>
              <span className={`font-semibold ${currentHasStroke ? 'text-emerald-300' : 'text-slate-400'}`}>
                {currentHasStroke ? `Açık (${currentStrokeColor}, ${currentStrokeWidth}px)` : 'Kapalı'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Diagnostic Accuracy Refinement Hints */}
      {diagnostics.refinementHints.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tanı İnce Ayar ve Doğruluk Tavsiyeleri</span>
            </span>

            {/* Quick Auto-Align Button */}
            <button
              type="button"
              onClick={handleAutoAlignWithDetection}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Tüm parametreleri AI tarafından algılanan orijinal font nitelikleriyle doğrudan eşitleyin"
            >
              {appliedQuickFix ? <Check className="w-3 h-3 text-emerald-400" /> : <RefreshCw className="w-3 h-3" />}
              <span>{appliedQuickFix ? 'Eşitlendi!' : '🎯 Orijinal Niteliklere Eşitle'}</span>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {diagnostics.refinementHints.map((hint, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span className="leading-snug">{hint}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Interactive Font Match Refinement Bar (Alternative Recommended System Fonts) */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Doğruluğu İyileştirmek İçin Önerilen Sistem Fontları (Top Alternatives)</span>
          </span>
          <span className="text-[10px] text-slate-400">Tek tıkla eşleşmeyi test edin</span>
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {diagnostics.alternativeProfiles.map(({ profile, score }) => {
            const isSelected = currentMatchedFont === profile.systemFamily && currentFontCategory === profile.category;
            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => {
                  onUpdateDiagnostics({
                    matchedSystemFont: profile.systemFamily,
                    fontCategory: profile.category,
                    fontWeight: profile.weightOptions.includes('bold') ? 'bold' : currentFontWeight,
                    hasStroke: profile.hasDefaultStroke ? true : currentHasStroke,
                    isUppercase: profile.isCondensed ? true : currentIsUppercase,
                  });
                }}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-400 text-white shadow-md shadow-emerald-500/15'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold truncate">{profile.systemFamily}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      %{score}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 block truncate mt-0.5">{profile.name}</span>
                </div>

                <div
                  className="mt-2 text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-950 text-emerald-300 truncate text-center border border-slate-800"
                  style={{
                    fontFamily: profile.stack,
                    fontStyle: currentIsItalic ? 'italic' : 'normal',
                    textTransform: currentIsUppercase ? 'uppercase' : 'none',
                  }}
                >
                  ABC Türkçe
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Live Typography Render Preview Box */}
      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Canlı Tipografi Test Önizlemesi
          </span>
          <span className="text-[10px] font-mono text-emerald-400">
            Font: {currentMatchedFont} • {currentFontWeight} • {currentIsItalic ? 'İtalik' : 'Düz'}
          </span>
        </div>

        <div
          className="p-3 rounded-lg bg-slate-900 text-center transition-all overflow-hidden flex items-center justify-center min-h-[48px]"
          style={{
            fontFamily: diagnostics.currentFontStack,
            fontWeight: currentFontWeight === 'bold' ? 700 : 400,
            fontStyle: currentIsItalic ? 'italic' : 'normal',
            textTransform: currentIsUppercase ? 'uppercase' : 'none',
            letterSpacing: `${currentLetterSpacing}px`,
            color: block.customTextColor || block.textColor || '#FFFFFF',
            WebkitTextStroke: currentHasStroke ? `${currentStrokeWidth}px ${currentStrokeColor}` : 'none',
          }}
        >
          <span className="text-sm font-bold truncate max-w-full">
            {previewText}
          </span>
        </div>
      </div>
    </div>
  );
};
