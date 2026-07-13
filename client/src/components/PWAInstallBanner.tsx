/*
 * PWAInstallBanner.tsx — iOS/Android ホーム画面追加の案内バナー
 * Design: Election Broadcast Dashboard
 *
 * - iOSでは「共有」→「ホーム画面に追加」の手順を案内
 * - Androidでは beforeinstallprompt イベントを使ってネイティブプロンプトを表示
 * - 一度閉じたら localStorage に記録して再表示しない
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallBanner() {
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed or installed
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    // Check if already running as PWA (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    // iOS detection
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) {
      // Show iOS banner after a short delay
      const timer = setTimeout(() => setShowIOSBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowAndroidBanner(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "1");
    setShowIOSBanner(false);
    setShowAndroidBanner(false);
  };

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem("pwa-install-dismissed", "1");
    }
    setShowAndroidBanner(false);
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {/* iOS Banner */}
      {showIOSBanner && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-safe"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-lg mx-auto rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
            {/* Top accent */}
            <div className="h-0.5 bg-gradient-to-r from-[#e74c3c] via-[#f1c40f] to-[#3498db]" />
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* App icon */}
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/pwa-icon-512-cZ6zHZeDG9vwwVFSQU7GBY.png"
                  alt="選挙クイズ"
                  className="w-12 h-12 rounded-xl border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">ホーム画面に追加する</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    アプリのように使えます
                  </p>
                  {/* Step-by-step instruction */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                      <Share className="w-3 h-3" />
                      <span>共有</span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1 bg-muted/50 rounded px-2 py-1">
                      <Plus className="w-3 h-3" />
                      <span>ホーム画面に追加</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="p-1 rounded-full hover:bg-muted transition-colors shrink-0"
                  aria-label="閉じる"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Android Banner */}
      {showAndroidBanner && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 p-3"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-lg mx-auto rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
            <div className="h-0.5 bg-gradient-to-r from-[#e74c3c] via-[#f1c40f] to-[#3498db]" />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://d2xsxph8kpxj0f.cloudfront.net/310519663287896154/nbjZG3PrxwapekxcosX7Mw/pwa-icon-512-cZ6zHZeDG9vwwVFSQU7GBY.png"
                  alt="選挙クイズ"
                  className="w-12 h-12 rounded-xl border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">アプリをインストール</p>
                  <p className="text-xs text-muted-foreground">ホーム画面に追加して快適に使えます</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={dismiss}
                    className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    後で
                  </button>
                  <button
                    onClick={handleAndroidInstall}
                    className="px-3 py-1.5 text-xs font-bold bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors"
                  >
                    追加する
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
