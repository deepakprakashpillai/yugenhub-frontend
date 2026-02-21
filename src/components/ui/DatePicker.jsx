import { useState, useRef, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO
} from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * DatePicker — A custom calendar dropdown.
 * 
 * Props:
 *   value      — YYYY-MM-DD string or empty
 *   onChange    — (dateStr: string) => void  — returns YYYY-MM-DD
 *   placeholder — optional placeholder text
 *   className   — additional wrapper classes
 *   label       — optional label (not rendered here, for parent use)
 */
export default function DatePicker({
    value = '',
    onChange,
    placeholder = 'Select date',
    className = '',
    inputClassName = '',
    icon: IconComponent = null,
}) {
    const { theme } = useTheme();
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            try { return parseISO(value); } catch { /* fallback */ }
        }
        return new Date();
    });
    const containerRef = useRef(null);
    const calendarRef = useRef(null);

    // Sync viewDate when value changes externally
    useEffect(() => {
        if (value) {
            try {
                const newDate = parseISO(value);
                // Only update if it's a different month/year to avoid unnecessary renders
                // while still keeping the calendar view somewhat in sync with the value.
                if (viewDate.getTime() !== newDate.getTime()) {
                    setViewDate(newDate);
                }
            } catch { /* ignore */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Close on click outside
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

    // Position calendar above or below based on viewport space
    useEffect(() => {
        if (open && calendarRef.current && containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const calendarHeight = 320;
            const spaceBelow = window.innerHeight - containerRect.bottom;
            if (spaceBelow < calendarHeight && containerRect.top > calendarHeight) {
                calendarRef.current.style.bottom = '100%';
                calendarRef.current.style.top = 'auto';
                calendarRef.current.style.marginBottom = '4px';
            } else {
                calendarRef.current.style.top = '100%';
                calendarRef.current.style.bottom = 'auto';
                calendarRef.current.style.marginTop = '4px';
            }
        }
    }, [open]);

    const selectedDate = value ? parseISO(value) : null;

    const handleSelect = (day) => {
        onChange(format(day, 'yyyy-MM-dd'));
        setOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setOpen(false);
    };

    // Build calendar grid
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
    }

    const displayValue = selectedDate
        ? format(selectedDate, 'dd MMM yyyy')
        : '';

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
                    <CalendarIcon className={`w-4 h-4 ${theme.text.secondary} flex-shrink-0`} />
                )}
                <span className={displayValue ? theme.text.primary : theme.text.secondary}>
                    {displayValue || placeholder}
                </span>
                {selectedDate && (
                    <span
                        onClick={handleClear}
                        className={`ml-auto ${theme.text.secondary} hover:text-red-400 transition-colors`}
                        title="Clear date"
                    >
                        ×
                    </span>
                )}
            </button>

            {/* Calendar Dropdown */}
            {open && (
                <div
                    ref={calendarRef}
                    className={`absolute left-0 z-[100] w-72 p-3 rounded-xl border shadow-2xl backdrop-blur-xl
                        ${theme.canvas.card} ${theme.canvas.border}`}
                    style={{ marginTop: '4px' }}
                >
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            type="button"
                            onClick={() => setViewDate(subMonths(viewDate, 1))}
                            className={`p-1.5 rounded-lg hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                        >
                            <ChevronLeftIcon />
                        </button>
                        <span className={`text-sm font-bold ${theme.text.primary}`}>
                            {format(viewDate, 'MMMM yyyy')}
                        </span>
                        <button
                            type="button"
                            onClick={() => setViewDate(addMonths(viewDate, 1))}
                            className={`p-1.5 rounded-lg hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} transition-colors`}
                        >
                            <ChevronRightIcon />
                        </button>
                    </div>

                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 mb-1">
                        {WEEKDAYS.map(wd => (
                            <div key={wd} className={`text-center text-[10px] font-bold uppercase ${theme.text.secondary} py-1`}>
                                {wd}
                            </div>
                        ))}
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7">
                        {days.map((d, i) => {
                            const inMonth = isSameMonth(d, viewDate);
                            const selected = selectedDate && isSameDay(d, selectedDate);
                            const today = isToday(d);

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelect(d)}
                                    className={`
                                        w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center mx-auto
                                        ${selected
                                            ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-600/30'
                                            : today
                                                ? `ring-1 ring-purple-500/50 ${theme.text.primary}`
                                                : inMonth
                                                    ? `${theme.text.primary} hover:bg-purple-500/20`
                                                    : `${theme.text.secondary} opacity-30 hover:opacity-60`
                                        }
                                    `}
                                >
                                    {format(d, 'd')}
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick Actions */}
                    <div className={`flex gap-2 mt-3 pt-3 border-t ${theme.canvas.border}`}>
                        <button
                            type="button"
                            onClick={() => handleSelect(new Date())}
                            className={`flex-1 text-xs py-1.5 rounded-lg ${theme.canvas.hover || 'bg-zinc-800'} ${theme.text.secondary} hover:${theme.text.primary} transition-colors font-medium`}
                        >
                            Today
                        </button>
                        {selectedDate && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className={`flex-1 text-xs py-1.5 rounded-lg ${theme.canvas.hover || 'bg-zinc-800'} text-red-400 hover:text-red-300 transition-colors font-medium`}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Inline SVG icons to avoid dependency on lucide for this component
function CalendarIcon({ className }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    );
}

function ChevronLeftIcon() {
    return (
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
        </svg>
    );
}

function ChevronRightIcon() {
    return (
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
