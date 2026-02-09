import { Icons } from './Icons';
import { motion } from 'framer-motion';

const EmptyState = ({ title = "No records found", message = "Try adjusting your filters." }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-12 text-zinc-500"
        >
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            {message && <p className="text-xs text-zinc-600 mt-1">{message}</p>}
        </motion.div>
    );
};

export default EmptyState;
