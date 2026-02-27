import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

const MultiActionFAB = ({ actions = [], mainLabel = 'Add', className }) => {
    const { theme, accentColor } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div
            className={clsx("fixed bottom-24 right-5 md:bottom-8 md:right-8 z-[100] flex flex-col items-end gap-3", className)}
            style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
            <AnimatePresence>
                {isOpen && (
                    <div className="flex flex-col gap-3 items-end mb-2">
                        {actions.map((action, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <span className={`${theme.canvas.card} border ${theme.canvas.border} ${theme.text.primary} text-xs px-2 py-1 rounded shadow-lg backdrop-blur-sm`}>
                                    {action.label}
                                </span>
                                <button
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className={`p-3 ${theme.canvas.card} ${theme.text.primary} border ${theme.canvas.border} rounded-xl shadow-lg hover:${theme.canvas.hover} transition-all active:scale-95`}
                                    title={action.label}
                                >
                                    {action.icon}
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            <motion.button
                layout
                onClick={toggleOpen}
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.92 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                className={clsx(
                    "flex items-center justify-center w-14 h-14",
                    "text-white",
                    "rounded-2xl", // Uniform rounded corners
                    "border border-white/20 dark:border-white/10",
                    "shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.07)]",
                    "hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,0.2)] dark:hover:shadow-[14px_14px_0px_0px_rgba(255,255,255,0.07)]",
                    "transition-all duration-300"
                )}
                style={{ backgroundColor: accentColor }}
                title={isOpen ? 'Close' : mainLabel}
            >
                <Icons.Plus className="w-6 h-6" />
            </motion.button>
        </div>
    );
};

export default MultiActionFAB;
