import React from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';

const Badge = ({ className, variant = "default", ...props }) => {
    const { theme } = useTheme();
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

    let variantStyles = `border-transparent ${theme.canvas.card} ${theme.text.primary} hover:${theme.canvas.hover}`; // Default fallback

    if (variant === "default") {
        variantStyles = "border-transparent bg-primary text-primary-foreground hover:bg-primary/80";
    } else if (variant === "secondary") {
        variantStyles = "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80";
    } else if (variant === "destructive") {
        variantStyles = "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80";
    } else if (variant === "outline") {
        variantStyles = `${theme.text.primary} ${theme.canvas.border}`;
    }

    return (
        <div className={cn(baseStyles, variantStyles, className)} {...props} />
    );
}

export { Badge };
