import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker with auto-update for offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('GörselÇevir için yeni bir sürüm mevcut');
  },
  onOfflineReady() {
    console.log('GörselÇevir masaüstü ve çevrimdışı çalışmaya hazır! Tüm dosyalar yerel olarak önbelleğe alındı.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
