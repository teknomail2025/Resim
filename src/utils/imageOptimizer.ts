/**
 * Optimizes an image for fast OCR transmission without degrading text recognition.
 * Dramatically reduces latency by downsampling large multi-megapixel photos (e.g. 15MB down to ~150KB)
 * while preserving the full original source image for local crisp rendering and upscaling.
 */
export async function optimizeImageForOCR(
  imageDataUrl: string,
  maxDimension = 960,
  quality = 0.70
): Promise<{
  optimizedDataUrl: string;
  originalWidth: number;
  originalHeight: number;
  isDownscaled: boolean;
}> {
  return new Promise((resolve) => {
    // If it's an SVG, send directly
    if (imageDataUrl.startsWith('data:image/svg+xml')) {
      resolve({
        optimizedDataUrl: imageDataUrl,
        originalWidth: 800,
        originalHeight: 600,
        isDownscaled: false,
      });
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origW = img.naturalWidth || img.width;
      const origH = img.naturalHeight || img.height;

      // If already within reasonable dimensions and small, no downscaling needed
      if (origW <= maxDimension && origH <= maxDimension && imageDataUrl.length < 500000) {
        resolve({
          optimizedDataUrl: imageDataUrl,
          originalWidth: origW,
          originalHeight: origH,
          isDownscaled: false,
        });
        return;
      }

      // Calculate new scaled dimensions
      let targetW = origW;
      let targetH = origH;
      let isDownscaled = false;

      if (origW > maxDimension || origH > maxDimension) {
        isDownscaled = true;
        if (origW >= origH) {
          targetW = maxDimension;
          targetH = Math.round((origH * maxDimension) / origW);
        } else {
          targetH = maxDimension;
          targetW = Math.round((origW * maxDimension) / origH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          optimizedDataUrl: imageDataUrl,
          originalWidth: origW,
          originalHeight: origH,
          isDownscaled: false,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const optimized = canvas.toDataURL('image/jpeg', quality);
      resolve({
        optimizedDataUrl: optimized,
        originalWidth: origW,
        originalHeight: origH,
        isDownscaled,
      });
    };

    img.onerror = () => {
      // Fallback to original
      resolve({
        optimizedDataUrl: imageDataUrl,
        originalWidth: 800,
        originalHeight: 600,
        isDownscaled: false,
      });
    };

    img.src = imageDataUrl;
  });
}
