import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Edit3,
  Image as ImageIcon,
  Eye,
  ArrowLeftRight,
} from 'lucide-react';
import { TextBlock, OverlayStyle, ViewMode } from '../types';
import { CompareSlider } from './CompareSlider';
import { renderTranslatedImageToCanvas } from '../utils/canvasRenderer';
import { getFontFamilyString } from '../utils/upscaler';
import { getResolvedFontFamily } from '../utils/fontEngine';

interface ImageViewerProps {
  imageSrc: string;
  textBlocks: TextBlock[];
  viewMode: ViewMode;
  overlayStyle: OverlayStyle;
  onSelectBlock: (block: TextBlock) => void;
  hoveredBlockId: string | null;
  setHoveredBlockId: (id: string | null) => void;
  isCompareOriginal?: boolean;
  onToggleCompareOriginal?: (showOriginal: boolean) => void;
  selectedBlockId?: string | null;
  onSelectBlockId?: (id: string | null) => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  imageSrc,
  textBlocks,
  viewMode,
  overlayStyle,
  onSelectBlock,
  hoveredBlockId,
  setHoveredBlockId,
  isCompareOriginal,
  onToggleCompareOriginal,
  selectedBlockId,
  onSelectBlockId,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [renderedCanvasUrl, setRenderedCanvasUrl] = useState<string | null>(null);

  // Local comparison state
  const [internalIsOriginal, setInternalIsOriginal] = useState(false);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Resolved compare state: sync with external prop if provided, else use local state
  const isToggledOriginal = isCompareOriginal !== undefined ? isCompareOriginal : internalIsOriginal;
  const isShowingOriginal = isToggledOriginal || isHoldingOriginal;

  const handleSetToggledOriginal = (val: boolean) => {
    setInternalIsOriginal(val);
    onToggleCompareOriginal?.(val);
  };

  // Keyboard shortcut listener (Spacebar or 'C' key to temporarily peek original)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (e.code === 'Space' || e.key === 'c' || e.key === 'C') {
        if (e.code === 'Space') {
          e.preventDefault();
        }
        setIsHoldingOriginal(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'c' || e.key === 'C') {
        setIsHoldingOriginal(false);
      }
    };

    const handleBlur = () => {
      setIsHoldingOriginal(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Generate rendered translated canvas data URL (single unified picture)
  useEffect(() => {
    let active = true;
    renderTranslatedImageToCanvas(imageSrc, textBlocks, overlayStyle, 2)
      .then((canvas) => {
        if (active) setRenderedCanvasUrl(canvas.toDataURL('image/png'));
      })
      .catch(console.error);
    return () => {
      active = false;
    };
  }, [imageSrc, textBlocks, overlayStyle]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.altKey || viewMode === 'pure-image')) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // 1. Slider Mode
  if (viewMode === 'slider') {
    return (
      <div className="w-full flex justify-center py-2">
        <CompareSlider
          originalImage={imageSrc}
          textBlocks={textBlocks}
          overlayStyle={overlayStyle}
        />
      </div>
    );
  }

  // 2. Side-by-Side Mode
  if (viewMode === 'side-by-side') {
    return (
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Original */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400">
            <span>Orijinal Yabancı Görsel</span>
            <span className="text-[11px] bg-slate-800 px-2 py-0.5 rounded text-amber-400 font-bold">
              Orijinal
            </span>
          </div>
          <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-xl aspect-auto flex items-center justify-center p-2">
            <img
              src={imageSrc}
              alt="Orijinal"
              className="max-h-[65vh] w-auto object-contain rounded-lg select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Right: Translated Real Image */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 text-xs font-semibold text-emerald-400">
            <span className="flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5" /> Türkçe Çevrilmiş Görsel
            </span>
            <span className="text-[11px] bg-emerald-950 px-2 py-0.5 rounded text-emerald-300 border border-emerald-500/30 font-bold">
              Tek Parça Resim
            </span>
          </div>
          <div className="relative rounded-xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-xl aspect-auto flex items-center justify-center p-2">
            {renderedCanvasUrl ? (
              <img
                src={renderedCanvasUrl}
                alt="Türkçe Çeviri"
                className="max-h-[65vh] w-auto object-contain rounded-lg select-none"
                draggable={false}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 animate-pulse">
                Görsel oluşturuluyor...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. PURE IMAGE MODE (Default: Normal, unified image without HTML badge clutter, with Instant Compare Overlay)
  if (viewMode === 'pure-image') {
    return (
      <div className="relative flex flex-col items-center w-full">
        {/* Floating Compare Active Indicator (Top-Left) */}
        <div className="absolute top-3 left-3 z-30 pointer-events-none transition-all duration-200">
          {isShowingOriginal ? (
            <div className="flex items-center gap-2 bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-3 py-1.5 shadow-xl text-amber-200">
              <Eye className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold">Orijinal Görsel</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                {isHoldingOriginal ? 'Basılı Tutuluyor' : 'Görüntüleniyor'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 rounded-xl px-3 py-1.5 shadow-xl text-emerald-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold">Türkçe Çevrilmiş Görsel</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                Normal Resim
              </span>
            </div>
          )}
        </div>

        {/* Floating Zoom & Pan Controls (Top-Right) */}
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Yakınlaştır"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Uzaklaştır"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Sıfırla"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport with pure rendered image and underlying original */}
        <div
          ref={containerRef}
          className="relative w-full max-w-4xl max-h-[72vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 flex items-center justify-center select-none shadow-2xl p-2 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div
            className="relative inline-block transition-transform duration-100 ease-out origin-center"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            }}
          >
            {/* Base Layer: Original Image (Instant fallback & compare foundation) */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Orijinal Görsel"
              className="block max-h-[68vh] w-auto object-contain mx-auto rounded-lg shadow-inner select-none pointer-events-none"
              draggable={false}
            />

            {/* Top Layer: Translated Canvas Image with smooth cross-fade */}
            {renderedCanvasUrl ? (
              <img
                src={renderedCanvasUrl}
                alt="Türkçe Çevrilmiş Görsel"
                className={`absolute inset-0 w-full h-full object-contain mx-auto rounded-lg pointer-events-none select-none transition-opacity duration-150 ease-in-out ${
                  isShowingOriginal ? 'opacity-0' : 'opacity-100'
                }`}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-slate-300 rounded-lg">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold">Çeviri görsel üzerine işleniyor...</span>
              </div>
            )}

            {/* Interactive selection & keyboard focus targets over pure rendered image */}
            {!isShowingOriginal && (
              <div
                className="absolute inset-0 w-full h-full pointer-events-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onSelectBlockId?.(null);
                  }
                }}
              >
                {textBlocks.map((block, idx) => {
                  if (block.isVisible === false) return null;
                  const [ymin, xmin, ymax, xmax] = block.boundingBox;
                  const topPct = ymin / 10;
                  const leftPct = xmin / 10;
                  const widthPct = Math.max(1, (xmax - xmin) / 10);
                  const heightPct = Math.max(1, (ymax - ymin) / 10);
                  const isSelected = selectedBlockId === block.id;
                  const isHovered = hoveredBlockId === block.id;

                  return (
                    <div
                      key={block.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBlockId?.(block.id);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        onSelectBlock(block);
                      }}
                      onMouseEnter={() => setHoveredBlockId(block.id)}
                      onMouseLeave={() => setHoveredBlockId(null)}
                      className={`absolute cursor-pointer transition-all duration-150 rounded-sm ${
                        isSelected
                          ? 'ring-2 ring-emerald-400 bg-emerald-500/15 z-30 shadow-lg shadow-emerald-500/20'
                          : isHovered
                          ? 'ring-1 ring-emerald-400/70 bg-emerald-500/5 z-20'
                          : 'border border-transparent hover:border-emerald-400/40 z-10'
                      }`}
                      style={{
                        top: `${topPct}%`,
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        height: `${heightPct}%`,
                      }}
                      title={`Balon #${idx + 1}: ${block.translatedText}\n[Çift Tık / Enter]: Düzenle | [Del]: Sil | [Ok Tuşları]: Taşı | [+/-]: Boyut`}
                    >
                      {/* Active Selection Badge with font match and keyboard shortcut hints */}
                      {isSelected && (
                        <div
                          className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 border border-emerald-400/80 rounded-lg px-2 py-0.5 text-[10px] text-emerald-300 font-mono flex items-center gap-1.5 shadow-xl pointer-events-none select-none z-40"
                        >
                          <span className="font-bold text-white">#{idx + 1}</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-amber-300 font-sans font-semibold">
                            {block.matchedSystemFont || 'Font'} ({block.fontSimilarityScore || 95}%)
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-300">Enter: Düzenle</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-rose-400 font-semibold">Del: Sil</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating Compare Translation Overlay Dock (Bottom Center) */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            {/* Segmented Switch: Translated vs Original */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSetToggledOriginal(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  !isShowingOriginal
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Türkçe çevrilmiş resmi görüntüle"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Çevrilmiş</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetToggledOriginal(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isShowingOriginal
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Orijinal yabancı görseli görüntüle"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Orijinal</span>
              </button>
            </div>

            <div className="w-[1px] h-5 bg-slate-700/80 mx-0.5" />

            {/* Instant Hold to Compare Button */}
            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation();
                setIsHoldingOriginal(true);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                setIsHoldingOriginal(false);
              }}
              onMouseLeave={() => setIsHoldingOriginal(false)}
              onTouchStart={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsHoldingOriginal(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsHoldingOriginal(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer border ${
                isHoldingOriginal
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-95'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
              }`}
              title="Orijinal görseli anlık görmek için bu butona basılı tutun (bırakınca çeviri geri gelir)"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isHoldingOriginal ? 'Orijinal Görünüyor...' : 'Basılı Tut: Orijinal'}</span>
            </button>

            {/* Quick Keyboard Shortcut Pill */}
            <div className="hidden md:flex items-center gap-1 text-[10px] text-slate-400 font-mono px-2 py-1 bg-slate-950/80 rounded-lg border border-slate-800/80 select-none">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold border border-slate-700 text-[9px]">
                Boşluk
              </kbd>
              <span className="text-slate-500 text-[10px]">veya</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold border border-slate-700 text-[9px]">
                C
              </kbd>
            </div>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Normal Resim Formatında Çeviri
          </span>
          <span>•</span>
          <span className="text-slate-300">
            Metinler doğrudan resmin orijinal piksellerine işlenmiştir.
          </span>
          <span>•</span>
          <span className="text-amber-400/90 font-medium flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" />
            Orijinali görmek için butona basılı tutabilir veya Boşluk/C tuşuna basabilirsiniz.
          </span>
        </div>
      </div>
    );
  }

  // 4. Interactive Overlay Box Mode (When user explicitly chooses box editing)
  return (
    <div className="relative flex flex-col items-center w-full">
      {/* Floating Compare Active Indicator (Top-Left) */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none transition-all duration-200">
        {isShowingOriginal ? (
          <div className="flex items-center gap-2 bg-amber-950/90 backdrop-blur-md border border-amber-500/50 rounded-xl px-3 py-1.5 shadow-xl text-amber-200">
            <Eye className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold">Orijinal Görsel (Kutular Gizlendi)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-xl text-slate-300">
            <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold">Kutu Düzenleme Modu</span>
          </div>
        )}
      </div>

      {/* Floating Zoom & Pan Controls (Top-Right) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Yakınlaştır"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Uzaklaştır"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />
        <button
          onClick={handleResetZoom}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Sıfırla"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl max-h-[72vh] overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950 flex items-center justify-center select-none shadow-2xl"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div
          className="relative inline-block transition-transform duration-100 ease-out origin-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          }}
        >
          {/* Base Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Kaynak Görsel"
            className="block max-h-[68vh] w-auto object-contain mx-auto pointer-events-none rounded-lg select-none"
            draggable={false}
          />

          {/* Interactive Text Overlays (hidden smoothly if compare mode is active) */}
          <div
            className={`transition-opacity duration-150 ease-in-out ${
              isShowingOriginal ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            {textBlocks.map((block) => {
              if (block.isVisible === false) return null;
              const [ymin, xmin, ymax, xmax] = block.boundingBox;
              const topPct = ymin / 10;
              const leftPct = xmin / 10;
              const widthPct = Math.max(1, (xmax - xmin) / 10);
              const heightPct = Math.max(1, (ymax - ymin) / 10);

              const isSelected = selectedBlockId === block.id;
              const isHovered = hoveredBlockId === block.id;
              const bgColor = block.customBgColor || block.backgroundColor || '#1e293b';
              const textColor = block.customTextColor || block.textColor || '#ffffff';
              const fontWeight = block.fontWeight === 'bold' ? 'bold' : 'normal';

              const fontCat = block.customFontCategory || block.fontCategory || 'sans-serif';
              const hasStroke = block.customHasStroke ?? block.hasStroke ?? (Boolean(block.strokeColor) || fontCat === 'comic');
              const strokeColor = block.customStrokeColor || block.strokeColor || (textColor === '#ffffff' ? '#000000' : '#ffffff');
              const strokeWidth = block.customStrokeWidth || block.strokeWidth || 1.5;
              const letterSpacing = block.customLetterSpacing ?? block.letterSpacing;
              const fontFamily = getResolvedFontFamily(block);

              return (
                <div
                  key={block.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBlockId?.(block.id);
                    onSelectBlock(block);
                  }}
                  onMouseEnter={() => setHoveredBlockId(block.id)}
                  onMouseLeave={() => setHoveredBlockId(null)}
                  className={`absolute cursor-pointer transition-all duration-150 flex items-center justify-center group overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-emerald-400 z-30 scale-[1.03] shadow-lg shadow-emerald-500/25'
                      : isHovered
                      ? 'ring-2 ring-emerald-400/80 z-20 scale-[1.02]'
                      : 'z-10'
                  }`}
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor:
                      overlayStyle === 'seamless'
                        ? bgColor
                        : overlayStyle === 'glass'
                        ? 'rgba(15, 23, 42, 0.9)'
                        : overlayStyle === 'highlight'
                        ? 'rgba(14, 165, 233, 0.25)'
                        : 'transparent',
                    color: overlayStyle === 'glass' ? '#ffffff' : textColor,
                    border:
                      overlayStyle === 'glass'
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : overlayStyle === 'highlight'
                        ? '1.5px solid #0284c7'
                        : 'none',
                    borderRadius: '3px',
                  }}
                  title={`Orijinal: ${block.originalText}\nTürkçe: ${block.translatedText}\nEşleşen Font: ${block.matchedSystemFont || 'Sistem Fontu'} (%${block.fontSimilarityScore || 95})\nDüzenlemek için tıkla`}
                >
                  <div
                    className="w-full h-full px-1 py-0.5 flex items-center justify-center leading-tight select-none overflow-hidden"
                    style={{
                      fontWeight,
                      textAlign: block.textAlign || 'center',
                      fontFamily,
                      fontStyle: (block.customIsItalic ?? block.isItalic) ? 'italic' : 'normal',
                      textTransform: (block.customIsUppercase ?? block.isUppercase) ? 'uppercase' : 'none',
                      WebkitTextStroke: hasStroke ? `${strokeWidth}px ${strokeColor}` : undefined,
                      letterSpacing: letterSpacing ? `${letterSpacing}px` : undefined,
                      fontSize: block.customFontSize
                        ? `${block.customFontSize}px`
                        : 'clamp(8px, 1.3vw, 24px)',
                    }}
                  >
                    <span className="break-words line-clamp-3">
                      {(block.customIsUppercase ?? block.isUppercase)
                        ? (block.translatedText || '').toLocaleUpperCase('tr-TR')
                        : block.translatedText}
                    </span>
                  </div>
                  <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-slate-900/90 text-emerald-400 p-0.5 rounded shadow pointer-events-none transition-opacity">
                    <Edit3 className="w-2.5 h-2.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Compare Translation Overlay Dock in Box Edit Mode too */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => handleSetToggledOriginal(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                !isShowingOriginal
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Çevrilmiş kutuları göster"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Çeviri Kutuları</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetToggledOriginal(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isShowingOriginal
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kutuları gizleyip orijinal görseli göster"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Orijinal</span>
            </button>
          </div>

          <div className="w-[1px] h-5 bg-slate-700/80 mx-0.5" />

          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsHoldingOriginal(true);
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              setIsHoldingOriginal(false);
            }}
            onMouseLeave={() => setIsHoldingOriginal(false)}
            onTouchStart={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsHoldingOriginal(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setIsHoldingOriginal(false);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all select-none cursor-pointer border ${
              isHoldingOriginal
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-95'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-500/60'
            }`}
            title="Orijinal görseli anlık görmek için bu butona basılı tutun"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isHoldingOriginal ? 'Orijinal...' : 'Basılı Tut: Orijinal'}</span>
          </button>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        💡 Kutu Düzenleme Modu: İstediğiniz kutuya tıklayıp çeviriyi değiştirebilirsiniz. Karşılaştırma butonlarıyla orijinali görebilirsiniz.
      </p>
    </div>
  );
};

