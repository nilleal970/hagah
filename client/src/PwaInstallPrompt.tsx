import React, { useState, useEffect } from 'react';
import { Download, Share2, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Detectar iOS / iPadOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone;

    if (isIosDevice && !isStandalone) {
      setIsIos(true);
    }

    // Capturar evento beforeinstallprompt (Chromium / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosTip(true);
    }
  };

  // Se já está instalado ou foi dispensado
  if (isDismissed || (!deferredPrompt && !isIos)) {
    return null;
  }

  return (
    <>
      {/* Botão sutil no cabeçalho ou banner flutuante */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-800 text-white hover:bg-amber-900 transition-all shadow-xs"
        title="Instalar aplicativo no seu aparelho"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>

      {/* Dica para iOS Safari */}
      {showIosTip && (
        <div className="fixed inset-x-4 bottom-6 z-50 max-w-sm mx-auto bg-stone-900 text-stone-100 p-4 rounded-2xl shadow-2xl border border-stone-700 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Instalar no iPhone / iPad
            </h4>
            <button
              onClick={() => setShowIosTip(false)}
              className="text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-stone-300 leading-relaxed">
            1. Toque no botão de <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> <strong>Compartilhar</strong> na barra do Safari.<br />
            2. Role a lista e escolha <strong>"Adicionar à Tela de Início"</strong>.
          </p>
        </div>
      )}
    </>
  );
};
