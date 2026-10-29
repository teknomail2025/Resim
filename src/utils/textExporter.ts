import { TextBlock } from '../types';

export interface ExportMetadata {
  detectedLanguage: string;
  detectedLanguageCode?: string;
  confidence?: string;
  targetLanguage?: string;
  summary?: string;
  imageFileName?: string;
}

/**
 * Escapes a single CSV cell value according to RFC 4180.
 * Wraps in quotes if contains commas, double quotes, or newlines.
 * Escapes inner double quotes as `""`.
 */
function escapeCSVField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 compliant CSV string with UTF-8 BOM for Excel/Google Sheets compatibility.
 */
export function generateCSVString(
  textBlocks: TextBlock[],
  metadata?: ExportMetadata
): string {
  const headers = [
    'Sıra No (Index)',
    'Orijinal Metin (Original Text)',
    'Türkçe Çeviri (Translated Text)',
    'Kategori (Category)',
    'Algılanan Font (Detected Font)',
    'Eşleşen Sistem Fontu (Matched Font)',
    'Font Benzerliği % (Similarity)',
    'Yazı Rengi (Text Color)',
    'Arka Plan Rengi (Background Color)',
    'Kalınlık (Font Weight)',
    'İtalik (Is Italic)',
    'Büyük Harf (Is Uppercase)',
    'Konum Y1 (ymin)',
    'Konum X1 (xmin)',
    'Konum Y2 (ymax)',
    'Konum X2 (xmax)',
    'Blok ID (Block ID)',
  ];

  const rows: string[] = [];

  // Optional metadata header comments or summary row
  rows.push(headers.map(escapeCSVField).join(','));

  textBlocks.forEach((block, index) => {
    const isBold = (block.customFontWeight || block.fontWeight) === 'bold';
    const isItalic = Boolean(block.customIsItalic ?? block.isItalic);
    const isUpper = Boolean(block.customIsUppercase ?? block.isUppercase);
    const matchedFont = block.customMatchedSystemFont || block.matchedSystemFont || 'Sistem Fontu';
    const detectedFont = block.detectedFontName || block.fontCategory || 'Standart';
    const similarity = block.fontSimilarityScore ? `${block.fontSimilarityScore}%` : '95%';
    const textColor = block.customTextColor || block.textColor || '#000000';
    const bgColor = block.customBgColor || block.backgroundColor || '#FFFFFF';
    const [ymin, xmin, ymax, xmax] = block.boundingBox || [0, 0, 0, 0];

    const row = [
      index + 1,
      block.originalText || '',
      block.translatedText || '',
      block.category || 'metin',
      detectedFont,
      matchedFont,
      similarity,
      textColor,
      bgColor,
      isBold ? 'Kalın (Bold)' : 'Normal',
      isItalic ? 'Evet' : 'Hayır',
      isUpper ? 'Evet' : 'Hayır',
      ymin,
      xmin,
      ymax,
      xmax,
      block.id,
    ];

    rows.push(row.map(escapeCSVField).join(','));
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 characters without mojibake
  return '\uFEFF' + rows.join('\r\n');
}

/**
 * Downloads text blocks as a CSV file.
 */
export function downloadAsCSV(
  textBlocks: TextBlock[],
  metadata?: ExportMetadata,
  filenamePrefix = 'gorsel-ceviriler'
): void {
  const csvContent = generateCSVString(textBlocks, metadata);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBrowserDownload(blob, `${filenamePrefix}-${Date.now()}.csv`);
}

/**
 * Generates structured, pretty-printed JSON data for export and integration with external tools.
 */
export function generateJSONString(
  textBlocks: TextBlock[],
  metadata?: ExportMetadata
): string {
  const exportPayload = {
    app: 'GörselÇevir',
    exportedAt: new Date().toISOString(),
    sourceLanguage: metadata?.detectedLanguage || 'Bilinmiyor',
    sourceLanguageCode: metadata?.detectedLanguageCode || 'auto',
    targetLanguage: metadata?.targetLanguage || 'Türkçe',
    confidence: metadata?.confidence || '%98',
    summary: metadata?.summary || '',
    totalBlocks: textBlocks.length,
    textBlocks: textBlocks.map((block, index) => {
      const isBold = (block.customFontWeight || block.fontWeight) === 'bold';
      const isItalic = Boolean(block.customIsItalic ?? block.isItalic);
      const isUpper = Boolean(block.customIsUppercase ?? block.isUppercase);
      const matchedFont = block.customMatchedSystemFont || block.matchedSystemFont || 'Segoe UI';
      const detectedFont = block.detectedFontName || block.fontCategory || 'sans-serif';
      const [ymin, xmin, ymax, xmax] = block.boundingBox || [0, 0, 0, 0];

      return {
        id: block.id,
        index: index + 1,
        originalText: block.originalText || '',
        translatedText: block.translatedText || '',
        category: block.category || 'label',
        typography: {
          detectedFont,
          matchedSystemFont: matchedFont,
          matchedFontStack: block.matchedFontStack,
          similarityScore: block.fontSimilarityScore || 95,
          fontWeight: isBold ? 'bold' : 'normal',
          isItalic,
          isUppercase: isUpper,
        },
        styling: {
          textColor: block.customTextColor || block.textColor || '#000000',
          backgroundColor: block.customBgColor || block.backgroundColor || '#FFFFFF',
          strokeColor: block.customStrokeColor || block.strokeColor,
          strokeWidth: block.customStrokeWidth || block.strokeWidth,
        },
        boundingBox: {
          ymin,
          xmin,
          ymax,
          xmax,
          scale: '0-1000',
        },
      };
    }),
  };

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Downloads text blocks as a JSON file.
 */
export function downloadAsJSON(
  textBlocks: TextBlock[],
  metadata?: ExportMetadata,
  filenamePrefix = 'gorsel-ceviriler'
): void {
  const jsonContent = generateJSONString(textBlocks, metadata);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  triggerBrowserDownload(blob, `${filenamePrefix}-${Date.now()}.json`);
}

/**
 * Downloads text blocks as a readable plain text file (TXT).
 */
export function downloadAsTXT(
  textBlocks: TextBlock[],
  metadata?: ExportMetadata,
  filenamePrefix = 'gorsel-ceviriler'
): void {
  const header = `GörselÇevir - Metin ve Çeviri Dökümü\n` +
    `Tarih: ${new Date().toLocaleString('tr-TR')}\n` +
    `Algılanan Dil: ${metadata?.detectedLanguage || 'Bilinmiyor'} (${metadata?.detectedLanguageCode || ''})\n` +
    `Hedef Dil: ${metadata?.targetLanguage || 'Türkçe'}\n` +
    `Doğruluk: ${metadata?.confidence || '%98'}\n` +
    `Özet: ${metadata?.summary || 'Görsel çeviri dökümü'}\n` +
    `Toplam Metin Sayısı: ${textBlocks.length}\n` +
    `------------------------------------------------------------\n\n`;

  const body = textBlocks
    .map((b, i) => {
      const font = b.customMatchedSystemFont || b.matchedSystemFont || 'Sistem';
      return `[${i + 1}] Kategori: ${b.category || 'Metin'} | Font: ${font}\n` +
             `Orijinal: ${b.originalText}\n` +
             `Türkçe:   ${b.translatedText}\n`;
    })
    .join('\n');

  const content = header + body;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  triggerBrowserDownload(blob, `${filenamePrefix}-${Date.now()}.txt`);
}

/**
 * Helper to trigger file download in browser.
 */
function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
