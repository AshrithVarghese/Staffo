import React, { useEffect, useState } from "react";
import { Download as DownloadIcon, Phone, Monitor, AppWindow } from "@phosphor-icons/react";

const Download = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallUI, setShowInstallUI] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userAgent, setUserAgent] = useState('');

  useEffect(() => {
    setUserAgent(navigator.userAgent);

    // Block the automatic install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault(); // Prevent the automatic mini-infobar
      setDeferredPrompt(e); // Store the event for later use
      setShowInstallUI(true); // Show our custom UI
    };

    // Check if app is already installed
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallUI(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if running in standalone mode
    if (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      setShowInstallUI(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('Install prompt is not available. Please try again later or use your browser menu.');
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallUI(false);
  };

  const isAndroid = /Android/.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  const isDesktop = !isAndroid && !isIOS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 pb-20 pt-8">
      <header className="max-w-4xl mx-auto mb-8 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <img
            src="/staffo.png"
            alt="Staffo"
            className="w-32 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => (window.location.href = "/")}
          />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Download Staffo App</h1>
        <p className="text-gray-600 mt-2">Install Staffo on your device for faster access and offline support</p>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        {isInstalled && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <AppWindow size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">App Installed!</h3>
              <p className="text-green-700 text-sm">Staffo is already installed on your device. You can launch it from your home screen.</p>
            </div>
          </div>
        )}

        {showInstallUI && !isInstalled && (
          <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-6 text-white shadow-lg animate-pulse-soft">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Install Staffo</h3>
                <p className="text-gray-200 text-sm">Get instant access with our web app experience</p>
              </div>
              <button
                onClick={() => setShowInstallUI(false)}
                className="text-gray-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
                <span>Fast & Responsive</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
                <span>Home Screen Access</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">✓</span>
                </div>
                <span>Works Offline</span>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <DownloadIcon size={20} />
              Install Now
            </button>
          </div>
        )}

        {!showInstallUI && !isInstalled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone size={24} className="text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Android</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Installation Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Staffo in Chrome or Edge browser</li>
                  <li>Tap the menu icon (⋮)</li>
                  <li>Select "Install app" or "Add to Home screen"</li>
                  <li>Follow the on-screen prompts</li>
                </ol>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Phone size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">iOS / iPadOS</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Installation Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Staffo in Safari</li>
                  <li>Tap the Share button</li>
                  <li>Select "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Monitor size={24} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Desktop</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Installation Steps:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Open Staffo in Chrome, Edge, or similar</li>
                  <li>Click the install icon (⬇️) in the address bar</li>
                  <li>Confirm the installation dialog</li>
                  <li>Staffo opens as a standalone window</li>
                </ol>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AppWindow size={24} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">App Benefits</h3>
              </div>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">⚡</span><span><strong>Faster Load Times:</strong> App caching for instant access</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">📱</span><span><strong>Home Screen Icon:</strong> Quick access from your home screen</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">🔋</span><span><strong>Offline Support:</strong> Access cached data without internet</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">🔔</span><span><strong>Notifications:</strong> Receive updates</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5">💾</span><span><strong>Minimal Storage:</strong> Uses less space than native apps</span></li>
              </ul>
            </div>
          </div>
        )}

        

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <details className="group border-b border-gray-200 pb-4">
              <summary className="font-medium text-gray-800 cursor-pointer hover:text-black transition-colors">Can I uninstall the app?</summary>
              <p className="text-gray-600 text-sm mt-2">Yes! You can uninstall Staffo like any other app. On Android, long-press the app icon and select "Uninstall". On iOS, long-press and select "Remove App".</p>
            </details>
            <details className="group border-b border-gray-200 pb-4">
              <summary className="font-medium text-gray-800 cursor-pointer hover:text-black transition-colors">Does it work offline?</summary>
              <p className="text-gray-600 text-sm mt-2">Yes! The app caches essential data when you first load it. Some features may be limited without internet, but you can still access previously loaded information.</p>
            </details>
            <details className="group border-b border-gray-200 pb-4">
              <summary className="font-medium text-gray-800 cursor-pointer hover:text-black transition-colors">Will it use my device storage?</summary>
              <p className="text-gray-600 text-sm mt-2">Very little! Progressive Web Apps use minimal storage compared to native apps. You can clear it like website cache.</p>
            </details>
            <details className="group">
              <summary className="font-medium text-gray-800 cursor-pointer hover:text-black transition-colors">How do I get updates?</summary>
              <p className="text-gray-600 text-sm mt-2">Updates happen automatically in the background. You'll always have the latest version without manual updates.</p>
            </details>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes pulse-soft {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.95;
          }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
}
export default Download