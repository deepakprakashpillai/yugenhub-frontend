// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
// import { Button } from './ui/button'; // Button component not created yet

import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const EmptyState = ({
    title = "No records found",
    message = "Try adjusting your filters.",
    icon: Icon,
    action
}) => {
    const { theme } = useTheme();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed ${theme.canvas.border} rounded-3xl ${theme.canvas.bg} bg-opacity-20`}
        >
            {Icon && (
                <div className={`w-12 h-12 rounded-2xl ${theme.canvas.card} border ${theme.canvas.border} flex items-center justify-center mb-4 shadow-inner`}>
                    <Icon className={`w-6 h-6 ${theme.text.secondary}`} />
                </div>
            )}
            <h3 className={`text-lg font-bold ${theme.text.primary} mb-1`}>{title}</h3>
            <p className={`text-sm ${theme.text.secondary} max-w-sm mb-6`}>{message}</p>

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
