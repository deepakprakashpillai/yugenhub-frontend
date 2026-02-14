import { twMerge } from "tailwind-merge";

function Skeleton({ className, ...props }) {
    return (
        <div
            className={twMerge("animate-pulse rounded-md bg-zinc-800/50", className)}
            {...props}
        />
    );
}

export { Skeleton };
