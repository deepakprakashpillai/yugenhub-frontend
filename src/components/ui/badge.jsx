import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

const Badge = ({ className, variant = "default", ...props }) => {
    const { theme } = useTheme();
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    let variantStyles = `border-transparent ${theme.canvas.card} ${theme.text.primary} hover:${theme.canvas.hover}`; // Default fallback

    if (variant === "default") {
        variantStyles = "border-transparent bg-accent text-white hover:opacity-90";
    } else if (variant === "secondary") {
        variantStyles = `border-transparent ${theme.canvas.button.secondary}`;
    } else if (variant === "destructive") {
        variantStyles = "border-transparent bg-red-500 text-white hover:bg-red-600";
    } else if (variant === "outline") {
        variantStyles = `${theme.text.primary} ${theme.canvas.border} bg-transparent`;
    }

    return (
        <div className={cn(baseStyles, variantStyles, className)} {...props} />
    );
}

export { Badge };
