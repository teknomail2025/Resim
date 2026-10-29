import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Zap,
  Sliders,
  FileImage,
  Layers,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  FileSpreadsheet,
  Code2,
  FileText,
} from 'lucide-react';
import { TextBlock, OverlayStyle, ExportOptions } from '../types';
import {
  downloadWithCustomSettings,
  upscaleAndRenderTranslatedImage,
} from '../utils/upscaler';
import {
  downloadAsCSV,
  downloadAsJSON,
  downloadAsTXT,
  generateCSVString,
  generateJSONString,
} from '../utils/textExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  textBlocks: TextBlock[];
  overlayStyle: OverlayStyle;
  defaultHighQuality?: boolean;
  detectedLanguage?: string;
  summary?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  textBlocks,
  overlayStyle,
  defaultHighQuality = true,
  detectedLanguage = 'Otomatik Algılandı',
  summary = '',
}) => {
  if (!isOpen) return null;

  // Export settings state
  const [enableUpscaler, setEnableUpscaler] = useState<boolean>(defaultHighQuality);
  const [scale, setScale] = useState<number>(defaultHighQuality ? 2 : 1);
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  const [quality, setQuality] = useState<number>(95);
  const [sharpness, setSharpness] = useState<'none' | 'light' | 'medium' | 'strong'>('medium');
  const [copiedTextFormat, setCopiedTextFormat] = useState<'csv' | 'json' | null>(null);

  // Dimensions & preview
  const [origDimensions, setOrigDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Measure original image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOrigDimensions({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Sync scale with upscaler toggle
  const handleToggleUpscaler = (enabled: boolean) => {
    setEnableUpscaler(enabled);
    if (enabled && scale < 2) {
      setScale(2);
    } else if (!enabled && scale >= 2) {
      setScale(1);
    }
  };

  const handleSelectScale = (newScale: number) => {
    setScale(newScale);
    setEnableUpscaler(newScale >= 2);
  };

  // Target dimensions
  const targetW = Math.round(origDimensions.w * scale);
  const targetH = Math.round(origDimensions.h * scale);

  // Generate lightweight preview when options change
  useEffect(() => {
    let active = true;
    const generatePreview = async () => {
      try {
        const previewCanvas = await upscaleAndRenderTranslatedImage(
          imageSrc,
          textBlocks,
          overlayStyle,
          {
            scale: Math.min(1.2, scale), // keep quick for modal preview
            sharpness: scale > 1 ? sharpness : 'none',
            enableUpscaler,
          }
        );
        if (active) {
          setPreviewDataUrl(previewCanvas.toDataURL('image/jpeg', 0.85));
        }
      } catch (err) {
        console.error('Preview generation error', err);
      }
    };
    generatePreview();
    return () => {
      active = false;
    };
  }, [imageSrc, textBlocks, overlayStyle, scale, sharpness, enableUpscaler]);

  // Handle Download
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      const options: ExportOptions = {
        format,
        scale,
        quality: quality / 100,
        sharpness,
        enableUpscaler,
      };

      await downloadWithCustomSettings(
        imageSrc,
        textBlocks,
        overlayStyle,
        options,
        `gorselcevir-turkce-${Date.now()}`
      );
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Download error:', err);
      setIsProcessing(false);
    }
  };

  // Handle Copy
  const handleCopy = async () => {
    setIsProcessing(true);
    try {
      const options: ExportOptions = {
        format: 'png',
        scale,
        quality: 1,
        sharpness,
        enableUpscaler,
      };
      const canvas = await upscaleAndRenderTranslatedImage(
        imageSrc,
        textBlocks,
        overlayStyle,
        options
      );
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportMeta = {
    detectedLanguage,
    targetLanguage: 'Türkçe',
    summary,
  };

  const handleDownloadCSV = () => {
    downloadAsCSV(textBlocks, exportMeta);
  };

  const handleDownloadJSON = () => {
    downloadAsJSON(textBlocks, exportMeta);
  };

  const handleDownloadTXT = () => {
    downloadAsTXT(textBlocks, exportMeta);
  };

  const handleCopyCSV = () => {
    const csv = generateCSVString(textBlocks, exportMeta);
    navigator.clipboard.writeText(csv);
    setCopiedTextFormat('csv');
    setTimeout(() => setCopiedTextFormat(null), 2000);
  };

  const handleCopyJSON = () => {
    const json = generateJSONString(textBlocks, exportMeta);
    navigator.clipboard.writeText(json);
    setCopiedTextFormat('json');
    setTimeout(() => setCopiedTextFormat(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Görsel İndirme ve Kalite Ayarları</h3>
              <p className="text-xs text-slate-400">
                Çözünürlük, dosya formatı ve 2x Yüksek Kalite Çözünürlük Artırıcıyı yapılandırın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Feature Highlight: Resolution Upscaler & High Quality Mode */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">
                  Yüksek Kalite Modu (Resolution Upscaler)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  2x Çözünürlük
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Piksel netliğini 2 katına çıkarır, kenarları keskinleştirir ve Türkçe metinleri ultra yüksek DPI kalitesinde işler.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={() => handleToggleUpscaler(!enableUpscaler)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              enableUpscaler ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-slate-950 shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                enableUpscaler ? 'translate-x-6' : 'translate-x-0'
              }`}
            >
              {enableUpscaler ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
              ) : null}
            </span>
          </button>
        </div>

        {/* 2. Resolution Multipliers Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              Çıkış Çözünürlüğü ve Ölçek (Resolution Scale)
            </span>
            <span className="text-emerald-400 font-mono text-[11px] font-bold">
              {targetW > 0 ? `${targetW} × ${targetH} px (${scale}x)` : 'Hesaplanıyor...'}
            </span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 1, label: '1x Orijinal', desc: 'Standart Çözünürlük', badge: null },
              { id: 1.5, label: '1.5x HD', desc: '+%50 Daha Net', badge: null },
              { id: 2, label: '2x Ultra HD', desc: 'Resolution Upscaler', badge: 'Tavsiye Edilen' },
              { id: 4, label: '4x Süper Res', desc: 'Maksimum Baskı/Büyütme', badge: 'En Yüksek' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectScale(item.id)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative ${
                  scale === item.id
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {item.badge && (
                  <span className="absolute top-2 right-2 text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-md font-bold">
                    {item.badge}
                  </span>
                )}
                <div className="font-bold text-xs text-white">{item.label}</div>
                <div className="text-[10px] text-slate-400 mt-1">{item.desc}</div>
                <div className="text-[10px] font-mono text-emerald-400 font-semibold mt-2">
                  {origDimensions.w > 0
                    ? `${Math.round(origDimensions.w * item.id)} × ${Math.round(origDimensions.h * item.id)} px`
                    : ''}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Format / Extension Selection (PNG, JPG, WEBP) */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-emerald-400" />
            Dosya Formatı ve Uzantısı (Image Extension)
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                id: 'png',
                name: 'PNG (.png)',
                desc: 'Kayıpsız & En Yüksek Netlik',
                sub: 'Metin ve grafikler için kusursuz',
              },
              {
                id: 'jpeg',
                name: 'JPG (.jpg)',
                desc: 'Küçük Dosya Boyutu',
                sub: 'Fotoğraflar ve paylaşım için ideal',
              },
              {
                id: 'webp',
                name: 'WEBP (.webp)',
                desc: 'Modern Web Standardı',
                sub: 'Süper sıkıştırma & yüksek kalite',
              },
            ].map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => setFormat(fmt.id as any)}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  format === fmt.id
                    ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-white flex items-center justify-between">
                    <span>{fmt.name}</span>
                    {format === fmt.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium mt-0.5">{fmt.desc}</div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">{fmt.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. Quality Slider (Enabled for JPG & WEBP) & Sharpness Booster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          {/* Quality Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                Resim Kalitesi (Quality)
              </label>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {format === 'png' ? 'Kayıpsız (%100)' : `%${quality}`}
              </span>
            </div>

            {format === 'png' ? (
              <p className="text-[11px] text-slate-400">
                PNG formatı kayıpsızdır, her zaman en saf piksel kalitesini verir.
              </p>
            ) : (
              <>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>%20 (Hafif)</span>
                  <span>%80 (Dengeli)</span>
                  <span>%100 (Maksimum)</span>
                </div>
              </>
            )}
          </div>

          {/* Sharpness Booster Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Kenar Keskinleştirici (Edge Sharpening)
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'none', label: 'Kapalı' },
                { id: 'light', label: 'Hafif' },
                { id: 'medium', label: 'Orta' },
                { id: 'strong', label: 'Güçlü' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSharpness(opt.id as any)}
                  className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                    sharpness === opt.id
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400">
              Büyütme sırasında yazıların ve kenarların bulanıklaşmasını engeller.
            </p>
          </div>
        </div>

        {/* 5. Document & Data Export Section (CSV / JSON / TXT for Word, Excel, Docs, Notion) */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Metin ve Çevirileri Belge Formatında Dışa Aktar</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 text-[10px] font-mono font-bold">
                    {textBlocks.length} Metin
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Orijinal ve Türkçe metinleri Excel, Google E-Tablolar veya doküman araçlarında kullanmak için indirin
                </p>
              </div>
            </div>

            {/* Quick Copy Dropdown / Feedback */}
            {copiedTextFormat && (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                {copiedTextFormat.toUpperCase()} panoya kopyalandı!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* CSV Export Option */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CSV Tablosu</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    .CSV
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Excel, Google E-Tablolar ve Numbers için UTF-8 Türkçe karakter uyumlu tablo formatı.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleDownloadCSV}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="CSV İndir"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>İndir</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCSV}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center justify-center transition-colors cursor-pointer"
                  title="CSV Kopyala"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* JSON Export Option */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>JSON Verisi</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-500/30">
                    .JSON
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Tüm font analizi, koordinatlar ve metin bloklarını içeren yapılandırılmış tam veri.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleDownloadJSON}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="JSON İndir"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  <span>İndir</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyJSON}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center justify-center transition-colors cursor-pointer"
                  title="JSON Kopyala"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* TXT Export Option */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-colors flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Metin Belgesi</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/30">
                    .TXT
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Not Defteri, Word ve dokümanlar için insan tarafından kolay okunabilir metin listesi.
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleDownloadTXT}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="TXT İndir"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span>İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Status & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Çıktı:{' '}
              <strong className="text-white font-mono">
                {targetW} × {targetH} px
              </strong>{' '}
              ({format.toUpperCase()} • {scale}x)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopy}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Kopyalandı!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Panoya Kopyala</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                  <span>İşleniyor & İndiriliyor...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    İndir ({format.toUpperCase()} • {scale}x)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
