import React, { useState } from 'react';
import {
  X,
  Monitor,
  Terminal,
  Cpu,
  ShieldCheck,
  Zap,
  Download,
  Copy,
  Check,
  FileCode2,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';

interface WindowsCppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsCppModal: React.FC<WindowsCppModalProps> = ({ isOpen, onClose }) => {
  const [copiedBatch, setCopiedBatch] = useState(false);

  if (!isOpen) return null;

  const copyBuildScript = () => {
    const script = `cd windows_cpp_app\nbuild_and_run.bat`;
    navigator.clipboard.writeText(script);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Monitor className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  GörselÇevir - Windows 10/11 Yerel Masaüstü Sürümü
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-extrabold">
                  Modern C++20 / C++23
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tarayıcı veya Electron olmadan doğrudan PC donanımınızda çalışan saf yerel C++ masaüstü uygulaması
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 5 Technical Principles Compliance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>1. Modern C++ & Sıfır Ham Pointer (RAII)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Tüm bellek ve COM kaynakları <code className="text-emerald-300 bg-slate-900 px-1 rounded">std::unique_ptr</code>, <code className="text-emerald-300 bg-slate-900 px-1 rounded">std::shared_ptr</code> ve <code className="text-emerald-300 bg-slate-900 px-1 rounded">Microsoft::WRL::ComPtr</code> ile yönetilir. Ham pointer sızıntısı riski %0'dır.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-cyan-400">
              <Zap className="w-4 h-4" />
              <span>2. Donanım Hızlandırmalı GPU Performansı</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Doğrudan Windows <strong>Direct2D</strong> ve <strong>DirectWrite</strong> API'leri kullanılır. Web motoru (Chromium/Node) yoktur. Milisaniyelik açılış süresi ve ultra düşük RAM (~35 MB) tüketimi.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-blue-400">
              <Cpu className="w-4 h-4" />
              <span>3. Windows 10/11 Tam Entegrasyonu</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              DPI farkındalığı (<code className="text-blue-300 bg-slate-900 px-1 rounded">PerMonitorV2</code>), Windows 11 Koyu Tema desteği (DWM), sürükle-bırak dosya açma ve yerel <code className="text-blue-300 bg-slate-900 px-1 rounded">WinHTTP</code> kütüphanesi.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <FolderGit2 className="w-4 h-4" />
              <span>4. CMake & Visual Studio 2022 Altyapısı</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Modern <code className="text-amber-300 bg-slate-900 px-1 rounded">CMakeLists.txt</code> ve tek tıkla derleme için hazır <code className="text-amber-300 bg-slate-900 px-1 rounded">build_and_run.bat</code> derleme scripti projenin <code className="text-amber-300 bg-slate-900 px-1 rounded">windows_cpp_app/</code> dizininde mevcuttur.
            </p>
          </div>
        </div>

        {/* Source Files Structure */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-cyan-400" />
              <span>Oluşturulan Yerel C++ Proje Dosyaları (/windows_cpp_app/)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">MSVC / Clang / GCC Uyumlu</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-emerald-300">src/main.cpp</span>
              <span className="text-[10px] text-slate-400 font-sans">Win32 GUI & Olay Döngüsü</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-cyan-300">src/ImageRenderer.cpp</span>
              <span className="text-[10px] text-slate-400 font-sans">Direct2D & WIC Donanım Motoru</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-blue-300">src/FontMatcher.cpp</span>
              <span className="text-[10px] text-slate-400 font-sans">DirectWrite Font Eşleme</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-amber-300">src/TextExporter.cpp</span>
              <span className="text-[10px] text-slate-400 font-sans">UTF-8 BOM CSV & JSON Dışa Aktarma</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-purple-300">src/TranslatorEngine.cpp</span>
              <span className="text-[10px] text-slate-400 font-sans">WinHTTP RAII & Çevrimdışı Mod</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <span className="text-pink-300">build_and_run.bat</span>
              <span className="text-[10px] text-slate-400 font-sans">1-Tık Derle ve Çalıştır</span>
            </div>
          </div>
        </div>

        {/* 1-Click Run Guide */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-emerald-950/40 border border-blue-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">PC'de Derlemek ve Çalıştırmak İçin:</div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Proje ana dizinindeki <code className="text-cyan-300 bg-slate-950 px-1 rounded">windows_cpp_app/build_and_run.bat</code> dosyasına çift tıklayın veya Visual Studio'da CMake projesi olarak açın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={copyBuildScript}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
          >
            {copiedBatch ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedBatch ? 'Kopyalandı!' : 'Komutu Kopyala'}</span>
          </button>
        </div>

        {/* Footer Close */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
