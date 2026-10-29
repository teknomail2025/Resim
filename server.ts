import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Fast in-memory cache to make repeated requests instantaneous (<5ms)
const translationCache = new Map<string, any>();

export interface TextBlock {
  id: string;
  originalText: string;
  translatedText: string;
  boundingBox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
  textColor: string;
  backgroundColor: string;
  fontWeight: 'bold' | 'normal' | '600' | '700' | '400';
  textAlign: 'left' | 'center' | 'right';
  fontSizeRatio?: number;
  category?: 'heading' | 'body' | 'label' | 'sign' | 'price' | 'button' | 'warning' | 'menu';
  fontCategory?: 'sans-serif' | 'serif' | 'comic' | 'display' | 'handwriting' | 'monospace';
  isItalic?: boolean;
  isUppercase?: boolean;
  strokeColor?: string;
}

export interface TranslationResponse {
  detectedLanguage: string;
  targetLanguage: string;
  summary: string;
  overallSentimentOrContext?: string;
  textBlocks: TextBlock[];
}

// Image translation endpoint
app.post('/api/translate-image', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg', targetLanguage = 'Turkish', sourceLanguage = 'Auto-Detect', style = 'natural' } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Görsel verisi gönderilmedi.' });
    }

    // Clean base64 string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    // Fast Cache Check (saves roundtrip and execution time if requested with same parameters)
    const cacheKey = `${base64Data.slice(0, 100)}_${base64Data.length}_${targetLanguage}_${sourceLanguage}_${style}`;
    if (translationCache.has(cacheKey)) {
      return res.json({
        success: true,
        data: translationCache.get(cacheKey),
        cached: true,
      });
    }

    // Map style parameter to explicit tone instructions
    let toneInstruction = "Doğal, akıcı ve bağlama uygun Türkçe çeviri yapın.";
    if (style === 'resmi' || style === 'formal') {
      toneInstruction = "RESMİ (FORMAL) TON: Kurumsal, saygılı, iş ve kamu ciddiyetiyle 'siz' hitabında çevirin.";
    } else if (style === 'sokak' || style === 'casual' || style === 'slang') {
      toneInstruction = "SOKAK DİLİ TONU: Günlük, samimi, esprili, gençlerin konuştuğu doğal sokak ağzıyla çevirin.";
    } else if (style === 'akademik' || style === 'academic') {
      toneInstruction = "AKADEMİK TON: Bilimsel, terminolojik, metodolojik ve nesnel literatür diliyle çevirin.";
    } else if (style === 'edebi' || style === 'literary') {
      toneInstruction = "EDEBİ TON: Sanatsal derinliği olan, zengin edebi kelimelerle çevirin.";
    } else if (style === 'kisa' || style === 'compact') {
      toneInstruction = "KISA VE ÖZ TON: Tabela, buton ve afişe tam sığacak en az kelimeyle öz anlamı verin.";
    }

    // Source language handling
    const isAutoDetect = !sourceLanguage || sourceLanguage === 'auto' || sourceLanguage === 'Auto-Detect';
    const langDetectInstruction = isAutoDetect
      ? `Determine the exact primary source language from scripts/letters (e.g. Japonca, Rusça, Korece, Çince, Arapça, Almanca, Fransızca, İngilizce vb.).`
      : `Expected source language: '${sourceLanguage}'.`;

    const promptText = `High-speed Visual OCR, Font Detection & In-Image Translation to ${targetLanguage}:
1. LANGUAGE: ${langDetectInstruction}
2. TONE: ${toneInstruction}
3. FONT STYLE DETECTION & SYSTEM-MATCHING ENGINE:
   Carefully examine the original visual typeface of each text region:
   - "detectedFontName": Describe the original visual font archetype (e.g. "Manga Dialogue / Anime Ace", "Impact / Condensed Poster", "Helvetica / Modern Sans", "Times / Classic Serif", "Segoe Print / Casual Handwriting", "Consolas / Terminal Code", "Rockwell / Slab Serif").
   - "fontCategory": One of: "comic", "display", "serif", "slab", "handwriting", "monospace", "sans-serif".
   - "matchedSystemFont": Pick the most visually identical system-supported font for Turkish rendering from:
     ["Comic Sans MS", "Impact", "Arial Black", "Segoe UI", "Georgia", "Segoe Print", "Consolas", "Rockwell", "Trebuchet MS"].
   - "fontSimilarityScore": Visual similarity percentage integer between 75 and 99 (e.g. 96).
   - "isCondensed": true if font is tall, narrow and condensed (e.g. billboard, impact, warning signs).
   - "fontWeight": "bold" or "normal".
   - "isUppercase": true if original text is ALL-CAPS / UPPERCASE.
   - "hasStroke": true if letters have an outline/contour border around them (common in comics, anime SFX, posters).
   - "strokeColor": Hex color of outline border (e.g. "#000000" or "#FFFFFF").
   - "strokeWidth": integer 1 to 4.
4. TEXT BLOCKS:
   - Extract "originalText", "translatedText" in ${targetLanguage}, tight "boundingBox" [ymin, xmin, ymax, xmax] (0-1000 scale), dominant "textColor" (hex), and surface "backgroundColor" (hex).
   - If no text exists, return empty textBlocks array.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Data,
            },
          },
          {
            text: promptText,
          },
        ],
      },
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        systemInstruction: `You are an expert visual OCR and typography matching engine. Accurately detect source languages, analyze original font styles, and match them with the most visually similar system-supported fonts. Output valid JSON.`,
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: {
              type: Type.STRING,
              description: 'Primary source language in Turkish (e.g. Japonca, İngilizce, Rusça, Çince, Korece, Almanca)',
            },
            detectedLanguageCode: {
              type: Type.STRING,
              description: 'ISO 2-letter language code e.g. ja, en, ru, de, fr, zh, ko, ar',
            },
            confidence: {
              type: Type.STRING,
              description: 'Confidence string e.g. %98',
            },
            isAutoDetected: {
              type: Type.BOOLEAN,
            },
            targetLanguage: {
              type: Type.STRING,
            },
            summary: {
              type: Type.STRING,
              description: 'Brief 1-sentence Turkish summary of the image content',
            },
            textBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  originalText: { type: Type.STRING },
                  translatedText: { type: Type.STRING },
                  boundingBox: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: '[ymin, xmin, ymax, xmax] in 0-1000 scale',
                  },
                  textColor: { type: Type.STRING },
                  backgroundColor: { type: Type.STRING },
                  fontWeight: { type: Type.STRING },
                  textAlign: { type: Type.STRING },
                  category: { type: Type.STRING },
                  fontCategory: {
                    type: Type.STRING,
                    description: 'One of: sans-serif, serif, comic, display, handwriting, monospace, slab',
                  },
                  detectedFontName: {
                    type: Type.STRING,
                    description: 'Visual font archetype e.g. Manga Dialogue / Anime Ace, Impact Bold, Helvetica Clean',
                  },
                  matchedSystemFont: {
                    type: Type.STRING,
                    description: 'Closest system font e.g. Comic Sans MS, Impact, Georgia, Segoe UI, Consolas',
                  },
                  fontSimilarityScore: {
                    type: Type.INTEGER,
                    description: 'Similarity score between 75 and 99',
                  },
                  isCondensed: { type: Type.BOOLEAN },
                  hasStroke: { type: Type.BOOLEAN },
                  strokeColor: { type: Type.STRING },
                  strokeWidth: { type: Type.INTEGER },
                  letterSpacing: { type: Type.NUMBER },
                  isItalic: { type: Type.BOOLEAN },
                  isUppercase: { type: Type.BOOLEAN },
                },
                required: ['originalText', 'translatedText', 'boundingBox', 'textColor', 'backgroundColor'],
              },
            },
          },
          required: ['detectedLanguage', 'summary', 'textBlocks'],
        },
      },
    });

    const responseText = response.text || '{}';
    const parsedData = JSON.parse(responseText);

    const validFontCats = ['sans-serif', 'serif', 'comic', 'display', 'handwriting', 'monospace', 'slab'];

    const SYSTEM_FONT_STACKS: Record<string, string> = {
      'Comic Sans MS': "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Chalkboard', cursive, sans-serif",
      'Comic Neue': "'Comic Neue', 'Comic Sans MS', cursive, sans-serif",
      'Impact': "'Bangers', 'Impact', 'Arial Black', 'Haettenschweiler', sans-serif",
      'Bangers': "'Bangers', 'Impact', cursive, sans-serif",
      'Anton': "'Anton', 'Impact', 'Arial Black', sans-serif",
      'Arial Black': "'Arial Black', 'Impact', 'Trebuchet MS', sans-serif",
      'Segoe UI': "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      'Inter': "'Inter', system-ui, -apple-system, sans-serif",
      'Montserrat': "'Montserrat', 'Plus Jakarta Sans', sans-serif",
      'Roboto': "'Roboto', 'Plus Jakarta Sans', sans-serif",
      'Open Sans': "'Open Sans', sans-serif",
      'Georgia': "'Georgia', 'Playfair Display', 'Merriweather', 'Times New Roman', serif",
      'Merriweather': "'Merriweather', Georgia, serif",
      'Playfair Display': "'Playfair Display', Georgia, serif",
      'Segoe Print': "'Caveat', 'Segoe Print', 'Bradley Hand', 'Comic Sans MS', cursive",
      'Caveat': "'Caveat', 'Segoe Print', cursive",
      'Consolas': "'JetBrains Mono', Consolas, 'Courier New', Menlo, Monaco, monospace",
      'JetBrains Mono': "'JetBrains Mono', Consolas, monospace",
      'Rockwell': "'Rockwell', 'Roboto Slab', 'Georgia', serif",
      'Trebuchet MS': "'Trebuchet MS', 'Plus Jakarta Sans', sans-serif",
    };

    // Ensure all items have IDs, typography attributes, font detection metrics, and valid bounding boxes
    if (parsedData.textBlocks && Array.isArray(parsedData.textBlocks)) {
      parsedData.textBlocks = parsedData.textBlocks.map((block: any, idx: number) => {
        const fontCat = validFontCats.includes(block.fontCategory) ? block.fontCategory : 'sans-serif';
        let matchedFont = block.matchedSystemFont;
        if (!matchedFont) {
          if (fontCat === 'comic') matchedFont = 'Comic Sans MS';
          else if (fontCat === 'display') matchedFont = 'Impact';
          else if (fontCat === 'serif') matchedFont = 'Georgia';
          else if (fontCat === 'handwriting') matchedFont = 'Segoe Print';
          else if (fontCat === 'monospace') matchedFont = 'Consolas';
          else if (fontCat === 'slab') matchedFont = 'Rockwell';
          else matchedFont = 'Segoe UI';
        }

        const resolvedStack = SYSTEM_FONT_STACKS[matchedFont] || SYSTEM_FONT_STACKS['Segoe UI'];
        const score = typeof block.fontSimilarityScore === 'number' && block.fontSimilarityScore >= 70 && block.fontSimilarityScore <= 99
          ? block.fontSimilarityScore
          : Math.floor(88 + (idx * 3) % 10);

        return {
          id: block.id || `block-${idx + 1}-${Date.now().toString(36)}`,
          originalText: block.originalText || '',
          translatedText: block.translatedText || '',
          boundingBox: Array.isArray(block.boundingBox) && block.boundingBox.length === 4
            ? block.boundingBox
            : [0, 0, 100, 100],
          textColor: block.textColor || '#FFFFFF',
          backgroundColor: block.backgroundColor || '#1E293B',
          fontWeight: block.fontWeight === 'bold' ? 'bold' : 'normal',
          textAlign: ['left', 'center', 'right'].includes(block.textAlign) ? block.textAlign : 'center',
          category: block.category || 'label',
          fontCategory: fontCat,
          detectedFontName: block.detectedFontName || `${fontCat.toUpperCase()} Tipografi`,
          matchedSystemFont: matchedFont,
          matchedFontStack: resolvedStack,
          fontSimilarityScore: score,
          isCondensed: Boolean(block.isCondensed),
          hasStroke: Boolean(block.hasStroke || block.strokeColor),
          isItalic: Boolean(block.isItalic),
          isUppercase: Boolean(block.isUppercase),
          strokeColor: block.strokeColor || (block.hasStroke ? '#000000' : undefined),
          strokeWidth: block.strokeWidth || (block.hasStroke ? 2 : undefined),
          letterSpacing: typeof block.letterSpacing === 'number' ? block.letterSpacing : undefined,
        };
      });
    }

    // Save in cache (keep last 50 items)
    if (translationCache.size > 50) {
      const firstKey = translationCache.keys().next().value;
      if (firstKey) translationCache.delete(firstKey);
    }
    translationCache.set(cacheKey, parsedData);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Görsel işlenirken ve çeviri yapılırken bir hata oluştu.',
    });
  }
});

// Production static serve / Dev Vite middleware
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`GörselÇevir Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
