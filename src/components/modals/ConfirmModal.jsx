// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from '../Icons';
import { useTheme } from '../../context/ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

const VARIANTS = {
    danger: {
        icon: Icons.AlertTriangle,
        iconBg: 'bg-red-500/20',
        iconColor: 'text-red-500',
        confirmClass: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
        icon: Icons.AlertCircle,
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-400',
        confirmClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
        icon: Icons.AlertCircle,
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-400',
        confirmClass: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
};

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Are you sure?',
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    loading = false,
}) => {
    const { theme } = useTheme();
    const isMobile = useIsMobile();
    const v = VARIANTS[variant] ?? VARIANTS.danger;
    const VariantIcon = v.icon;

    const mobileAnim = {
        initial: { opacity: 0, y: '100%' },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: '100%' },
    };
    const desktopAnim = {
        initial: { opacity: 0, scale: 0.95, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.95, y: 20 },
    };
    const anim = isMobile ? mobileAnim : desktopAnim;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className={`fixed inset-0 z-50 flex ${isMobile ? 'items-end' : 'items-center justify-center p-4'}`}
                    style={isMobile ? { paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' } : undefined}
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={anim.initial}
                        animate={anim.animate}
                        exit={anim.exit}
                        transition={{
                            duration: 0.2,
                            type: isMobile ? 'spring' : 'tween',
                            damping: isMobile ? 30 : undefined,
                            stiffness: isMobile ? 300 : undefined,
                        }}
                        drag={isMobile ? 'y' : false}
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => { if (info.offset.y > 100) onClose(); }}
                        className={`relative w-full max-w-sm ${theme.canvas.card} border ${theme.canvas.border} ${isMobile ? 'rounded-t-2xl' : 'rounded-2xl'} shadow-2xl overflow-hidden`}
                    >
                        {isMobile && (
                            <div className="flex justify-center pt-3 pb-1">
                                <div className={`w-10 h-1 rounded-full ${theme.canvas.border} bg-current opacity-30`} />
                            </div>
                        )}

                        <div className="p-6 space-y-5">
                            <div className="flex justify-center">
                                <div className={`w-16 h-16 rounded-full ${v.iconBg} flex items-center justify-center`}>
                                    <VariantIcon className={`w-8 h-8 ${v.iconColor}`} />
                                </div>
                            </div>

                            <div className="text-center space-y-1.5">
                                <h3 className={`text-lg font-bold ${theme.text.primary}`}>{title}</h3>
                                {message && (
                                    <p className={`text-sm ${theme.text.secondary} leading-relaxed`}>{message}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={onClose}
                                    disabled={loading}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium ${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} border ${theme.canvas.border} transition-colors disabled:opacity-50`}
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={loading}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium ${v.confirmClass} transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
                                >
                                    {loading ? (
                                        <Icons.Loader className="w-4 h-4 animate-spin" />
                                    ) : confirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
