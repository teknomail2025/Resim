import { TextBlock, OverlayStyle, ExportOptions, FontCategory } from '../types';
import { sampleBorderColor } from './canvasRenderer';

/**
 * Maps fontCategory to suitable web and offline local PC system fonts
 */
export function getFontFamilyString(fontCategory?: FontCategory): string {
  switch (fontCategory) {
    case 'comic':
      return "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Chalkboard', 'Bangers', cursive, sans-serif";
    case 'display':
      return "'Impact', 'Arial Black', 'Haettenschweiler', 'Anton', 'Oswald', sans-serif";
    case 'serif':
      return "'Georgia', 'Playfair Display', 'Merriweather', 'Times New Roman', serif";
    case 'handwriting':
      return "'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive";
    case 'monospace':
      return "'JetBrains Mono', Consolas, Monaco, Menlo, 'Courier New', monospace";
    case 'slab':
      return "'Roboto Slab', 'Rockwell', 'Georgia', serif";
    case 'sans-serif':
    default:
      return "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  }
}

/**
 * Convolution 3x3 kernel sharpening filter to reconstruct edge definition
 */
export function applyConvolutionSharpen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  level: 'none' | 'light' | 'medium' | 'strong' = 'medium'
) {
  if (level === 'none') return;

  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const output = ctx.createImageData(width, height);
    const dst = output.data;

    // Weight factor based on intensity
    let centerWeight = 1.6;
    let edgeWeight = -0.15;

    if (level === 'light') {
      centerWeight = 1.4;
      edgeWeight = -0.1;
    } else if (level === 'strong') {
      centerWeight = 2.2;
      edgeWeight = -0.3;
    }

    const rowBytes = width * 4;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;

        // Apply unsharp mask filter to R, G, B
        for (let c = 0; c < 3; c++) {
          const up = data[idx - rowBytes + c];
          const down = data[idx + rowBytes + c];
          const left = data[idx - 4 + c];
          const right = data[idx + 4 + c];
          const current = data[idx + c];

          const val =
            current * centerWeight +
            (up + down + left + right) * edgeWeight;

          dst[idx + c] = Math.min(255, Math.max(0, val));
        }
        dst[idx + 3] = data[idx + 3]; // Preserve alpha
      }
    }

    ctx.putImageData(output, 0, 0);
  } catch (err) {
    // Canvas tainted or out-of-memory fallback
    console.warn('Upscaler sharpen skipped due to canvas restrictions', err);
  }
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
 * Calculates optimal font size inside target bounding box
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
  maxSize = 120
): { fontSize: number; lines: string[]; lineHeight: number } {
  let low = minSize;
  let high = Math.min(maxSize, Math.max(minSize, Math.floor(targetHeight * 0.88)));
  let bestSize = low;
  let bestLines = [text];

  const stylePrefix = isItalic ? 'italic ' : '';

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    ctx.font = `${stylePrefix}${fontWeight} ${mid}px ${fontFamily}`;
    const lines = wrapText(ctx, text, targetWidth - 6);
    const lineHeight = mid * 1.22;
    const totalHeight = lines.length * lineHeight;

    const maxLineWidth = Math.max(...lines.map((l) => ctx.measureText(l).width));

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
    lineHeight: Math.max(12, bestSize * 1.22),
  };
}

/**
 * Client-Side Resolution Upscaler & High-Quality Image Renderer.
 * Scales image resolution up to 2x (High Quality Mode) or 4x (Super-Resolution),
 * applies sub-pixel edge sharpening to eliminate blur, and draws translated text
 * directly at the upscaled coordinate space so typography is razor-sharp.
 */
export async function upscaleAndRenderTranslatedImage(
  imageSource: HTMLImageElement | string,
  textBlocks: TextBlock[],
  overlayStyle: OverlayStyle = 'seamless',
  options: Partial<ExportOptions> = {}
): Promise<HTMLCanvasElement> {
  const scale = options.scale ?? (options.enableUpscaler ? 2 : 1);
  const sharpness = options.sharpness ?? 'medium';

  // Ensure web fonts are completely ready before upscaling
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Fallback
    }
  }

  // 1. Resolve image
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

  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  const targetW = Math.round(origW * scale);
  const targetH = Math.round(origH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context for upscaler');

  // Multi-pass high quality canvas scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw base image upscaled
  ctx.drawImage(img, 0, 0, targetW, targetH);

  // If upscaled (2x or higher), apply edge-reconstruction sharpening before drawing text
  if (scale > 1 && sharpness !== 'none') {
    applyConvolutionSharpen(ctx, targetW, targetH, sharpness);
  }

  // 2. Render each text block at the upscaled canvas coordinate space
  for (const block of textBlocks) {
    if (block.isVisible === false) continue;

    const [ymin, xmin, ymax, xmax] = block.boundingBox;
    const bx = (xmin / 1000) * targetW;
    const by = (ymin / 1000) * targetH;
    const bw = Math.max(12, ((xmax - xmin) / 1000) * targetW);
    const bh = Math.max(12, ((ymax - ymin) / 1000) * targetH);

    const padX = Math.min(10 * scale, bw * 0.05);
    const padY = Math.min(8 * scale, bh * 0.05);

    const patchX = Math.max(0, bx - padX);
    const patchY = Math.max(0, by - padY);
    const patchW = Math.min(targetW - patchX, bw + padX * 2);
    const patchH = Math.min(targetH - patchY, bh + padY * 2);

    const bgColor = block.customBgColor || block.backgroundColor || '#1e293b';
    const textColor = block.customTextColor || block.textColor || '#ffffff';
    const rawFontWeight = block.customFontWeight || block.fontWeight || 'bold';
    const fontWeight = rawFontWeight === 'bold' ? 'bold' : 'normal';
    const isItalic = block.customIsItalic ?? block.isItalic ?? false;
    const isUppercase = block.customIsUppercase ?? block.isUppercase ?? false;
    const fontCat = block.customFontCategory || block.fontCategory || 'sans-serif';
    const fontFamily = getFontFamilyString(fontCat);

    ctx.save();

    // Inpaint / Background Patch
    if (overlayStyle === 'seamless') {
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, Math.max(4, 4 * scale));
      ctx.fill();
    } else if (overlayStyle === 'glass') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = Math.max(1.5, 1.5 * scale);
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, Math.max(6, 6 * scale));
      ctx.fill();
      ctx.stroke();
    } else if (overlayStyle === 'highlight') {
      ctx.fillStyle = 'rgba(14, 165, 233, 0.22)';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = Math.max(2, 2 * scale);
      ctx.beginPath();
      ctx.roundRect(patchX, patchY, patchW, patchH, Math.max(4, 4 * scale));
      ctx.fill();
      ctx.stroke();
    }

    // Prepare text
    let textToRender = block.translatedText || block.originalText;
    if (isUppercase) {
      textToRender = textToRender.toLocaleUpperCase('tr-TR');
    }

    let fontSize = 16 * scale;
    let lines: string[] = [textToRender];
    let lineHeight = 20 * scale;

    const stylePrefix = isItalic ? 'italic ' : '';

    if (block.customFontSize && block.customFontSize > 0) {
      fontSize = block.customFontSize * scale;
      ctx.font = `${stylePrefix}${fontWeight} ${fontSize}px ${fontFamily}`;
      lines = wrapText(ctx, textToRender, Math.max(20, patchW - 8 * scale));
      lineHeight = Math.max(12 * scale, fontSize * 1.25);
    } else {
      const optimal = calculateOptimalFontSize(
        ctx,
        textToRender,
        patchW - 8 * scale,
        patchH - 6 * scale,
        fontFamily,
        fontWeight,
        isItalic,
        Math.max(10, 10 * scale),
        Math.max(80, 80 * scale)
      );
      fontSize = optimal.fontSize;
      lines = optimal.lines;
      lineHeight = optimal.lineHeight;
    }

    ctx.font = `${stylePrefix}${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = overlayStyle === 'glass' ? '#ffffff' : textColor;
    ctx.textBaseline = 'middle';

    // Stroke outline handling (comic / meme / billboard styles)
    const hasStroke = Boolean(block.strokeColor) || fontCat === 'comic';
    const strokeColor = block.strokeColor || '#000000';
    const strokeWidth = (block.strokeWidth || Math.max(2, fontSize * 0.08));

    const totalTextHeight = lines.length * lineHeight;
    let startY = patchY + (patchH - totalTextHeight) / 2 + lineHeight / 2;

    for (const line of lines) {
      let textX = patchX + 4 * scale;
      if (block.textAlign === 'center') {
        ctx.textAlign = 'center';
        textX = patchX + patchW / 2;
      } else if (block.textAlign === 'right') {
        ctx.textAlign = 'right';
        textX = patchX + patchW - 4 * scale;
      } else {
        ctx.textAlign = 'left';
      }

      // Draw stroke outline if applicable
      if (hasStroke) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(line, textX, startY);
      }

      // Drop shadow for crisp contrast
      ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
      ctx.shadowBlur = Math.max(2, 2 * scale);
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
 * Downloads translated and upscaled image with specific format and quality
 */
export async function downloadWithCustomSettings(
  imageSource: HTMLImageElement | string,
  textBlocks: TextBlock[],
  overlayStyle: OverlayStyle = 'seamless',
  options: ExportOptions = {
    format: 'png',
    scale: 2,
    quality: 0.95,
    sharpness: 'medium',
    enableUpscaler: true,
  },
  baseFilename = 'cevrilmis-gorsel'
) {
  const canvas = await upscaleAndRenderTranslatedImage(
    imageSource,
    textBlocks,
    overlayStyle,
    options
  );

  let mimeType = 'image/png';
  let ext = 'png';

  if (options.format === 'jpeg') {
    mimeType = 'image/jpeg';
    ext = 'jpg';
  } else if (options.format === 'webp') {
    mimeType = 'image/webp';
    ext = 'webp';
  }

  const dataUrl = canvas.toDataURL(mimeType, options.quality);
  const scaleTag = options.scale > 1 ? `-${options.scale}x-HD` : '';
  const filename = `${baseFilename}${scaleTag}.${ext}`;

  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
