import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import clsx from 'clsx';

const MultiActionFAB = ({ actions = [], mainLabel = 'Add', className }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <div className={clsx("fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3", className)}>
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
                                <span className="bg-black/75 text-white text-xs px-2 py-1 rounded shadow-lg backdrop-blur-sm">
                                    {action.label}
                                </span>
                                <button
                                    onClick={() => {
                                        action.onClick();
                                        setIsOpen(false);
                                    }}
                                    className="p-3 bg-white text-indigo-600 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
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
                onClick={toggleOpen}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
                className={clsx(
                    "flex items-center justify-center w-14 h-14",
                    "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
                    "text-white rounded-full",
                    "shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50",
                    "transition-all duration-200"
                )}
                title={isOpen ? 'Close' : mainLabel}
            >
                <Icons.Plus className="w-6 h-6" />
            </motion.button>
        </div>
    );
};

export default MultiActionFAB;
