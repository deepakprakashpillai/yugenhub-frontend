import { forwardRef } from 'react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

const Textarea = forwardRef(({
    value,
    onChange,
    placeholder,
    rows = 4,
    name,
    disabled = false,
    resize = false,
    className,
    error,
    ...props
}, ref) => {
    const { theme } = useTheme();

    return (
        <textarea
            ref={ref}
            name={name}
            value={value}
            onChange={onChange}
            rows={rows}
            placeholder={placeholder}
            disabled={disabled}
            className={clsx(
                'w-full px-4 py-3 rounded-xl border text-sm leading-relaxed transition-all outline-none',
                theme.canvas.bg,
                theme.canvas.border,
                theme.text.primary,
                `placeholder:${theme.text.secondary}`,
                !disabled && `hover:${theme.canvas.hover}`,
                disabled && 'opacity-50 cursor-not-allowed',
                !resize && 'resize-none',
                error
                    ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                    : 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
                className
            )}
            {...props}
        />
    );
});

Textarea.displayName = 'Textarea';

export default Textarea;
