// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
// import { Button } from './ui/button'; // Button component not created yet

import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const EmptyState = ({
    title = "No records found",
    message = "Try adjusting your filters.",
    icon: Icon,
    compact = false,
    action
}) => {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center ${compact ? 'py-8 px-4 rounded-2xl' : 'py-16 px-4 rounded-3xl'} text-center border-2 border-dashed ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-20`}
        >
            {Icon && (
                <div className={`${compact ? 'w-10 h-10 rounded-xl mb-3' : 'w-12 h-12 rounded-2xl mb-4'} ${theme.canvas.card} border ${theme.canvas.border} flex items-center justify-center shadow-inner`}>
                    <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${theme.text.secondary}`} />
                </div>
            )}
            <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold ${theme.text.primary} mb-1`}>{title}</h3>
            <p className={`text-sm ${theme.text.secondary} max-w-sm ${compact ? 'mb-4' : 'mb-6'}`}>{message}</p>

            {action && (
                action.to ? (
                    <Link
                        to={action.to}
                        className={`px-4 py-2 ${theme.canvas.fg || 'bg-white'} ${theme.text.inverse || 'text-black'} text-sm font-bold rounded-xl hover:opacity-90 transition-colors`}
                    >
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className={`px-4 py-2 ${theme.canvas.fg || 'bg-white'} ${theme.text.inverse || 'text-black'} text-sm font-bold rounded-xl hover:opacity-90 transition-colors`}
                    >
                        {action.label}
                    </button>
                )
            )}
        </motion.div>
    );
};

export default EmptyState;
