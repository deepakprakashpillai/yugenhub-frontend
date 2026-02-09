import { motion } from 'framer-motion';
import { Icons } from './Icons';
import clsx from 'clsx';

const FloatingActionButton = ({ onClick, label = 'Add', className }) => {
    return (
        <motion.button
            onClick={onClick}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={clsx(
                "fixed bottom-8 right-8 z-40",
                "flex items-center gap-2 px-5 py-3.5",
                "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500",
                "text-white font-semibold rounded-full",
                "shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50",
                "transition-all duration-200",
                className
            )}
            title={label}
        >
            <Icons.Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{label}</span>
        </motion.button>
    );
};

export default FloatingActionButton;
