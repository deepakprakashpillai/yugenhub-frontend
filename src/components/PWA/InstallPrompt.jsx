import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Download } from 'lucide-react';

export default function InstallPrompt({ isMobile }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isVisible, setIsVisible] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        // Only care about this on mobile devices
        if (!isMobile) return;

        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        const handleAppInstalled = () => {
            // Clear prompt and hide when installed
            setDeferredPrompt(null);
            setIsVisible(false);
            console.log('PWA was installed');
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isMobile]);

    if (!isMobile || !isVisible || !theme) return null;

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    return (
        <div className="mt-4 mb-2 px-3.5">
            <button
                onClick={handleInstallClick}
                style={{
                    backgroundColor: `${theme.accents?.default?.primary}1A`, // 10% opacity 
                    color: theme.accents?.default?.primary,
                    border: `1px solid ${theme.accents?.default?.primary}44`,
                    boxShadow: `0 0 20px ${theme.accents?.default?.glow}`
                }}
                className={`
          flex items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all font-bold text-[13px]
          ${theme.canvas.hover}
        `}
            >
                <Download size={15} />
                Install App
            </button>
        </div>
    );
}
