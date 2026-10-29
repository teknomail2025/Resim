import { TextBlock, FontCategory } from '../types';

export interface TurkishFontItem {
  id: string;
  name: string;
  category: FontCategory;
  categoryLabel: string;
  fontFamily: string;
  description: string;
  sampleTurkish: string;
  isPopular?: boolean;
  isHeadingOnly?: boolean;
  defaultWeight: 'normal' | 'bold';
  tags: string[];
}

/**
 * 100% Turkish Character Supported Font Catalog
 * Full glyph coverage for: ç, ğ, ı, ö, ş, ü - Ç, Ğ, İ, Ö, Ş, Ü
 */
export const TURKISH_FONTS_CATALOG: TurkishFontItem[] = [
  // 1. MODERN SANS-SERIF
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    description: 'Son derece zarif, modern ve okunaklı Türkçe harf anatomisi.',
    sampleTurkish: 'Şık ve çağdaş Türkçe arayüz tipografisi (ç, ğ, ı, ö, ş, ü)',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['modern', 'temiz', 'popüler', 'ui'],
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    description: 'Dünya standartlarında dijital ekran ve tabela fontu. Yüksek netlik.',
    sampleTurkish: 'Özgürce çalışan çağdaş grafik ve çeviri düzeni.',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['dijital', 'tabela', 'net', 'okunaklı'],
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Montserrat', sans-serif",
    description: 'Geometrik, güçlü ve prestijli kurumsal başlık & gövde fontu.',
    sampleTurkish: 'GÜÇLÜ VE ÇAĞDAŞ TÜRKÇE BAŞLIK DÜZENİ',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['geometrik', 'güçlü', 'prestij'],
  },
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Roboto', sans-serif",
    description: 'Mükemmel dengeli harf aralıkları, her boyutta kusursuz Türkçe okunuş.',
    sampleTurkish: 'Pijamalı hasta yağız şoföre çabucak güvendi.',
    isPopular: true,
    defaultWeight: 'normal',
    tags: ['evrensel', 'dengeli', 'google'],
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Open Sans', sans-serif",
    description: 'Geniş ve açık harf yapısıyla kolay okunan Türkçe metin fontu.',
    sampleTurkish: 'Açık, aydınlık ve şeffaf Türkçe tabela metinleri.',
    defaultWeight: 'normal',
    tags: ['kolay', 'tabela', 'açık'],
  },
  {
    id: 'segoe-ui',
    name: 'Segoe UI',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    description: 'Windows 10/11 yerel sistem fontu, sıfır gecikme ile native PC görünümü.',
    sampleTurkish: 'Windows yerel sistem Türkçe karakter uyumu.',
    isPopular: true,
    defaultWeight: 'normal',
    tags: ['windows', 'native', 'pc'],
  },
  {
    id: 'arial',
    name: 'Arial',
    category: 'sans-serif',
    categoryLabel: 'Modern Sans-Serif',
    fontFamily: "Arial, Helvetica, sans-serif",
    description: 'Tüm dünyada ve her cihazda istisnasız desteklenen güvenilir standart.',
    sampleTurkish: 'Klasik ve güvenli Türkçe harf desteği.',
    defaultWeight: 'normal',
    tags: ['klasik', 'evrensel'],
  },

  // 2. ÇİZGİ ROMAN & KONUŞMA BALONU (COMIC)
  {
    id: 'comic-neue',
    name: 'Comic Neue',
    category: 'comic',
    categoryLabel: 'Çizgi Roman & Balon',
    fontFamily: "'Comic Neue', 'Comic Sans MS', cursive, sans-serif",
    description: 'Modernize edilmiş, eğlenceli ve mükemmel Türkçe karakterli manga balonu.',
    sampleTurkish: 'Neler oluyor orada?! Çabuk kaçışın!',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['manga', 'balon', 'diyalog', 'popüler'],
  },
  {
    id: 'comic-sans',
    name: 'Comic Sans MS',
    category: 'comic',
    categoryLabel: 'Çizgi Roman & Balon',
    fontFamily: "'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif",
    description: 'Orijinal masaüstü çizgi roman ve samimi konuşma standardı.',
    sampleTurkish: 'İşte harika bir Türkçe diyalog cümlesi!',
    defaultWeight: 'bold',
    tags: ['klasik', 'diyalog'],
  },

  // 3. BAŞLIK, POSTER & AFİŞ (DISPLAY)
  {
    id: 'bangers',
    name: 'Bangers',
    category: 'display',
    categoryLabel: 'Afiş & Ses Efekti',
    fontFamily: "'Bangers', 'Impact', cursive, sans-serif",
    description: 'Aksiyon çizgi roman ses efektleri (GÜM, BOOM), büyük afiş başlıkları.',
    sampleTurkish: 'GÜÜÜÜM! ÇILGINCA BİR ŞEYLER OLUYOR!',
    isPopular: true,
    isHeadingOnly: true,
    defaultWeight: 'bold',
    tags: ['efekt', 'sfx', 'aksiyon', 'büyük'],
  },
  {
    id: 'anton',
    name: 'Anton',
    category: 'display',
    categoryLabel: 'Afiş & Ses Efekti',
    fontFamily: "'Anton', 'Impact', 'Arial Black', sans-serif",
    description: 'Yüksek kontrastlı, devasa blok reklam ve dükkan tabelası manşetleri.',
    sampleTurkish: 'BÜYÜK İNDİRİM GÜNLERİ BAŞLADI!',
    isPopular: true,
    isHeadingOnly: true,
    defaultWeight: 'bold',
    tags: ['reklam', 'afiş', 'blok', 'manşet'],
  },
  {
    id: 'oswald',
    name: 'Oswald',
    category: 'display',
    categoryLabel: 'Afiş & Ses Efekti',
    fontFamily: "'Oswald', 'Trebuchet MS', sans-serif",
    description: 'Kondanse (dar ve uzun) şık film afişi ve yönlendirme levhaları.',
    sampleTurkish: 'ÖZEL GÖSTERİM: ÇARŞAMBA AKŞAMI',
    defaultWeight: 'bold',
    tags: ['kondanse', 'dar', 'film', 'afiş'],
  },
  {
    id: 'impact',
    name: 'Impact',
    category: 'display',
    categoryLabel: 'Afiş & Ses Efekti',
    fontFamily: "Impact, 'Arial Black', sans-serif",
    description: 'Dünyanın en bilinen kalın manşet ve uyarı tabelası tipi.',
    sampleTurkish: 'DİKKAT! GİRİŞLER KAPALIDIR!',
    defaultWeight: 'bold',
    tags: ['uyarı', 'tabela', 'kalın'],
  },
  {
    id: 'arial-black',
    name: 'Arial Black',
    category: 'display',
    categoryLabel: 'Afiş & Ses Efekti',
    fontFamily: "'Arial Black', Impact, sans-serif",
    description: 'Ultra dolgun gövdeli, yüksek etkili ürün logo ve etiket fontu.',
    sampleTurkish: 'SÜPER GÜÇLÜ VE ÇARPICI ÇIKTI',
    defaultWeight: 'bold',
    tags: ['ultra', 'bold', 'logo'],
  },

  // 4. KLASİK SERİF & EDEBİ (SERIF & SLAB)
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'serif',
    categoryLabel: 'Klasik & Edebi (Serif)',
    fontFamily: "'Merriweather', Georgia, serif",
    description: 'Ekranlar için özel optimize edilmiş sıcak ve saygın Türkçe serif.',
    sampleTurkish: 'Tarihin derin sayfalarından günümüze ulaşan ışık...',
    isPopular: true,
    defaultWeight: 'normal',
    tags: ['kitap', 'edebi', 'sıcak', 'makale'],
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'serif',
    categoryLabel: 'Klasik & Edebi (Serif)',
    fontFamily: "'Playfair Display', Georgia, serif",
    description: 'Yüksek sosyete, lüks menüler, sanat galerisi ve zarif sertifikalar.',
    sampleTurkish: 'Şık ve Seçkin Lezzetler Restoranı',
    defaultWeight: 'bold',
    tags: ['lüks', 'zarif', 'menü', 'sanat'],
  },
  {
    id: 'georgia',
    name: 'Georgia',
    category: 'serif',
    categoryLabel: 'Klasik & Edebi (Serif)',
    fontFamily: "Georgia, 'Times New Roman', serif",
    description: 'Klasik tırnaklı gazete kupürü ve belge standardı.',
    sampleTurkish: 'Şehrin en eski kütüphanesinde keşfedilen yazıt.',
    defaultWeight: 'normal',
    tags: ['gazete', 'belge', 'klasik'],
  },
  {
    id: 'roboto-slab',
    name: 'Roboto Slab',
    category: 'slab',
    categoryLabel: 'Klasik & Edebi (Serif)',
    fontFamily: "'Roboto Slab', 'Rockwell', Georgia, serif",
    description: 'Kare tırnaklı, modern endüstriyel levha ve teknik broşür fontu.',
    sampleTurkish: 'Sanayi ve Teknoloji Bakanlığı Resmi Bülteni',
    defaultWeight: 'bold',
    tags: ['teknik', 'levha', 'endüstriyel'],
  },

  // 5. EL YAZISI & SAMİMİ NOTLAR (HANDWRITING)
  {
    id: 'caveat',
    name: 'Caveat',
    category: 'handwriting',
    categoryLabel: 'El Yazısı & Not',
    fontFamily: "'Caveat', 'Segoe Print', cursive",
    description: 'Son derece canlı, doğal tükenmez kalem el yazısı notlar ve karatahtalar.',
    sampleTurkish: 'Akşam dönerken fırından taze ekmek almayı unutma! :)',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['el yazısı', 'not', 'samimi', 'kalem'],
  },
  {
    id: 'segoe-print',
    name: 'Segoe Print',
    category: 'handwriting',
    categoryLabel: 'El Yazısı & Not',
    fontFamily: "'Segoe Print', 'Bradley Hand', cursive",
    description: 'Windows yerel el yazısı ve marker kalem stili.',
    sampleTurkish: 'Özel not: Yarın saat üçte görüşmek üzere.',
    defaultWeight: 'normal',
    tags: ['windows', 'marker', 'not'],
  },

  // 6. MONOSPACE / KOD & TERMİNAL
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'monospace',
    categoryLabel: 'Kod & Terminal',
    fontFamily: "'JetBrains Mono', Consolas, monospace",
    description: 'Geliştiricilerin tercihi, fiş, fatura ve dijital ekranlar için net monospace.',
    sampleTurkish: 'KOD: 8492-TR-2026 // ÇIKTI: BAŞARILI',
    isPopular: true,
    defaultWeight: 'bold',
    tags: ['kod', 'fiş', 'terminal', 'sabit'],
  },
  {
    id: 'consolas',
    name: 'Consolas',
    category: 'monospace',
    categoryLabel: 'Kod & Terminal',
    fontFamily: "Consolas, 'Courier New', monospace",
    description: 'Windows komut satırı ve teknik cihaz konsol standardı.',
    sampleTurkish: 'SERIAL: TR_9938_ÖŞĞ // STATUS: OK',
    defaultWeight: 'normal',
    tags: ['windows', 'cmd', 'konsol'],
  },
];

/**
 * Apply a selected Turkish font to a single text block
 */
export function applyTurkishFontToBlock(block: TextBlock, font: TurkishFontItem): TextBlock {
  return {
    ...block,
    customMatchedSystemFont: font.name,
    customFontCategory: font.category,
    matchedFontStack: font.fontFamily,
    // Adjust stroke if display/comic
    ...(font.category === 'display' && {
      customFontWeight: 'bold',
    }),
  };
}

/**
 * Apply a selected Turkish font to ALL text blocks across the current image
 */
export function applyTurkishFontToAllBlocks(blocks: TextBlock[], font: TurkishFontItem): TextBlock[] {
  return blocks.map((b) => applyTurkishFontToBlock(b, font));
}
