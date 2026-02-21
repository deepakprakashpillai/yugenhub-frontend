import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../Icons';

const SearchableSelect = ({
    options,
    value,
    onChange,
    placeholder = "Select...",
    className = "",
    disabled = false
}) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    // Find selected option label
    const selectedOption = options.find(opt => opt.value === value);

    // Filter options based on search
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        // Reset search when closed
        if (!isOpen) {
            setTimeout(() => setSearchTerm(''), 0);
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer ${theme.canvas.bg
                    } ${theme.canvas.border} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    } focus-within:border-indigo-500 transition-colors`}
            >
                <span className={`block truncate ${selectedOption ? theme.text.primary : 'text-gray-500'} text-sm`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <Icons.ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className={`absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg border ${theme.canvas.border} ${theme.canvas.card} py-1 text-base sm:text-sm animate-in fade-in slide-in-from-top-1 duration-200`}>
                    <div className="px-2 py-1 sticky top-0 md:bg-inherit z-10 backdrop-blur-sm">
                        <input
                            type="text"
                            className={`w-full px-2 py-1.5 rounded-md border ${theme.canvas.border} bg-transparent text-sm focus:outline-none focus:border-indigo-500`}
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                        />
                    </div>

                    {filteredOptions.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-gray-500 italic text-center">
                            No options found.
                        </div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                className={`relative cursor-pointer select-none py-2 pl-3 pr-9 transition-colors ${option.value === value
                                    ? 'bg-indigo-600/10 text-indigo-500'
                                    : `text-gray-700 hover:${theme.canvas.hover} dark:text-gray-300`
                                    }`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span className={`block truncate ${option.value === value ? 'font-semibold' : 'font-normal'}`}>
                                    {option.label}
                                </span>
                                {option.value === value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                        <Icons.Check className="w-4 h-4" aria-hidden="true" />
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
