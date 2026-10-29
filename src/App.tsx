import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Camera,
  Download,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Sliders,
  Columns,
  Eye,
  FileText,
  Languages,
  Layers,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Share2,
  History,
  Image as ImageIcon,
  WifiOff,
  Wifi,
  HardDrive,
  PlusCircle,
  Undo2,
  Redo2,
  Trash2,
  Keyboard,
  Bold,
  Italic,
  X,
  Edit3,
  Monitor,
  Settings,
  Type,
} from 'lucide-react';
import { TextBlock, TranslationResult, ViewMode, OverlayStyle, TranslationStyle, TRANSLATION_STYLES, SOURCE_LANGUAGES } from './types';
import { SAMPLE_IMAGES } from './utils/imageSamples';
import { ImageViewer } from './components/ImageViewer';
import { BlockEditorModal } from './components/BlockEditorModal';
import { TextListDrawer } from './components/TextListDrawer';
import { CameraCaptureModal } from './components/CameraCaptureModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { WindowsCppModal } from './components/WindowsCppModal';
import { SettingsModal } from './components/SettingsModal';
import { TurkishFontModal } from './components/TurkishFontModal';
import { useOnlineStatus } from './utils/useOnlineStatus';
import {
  saveProjectToLocalDB,
  getAllProjectsFromLocalDB,
  exportAllProjectsToFile,
} from './utils/localDB';
import {
  getHistoryItems,
  saveToHistory,
  deleteHistoryItem,
  clearAllHistory,
  HistoryItem,
} from './utils/historyStorage';
import { downloadTranslatedImage, copyCanvasToClipboard } from './utils/canvasRenderer';
import { optimizeImageForOCR } from './utils/imageOptimizer';
import { ExportModal } from './components/ExportModal';
import { QuickExportBar } from './components/QuickExportBar';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationProgressStep, setTranslationProgressStep] = useState<string>('Hazırlanıyor...');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // View preferences: default to 'pure-image' for normal single image output
  const [viewMode, setViewMode] = useState<ViewMode>('pure-image');
  const [overlayStyle, setOverlayStyle] = useState<OverlayStyle>('seamless');
  const [sourceLanguage, setSourceLanguage] = useState<string>('auto');
  const [targetLanguage, setTargetLanguage] = useState<string>('Turkish');
  const [translationStyle, setTranslationStyle] = useState<TranslationStyle>('resmi');

  // Modals & Inspection
  const [editingBlock, setEditingBlock] = useState<TextBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isComparingOriginal, setIsComparingOriginal] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isHighQualityMode, setIsHighQualityMode] = useState<boolean>(true);
  const { isOnline, wasOffline } = useOnlineStatus();

  // Selection & Keyboard Shortcuts & History (Undo / Redo)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<TextBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<TextBlock[][]>([]);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isCppModalOpen, setIsCppModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTurkishFontsOpen, setIsTurkishFontsOpen] = useState<boolean>(false);
  const [defaultFontName, setDefaultFontName] = useState<string>(() => {
    return localStorage.getItem('gorselcevir_default_font') || 'Plus Jakarta Sans';
  });

  const handleSetDefaultFontName = (fontName: string) => {
    setDefaultFontName(fontName);
    localStorage.setItem('gorselcevir_default_font', fontName);
    showToast(`⭐ Varsayılan font: ${fontName}`);
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem('gorselcevir_cache');
      showToast('🧹 Önbellek başarıyla temizlendi');
    } catch (e) {
      showToast('Önbellek temizlendi');
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage & IndexedDB on initial render
  const refreshProjectsList = async () => {
    setHistoryItems(getHistoryItems());
    try {
      const dbProjects = await getAllProjectsFromLocalDB();
      if (dbProjects.length > 0 && historyItems.length === 0) {
        // Hydrate from IndexedDB if localStorage was empty
        const mappedHistory: HistoryItem[] = dbProjects.map((p) => ({
          id: p.id,
          timestamp: p.updatedAt || p.createdAt,
          formattedDate: p.formattedDate,
          thumbnail: p.thumbnail,
          fullImage: p.fullImage,
          mimeType: p.mimeType,
          detectedLanguage: p.detectedLanguage,
          summary: p.summary,
          textBlocks: p.textBlocks,
          blockCount: p.blockCount,
        }));
        setHistoryItems(mappedHistory);
      }
    } catch (e) {
      console.warn('Could not read IndexedDB projects:', e);
    }
  };

  useEffect(() => {
    refreshProjectsList();
  }, []);

  // Global paste handler (Ctrl+V anywhere on page)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                const dataUrl = event.target.result as string;
                setSelectedImage(dataUrl);
                setMimeType(blob.type || 'image/jpeg');
                translateImage(dataUrl, blob.type || 'image/jpeg', translationStyle, sourceLanguage);
              }
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [targetLanguage, translationStyle, sourceLanguage]);

  // Global Keyboard Shortcuts Listener (Mouseless fast editing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      const isInputFocused =
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable);

      // 1. Ctrl+S / Cmd+S: Intercept everywhere to prevent browser Save Webpage dialog
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleSaveToPC();
        return;
      }

      // If user is actively typing in a text field, do not hijack normal typing keys
      if (isInputFocused) {
        if (e.key === 'Escape') {
          active?.blur();
        }
        return;
      }

      // 2. F1 or '?' -> Open / Toggle Keyboard Shortcuts Modal
      if (e.key === 'F1' || (e.key === '?' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 3. Escape: Close modals or clear selection
      if (e.key === 'Escape') {
        if (isShortcutsOpen) {
          setIsShortcutsOpen(false);
          return;
        }
        if (editingBlock) {
          setEditingBlock(null);
          return;
        }
        if (isHistoryOpen) {
          setIsHistoryOpen(false);
          return;
        }
        if (isExportModalOpen) {
          setIsExportModalOpen(false);
          return;
        }
        if (selectedBlockId) {
          setSelectedBlockId(null);
          return;
        }
      }

      // 4. Undo: Ctrl+Z / Cmd+Z (without shift)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 5. Redo: Ctrl+Y / Cmd+Y OR Ctrl+Shift+Z / Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // 6. Delete / Backspace: Delete selected speech bubble
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlockId) {
          e.preventDefault();
          handleDeleteSelectedBlock();
          return;
        }
      }

      // 7. Tab / Shift+Tab: Cycle through speech bubbles
      if (e.key === 'Tab') {
        if (translationResult && translationResult.textBlocks.length > 0) {
          e.preventDefault();
          handleCycleBlock(e.shiftKey ? -1 : 1);
          return;
        }
      }

      // 8. Enter: Open editor modal for selected bubble
      if (e.key === 'Enter') {
        if (selectedBlockId && translationResult) {
          e.preventDefault();
          const block = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
          if (block) {
            setEditingBlock(block);
          }
          return;
        }
      }

      // 9. Arrow keys: Nudge selected bubble
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        if (selectedBlockId) {
          e.preventDefault();
          const step = e.shiftKey ? 2 : 10;
          if (e.key === 'ArrowUp') handleNudgeBlock(0, -step);
          if (e.key === 'ArrowDown') handleNudgeBlock(0, step);
          if (e.key === 'ArrowLeft') handleNudgeBlock(-step, 0);
          if (e.key === 'ArrowRight') handleNudgeBlock(step, 0);
          return;
        }
      }

      // 10. Font size adjustments: + / = or - / _
      if (e.key === '+' || e.key === '=' || e.key === ']') {
        if (selectedBlockId) {
          e.preventDefault();
          handleChangeFontSize(2);
          return;
        }
      }
      if (e.key === '-' || e.key === '_' || e.key === '[') {
        if (selectedBlockId) {
          e.preventDefault();
          handleChangeFontSize(-2);
          return;
        }
      }

      // 11. Style toggles: Ctrl+B (Bold), Ctrl+I (Italic)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        if (selectedBlockId) {
          e.preventDefault();
          handleToggleBold();
          return;
        }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'i' || e.key === 'I')) {
        if (selectedBlockId) {
          e.preventDefault();
          handleToggleItalic();
          return;
        }
      }

      // 12. 'N' key: Add new manual bubble
      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (selectedImage) {
          e.preventDefault();
          handleAddManualBubble();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedImage,
    translationResult,
    selectedBlockId,
    undoStack,
    redoStack,
    isShortcutsOpen,
    editingBlock,
    isHistoryOpen,
    isExportModalOpen,
    overlayStyle,
  ]);

  // Main translation function with full offline tolerance
  const translateImage = async (
    imageDataUrl: string,
    imageMime = 'image/jpeg',
    styleOverride: TranslationStyle = translationStyle,
    sourceLangOverride: string = sourceLanguage
  ) => {
    setIsTranslating(true);
    setTranslationProgressStep('Görsel optimize ediliyor...');
    setErrorMessage(null);
    setTranslationResult(null);
    setIsComparingOriginal(false);

    // 1. IF COMPLETELY OFFLINE (NO INTERNET):
    if (!navigator.onLine) {
      setIsTranslating(false);
      const offlineResult: TranslationResult = {
        detectedLanguage: 'Çevrimdışı (PC Yerel)',
        targetLanguage: 'Turkish',
        summary: 'Çevrimdışı Mod: Görseliniz bilgisayarınızda açıldı. İstediğiniz yere balon ekleyebilir, fontları ve boyutları ayarlayıp yüksek kalitede PC\'nize kaydedebilirsiniz.',
        textBlocks: [
          {
            id: `offline-block-${Date.now()}`,
            originalText: 'MANUEL BALON',
            translatedText: 'TÜRKÇE METİN',
            boundingBox: [380, 250, 580, 750],
            category: 'comic',
            fontCategory: 'comic',
            detectedFontName: 'Manga & Çizgi Roman (Diyalog)',
            matchedSystemFont: 'Comic Sans MS',
            matchedFontStack: "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Chalkboard', cursive, sans-serif",
            fontSimilarityScore: 98,
            hasStroke: true,
            strokeColor: '#000000',
            strokeWidth: 2,
            fontWeight: 'bold',
            isUppercase: true,
            textColor: '#000000',
            backgroundColor: '#ffffff',
            customFontSize: 24,
            customTextColor: '#000000',
            customBgColor: '#ffffff',
            textAlign: 'center',
          },
        ],
        isAutoDetected: false,
      };

      setTranslationResult(offlineResult);
      saveToHistory(imageDataUrl, imageMime, offlineResult).then((updated) => {
        setHistoryItems(updated);
      });
      saveProjectToLocalDB({
        id: `proj-${Date.now()}`,
        name: `Çevrimdışı Proje ${new Date().toLocaleTimeString('tr-TR')}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        formattedDate: new Date().toLocaleDateString('tr-TR'),
        thumbnail: imageDataUrl,
        fullImage: imageDataUrl,
        mimeType: imageMime,
        detectedLanguage: 'Çevrimdışı',
        summary: offlineResult.summary,
        textBlocks: offlineResult.textBlocks,
        blockCount: 1,
        offlineCreated: true,
      });
      return;
    }

    try {
      // Fast client-side optimization: downscale large megapixel photos for OCR
      const { optimizedDataUrl } = await optimizeImageForOCR(imageDataUrl, 960, 0.70);

      setTranslationProgressStep('Yapay zeka metinleri okuyor & fontları eşleştiriyor...');

      const res = await fetch('/api/translate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: optimizedDataUrl,
          mimeType: imageMime,
          targetLanguage,
          sourceLanguage: sourceLangOverride,
          style: styleOverride,
        }),
      });

      setTranslationProgressStep("Orijinal tasarımla Türkçe'ye aktarılıyor...");

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Çeviri servisi yanıt vermedi.');
      }

      setTranslationResult(json.data);

      // Automatically save to local browser storage (localStorage + IndexedDB on PC disk)
      saveToHistory(imageDataUrl, imageMime, json.data).then((updated) => {
        setHistoryItems(updated);
      });
      saveProjectToLocalDB({
        id: `proj-${Date.now()}`,
        name: `Çeviri Projesi ${new Date().toLocaleTimeString('tr-TR')}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        formattedDate: new Date().toLocaleDateString('tr-TR'),
        thumbnail: imageDataUrl,
        fullImage: imageDataUrl,
        mimeType: imageMime,
        detectedLanguage: json.data.detectedLanguage,
        summary: json.data.summary,
        textBlocks: json.data.textBlocks,
        blockCount: json.data.textBlocks.length,
      });
    } catch (err: any) {
      console.warn('Network translation failed, providing offline studio option:', err);
      // Fallback: If network drops mid-request, activate offline studio mode so user is never stuck
      const fallbackResult: TranslationResult = {
        detectedLanguage: 'Yerel PC / Çevrimdışı',
        targetLanguage: 'Turkish',
        summary: 'İnternet bağlantısı kesildi veya servis meşgul. Görseliniz yerel düzenleme modunda hazır.',
        textBlocks: [
          {
            id: `offline-block-${Date.now()}`,
            originalText: 'MANUEL BALON',
            translatedText: 'METİN GİRİN',
            boundingBox: [380, 250, 580, 750],
            category: 'comic',
            fontCategory: 'comic',
            fontWeight: 'bold',
            isUppercase: true,
            textColor: '#000000',
            backgroundColor: '#ffffff',
            customFontSize: 24,
            customTextColor: '#000000',
            customBgColor: '#ffffff',
            textAlign: 'center',
          },
        ],
        isAutoDetected: false,
      };
      setTranslationResult(fallbackResult);
      setErrorMessage(
        'Çevrimiçi yapay zeka servisine bağlanılamadı. Çevrimdışı Düzenleyici aktif! Balonları kendiniz ekleyip metinleri ve fontları değiştirebilirsiniz.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setSelectedImage(dataUrl);
        setMimeType(file.type || 'image/jpeg');
        translateImage(dataUrl, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setSelectedImage(dataUrl);
          setMimeType(file.type);
          translateImage(dataUrl, file.type);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Sample load handler
  const handleSelectSample = (sample: (typeof SAMPLE_IMAGES)[0]) => {
    setSelectedImage(sample.dataUrl);
    setMimeType('image/svg+xml');
    translateImage(sample.dataUrl, 'image/svg+xml');
  };

  // Core History & Persistence Dispatcher
  const applyBlocksWithHistory = (newBlocks: TextBlock[], actionToast?: string) => {
    if (!translationResult) return;
    setUndoStack((prev) => [...prev.slice(-40), translationResult.textBlocks]);
    setRedoStack([]); // clear redo stack on new action
    const updatedResult = {
      ...translationResult,
      textBlocks: newBlocks,
    };
    setTranslationResult(updatedResult);

    if (actionToast) {
      showToast(actionToast);
    }

    if (selectedImage) {
      saveProjectToLocalDB({
        id: `proj-${Date.now()}`,
        name: `Çeviri Projesi ${new Date().toLocaleTimeString('tr-TR')}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        formattedDate: new Date().toLocaleDateString('tr-TR'),
        thumbnail: selectedImage,
        fullImage: selectedImage,
        mimeType,
        detectedLanguage: updatedResult.detectedLanguage,
        summary: updatedResult.summary,
        textBlocks: newBlocks,
        blockCount: newBlocks.length,
      });
    }
  };

  // Undo (Ctrl+Z)
  const handleUndo = () => {
    if (!translationResult || undoStack.length === 0) return;
    const previousBlocks = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    setRedoStack((prev) => [...prev, translationResult.textBlocks]);
    setUndoStack(newUndoStack);

    setTranslationResult({
      ...translationResult,
      textBlocks: previousBlocks,
    });
    showToast('↩️ Değişiklik Geri Alındı (Ctrl+Z)');
  };

  // Redo (Ctrl+Y / Ctrl+Shift+Z)
  const handleRedo = () => {
    if (!translationResult || redoStack.length === 0) return;
    const nextBlocks = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    setUndoStack((prev) => [...prev, translationResult.textBlocks]);
    setRedoStack(newRedoStack);

    setTranslationResult({
      ...translationResult,
      textBlocks: nextBlocks,
    });
    showToast('↪️ Değişiklik Yinelendi (Ctrl+Y)');
  };

  // Direct Save / Download to PC (Ctrl+S)
  const handleSaveToPC = async () => {
    if (!selectedImage || !translationResult) return;
    showToast('💾 Görsel Bilgisayarınıza Kaydediliyor (Ctrl+S)...');
    try {
      await downloadTranslatedImage(
        selectedImage,
        translationResult.textBlocks,
        overlayStyle,
        `turkce-cevrilmis-${Date.now()}.png`
      );
      showToast('✅ Görsel Başarıyla PC\'ye Kaydedildi (Ctrl+S)');
    } catch (err) {
      showToast('Görsel kaydedilirken hata oluştu');
    }
  };

  // Delete currently selected block (Delete / Backspace)
  const handleDeleteSelectedBlock = () => {
    if (!translationResult || !selectedBlockId) return;
    const newBlocks = translationResult.textBlocks.filter((b) => b.id !== selectedBlockId);
    applyBlocksWithHistory(newBlocks, '🗑️ Balon Silindi (Ctrl+Z ile geri alabilirsiniz)');
    setSelectedBlockId(null);
  };

  // Move / Nudge selected block with Arrow Keys
  const handleNudgeBlock = (dx: number, dy: number) => {
    if (!translationResult || !selectedBlockId) return;
    const currentBlock = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
    if (!currentBlock) return;

    const [ymin, xmin, ymax, xmax] = currentBlock.boundingBox;
    const h = ymax - ymin;
    const w = xmax - xmin;

    const newYmin = Math.max(0, Math.min(1000 - h, ymin + dy));
    const newXmin = Math.max(0, Math.min(1000 - w, xmin + dx));
    const newYmax = newYmin + h;
    const newXmax = newXmin + w;

    const updatedBlock: TextBlock = {
      ...currentBlock,
      boundingBox: [newYmin, newXmin, newYmax, newXmax],
    };

    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === selectedBlockId ? updatedBlock : b
    );
    applyBlocksWithHistory(newBlocks);
  };

  // Increase / Decrease Font Size (+ / -)
  const handleChangeFontSize = (delta: number) => {
    if (!translationResult || !selectedBlockId) return;
    const currentBlock = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
    if (!currentBlock) return;

    const currentSize = currentBlock.customFontSize || 22;
    const newSize = Math.max(8, Math.min(120, currentSize + delta));
    const updatedBlock: TextBlock = {
      ...currentBlock,
      customFontSize: newSize,
    };

    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === selectedBlockId ? updatedBlock : b
    );
    applyBlocksWithHistory(newBlocks, `Yazı Boyutu: ${newSize}px`);
  };

  // Toggle Bold (Ctrl+B)
  const handleToggleBold = () => {
    if (!translationResult || !selectedBlockId) return;
    const currentBlock = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
    if (!currentBlock) return;

    const isBold = currentBlock.fontWeight === 'bold';
    const updatedBlock: TextBlock = {
      ...currentBlock,
      fontWeight: isBold ? 'normal' : 'bold',
    };
    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === selectedBlockId ? updatedBlock : b
    );
    applyBlocksWithHistory(newBlocks, isBold ? 'Yazı stili: Normal' : 'Yazı stili: Kalın (Bold)');
  };

  // Toggle Italic (Ctrl+I)
  const handleToggleItalic = () => {
    if (!translationResult || !selectedBlockId) return;
    const currentBlock = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
    if (!currentBlock) return;

    const isItalic = !!(currentBlock.customIsItalic ?? currentBlock.isItalic);
    const updatedBlock: TextBlock = {
      ...currentBlock,
      customIsItalic: !isItalic,
    };
    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === selectedBlockId ? updatedBlock : b
    );
    applyBlocksWithHistory(newBlocks, !isItalic ? 'Yazı stili: İtalik' : 'Yazı stili: Düz');
  };

  // Cycle through speech bubbles (Tab / Shift+Tab)
  const handleCycleBlock = (direction: 1 | -1) => {
    if (!translationResult || translationResult.textBlocks.length === 0) return;
    const blocks = translationResult.textBlocks;
    if (!selectedBlockId) {
      setSelectedBlockId(direction === 1 ? blocks[0].id : blocks[blocks.length - 1].id);
      return;
    }
    const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
    if (currentIndex === -1) {
      setSelectedBlockId(blocks[0].id);
      return;
    }
    const nextIndex = (currentIndex + direction + blocks.length) % blocks.length;
    setSelectedBlockId(blocks[nextIndex].id);
  };

  // Update block from editor modal and persist to history & IndexedDB
  const handleUpdateBlock = (updated: TextBlock) => {
    if (!translationResult) return;
    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === updated.id ? updated : b
    );
    applyBlocksWithHistory(newBlocks, 'Metin balonu güncellendi');
  };

  // Delete block and persist
  const handleDeleteBlock = (id: string) => {
    if (!translationResult) return;
    const filtered = translationResult.textBlocks.filter((b) => b.id !== id);
    applyBlocksWithHistory(filtered, '🗑️ Balon silindi (Ctrl+Z ile geri alınabilir)');
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  // Toggle visibility of a block
  const handleToggleVisibility = (id: string) => {
    if (!translationResult) return;
    const newBlocks = translationResult.textBlocks.map((b) =>
      b.id === id ? { ...b, isVisible: b.isVisible === false ? true : false } : b
    );
    applyBlocksWithHistory(newBlocks);
  };

  // Add manual speech bubble / translation box (Offline & Online)
  const handleAddManualBubble = () => {
    const newId = `bubble-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newBlock: TextBlock = {
      id: newId,
      originalText: 'MANUEL BALON',
      translatedText: 'TÜRKÇE YAZI',
      boundingBox: [350, 250, 550, 750],
      category: 'comic',
      fontCategory: 'comic',
      detectedFontName: 'Manga & Çizgi Roman (Diyalog)',
      matchedSystemFont: 'Comic Sans MS',
      matchedFontStack: "'Comic Neue', 'Comic Sans MS', 'Chalkboard SE', 'Chalkboard', cursive, sans-serif",
      fontSimilarityScore: 98,
      hasStroke: true,
      strokeColor: '#000000',
      strokeWidth: 2,
      fontWeight: 'bold',
      isUppercase: true,
      textColor: '#000000',
      backgroundColor: '#ffffff',
      customFontSize: 24,
      customTextColor: '#000000',
      customBgColor: '#ffffff',
      textAlign: 'center',
    };

    if (translationResult) {
      const updatedBlocks = [...translationResult.textBlocks, newBlock];
      applyBlocksWithHistory(updatedBlocks, '➕ Yeni konuşma balonu eklendi');
    } else if (selectedImage) {
      const initialResult: TranslationResult = {
        detectedLanguage: 'Yerel PC / Çevrimdışı',
        targetLanguage: 'Turkish',
        summary: 'Çevrimdışı Düzenleyici: Metin balonu eklendi.',
        textBlocks: [newBlock],
        isAutoDetected: false,
      };
      setTranslationResult(initialResult);
      showToast('➕ Yeni konuşma balonu eklendi');
    }

    setSelectedBlockId(newBlock.id);
  };

  // Download translated image as PNG
  const handleDownload = async () => {
    if (!selectedImage || !translationResult) return;
    await downloadTranslatedImage(
      selectedImage,
      translationResult.textBlocks,
      overlayStyle,
      `turkce-cevrilmis-${Date.now()}.png`
    );
  };

  // Copy rendered image to clipboard
  const handleCopyClipboard = async () => {
    if (!selectedImage || !translationResult) return;
    const success = await copyCanvasToClipboard(
      selectedImage,
      translationResult.textBlocks,
      overlayStyle
    );
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Reset to upload screen
  const handleReset = () => {
    setSelectedImage(null);
    setTranslationResult(null);
    setErrorMessage(null);
  };

  // History handlers
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSelectedImage(item.fullImage || item.thumbnail);
    setMimeType(item.mimeType || 'image/jpeg');
    setTranslationResult({
      detectedLanguage: item.detectedLanguage,
      targetLanguage: 'Turkish',
      summary: item.summary,
      textBlocks: item.textBlocks,
    });
    setErrorMessage(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistoryItems(updated);
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistoryItems([]);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar - Clean Native Desktop App Titlebar & Essential Controls */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Brand / Logo + Fast Image Upload Triggers */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={handleReset}
              title="GörselÇevir Ana Ekrana Dön"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Languages className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-none">
                    Görsel<span className="text-emerald-400">Çevir</span>
                  </h1>
                  <span className="hidden md:inline-block px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    PC
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden lg:block leading-tight mt-0.5">
                  Masaüstü Görsel Çeviri
                </p>
              </div>
            </div>

            {/* Fast Image Actions (Directly in Titlebar) */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                title="Resim yükleyin veya değiştirin (JPG, PNG, WebP)"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Resim Yükle</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Kamera ile fotoğraf çek"
              >
                <Camera className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">Kamera</span>
              </button>
            </div>
          </div>

          {/* Center: Essential Language & Translation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Source Language Selector with Auto-Detect */}
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
              <span className="text-slate-400 hidden xl:inline">Kaynak:</span>
              <select
                value={sourceLanguage}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setSourceLanguage(newLang);
                  if (selectedImage && !isTranslating) {
                    translateImage(selectedImage, mimeType, translationStyle, newLang);
                  }
                }}
                className="bg-transparent font-bold text-amber-300 outline-none cursor-pointer border-none text-xs max-w-[105px] sm:max-w-none"
                title="Kaynak dil seçimi"
              >
                {SOURCE_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600 font-bold text-xs hidden sm:inline">→</span>

            {/* Target Language Indicator */}
            <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                🇹🇷 <span className="hidden sm:inline">Türkçe</span>
              </span>
            </div>

            {/* Translation Tone/Style Dropdown */}
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <select
                value={translationStyle}
                onChange={(e) => {
                  const newStyle = e.target.value as TranslationStyle;
                  setTranslationStyle(newStyle);
                  if (selectedImage && !isTranslating) {
                    translateImage(selectedImage, mimeType, newStyle, sourceLanguage);
                  }
                }}
                className="bg-transparent font-bold text-emerald-400 outline-none cursor-pointer border-none text-xs"
                title="Çeviri tonu (Resmi, Sokak, Akademik vb.)"
              >
                {TRANSLATION_STYLES.map((style) => (
                  <option key={style.id} value={style.id} className="bg-slate-900 text-slate-200">
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Turkish Font Changer & Unified Settings Hub */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 1. Turkish Font Changer Feature Button */}
            <button
              type="button"
              onClick={() => setIsTurkishFontsOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Türkçe Font Değiştirici: Tüm balonların veya seçili metnin fontunu Türkçe karakter uyumlu yazı tipleriyle değiştirin"
            >
              <Type className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              <span className="hidden sm:inline">Türkçe Fontlar</span>
              <span className="sm:hidden">Fontlar</span>
            </button>

            {/* 2. Unified Settings & Tools Hub Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all hover:border-emerald-500/50 cursor-pointer"
              title="Uygulama Ayarları & Araç Merkezi (Geçmiş, Windows C++, Kısayollar, PWA, Çözünürlük, Önbellek)"
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">Ayarlar</span>
              {historyItems.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Reset / New Image button if an image is loaded */}
            {selectedImage && (
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Görseli sıfırla ve yeni resim seç"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Yeni</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col">
        {/* Offline Mode Banner & Tools */}
        <OfflineIndicator
          isOnline={isOnline}
          wasOffline={wasOffline}
          onAddManualBubble={handleAddManualBubble}
          onRefreshProjects={refreshProjectsList}
          hasActiveImage={!!selectedImage}
        />

        {/* Error notification banner */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white underline ml-4"
            >
              Kapat
            </button>
          </div>
        )}

        {/* 1. UPLOAD SCREEN (when no image selected) */}
        {!selectedImage && (
          <div className="flex-1 flex flex-col justify-center py-6">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Yapay Zekâ ile Yerinde Görsel Çeviri</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
                Resimdeki Yabancı Yazıları{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Aynı Halde Türkçe'ye
                </span>{' '}
                Çevirin
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Tabelalar, menüler, kullanım kılavuzları veya belgeler... Orijinal yazı tipi, renk ve arka plan korunarak görsel üzerine doğrudan Türkçe yerleştirilir.
              </p>
            </div>

            {/* Configuration Bar: Source Language (Auto-Detect) & Translation Style */}
            <div className="max-w-2xl w-full mx-auto mb-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-lg">
              {/* Row 1: Source Language Selection with Auto-Detect */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xs">
                    🌐
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Kaynak Dil:</span>
                  <span className="text-[10px] text-amber-400/90 font-mono">
                    {sourceLanguage === 'auto' ? '✨ Otomatik Algılama Devrede' : 'Manuel Seçildi'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 outline-none cursor-pointer hover:border-amber-500/50 transition-colors"
                  >
                    {SOURCE_LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
                        {lang.flag} {lang.name} {lang.code === 'auto' ? '(Bilinmeyen Diller)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Translation Style Selector */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-slate-300">Çeviri Stili / Tonu:</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 justify-center">
                  {TRANSLATION_STYLES.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTranslationStyle(style.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        translationStyle === style.id
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                          : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                      title={style.description}
                    >
                      <span>{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drag & Drop Box */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="max-w-2xl w-full mx-auto border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/40 hover:bg-slate-900/70 rounded-3xl p-8 sm:p-12 transition-all duration-200 flex flex-col items-center justify-center text-center group cursor-pointer shadow-2xl relative"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 group-hover:bg-emerald-500/20 border border-slate-700 group-hover:border-emerald-500/40 flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-emerald-400 transition-colors" />
              </div>

              <h3 className="text-base font-semibold text-white mb-1">
                Görseli buraya sürükleyip bırakın
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                veya bilgisayarınızdan dosya seçin (JPG, PNG, WebP)
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Görsel Yükle</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCameraOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Kamera ile Çek</span>
                </button>
              </div>

              <div className="mt-6 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                <span>💡 İpucu: Herhangi bir resmi kopyalayıp</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  Ctrl+V
                </kbd>
                <span>ile doğrudan yapıştırabilirsiniz.</span>
              </div>
            </div>

            {/* PC Desktop App Banner */}
            <div className="max-w-2xl w-full mx-auto mt-4">
              <PWAInstallButton variant="card" />
            </div>

            {/* Recent History Section (Last 5 translations saved in localStorage) */}
            {historyItems.length > 0 && (
              <div className="max-w-4xl w-full mx-auto mt-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Son Çevirileriniz (Geçmiş)
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {historyItems.length} Kayıt
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsHistoryOpen(true)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <span>Geçmiş Panelini Aç</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistoryItem(item)}
                      className="group bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-2.5 cursor-pointer transition-all duration-200 shadow-md hover:shadow-emerald-500/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-950 mb-2 border border-slate-800">
                          <img
                            src={item.thumbnail || item.fullImage}
                            alt={item.summary}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                            {item.detectedLanguage}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                          {item.summary || 'Çeviri'}
                        </p>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{item.formattedDate}</span>
                      </div>
                      <span className="mt-2 pt-1 border-t border-slate-800/60 text-[10px] font-semibold text-emerald-400 flex items-center justify-between">
                        <span>Aç</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instant Sample Presets */}
            <div className="max-w-4xl w-full mx-auto mt-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Hemen Test Etmek İçin Örnek Görseller:
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">Tek tıkla deneyin</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {SAMPLE_IMAGES.map((sample) => (
                  <div
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className="group bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3 cursor-pointer transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 mb-2.5 border border-slate-800">
                        <img
                          src={sample.dataUrl}
                          alt={sample.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-md text-amber-300 border border-white/10">
                          {sample.sourceLang}
                        </span>
                      </div>
                      <h5 className="font-semibold text-xs text-white group-hover:text-emerald-300 transition-colors">
                        {sample.title}
                      </h5>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                      <span>Türkçe'ye Çevir</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. TRANSLATION WORKSPACE (when image is uploaded) */}
        {selectedImage && (
          <div className="flex-1 flex flex-col gap-4">
            {/* Control Toolbar */}
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl">
              {/* Left: View Mode Switches */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('pure-image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'pure-image'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tek parça normal resim olarak görüntüle (yazı katmanı olmadan)"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Normal Resim</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('slider')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'slider'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Önce / Sonra kaydırma çubuğu"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Karşılaştırma</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('side-by-side')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'side-by-side'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Yan yana karşılaştırma"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Yan Yana</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('overlay')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    viewMode === 'overlay'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="İnteraktif kutuları ve çevirileri düzenle"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Kutu Düzenleme</span>
                </button>
              </div>

              {/* Instant Compare Toggle for Normal Resim & Box Edit Mode */}
              {(viewMode === 'pure-image' || viewMode === 'overlay') && (
                <button
                  type="button"
                  onClick={() => setIsComparingOriginal(!isComparingOriginal)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isComparingOriginal
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                      : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border-amber-500/30 hover:border-amber-500/50'
                  }`}
                  title="Görünüm modunu değiştirmeden Orijinal ve Çeviri arasında anında geçiş yapın"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isComparingOriginal ? 'Orijinal Açık' : 'Hızlı Karşılaştır'}</span>
                </button>
              )}

              {/* Middle: Translation Style & Overlay Style */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Style Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-700/80">
                  <span className="text-slate-400 text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" /> Stil:
                  </span>
                  <select
                    value={translationStyle}
                    onChange={(e) => {
                      const newStyle = e.target.value as TranslationStyle;
                      setTranslationStyle(newStyle);
                      if (selectedImage && !isTranslating) {
                        translateImage(selectedImage, mimeType, newStyle);
                      }
                    }}
                    className="bg-transparent font-bold text-emerald-400 outline-none cursor-pointer border-none text-xs"
                    title="Çeviri tonunu değiştir"
                  >
                    {TRANSLATION_STYLES.map((style) => (
                      <option key={style.id} value={style.id} className="bg-slate-900 text-slate-200">
                        {style.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImage && !isTranslating) {
                        translateImage(selectedImage, mimeType, translationStyle);
                      }
                    }}
                    disabled={isTranslating}
                    className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
                    title="Bu ton ile görseli yeniden çevir"
                  >
                    <RefreshCw className={`w-3 h-3 ${isTranslating ? 'animate-spin text-emerald-400' : ''}`} />
                  </button>
                </div>

                {/* Overlay Style (for overlay view) */}
                {viewMode === 'overlay' && (
                  <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-700/80">
                    <span className="text-slate-400 text-[11px]">Kaplama:</span>
                    <select
                      value={overlayStyle}
                      onChange={(e) => setOverlayStyle(e.target.value as OverlayStyle)}
                      className="bg-transparent text-slate-200 text-xs outline-none cursor-pointer border-none"
                    >
                      <option value="seamless" className="bg-slate-900 text-slate-200">Tam Eşleme</option>
                      <option value="glass" className="bg-slate-900 text-slate-200">Buzlu Cam</option>
                      <option value="highlight" className="bg-slate-900 text-slate-200">Vurgulu</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Right: Actions (Undo/Redo, Resolution Upscaler Toggle, Export Settings, Copy, Text Panel) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Undo / Redo Buttons */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Geri Al (Ctrl+Z)"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">Geri</span>
                    <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-900 border border-slate-700/80 text-[9px] font-mono text-slate-400">Ctrl+Z</kbd>
                  </button>
                  <button
                    type="button"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    title="Yinele (Ctrl+Y veya Ctrl+Shift+Z)"
                  >
                    <Redo2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="hidden sm:inline">İleri</span>
                    <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-900 border border-slate-700/80 text-[9px] font-mono text-slate-400">Ctrl+Y</kbd>
                  </button>
                </div>

                {/* Resolution Upscaler Quick Toggle */}
                <button
                  type="button"
                  onClick={() => setIsHighQualityMode(!isHighQualityMode)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isHighQualityMode
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Yüksek Kalite Modu: Çözünürlüğü 2 katına çıkarır ve kenarları keskinleştirir"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Yüksek Kalite</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-extrabold">
                    {isHighQualityMode ? '2x Açık' : '1x'}
                  </span>
                </button>

                {/* Turkish Font Quick Selector */}
                <button
                  type="button"
                  onClick={() => setIsTurkishFontsOpen(true)}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-emerald-500/50"
                  title="Türkçe Yazı Tipleri Kataloğunu Aç (ç, ğ, ı, ö, ş, ü tam uyumlu)"
                >
                  <Type className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="hidden sm:inline">Türkçe Fontlar</span>
                </button>

                {/* Manual Speech Bubble Add Button (Works Offline & Online) */}
                <button
                  type="button"
                  onClick={handleAddManualBubble}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Görsele yeni bir konuşma balonu veya metin kutusu ekleyin (Klavye Kısayolu: N)"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Balon Ekle</span>
                  <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono text-amber-400 font-bold">N</kbd>
                </button>

                {/* Quick Save to PC Button */}
                <button
                  type="button"
                  onClick={handleSaveToPC}
                  disabled={!translationResult || isTranslating}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-40"
                  title="Görseli doğrudan bilgisayarınıza kaydedin (Ctrl+S)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Kaydet</span>
                  <kbd className="hidden md:inline px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono text-emerald-300 font-bold">Ctrl+S</kbd>
                </button>

                {/* Enhanced Download / Export Settings Button */}
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  disabled={!translationResult || isTranslating}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-40 cursor-pointer"
                  title="Görseli İndir, Çözünürlük (1x, 2x, 4x) ve Format (PNG, JPG, WEBP) Ayarları"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden xl:inline">İndirme / Çözünürlük</span>
                  <span className="xl:hidden">Ayarlar</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  disabled={!translationResult || isTranslating}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Çevrilmiş görseli panoya kopyala"
                >
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{isCopied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isDrawerOpen
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Metin ve OCR panelini aç/kapat"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Keyboard Actions Floating Bar for Selected Bubble */}
            {selectedBlockId && translationResult && (() => {
              const selectedBlock = translationResult.textBlocks.find((b) => b.id === selectedBlockId);
              if (!selectedBlock) return null;
              const blockIndex = translationResult.textBlocks.findIndex((b) => b.id === selectedBlockId);
              return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-fade-in text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold text-white">
                      Seçili Balon #{blockIndex + 1}:
                    </span>
                    <span className="text-emerald-300 font-semibold max-w-[200px] truncate bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      "{selectedBlock.translatedText}"
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                      ({selectedBlock.customFontSize || 22}px)
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-sans font-bold text-[10px] hidden md:flex items-center gap-1">
                      <span>🎯 {selectedBlock.matchedSystemFont || 'Sistem Fontu'}</span>
                      <span className="text-emerald-400/80 font-mono">({selectedBlock.fontSimilarityScore || 96}%)</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Font Diagnostic & Accuracy Refinement Trigger */}
                    <button
                      type="button"
                      onClick={() => setEditingBlock(selectedBlock)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Font Tanı ve Teşhis: Orijinal font ailesi, kalınlık ve stil niteliklerini inceleyerek eşleşme doğruluğunu elle iyileştirin"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Font Tanısı &amp; İyileştir</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingBlock(selectedBlock)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Metni Düzenle (Enter)"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Metni Düzenle</span>
                      <kbd className="px-1 py-0.2 rounded bg-emerald-700/40 text-[9px] font-mono text-emerald-950 font-extrabold">Enter</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFontSize(2)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                      title="Yazı Boyutunu Büyüt (+)"
                    >
                      <span>A+</span>
                      <kbd className="px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono">+</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleChangeFontSize(-2)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                      title="Yazı Boyutunu Küçült (-)"
                    >
                      <span>A-</span>
                      <kbd className="px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono">-</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleBold}
                      className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                        selectedBlock.fontWeight === 'bold'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="Kalın Yazı (Ctrl+B)"
                    >
                      <Bold className="w-3 h-3" />
                      <kbd className="px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono">Ctrl+B</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleItalic}
                      className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                        selectedBlock.customIsItalic ?? selectedBlock.isItalic
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title="İtalik Yazı (Ctrl+I)"
                    >
                      <Italic className="w-3 h-3" />
                      <kbd className="px-1 py-0.2 rounded bg-slate-950 text-[9px] font-mono">Ctrl+I</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteSelectedBlock}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Balonu Sil (Delete / Backspace)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Sil</span>
                      <kbd className="px-1 py-0.2 rounded bg-rose-950 text-[9px] font-mono text-rose-300">Del</kbd>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedBlockId(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                      title="Seçimi Bırak (Esc)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Translation Progress or Summary Pill */}
            {isTranslating ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center gap-3">
                <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-300 block text-sm">
                    {translationProgressStep}
                  </span>
                  <span className="text-slate-400 text-xs">
                    Hızlı yapay zeka motoru devrede. Orijinal yazı tipleri, renkler ve konumlar korunuyor.
                  </span>
                </div>
              </div>
            ) : translationResult ? (
              <>
                <div className="px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-3 shadow-lg">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Prominent Detected Language Badge */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-xs shadow-sm">
                      <span className="text-sm">🌐</span>
                      <span className="text-slate-400 font-normal">Algılanan Dil:</span>
                      <span className="text-white font-extrabold tracking-wide">
                        {translationResult.detectedLanguage}
                      </span>
                      {translationResult.confidence && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-200 text-[10px] font-mono border border-amber-500/30">
                          {translationResult.confidence}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium">
                      {translationResult.isAutoDetected !== false ? '✨ Otomatik Algılandı' : 'Manuel Seçildi'}
                    </span>

                    <span className="text-slate-300 font-medium line-clamp-1 max-w-md hidden sm:inline">
                      {translationResult.summary}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 font-medium border border-slate-700/60">
                      {translationResult.textBlocks.length} metin tespit edildi
                    </span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span>➔ 🇹🇷 Türkçe Çeviri</span>
                    </span>
                  </div>
                </div>

                {/* Prominent Quick Resolution, Format & Quality Bar */}
                <QuickExportBar
                  imageSrc={selectedImage}
                  textBlocks={translationResult.textBlocks}
                  overlayStyle={overlayStyle}
                  onOpenAdvancedModal={() => setIsExportModalOpen(true)}
                  isTranslating={isTranslating}
                  detectedLanguage={translationResult.detectedLanguage}
                />
              </>
            ) : null}

            {/* Main Workspace Split: Canvas Viewer + OCR List Drawer */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Canvas / Image Display */}
              <div
                className={`transition-all duration-200 ${
                  isDrawerOpen ? 'lg:col-span-8' : 'lg:col-span-12'
                }`}
              >
                {selectedImage && translationResult && (
                  <ImageViewer
                    imageSrc={selectedImage}
                    textBlocks={translationResult.textBlocks}
                    viewMode={viewMode}
                    overlayStyle={overlayStyle}
                    onSelectBlock={(block) => {
                      setSelectedBlockId(block.id);
                      setEditingBlock(block);
                    }}
                    hoveredBlockId={hoveredBlockId}
                    setHoveredBlockId={setHoveredBlockId}
                    isCompareOriginal={isComparingOriginal}
                    onToggleCompareOriginal={setIsComparingOriginal}
                    selectedBlockId={selectedBlockId}
                    onSelectBlockId={setSelectedBlockId}
                  />
                )}

                {/* If still translating initially */}
                {isTranslating && !translationResult && (
                  <div className="w-full h-96 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
                    <h4 className="text-sm font-bold text-white mb-1">
                      Yazılar ve Dil İnceleniyor
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Görsel üzerindeki alfabe ve dil otomatik tespit ediliyor, tüm yazılar orijinal konumlarında Türkçe'ye aktarılıyor.
                    </p>
                  </div>
                )}
              </div>

              {/* Side Transcript / OCR Panel */}
              {isDrawerOpen && translationResult && (
                <div className="lg:col-span-4 h-[75vh]">
                  <TextListDrawer
                    textBlocks={translationResult.textBlocks}
                    detectedLanguage={translationResult.detectedLanguage}
                    detectedLanguageCode={translationResult.detectedLanguageCode}
                    confidence={translationResult.confidence}
                    isAutoDetected={translationResult.isAutoDetected}
                    summary={translationResult.summary}
                    onSelectBlock={(block) => {
                      setSelectedBlockId(block.id);
                      setEditingBlock(block);
                    }}
                    onToggleVisibility={handleToggleVisibility}
                    selectedBlockId={selectedBlockId}
                    onSelectBlockId={setSelectedBlockId}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Block Fine-tuning Modal */}
      <BlockEditorModal
        block={editingBlock}
        isOpen={!!editingBlock}
        onClose={() => setEditingBlock(null)}
        onUpdateBlock={handleUpdateBlock}
        onDeleteBlock={handleDeleteBlock}
      />

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setSelectedImage(dataUrl);
          setMimeType('image/jpeg');
          translateImage(dataUrl, 'image/jpeg');
        }}
      />

      {/* History Slide-over Drawer (Last 5 translations in localStorage) */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        historyItems={historyItems}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
      />

      {/* Resolution Upscaler & Custom Download Settings Modal */}
      {selectedImage && translationResult && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          imageSrc={selectedImage}
          textBlocks={translationResult.textBlocks}
          overlayStyle={overlayStyle}
          defaultHighQuality={isHighQualityMode}
          detectedLanguage={translationResult.detectedLanguage}
          summary={translationResult.summary}
        />
      )}

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Windows Native C++20 / C++23 Desktop App Modal */}
      <WindowsCppModal
        isOpen={isCppModalOpen}
        onClose={() => setIsCppModalOpen(false)}
      />

      {/* Turkish Font Manager & Batch-Changer Modal */}
      <TurkishFontModal
        isOpen={isTurkishFontsOpen}
        onClose={() => setIsTurkishFontsOpen(false)}
        blocks={translationResult?.textBlocks || []}
        selectedBlockId={selectedBlockId}
        onApplyBlocks={(updatedBlocks, message) => {
          applyBlocksWithHistory(updatedBlocks, message);
        }}
        defaultFontName={defaultFontName}
        onSetDefaultFontName={handleSetDefaultFontName}
      />

      {/* Centralized Application Settings & Tools Hub Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenTurkishFonts={() => setIsTurkishFontsOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenCppModal={() => setIsCppModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenExportModal={() => {
          if (selectedImage && translationResult) {
            setIsExportModalOpen(true);
          } else {
            showToast('⚠️ Önce bir görsel yükleyin veya örnek seçin');
          }
        }}
        historyCount={historyItems.length}
        isOnline={isOnline}
        isHighQualityMode={isHighQualityMode}
        onToggleHighQualityMode={() => {
          setIsHighQualityMode((prev) => !prev);
          showToast(!isHighQualityMode ? '✨ Yüksek Kalite (2x) Aktif' : 'Standart Çözünürlük (1x) Aktif');
        }}
        defaultFontName={defaultFontName}
        hasActiveImage={!!selectedImage}
        blockCount={translationResult?.textBlocks.length || 0}
        onClearHistory={handleClearAllHistory}
        onClearCache={handleClearCache}
      />

      {/* Floating Action Toast Notification (Keyboard feedback) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 text-white border border-emerald-500/50 shadow-2xl rounded-2xl px-4 py-3 text-xs font-bold backdrop-blur-md animate-fade-in pointer-events-none">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
