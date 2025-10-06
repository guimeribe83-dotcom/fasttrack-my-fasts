import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as installed app
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 3 seconds if not previously dismissed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS instructions if on iOS and not installed
    if (ios && !isInStandaloneMode) {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isStandalone || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-md mx-auto">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Download className="w-6 h-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              {isIOS ? 'Instalar FastTrack' : 'Instalar Aplicativo'}
            </h3>
            
            {isIOS ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Para instalar este app no seu iPhone:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Toque no botão de compartilhar <span className="inline-block">⎙</span></li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Toque em "Adicionar"</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                Instale o FastTrack na sua tela inicial para acesso rápido e experiência completa
              </p>
            )}
            
            {!isIOS && deferredPrompt && (
              <Button 
                onClick={handleInstallClick}
                className="mt-3 w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Agora
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
