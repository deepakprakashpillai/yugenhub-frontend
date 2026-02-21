 
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

import { useTheme } from '../context/ThemeContext';

const SkeletonCard = () => {
    const { theme } = useTheme();
    return (
        <div className={`${theme.canvas.bg} bg-opacity-30 border ${theme.canvas.border} rounded-2xl p-6 flex flex-col gap-4 overflow-hidden relative`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />

            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className={`w-12 h-12 ${theme.canvas.card} rounded-xl`} />
                <div className={`w-20 h-6 ${theme.canvas.card} rounded-full`} />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-2 mt-2">
                <div className={`w-3/4 h-6 ${theme.canvas.card} rounded`} />
                <div className={`w-1/2 h-4 ${theme.canvas.card} rounded`} />
            </div>

            {/* Footer Skeleton */}
            <div className={`mt-auto pt-6 flex items-center justify-between border-t ${theme.canvas.border}`}>
                <div className={`w-24 h-4 ${theme.canvas.card} rounded`} />
                <div className={`w-8 h-8 ${theme.canvas.card} rounded-full`} />
            </div>
        </div>
    );
};

export default SkeletonCard;
