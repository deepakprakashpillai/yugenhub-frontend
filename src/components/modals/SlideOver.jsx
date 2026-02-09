import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import clsx from 'clsx';

const SlideOver = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    width = 'max-w-xl'
}) => {
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
                            "fixed right-0 top-0 h-full bg-zinc-900 border-l border-zinc-800 z-50 flex flex-col",
                            width
                        )}
                        style={{ width: '100%' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-800 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-white">{title}</h2>
                                {subtitle && (
                                    <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            >
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SlideOver;
