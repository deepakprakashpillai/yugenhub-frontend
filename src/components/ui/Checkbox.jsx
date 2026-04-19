import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../Icons';

const Checkbox = ({
    checked,
    onChange,
    label,
    disabled = false,
    className,
    id,
}) => {
    const { theme } = useTheme();

    return (
        <label
            htmlFor={id}
            className={clsx(
                'flex items-center gap-3 cursor-pointer group',
                disabled && 'opacity-50 cursor-not-allowed',
                className
            )}
        >
            <div className="relative flex-shrink-0">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="sr-only"
                />
                <div
                    className={clsx(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150',
                        checked
                            ? 'border-purple-500 bg-purple-500'
                            : `border-current ${theme.text.secondary} bg-transparent group-hover:border-purple-400`
                    )}
                    style={checked ? {
                        backgroundColor: 'rgb(168 85 247)',
                        borderColor: 'rgb(168 85 247)',
                    } : {}}
                >
                    {checked && (
                        <Icons.Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                </div>
            </div>

            {label && (
                <span className={clsx('text-sm', theme.text.primary)}>
                    {label}
                </span>
            )}
        </label>
    );
};

export default Checkbox;
