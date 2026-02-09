import { motion } from 'framer-motion';

const SkeletonCard = () => {
    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-shimmer" />

            {/* Header Skeleton */}
            <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl" />
                <div className="w-20 h-6 bg-zinc-800 rounded-full" />
            </div>

            {/* Title Skeleton */}
            <div className="space-y-2 mt-2">
                <div className="w-3/4 h-6 bg-zinc-800 rounded" />
                <div className="w-1/2 h-4 bg-zinc-800 rounded" />
            </div>

            {/* Footer Skeleton */}
            <div className="mt-auto pt-6 flex items-center justify-between border-t border-zinc-800/50">
                <div className="w-24 h-4 bg-zinc-800 rounded" />
                <div className="w-8 h-8 bg-zinc-800 rounded-full" />
            </div>
        </div>
    );
};

export default SkeletonCard;
