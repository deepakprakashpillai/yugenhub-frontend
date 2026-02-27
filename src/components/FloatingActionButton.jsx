import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import clsx from 'clsx';
import { useTheme } from '../context/ThemeContext';

const FloatingActionButton = ({ onClick, label = 'Add', className }) => {
    const { accentColor } = useTheme();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.button
            layout
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25,
                layout: { duration: 0.3 }
            }}
            className={clsx(
                "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100]",
                "flex items-center justify-center overflow-hidden",
                "text-white font-black uppercase tracking-tight",
                "rounded-2xl",
                "border border-white/10 dark:border-white/5",
                "shadow-[10px_10px_0px_0px_rgba(0,0,0,0.2)] dark:shadow-[10px_10px_0px_0px_rgba(255,255,255,0.07)]",
                "hover:shadow-[14px_14px_0px_0px_rgba(0,0,0,0.2)] dark:hover:shadow-[14px_14px_0px_0px_rgba(255,255,255,0.07)]",
                isHovered ? "w-auto md:px-6" : "w-14",
                className
            )}
            style={{
                marginBottom: 'env(safe-area-inset-bottom, 0px)',
                backgroundColor: accentColor,
                height: '3.5rem'
            }}
            title={label}
        >
            <motion.div layout className="flex items-center justify-center gap-2 px-4 md:px-0 h-full">
                <Icons.Plus className="w-5 h-5 shrink-0" />
                <AnimatePresence mode="wait">
                    {isHovered && (
                        <motion.span
                            layout
                            initial={{ width: 0, opacity: 0, x: -10 }}
                            animate={{ width: 'auto', opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden whitespace-nowrap hidden md:inline-block text-xs"
                        >
                            {label}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.button>
    );
};

export default FloatingActionButton;
