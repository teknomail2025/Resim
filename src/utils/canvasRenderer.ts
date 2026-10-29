import { TextBlock, OverlayStyle } from '../types';
import { getFontFamilyString } from './upscaler';
import { getResolvedFontFamily } from './fontEngine';

/**
 * Samples average color from the border pixels around a bounding box to create a seamless patch
 */
export function sampleBorderColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fallbackColor: string
): string {
  try {
    const pad = 3;
    const sx = Math.max(0, Math.floor(x - pad));
    const sy = Math.max(0, Math.floor(y - pad));
    const sw = Math.min(ctx.canvas.width - sx, Math.ceil(width + pad * 2));
    const sh = Math.min(ctx.canvas.height - sy, Math.ceil(height + pad * 2));

    if (sw <= 0 || sh <= 0) return fallbackColor;

    const imgData = ctx.getImageData(sx, sy, sw, sh);
    const data = imgData.data;

    let r = 0, g = 0, b = 0, count = 0;
    // Sample top and bottom edge
    for (let i = 0; i < sw; i += 2) {
      // top row
      let idx = (0 * sw + i) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
      // bottom row
      idx = ((sh - 1) * sw + i) * 4;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count++;
    }

    if (count > 0) {
      const avgR = Math.round(r / count);
      const avgG = Math.round(g / count);
      const avgB = Math.round(b / count);
      return `rgb(${avgR}, ${avgG}, ${avgB})`;
    }
  } catch (err) {
    // Canvas tainted or out of bounds fallback
  }
  return fallbackColor;
}

/**
 * Wraps text into lines that fit within a maxWidth
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/);
  if (words.length <= 1) return [text];

  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Calculates optimal font size for a text block to fit inside width & height
 */
function calculateOptimalFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  targetWidth: number,
  targetHeight: number,
  fontFamily: string,
  fontWeight: string,
  isItalic: boolean,
  minSize = 10,
  maxSize = 72
): { fontSize: number; lines: string[]; lineHeight: number } {
  let low = minSize;
  let high = Math.min(maxSize, Math.max(minSize, Math.floor(targetHeight * 0.85)));
  let bestSize = low;
  let bestLines = [text];
  const stylePrefix = isItalic ? 'italic ' : '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    ctx.font = `${stylePrefix}${fontWeight} ${mid}px ${fontFamily}`;
    const lines = wrapText(ctx, text, targetWidth - 6);
    const lineHeight = mid * 1.2;
    const totalHeight = lines.length * lineHeight;

    const maxLineWidth = Math.max(...lines.map(l => ctx.measureText(l).width));

    if (maxLineWidth <= targetWidth && totalHeight <= targetHeight) {
      bestSize = mid;
      bestLines = lines;
      low = mid + 1; // Try bigger
    } else {
      high = mid - 1; // Too big
    }
  }

  return {
    fontSize: Math.max(10, bestSize),
    lines: bestLines,
    lineHeight: Math.max(12, bestSize * 1.2),
  };
}

/**
 * Renders translated image to an HTML Canvas
 */
export async function renderTranslatedImageToCanvas(
  imageSource: HTMLImageElement | string,
  textBlocks: TextBlock[],
  overlayStyle: OverlayStyle = 'seamless',
  scale = 1
): Promise<HTMLCanvasElement> {
  // Ensure all custom web fonts (Bangers, Anton, Caveat, Playfair, etc.) are loaded before rendering
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Fallback gracefully if font loading check fails
    }
  }

  let img: HTMLImageElement;

  if (typeof imageSource === 'string') {
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const canvas = document.createElement('canvas');
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  canvas.width = w * scale;
  canvas.height = h * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  ctx.scale(scale, scale);

  // 1. Draw base image
  ctx.drawImage(img, 0, 0, w, h);

  // 2. Render each text block
  for (const block of textBlocks) {
    if (block.isVisible === false) continue;

    const [ymin, xmin, ymax, xmax] = block.boundingBox;
    const bx = (xmin / 1000) * w;
    const by = (ymin / 1000) * h;
    const bw = Math.max(10, ((xmax - xmin) / 1000) * w);
    const bh = Math.max(10, ((ymax - ymin) / 1000) * h);

    const padX = Math.min(8, bw * 0.05);
    const padY = Math.min(6, bh * 0.05);

    const patchX = Math.max(0, bx - padX);
    const patchY = Math.max(0, by - padY);
    const patchW = Math.min(w - patchX, bw + padX * 2);
    const patchH = Math.min(h - patchY, bh + padY * 2);

    const bgColor = block.customBgColor || block.backgroundColor || '#1e293b';
    const textColor = block.customTextColor || block.textColor || '#ffffff';
    const rawFontWeight = block.customFontWeight || block.fontWeight || 'bold';
    const fontWeight = rawFontWeight === 'bold' ? 'bold' : 'normal';
    const isItalic = block.customIsItalic ?? block.isItalic ?? false;
    const isUppercase = block.customIsUppercase ?? block.isUppercase ?? false;
    const fontCat = block.customFontCategory || block.fontCategory || 'sans-serif';
    const fontFamily = getResolvedFontFamily(block);

    ctx.save();

    // Letter-spacing handling
    const letterSpacing = block.customLetterSpacing ?? block.letterSpacing;
    if (letterSpacing && 'letterSpacing' in ctx) {
      try {
        (ctx as any).letterSpacing = `${letterSpacing}px`;
      } catch (e) {
        // Fallback for older canvas implementations
      }
    }

    if (overlayStyle === 'seamless') {
      // Inpaint with background color patch
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, 4);
      ctx.fill();
    } else if (overlayStyle === 'glass') {
      // Frosted / dark translucent badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, 6);
      ctx.fill();
      ctx.stroke();
    } else if (overlayStyle === 'highlight') {
      // Subtle highlight box
      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, 4);
      ctx.fill();
      ctx.stroke();
    }

    // Measure and render text with preserved casing
    let textToRender = block.translatedText || block.originalText;
    if (isUppercase) {
      textToRender = textToRender.toLocaleUpperCase('tr-TR');
    }

    let fontSize = 16;
    let lines: string[] = [textToRender];
    let lineHeight = 20;

    const stylePrefix = isItalic ? 'italic ' : '';

    if (block.customFontSize && block.customFontSize > 0) {
      fontSize = block.customFontSize;
      ctx.font = `${stylePrefix}${fontWeight} ${fontSize}px ${fontFamily}`;
      lines = wrapText(ctx, textToRender, Math.max(20, patchW - 6));
      lineHeight = Math.max(12, fontSize * 1.25);
    } else {
      const optimal = calculateOptimalFontSize(
        ctx,
        textToRender,
        patchW - 6,
        patchH - 4,
        fontFamily,
        fontWeight,
        isItalic,
        10,
        64
      );
      fontSize = optimal.fontSize;
      lines = optimal.lines;
      lineHeight = optimal.lineHeight;
    }

    ctx.font = `${stylePrefix}${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = overlayStyle === 'glass' ? '#ffffff' : textColor;
    ctx.textBaseline = 'middle';

    // Stroke outline handling (comic / memes / bold banners)
    const hasStroke = block.customHasStroke ?? block.hasStroke ?? (Boolean(block.strokeColor) || fontCat === 'comic');
    const strokeColor = block.customStrokeColor || block.strokeColor || (textColor === '#ffffff' ? '#000000' : '#ffffff');
    const strokeWidth = block.customStrokeWidth || block.strokeWidth || Math.max(2, fontSize * 0.08);

    const totalTextHeight = lines.length * lineHeight;
    let startY = patchY + (patchH - totalTextHeight) / 2 + lineHeight / 2;

    for (const line of lines) {
      let textX = patchX + 4;
      if (block.textAlign === 'center') {
        ctx.textAlign = 'center';
        textX = patchX + patchW / 2;
      } else if (block.textAlign === 'right') {
        ctx.textAlign = 'right';
        textX = patchX + patchW - 4;
      } else {
        ctx.textAlign = 'left';
      }

      if (hasStroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, textX, startY);
      }

      // Add soft text shadow if contrast is needed
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 3;
      ctx.fillText(line, textX, startY);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      startY += lineHeight;
    }

    ctx.restore();
  }

  return canvas;
}

/**
 * Downloads translated canvas as PNG
 */
export async function downloadTranslatedImage(
  imageSource: HTMLImageElement | string,
  textBlocks: TextBlock[],
  overlayStyle: OverlayStyle = 'seamless',
  filename = 'cevrilmis-gorsel.png'
) {
  const canvas = await renderTranslatedImageToCanvas(imageSource, textBlocks, overlayStyle, 1.5);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copies translated canvas to user clipboard
 */
export async function copyCanvasToClipboard(
  imageSource: HTMLImageElement | string,
  textBlocks: TextBlock[],
  overlayStyle: OverlayStyle = 'seamless'
): Promise<boolean> {
  try {
    const canvas = await renderTranslatedImageToCanvas(imageSource, textBlocks, overlayStyle, 1);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}
