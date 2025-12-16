import React, { useEffect, useState } from 'react'
import { Download as DownloadIcon, Phone, Monitor, AppWindow } from "@phosphor-icons/react";

const Download = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallUI, setShowInstallUI] = useState(true);
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
        {/* Installation Status Card */}
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

        {/* Custom Install Prompt */}
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
  )
}

export default Download