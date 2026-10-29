import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Volume2,
  Search,
  ExternalLink,
  Edit2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Code2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { TextBlock } from '../types';
import {
  downloadAsCSV,
  downloadAsJSON,
  downloadAsTXT,
  generateCSVString,
  generateJSONString,
} from '../utils/textExporter';

interface TextListDrawerProps {
  textBlocks: TextBlock[];
  detectedLanguage: string;
  detectedLanguageCode?: string;
  confidence?: string;
  isAutoDetected?: boolean;
  summary: string;
  onSelectBlock: (block: TextBlock) => void;
  onToggleVisibility: (id: string) => void;
  selectedBlockId?: string | null;
  onSelectBlockId?: (id: string) => void;
}

export const TextListDrawer: React.FC<TextListDrawerProps> = ({
  textBlocks,
  detectedLanguage,
  detectedLanguageCode,
  confidence,
  isAutoDetected,
  summary,
  onSelectBlock,
  onToggleVisibility,
  selectedBlockId,
  onSelectBlockId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filteredBlocks = textBlocks.filter(
    (b) =>
      b.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.translatedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metadata = {
    detectedLanguage,
    detectedLanguageCode,
    confidence,
    targetLanguage: 'Türkçe',
    summary,
  };

  const copyAllText = () => {
    const fullText = textBlocks
      .map(
        (b, i) =>
          `[${i + 1}] Orijinal (${detectedLanguage}): ${b.originalText}\n    Türkçe: ${b.translatedText}\n`
      )
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopiedType('text');
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyAsCSV = () => {
    const csv = generateCSVString(textBlocks, metadata);
    navigator.clipboard.writeText(csv);
    setCopiedType('csv');
    setShowExportMenu(false);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const copyAsJSON = () => {
    const json = generateJSONString(textBlocks, metadata);
    navigator.clipboard.writeText(json);
    setCopiedType('json');
    setShowExportMenu(false);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleExportCSV = () => {
    downloadAsCSV(textBlocks, metadata);
    setShowExportMenu(false);
  };

  const handleExportJSON = () => {
    downloadAsJSON(textBlocks, metadata);
    setShowExportMenu(false);
  };

  const handleExportTXT = () => {
    downloadAsTXT(textBlocks, metadata);
    setShowExportMenu(false);
  };

  const copySingleText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 1500);
  };

  const playTTS = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Drawer Top */}
      <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h4 className="font-semibold text-white text-sm">Metin ve Çeviri Paneli</h4>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {textBlocks.length} Metin
            </span>
          </div>

          <div className="flex items-center gap-1.5 relative">
            {/* Quick CSV Export Button */}
            <button
              onClick={handleExportCSV}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Metin ve çevirileri CSV dosyası olarak indir (Excel & Google E-Tablolar uyumlu)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Quick JSON Export Button */}
            <button
              onClick={handleExportJSON}
              className="px-2 py-1 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              title="Metinleri yapılandırılmış JSON verisi olarak indir (API ve doküman araçları için)"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>

            {/* More Export / Copy Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Diğer Dışa Aktarma Seçenekleri"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Dosya Olarak İndir
                  </div>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV Tablosu (.csv)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-cyan-500/20 hover:text-cyan-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>JSON Verisi (.json)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Veri</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportTXT}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Metin Belgesi (.txt)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Düz</span>
                  </button>

                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800 mt-1">
                    Panoya Kopyala
                  </div>

                  <button
                    type="button"
                    onClick={copyAsCSV}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV Metnini Kopyala</span>
                    </span>
                    {copiedType === 'csv' && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={copyAsJSON}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>JSON Metnini Kopyala</span>
                    </span>
                    {copiedType === 'json' && <Check className="w-3 h-3 text-cyan-400" />}
                  </button>

                  <button
                    type="button"
                    onClick={copyAllText}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-slate-200 hover:bg-slate-800 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Düz Çevirileri Kopyala</span>
                    </span>
                    {copiedType === 'text' && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Detected Language Badge */}
        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Algılanan Dil:</span>
                <span className="font-bold text-emerald-300">{detectedLanguage}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span>{isAutoDetected !== false ? '✨ Otomatik Algılandı' : 'Seçili Dil'}</span>
                {confidence && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-mono">{confidence} Güven</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
            🇹🇷 Türkçe
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Orijinal veya Türkçe metin ara..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredBlocks.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            Arama kriterine uygun metin bulunamadı.
          </div>
        ) : (
          filteredBlocks.map((block, index) => {
            const isSelected = selectedBlockId === block.id;
            return (
              <div
                key={block.id}
                onClick={() => {
                  onSelectBlockId?.(block.id);
                  onSelectBlock(block);
                }}
                className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 bg-slate-900 border-emerald-500 shadow-md'
                    : block.isVisible === false
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                    #{index + 1} {block.category || 'Metin'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-sans bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-bold flex items-center gap-1">
                    <span>🎯 {block.matchedSystemFont || 'Sistem Fontu'}</span>
                    <span className="text-emerald-400/80 font-mono">({block.fontSimilarityScore || 95}%)</span>
                  </span>

                  {/* Diagnostic Attributes Pill */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBlock(block);
                    }}
                    className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                    title="Font Tanı ve Teşhis Panelini Aç (Ağırlık ve stil parametrelerini inceleyin)"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Tanı: {block.fontWeight === 'bold' ? 'Kalın' : 'Normal'}</span>
                    {block.isItalic && <span>• İtalik</span>}
                    {block.isUppercase && <span>• BÜYÜK</span>}
                    {block.hasStroke && <span>• Kontur</span>}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => onToggleVisibility(block.id)}
                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title={block.isVisible === false ? 'Görselde Göster' : 'Görselde Gizle'}
                  >
                    {block.isVisible === false ? (
                      <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => playTTS(block.translatedText)}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                    title="Sesli Dinle"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => copySingleText(block.translatedText, block.id)}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                    title="Kopyala"
                  >
                    {copiedBlockId === block.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectBlock(block)}
                    className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800"
                    title="Düzenle"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Original */}
              <p className="text-xs text-slate-400 font-mono mb-1 line-clamp-2">
                {block.originalText}
              </p>

              {/* Translated */}
              <div
                onClick={() => onSelectBlock(block)}
                className="cursor-pointer text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-500/20 flex items-center justify-between"
              >
                <span>{block.translatedText}</span>
                <Edit2 className="w-3 h-3 text-emerald-400/60 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0" />
              </div>
            </div>
          );
        })
      )}
      </div>
    </div>
  );
};
