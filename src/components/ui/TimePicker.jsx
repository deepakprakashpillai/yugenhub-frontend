import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';

export default function TimePicker({
    value = '',
    onChange,
    placeholder = 'Time',
    className = '',
    inputClassName = '',
    icon: IconComponent = null,
}) {
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Parse value to 12h format for state
    const parseTime = (val) => {
        if (!val) {
            const now = new Date();
            let h24 = now.getHours();
            let m = now.getMinutes();
            // Optional: round to nearest 5 min
            const ampm = h24 >= 12 ? 'PM' : 'AM';
            const h12 = h24 % 12 || 12;
            return {
                h: h12.toString().padStart(2, '0'),
                m: m.toString().padStart(2, '0'),
                ampm
            };
        }
        const [hours24, minutes] = val.split(':');
        const h24 = parseInt(hours24, 10);
        const ampm = h24 >= 12 ? 'PM' : 'AM';
        const h12 = h24 % 12 || 12;
        return {
            h: h12.toString().padStart(2, '0'),
            m: minutes.padStart(2, '0'),
            ampm
        };
    };

    const [{ h, m, ampm }, setTimeState] = useState(parseTime(value));

    // Sync state when value changes externally
    useEffect(() => {
        if (value) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimeState(parseTime(value));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [open]);

    // Auto-scroll to selected items when opened
    useEffect(() => {
        if (open && containerRef.current) {
            setTimeout(() => {
                const activeButtons = containerRef.current.querySelectorAll('[data-active="true"]');
                activeButtons.forEach(btn => {
                    // Scroll container so button is in center
                    const container = btn.parentElement;
                    container.scrollTop = btn.offsetTop - (container.clientHeight / 2) + (btn.clientHeight / 2);
                });
            }, 10); // Small delay to ensure DOM is ready
        }
    }, [open]);

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const updateTime = (newH, newM, newAmpm) => {
        setTimeState({ h: newH, m: newM, ampm: newAmpm });
        let h24 = parseInt(newH, 10);
        if (newAmpm === 'PM' && h24 !== 12) h24 += 12;
        if (newAmpm === 'AM' && h24 === 12) h24 = 0;

        onChange(`${h24.toString().padStart(2, '0')}:${newM}`);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setOpen(false);
    };

    const displayValue = value ? `${h}:${m} ${ampm}` : '';

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 w-full text-left text-sm rounded-lg border px-3 py-2 transition-colors cursor-pointer
                    ${theme.canvas.card} ${theme.canvas.border}
                    hover:border-purple-500/50 focus:outline-none focus:border-purple-500
                    ${inputClassName}`}
            >
                {IconComponent ? (
                    <IconComponent className={`w-4 h-4 ${theme.text.secondary} flex-shrink-0`} />
                ) : (
                    <ClockIcon className={`w-4 h-4 ${theme.text.secondary} flex-shrink-0`} />
                )}
                <span className={displayValue ? theme.text.primary : theme.text.secondary}>
                    {displayValue || placeholder}
                </span>
                {value && (
                    <span
                        onClick={handleClear}
                        className={`ml-auto ${theme.text.secondary} hover:text-red-400 transition-colors z-10`}
                        title="Clear time"
                    >
                        ×
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    className={`absolute left-0 z-[100] w-64 mt-1 p-2 rounded-xl border shadow-2xl backdrop-blur-xl
                        ${theme.canvas.card} ${theme.canvas.border}`}
                >
                    {/* Headers */}
                    <div className="flex text-center mb-1">
                        <span className={`flex-1 text-[10px] font-bold uppercase tracking-widest ${theme.text.secondary}`}>Hour</span>
                        <span className={`flex-1 text-[10px] font-bold uppercase tracking-widest ${theme.text.secondary}`}>Minute</span>
                        <span className={`flex-1 text-[10px] font-bold uppercase tracking-widest ${theme.text.secondary}`}>AM/PM</span>
                    </div>

                    <div className="flex h-48 gap-1">
                        {/* Hours */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-1 relative" style={{ scrollBehavior: 'smooth' }}>
                            {hours.map(hour => {
                                const isSelected = hour === h;
                                return (
                                    <button
                                        key={hour}
                                        data-active={isSelected}
                                        type="button"
                                        onClick={() => updateTime(hour, m, ampm)}
                                        className={`block w-full text-center py-2 text-sm rounded transition-colors
                                            ${isSelected
                                                ? 'bg-purple-600 font-bold text-white shadow-md'
                                                : `${theme.text.primary} hover:bg-purple-500/20`
                                            }`}
                                    >
                                        {hour}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Minutes */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-1 relative" style={{ scrollBehavior: 'smooth' }}>
                            {minutes.map(minute => {
                                const isSelected = minute === m;
                                return (
                                    <button
                                        key={minute}
                                        data-active={isSelected}
                                        type="button"
                                        onClick={() => updateTime(h, minute, ampm)}
                                        className={`block w-full text-center py-2 text-sm rounded transition-colors
                                            ${isSelected
                                                ? 'bg-purple-600 font-bold text-white shadow-md'
                                                : `${theme.text.primary} hover:bg-purple-500/20`
                                            }`}
                                    >
                                        {minute}
                                    </button>
                                );
                            })}
                        </div>
                        {/* AM/PM */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-1 relative" style={{ scrollBehavior: 'smooth' }}>
                            {periods.map(period => {
                                const isSelected = period === ampm;
                                return (
                                    <button
                                        key={period}
                                        data-active={isSelected}
                                        type="button"
                                        onClick={() => updateTime(h, m, period)}
                                        className={`block w-full text-center py-2 text-sm rounded transition-colors
                                            ${isSelected
                                                ? 'bg-purple-600 font-bold text-white shadow-md'
                                                : `${theme.text.primary} hover:bg-purple-500/20`
                                            }`}
                                    >
                                        {period}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Ok Button */}
                    <div className={`mt-2 pt-2 border-t ${theme.canvas.border}`}>
                        <button
                            type="button"
                            onClick={() => {
                                // Just in case it wasn't updated
                                updateTime(h, m, ampm);
                                setOpen(false);
                            }}
                            className={`w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors`}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ClockIcon({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
