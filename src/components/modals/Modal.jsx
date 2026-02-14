import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import { useTheme } from '../../context/ThemeContext';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const { theme } = useTheme();
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={`relative w-full ${sizeClasses[size]} ${theme.canvas.card} border ${theme.canvas.border} rounded-2xl shadow-2xl overflow-hidden`}
                    >
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
                        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Modal;
