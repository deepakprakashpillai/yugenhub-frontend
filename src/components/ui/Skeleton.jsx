import { twMerge } from "tailwind-merge";
import { useTheme } from "../../context/ThemeContext";

function Skeleton({ className, ...props }) {
    const { theme } = useTheme();
    return (
        <div
            className={twMerge(`animate-pulse rounded-md ${theme.canvas.card}`, className)}
            {...props}
        />
    );
}

export { Skeleton };
