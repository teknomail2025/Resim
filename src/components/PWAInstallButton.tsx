import React, { useState } from 'react';
import { Monitor, Download, Check, X, Info } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'navbar' | 'banner' | 'card' }> = ({
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 4000);
      }
    } else {
      setShowGuide(true);
    }
  };

  // If already installed and running standalone
  if (isInstalled || justInstalled) {
    if (variant === 'navbar') {
      return (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Monitor className="w-3.5 h-3.5" />
          <span>Masaüstü Modu</span>
        </div>
      );
    }
    return null;
  }

  // Navbar Button
  if (variant === 'navbar') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          title="GörselÇevir uygulamasını bilgisayarınıza bağımsız masaüstü PC uygulaması olarak yükleyin"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">PC Uygulaması Olarak Kur</span>
          <span className="sm:hidden">PC Kur</span>
        </button>

        {showGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">
                    Bilgisayara PC Uygulaması Olarak Kurma
                  </h3>
                </div>
                <button
                  onClick={() => setShowGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  GörselÇevir, Chromium (Chrome, Edge, Brave vb.) tabanlı tüm masaüstü tarayıcılarda bağımsız bir <strong>PC Masaüstü Uygulaması (PWA)</strong> olarak çalışabilir.
                </p>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      1
                    </span>
                    <span>
                      Tarayıcınızın adres çubuğunun sağ tarafındaki <strong>"Uygulamayı Yükle" 💻</strong> veya <strong>"GörselÇevir'i Yükle"</strong> simgesine tıklayın.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      2
                    </span>
                    <span>
                      Veya tarayıcı menüsünden <strong>"Diğer Araçlar" → "Uygulama Olarak Yükle..."</strong> seçeneğini seçin.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      3
                    </span>
                    <span>
                      Uygulama masaüstünüze ve Başlat menünüze ayrı bir program gibi eklenir, tarayıcı çubuğu olmadan tam ekran pencere olarak açılır.
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Card Variant (e.g. for homepage hero)
  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-3 text-left">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Monitor className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Masaüstü PC Uygulaması Olarak Kullanın</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
              Windows &amp; Mac &amp; Linux
            </span>
          </h4>
          <p className="text-[11px] text-slate-400">
            Tarayıcı çubuğu olmadan tek tıkla masaüstünden açın, doğrudan resim yapıştırıp çevirin.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleInstallClick}
        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        <span>PC Uygulamasını Yükle</span>
      </button>
    </div>
  );
};
