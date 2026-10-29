export type FontCategory =
  | 'sans-serif'
  | 'serif'
  | 'comic'
  | 'display'
  | 'handwriting'
  | 'monospace'
  | 'slab';

export interface TextBlock {
  id: string;
  originalText: string;
  translatedText: string;
  boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] in 0-1000 scale
  textColor: string;
  backgroundColor: string;
  fontWeight: 'bold' | 'normal' | '600' | '700' | '800' | '900' | '400';
  textAlign: 'left' | 'center' | 'right';
  category?: 'heading' | 'body' | 'label' | 'sign' | 'price' | 'button' | 'warning' | 'menu' | 'comic';
  // Typography detection & preservation
  fontCategory?: FontCategory;
  detectedFontName?: string;
  fontSimilarityScore?: number; // 0 - 100 percentage
  matchedSystemFont?: string;
  matchedFontStack?: string;
  isCondensed?: boolean;
  hasStroke?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  letterSpacing?: number;
  isItalic?: boolean;
  isUppercase?: boolean;
  // User overrides
  fontSizeRatio?: number;
  customFontSize?: number;
  customTextColor?: string;
  customBgColor?: string;
  customFontCategory?: FontCategory;
  customMatchedSystemFont?: string;
  customFontWeight?: 'bold' | 'normal';
  customIsItalic?: boolean;
  customIsUppercase?: boolean;
  customHasStroke?: boolean;
  customStrokeColor?: string;
  customStrokeWidth?: number;
  customLetterSpacing?: number;
  isVisible?: boolean;
}

export interface ExportOptions {
  format: 'png' | 'jpeg' | 'webp';
  scale: number; // 1, 1.5, 2, 4
  quality: number; // 0.1 to 1.0 (for jpeg/webp)
  sharpness: 'none' | 'light' | 'medium' | 'strong';
  enableUpscaler: boolean; // 2x/4x high quality mode toggle
}

export interface TranslationResult {
  detectedLanguage: string;
  detectedLanguageCode?: string;
  confidence?: string;
  isAutoDetected?: boolean;
  targetLanguage: string;
  summary: string;
  textBlocks: TextBlock[];
}

export interface SourceLanguageOption {
  code: string;
  name: string;
  flag: string;
}

export const SOURCE_LANGUAGES: SourceLanguageOption[] = [
  { code: 'auto', name: 'Otomatik Dil Algıla', flag: '🌐' },
  { code: 'en', name: 'İngilizce', flag: '🇬🇧' },
  { code: 'ja', name: 'Japonca', flag: '🇯🇵' },
  { code: 'de', name: 'Almanca', flag: '🇩🇪' },
  { code: 'fr', name: 'Fransızca', flag: '🇫🇷' },
  { code: 'ru', name: 'Rusça', flag: '🇷🇺' },
  { code: 'ar', name: 'Arapça', flag: '🇸🇦' },
  { code: 'zh', name: 'Çince', flag: '🇨🇳' },
  { code: 'ko', name: 'Korece', flag: '🇰🇷' },
  { code: 'es', name: 'İspanyolca', flag: '🇪🇸' },
  { code: 'it', name: 'İtalyanca', flag: '🇮🇹' },
  { code: 'el', name: 'Yunanca', flag: '🇬🇷' },
];

export type ViewMode = 'pure-image' | 'slider' | 'side-by-side' | 'overlay';
export type OverlayStyle = 'seamless' | 'glass' | 'highlight' | 'outline';

export type TranslationStyle = 'resmi' | 'sokak' | 'akademik' | 'dogal' | 'kisa';

export interface StyleOption {
  id: TranslationStyle;
  label: string;
  description: string;
  badge: string;
}

export const TRANSLATION_STYLES: StyleOption[] = [
  {
    id: 'resmi',
    label: 'Resmi',
    description: 'Kurumsal, saygılı ve ciddi iş/bürokrasi dili',
    badge: '👔 Kurumsal',
  },
  {
    id: 'sokak',
    label: 'Sokak Dili',
    description: 'Günlük samimi konuşma ağzı ve dinamik sokak ifadeleri',
    badge: '🧢 Samimi & Doğal',
  },
  {
    id: 'akademik',
    label: 'Akademik',
    description: 'Bilimsel, metodolojik ve terminolojiye sadık anlatım',
    badge: '🎓 Bilimsel & Net',
  },
  {
    id: 'dogal',
    label: 'Doğal & Akıcı',
    description: 'Standart akıcı ve dengeli günlük Türkçe',
    badge: '✨ Dengeli',
  },
  {
    id: 'kisa',
    label: 'Kısa & Öz',
    description: 'Tabelalara ve butonlara tam sığacak en kompakt çeviri',
    badge: '⚡ Minimal',
  },
];

export interface SampleImage {
  id: string;
  title: string;
  sourceLang: string;
  description: string;
  dataUrl: string;
}
