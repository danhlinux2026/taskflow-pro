import { useEffect, useState } from 'react';
import { Download, Check } from 'lucide-react';

// Custom event fired by the app-level installer (see InstallPWAPrompt.tsx)
// when the PWA has successfully been added to the home screen.
const INSTALL_DONE_EVENT = 'taskflow:pwa-installed';

/**
 * Small inline button that triggers the browser's PWA install prompt.
 * If the browser never fires `beforeinstallprompt` (e.g. user already
 * dismissed it, or browser doesn't support it), it shows a hint telling
 * the user to use the browser menu instead.
 */
export function InstallPWAButton({ dark = false }: { dark?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );
  const [hint, setHint] = useState('');

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setHint('');
    };
    const onAppInstalled = () => setInstalled(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener(INSTALL_DONE_EVENT, onAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener(INSTALL_DONE_EVENT, onAppInstalled);
    };
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferredPrompt(null);
    } else if (!installed) {
      setHint(
        'Bấm menu trình duyệt (⋮ / ⋯) → "Thêm vào màn hình chính" hoặc "Cài đặt trang web".'
      );
      setTimeout(() => setHint(''), 6000);
    }
  };

  if (installed) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-medium ${
          dark
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
        }`}
      >
        <Check className="h-3.5 w-3.5 shrink-0" />
        <span>Đã cài ứng dụng — mở được từ màn hình chính.</span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border p-2.5 space-y-1.5 ${
        dark
          ? 'border-blue-500/40 bg-blue-500/10'
          : 'border-blue-200 bg-blue-50/60'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex items-center gap-2 text-xs font-medium ${
            dark ? 'text-slate-200' : 'text-slate-800'
          }`}
        >
          <Download className="h-3.5 w-3.5 shrink-0 text-blue-500" />
          <span>Cài ứng dụng lên màn hình chính</span>
        </div>
        <button
          type="button"
          onClick={handleClick}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
            dark
              ? 'bg-blue-500 hover:bg-blue-400 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Cài đặt
        </button>
      </div>
      <p
        className={`text-[11px] leading-relaxed ${
          dark ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        Mở app nhanh như ứng dụng thường, chạy được cả khi offline.
      </p>
      {hint && (
        <p className="text-[11px] font-medium text-amber-500 leading-relaxed">
          ⚠️ {hint}
        </p>
      )}
    </div>
  );
}
