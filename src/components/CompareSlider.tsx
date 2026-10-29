import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, Image as ImageIcon } from 'lucide-react';
import { TextBlock, OverlayStyle } from '../types';
import { renderTranslatedImageToCanvas } from '../utils/canvasRenderer';

interface CompareSliderProps {
  originalImage: string;
  textBlocks: TextBlock[];
  overlayStyle: OverlayStyle;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  originalImage,
  textBlocks,
  overlayStyle,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const [translatedDataUrl, setTranslatedDataUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate translated canvas data URL when blocks or style change
  useEffect(() => {
    let isMounted = true;
    async function generate() {
      try {
        const canvas = await renderTranslatedImageToCanvas(originalImage, textBlocks, overlayStyle, 1);
        if (isMounted) {
          setTranslatedDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Slider render error:', err);
      }
    }
    generate();
    return () => {
      isMounted = false;
    };
  }, [originalImage, textBlocks, overlayStyle]);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const percent = (clamped / rect.width) * 100;
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, handleMove]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex items-center justify-between w-full max-w-4xl px-2 mb-3 text-xs font-medium text-slate-400">
        <span className="flex items-center gap-1.5 text-amber-400">
          <ImageIcon className="w-3.5 h-3.5" /> Orijinal Yabancı Metin (Sol)
        </span>
        <span className="text-slate-500">Ortadaki çizgiyi sağa-sola kaydırın</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <Sparkles className="w-3.5 h-3.5" /> Türkçe Çevrilmiş Hal (Sağ)
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full max-w-4xl max-h-[70vh] overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 select-none shadow-2xl cursor-ew-resize"
        onMouseDown={() => setIsDragging(true)}
        onTouchMove={handleTouchMove}
        onMouseMove={handleMouseMove}
        onClick={(e) => handleMove(e.clientX)}
      >
        {/* Original Image (Bottom Layer) */}
        <img
          src={originalImage}
          alt="Orijinal Görsel"
          className="w-full h-auto object-contain block mx-auto pointer-events-none"
        />

        {/* Translated Image (Top Layer, clipped by slider position) */}
        {translatedDataUrl && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
          >
            <img
              src={translatedDataUrl}
              alt="Türkçe Çevrilmiş Görsel"
              className="w-full h-auto object-contain block mx-auto"
            />
          </div>
        )}

        {/* Divider Bar */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Handle button */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-900 border-2 border-emerald-400 text-white flex items-center justify-center shadow-lg pointer-events-auto">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-emerald-400 rounded-full" />
              <div className="w-0.5 h-3 bg-emerald-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Badges on corner */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[11px] font-semibold text-amber-300 border border-white/10 pointer-events-none">
          Orijinal
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-emerald-950/80 backdrop-blur-md text-[11px] font-semibold text-emerald-300 border border-emerald-500/30 pointer-events-none">
          Türkçe Çeviri
        </div>
      </div>
    </div>
  );
};
