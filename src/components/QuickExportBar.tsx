import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Sliders,
  Check,
  Zap,
  Maximize2,
  FileImage,
  Layers,
  Settings,
  FileSpreadsheet,
  Code2,
} from 'lucide-react';
import { TextBlock, OverlayStyle, ExportOptions } from '../types';
import { downloadWithCustomSettings } from '../utils/upscaler';
import { downloadAsCSV, downloadAsJSON } from '../utils/textExporter';

interface QuickExportBarProps {
  imageSrc: string;
  textBlocks: TextBlock[];
  overlayStyle: OverlayStyle;
  onOpenAdvancedModal: () => void;
  isTranslating?: boolean;
  detectedLanguage?: string;
}

export const QuickExportBar: React.FC<QuickExportBarProps> = ({
  imageSrc,
  textBlocks,
  overlayStyle,
  onOpenAdvancedModal,
  isTranslating = false,
  detectedLanguage = 'Otomatik Algılandı',
}) => {
  // Resolution scale
  const [scale, setScale] = useState<number>(2);
  // Format (.png, .jpg, .webp)
  const [format, setFormat] = useState<'png' | 'jpeg' | 'webp'>('png');
  // Quality percentage (70 to 100)
  const [quality, setQuality] = useState<number>(95);
  // Sharpness filter
  const [sharpness, setSharpness] = useState<'none' | 'light' | 'medium' | 'strong'>('medium');
  // Loading state
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Original dimensions
  const [dimensions, setDimensions] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setDimensions({
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height,
      });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const targetW = Math.round(dimensions.w * scale);
  const targetH = Math.round(dimensions.h * scale);

  const handleDownload = async () => {
    if (isDownloading || isTranslating) return;
    setIsDownloading(true);
    setDownloadSuccess(false);

    try {
      const options: ExportOptions = {
        format,
        scale,
        quality: quality / 100,
        sharpness: scale > 1 ? sharpness : 'none',
        enableUpscaler: scale >= 2,
      };

      await downloadWithCustomSettings(
        imageSrc,
        textBlocks,
        overlayStyle,
        options,
        `turkce-gorsel-${scale}x`
      );

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const getFormatExt = () => {
    if (format === 'jpeg') return '.JPG';
    if (format === 'webp') return '.WEBP';
    return '.PNG';
  };

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col gap-3">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Çözünürlük, Format ve Kalite Kontrolü</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                {targetW > 0 ? `${targetW} × ${targetH} px` : `${scale}x`}
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Görseli istediğiniz çözünürlükte, dosya formatında ve netlik kalitesinde dışa aktarın
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => downloadAsCSV(textBlocks, { detectedLanguage, targetLanguage: 'Türkçe' })}
            disabled={textBlocks.length === 0 || isTranslating}
            className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors disabled:opacity-40 cursor-pointer"
            title="Metinleri Excel & Google E-Tablolar için CSV olarak indir"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV İndir</span>
          </button>

          <button
            type="button"
            onClick={() => downloadAsJSON(textBlocks, { detectedLanguage, targetLanguage: 'Türkçe' })}
            disabled={textBlocks.length === 0 || isTranslating}
            className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors disabled:opacity-40 cursor-pointer"
            title="Metinleri yapılandırılmış JSON verisi olarak indir"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON İndir</span>
          </button>

          {/* Advanced Modal Trigger */}
          <button
            type="button"
            onClick={onOpenAdvancedModal}
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 transition-colors cursor-pointer"
            title="Tüm gelişmiş indirme ve çözünürlük ayarlarını gör"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Gelişmiş Ayarlar</span>
          </button>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. ÇÖZÜNÜRLÜK (Resolution) */}
        <div className="flex flex-col gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Maximize2 className="w-3 h-3 text-cyan-400" /> Çözünürlük
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {scale === 1 ? '1x Orijinal' : scale === 1.5 ? '1.5x Gelişmiş' : scale === 2 ? '2x HD' : '4x 4K Ultra'}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {[
              { val: 1, label: '1x', sub: 'Orijinal' },
              { val: 1.5, label: '1.5x', sub: 'Net' },
              { val: 2, label: '2x', sub: 'HD' },
              { val: 4, label: '4x', sub: 'Ultra' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setScale(opt.val)}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold flex flex-col items-center transition-all ${
                  scale === opt.val
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[9px] opacity-75 font-normal">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. FORMAT / RESİM UZANTISI */}
        <div className="flex flex-col gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <FileImage className="w-3 h-3 text-emerald-400" /> Resim Uzantısı
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">
              {getFormatExt()}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'png', ext: '.PNG', tip: 'Kayıpsız / Net' },
              { id: 'jpeg', ext: '.JPG', tip: 'Hafif Boyut' },
              { id: 'webp', ext: '.WEBP', tip: 'Modern Web' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id as any)}
                className={`py-1.5 px-1 rounded-lg text-xs font-bold flex flex-col items-center transition-all ${
                  format === f.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold scale-[1.02]'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{f.ext}</span>
                <span className="text-[9px] opacity-75 font-normal">{f.tip}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. RESİM KALİTESİ & NETLİK ARTIRMA */}
        <div className="flex flex-col gap-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Sliders className="w-3 h-3 text-amber-400" /> Kalite & Netlik
            </span>
            <span className="text-[10px] font-mono text-amber-300 font-bold">
              %{quality} {sharpness !== 'none' ? `| ${sharpness === 'strong' ? 'Yüksek Netlik' : 'Net'}` : ''}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {/* Quality Slider */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 w-10">Kalite:</span>
              <input
                type="range"
                min="70"
                max="100"
                step="5"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                title={`Görsel Kalitesi: %${quality}`}
              />
              <span className="text-[10px] font-mono text-amber-300 w-8 text-right font-bold">
                %{quality}
              </span>
            </div>
            {/* Sharpness Pill Selector */}
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className="text-slate-400 text-[10px]">Netlik:</span>
              <div className="flex items-center gap-1">
                {[
                  { id: 'none', label: 'Yok' },
                  { id: 'light', label: 'Hafif' },
                  { id: 'medium', label: 'Orta' },
                  { id: 'strong', label: 'Yüksek' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSharpness(s.id as any)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      sharpness === s.id
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. HIZLI İNDİR BUTONU */}
        <div className="flex flex-col justify-center bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || isTranslating}
            className={`w-full h-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-40 cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25'
            }`}
          >
            {isDownloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>İşleniyor ({scale}x)...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>İndirildi!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-black">{scale}x {getFormatExt()} İndir</span>
                  <span className="text-[9px] opacity-80 font-normal">
                    {targetW > 0 ? `${targetW}×${targetH}` : ''} • %{quality}
                  </span>
                </div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
