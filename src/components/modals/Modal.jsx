// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const { theme } = useTheme();
    const isMobile = useIsMobile();

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    // Mobile: bottom sheet slide-up
    const mobileAnimation = {
        initial: { opacity: 0, y: '100%' },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
    };

    // Desktop: center scale-in
    const desktopAnimation = {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
    };

    const animation = isMobile ? mobileAnimation : desktopAnimation;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center p-4'}`}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={animation.initial}
                        animate={animation.animate}
                        exit={animation.exit}
                        transition={{ duration: 0.2, type: isMobile ? 'spring' : 'tween', damping: isMobile ? 30 : undefined, stiffness: isMobile ? 300 : undefined }}
                        className={`relative w-full ${isMobile ? '' : sizeClasses[size]} ${theme.canvas.card} border ${theme.canvas.border} ${isMobile ? 'rounded-t-2xl' : 'rounded-2xl'} shadow-2xl overflow-hidden`}
                    >
                        {/* Mobile drag handle */}
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-1">
                                <div className={`w-10 h-1 rounded-full ${theme.canvas.border} bg-current opacity-30`} />
                            </div>
                        )}

                        {/* Header */}
                        <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.canvas.border}`}>
                            <h3 className={`text-lg font-bold ${theme.text.primary}`}>{title}</h3>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className={`p-6 ${isMobile ? 'max-h-[75vh] pb-8' : 'max-h-[70vh]'} overflow-y-auto`}>
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
