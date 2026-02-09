import { Icons } from './Icons';
import { motion } from 'framer-motion';

const EmptyState = ({ onClear, title = "No projects found/matched", message = "We couldn't find any items matching your filters. Try adjusting your search or filters." }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-zinc-500 border border-zinc-800 border-dashed rounded-3xl bg-zinc-900/20"
        >
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-xl">
                <Icons.Search className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm max-w-xs text-center mb-8 text-zinc-400">
                {message}
            </p>
            <button
                onClick={onClear}
                className="px-6 py-2.5 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-2 text-sm"
            >
                <Icons.X className="w-4 h-4" />
                Clear Filters
            </button>
        </motion.div>
    );
};

export default EmptyState;
