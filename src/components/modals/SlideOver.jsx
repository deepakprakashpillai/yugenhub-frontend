import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const SlideOver = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width = 'max-w-xl'
}) => {
    const { theme } = useTheme();

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
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={clsx(
                            `fixed right-0 top-0 h-full ${theme.canvas.card} border-l ${theme.canvas.border} z-50 flex flex-col`,
                            width
                        )}
                        style={{ width: '100%' }}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-5 border-b ${theme.canvas.border} shrink-0`}>
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
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SlideOver;
