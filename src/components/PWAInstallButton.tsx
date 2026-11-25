import React, {useState} from 'react';
import {Download, Smartphone, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({variant = 'compact'}) => {
  const {isInstallable, isInstalled, isIOS, isAndroid, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="rounded-xl border border-[#0E6B4E]/25 bg-[#0E6B4E]/8 dark:border-[#2BB686]/25 dark:bg-[#2BB686]/10 p-4 text-sm text-[#0E6B4E] dark:text-[#2BB686]">
          Uygulama cihazınıza ana ekran uygulaması olarak kuruldu.
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'card' ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0E6B4E]/10 text-[#0E6B4E] dark:bg-[#2BB686]/15 dark:text-[#2BB686]">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#121914] dark:text-[#F1F5F2]">
                Android ve Telefon Ana Ekranına Yükle
              </h4>
              <p className="mt-0.5 text-xs text-[#525C54] dark:text-[#A0ABA3]">
                Çevrimdışı vakit hesaplama ve bildirimler için uygulama olarak kurun.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAction}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E6B4E] hover:bg-[#0B573F] dark:bg-[#2BB686] dark:hover:bg-[#249E74] text-white dark:text-[#081C15] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            {isInstallable ? 'Uygulamayı Yükle' : 'Kurulum Adımları'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAction}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E4E7E3] dark:border-[#232E27] bg-white dark:bg-[#151C18] hover:bg-[#EFF2EE] dark:hover:bg-[#1C2520] text-[#121914] dark:text-[#F1F5F2] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-4 w-4 text-[#0E6B4E] dark:text-[#2BB686]" />
          <span>{isInstallable ? 'Uygulamayı Yükle' : 'Ana Ekrana Ekle'}</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#151C18] border border-[#E4E7E3] dark:border-[#232E27] p-6 shadow-xl">
            <div className="w-10 h-1.5 bg-[#D4DAD2] dark:bg-[#2E3B33] rounded-full mx-auto mb-4 sm:hidden" />
            <div className="flex items-center justify-between gap-4">
              <h3 id="pwa-guide-title" className="text-base font-bold text-[#121914] dark:text-[#F1F5F2]">
                {isIOS ? 'iPhone / iPad Ana Ekrana Ekleme' : 'Android / Tarayıcı Kurulumu'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#525C54] hover:bg-[#EFF2EE] dark:text-[#A0ABA3] dark:hover:bg-[#1C2520] cursor-pointer"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 space-y-2.5 text-sm text-[#525C54] dark:text-[#A0ABA3]">
              {isIOS ? (
                <>
                  <p>1. Safari alt menüsündeki <strong>Paylaş</strong> simgesine dokunun.</p>
                  <p>2. Aşağı kaydırıp <strong>Ana Ekrana Ekle</strong> seçeneğini seçin.</p>
                </>
              ) : isAndroid ? (
                <>
                  <p>1. Android Chrome sağ üstteki <strong>üç nokta (⋮)</strong> menüsüne dokunun.</p>
                  <p>2. <strong>Ana ekrana ekle</strong> veya <strong>Uygulamayı yükle</strong> seçeneğini onaylayın.</p>
                </>
              ) : (
                <>
                  <p>1. Tarayıcı adres çubuğundaki <strong>Uygulamayı Yükle</strong> simgesine veya menüye dokunun.</p>
                  <p>2. Android telefonda Chrome üzerinden açtığınızda doğrudan APK gibi ana ekrana kurulabilir.</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#0E6B4E] dark:bg-[#2BB686] text-white dark:text-[#081C15] text-sm font-semibold hover:opacity-95 transition-opacity cursor-pointer"
            >
              Anladım
            </button>
          </div>
        </div>
      )}
    </>
  );
};
