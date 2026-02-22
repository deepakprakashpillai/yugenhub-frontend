// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

const SlideOver = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width = 'max-w-xl'
}) => {
    const { theme } = useTheme();
    const isMobile = useIsMobile();

    // Mobile: full-screen bottom sheet
    const mobileVariants = {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
    };

    // Desktop: slide from right
    const desktopVariants = {
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
    };

    const variants = isMobile ? mobileVariants : desktopVariants;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        drag={isMobile ? 'y' : false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className={clsx(
                            `fixed z-50 flex flex-col ${theme.canvas.card}`,
                            isMobile
                                ? `inset-x-0 bottom-0 top-0 rounded-t-2xl border-t ${theme.canvas.border}`
                                : `right-0 top-0 h-full border-l ${theme.canvas.border} ${width}`
                        )}
                        style={isMobile ? {} : { width: '100%' }}
                    >
                        {/* Mobile drag handle */}
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-1 shrink-0">
                                <div className={`w-10 h-1 rounded-full ${theme.canvas.border} bg-current opacity-30`} />
                            </div>
                        )}

                        {/* Header */}
                        <div className={`flex items-center justify-between p-5 ${!isMobile ? `border-b ${theme.canvas.border}` : 'pb-3'} shrink-0`}>
                            <div>
                                <h2 className={`text-xl font-bold ${theme.text.primary}`}>{title}</h2>
                                {subtitle && (
                                    <p className={`text-sm ${theme.text.secondary} mt-0.5`}>{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-lg hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar md:pb-0 pb-20">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SlideOver;
