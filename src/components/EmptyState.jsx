import { motion } from 'framer-motion';
// import { Button } from './ui/button'; // Button component not created yet

import { Link } from 'react-router-dom';

const EmptyState = ({
    title = "No records found",
    message = "Try adjusting your filters.",
    icon: Icon,
    action
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-900/20"
        >
            {Icon && (
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
                    <Icon className="w-6 h-6 text-zinc-500" />
                </div>
            )}
            <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-zinc-500 max-w-sm mb-6">{message}</p>

            {action && (
                action.to ? (
                    <Link
                        to={action.to}
                        className="px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        {action.label}
                    </Link>
                ) : (
                    <button
                        onClick={action.onClick}
                        className="px-4 py-2 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-colors"
                    >
                        {action.label}
                    </button>
                )
            )}
        </motion.div>
    );
};

export default EmptyState;
