import { useState, useRef, useEffect } from 'react';
import { Icons } from '../Icons';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Custom dropdown component for Jira-style UX.
 */
const Select = ({
    value,
    onChange,
    options = [],
    placeholder = 'Select...',
    className,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Get current option
    const selectedOption = options.find(o => o.value === value);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle selection
    const handleSelect = (option) => {
        onChange(option.value);
        setIsOpen(false);
    };

    const toggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const StatusIcon = selectedOption?.icon;

    return (
        <div ref={containerRef} className={clsx("relative inline-block min-w-[140px]", className)}>
            <button
                type="button"
                onClick={toggle}
                disabled={disabled}
                className={clsx(
                    "flex items-center justify-between w-full gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200 outline-none",
                    isOpen ? "border-purple-500 bg-zinc-800 ring-2 ring-purple-500/20" : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50",
                    disabled && "opacity-50 cursor-not-allowed",
                    // Use option color if available, else plain text
                    selectedOption?.color ? selectedOption.color : "text-zinc-300"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    {StatusIcon && <StatusIcon className="w-4 h-4 shrink-0" />}
                    <span className="truncate">{selectedOption?.label || placeholder}</span>
                </div>
                <Icons.ChevronDown className={clsx("w-4 h-4 text-zinc-500 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 z-50 mt-2 w-full min-w-[180px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden backdrop-blur-sm"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {options.map((option) => {
                                const Icon = option.icon;
                                const isSelected = option.value === value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={clsx(
                                            "flex items-center w-full gap-2 px-3 py-2.5 text-sm rounded-md transition-colors text-left",
                                            isSelected ? "bg-purple-500/10 text-purple-400 font-medium" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                        )}
                                    >
                                        {Icon && <Icon className={clsx("w-4 h-4 shrink-0", isSelected ? "text-purple-400" : "text-zinc-500")} />}
                                        <span className="truncate">{option.label}</span>
                                        {isSelected && <Icons.Check className="w-4 h-4 ml-auto text-purple-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Select;
