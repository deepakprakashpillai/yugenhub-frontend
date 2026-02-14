import { useState } from 'react';
import { Icons } from './Icons';
import { useTheme } from '../context/ThemeContext';
import Select from './ui/Select';
import clsx from 'clsx';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'todo', label: 'To Do', icon: Icons.Circle },
    { value: 'in_progress', label: 'In Progress', icon: Icons.Timer },
    { value: 'review', label: 'Review', icon: Icons.Eye },
    { value: 'blocked', label: 'Blocked', icon: Icons.Ban },
];

const PRIORITY_OPTIONS = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'low', label: 'Low', color: 'text-emerald-400' },
];

const SORT_OPTIONS = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
];

const TaskFilters = ({ filters, onChange }) => {
    const { theme } = useTheme();
    const handleChange = (key, value) => {
        onChange({ ...filters, [key]: value });
    };

    const handleReset = () => {
        onChange({
            search: '',
            status: 'all',
            priority: 'all',
            sort_by: 'created_at'
        });
    };

    const hasActiveFilters = filters.search || filters.status !== 'all' || filters.priority !== 'all';

    return (
        <div className={`flex flex-wrap items-center gap-3 p-4 ${theme.canvas.bg} bg-opacity-50 border ${theme.canvas.border} rounded-2xl mb-8`}>
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Icons.Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.text.secondary}`} />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={filters.search || ''}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 ${theme.canvas.input || theme.canvas.card} border ${theme.canvas.border} rounded-xl text-sm ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all`}
                />
            </div>

            {/* Status Filter */}
            <Select
                value={filters.status || 'all'}
                onChange={(val) => handleChange('status', val)}
                options={STATUS_OPTIONS}
                placeholder="Status"
                className="min-w-[160px]"
            />

            {/* Priority Filter */}
            <Select
                value={filters.priority || 'all'}
                onChange={(val) => handleChange('priority', val)}
                options={PRIORITY_OPTIONS}
                placeholder="Priority"
                className="min-w-[160px]"
            />

            {/* Sort */}
            <Select
                value={filters.sort_by || 'created_at'}
                onChange={(val) => handleChange('sort_by', val)}
                options={SORT_OPTIONS}
                placeholder="Sort By"
                className="min-w-[160px]"
            />

            {/* Reset */}
            {hasActiveFilters && (
                <button
                    onClick={handleReset}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase ${theme.text.secondary} hover:${theme.text.primary} ${theme.canvas.card} hover:${theme.canvas.hover} rounded-lg transition-colors`}
                >
                    <Icons.X className="w-3.5 h-3.5" />
                    Reset
                </button>
            )}
        </div>
    );
};

export default TaskFilters;
