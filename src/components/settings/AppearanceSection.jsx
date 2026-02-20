import { useState } from 'react';
import { useAgencyConfig } from '../../context/AgencyConfigContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../api/axios';
import { toast } from 'sonner';
import { Check, Moon, Sun } from 'lucide-react';

const ACCENT_PRESETS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Rose', value: '#f43f5e' },
];

export default function AppearanceSection({ role }) {
    const { config, refreshConfig } = useAgencyConfig();
    const { theme, setThemeMode } = useTheme();
    // Local state for immediate feedback, though we save on change usually
    const [localThemeMode, setLocalThemeMode] = useState(config?.theme_mode || 'dark');
    const [localAccent, setLocalAccent] = useState(config?.accent_color || '#ef4444');

    const handleSave = async (key, value) => {
        if (role !== 'owner') {
            toast.error('Only owners can change appearance settings');
            return;
        }

        try {
            await api.patch('/settings/org', {
                [key]: value
            });
            await refreshConfig();
            toast.success('Appearance updated');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update appearance');
        }
    };

    const toggleTheme = (mode) => {
        setLocalThemeMode(mode);
        setThemeMode(mode);
        if (role === 'owner') {
            handleSave('theme_mode', mode);
        }
    };

    const selectAccent = (color) => {
        setLocalAccent(color);
        handleSave('accent_color', color);
    };

    return (
        <div className={`space-y-8 ${theme.text.primary}`}>

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold">Appearance</h2>
                <p className={`text-sm mt-1 ${theme.text.secondary}`}>Customize how your workspace looks.</p>
            </div>

            {/* Theme Mode */}
            <div className={`p-6 rounded-2xl border ${theme.canvas.card} ${theme.canvas.border}`}>
                <h3 className="text-lg font-bold mb-4">Interface Theme</h3>
                <div className="flex gap-4">
                    <button
                        onClick={() => toggleTheme('light')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3
                            ${localThemeMode === 'light'
                                ? `border-[color:var(--accent)] bg-[color:var(--accent)]/5`
                                : `border-transparent ${theme.canvas.hover}`
                            }
                        `}
                        style={localThemeMode === 'light' ? { borderColor: localAccent } : {}}
                    >
                        <div className="w-full aspect-video bg-white rounded-lg border border-zinc-200 shadow-sm p-3 flex gap-2">
                            <div className="w-1/4 h-full bg-zinc-50 rounded"></div>
                            <div className="flex-1 h-full space-y-2">
                                <div className="w-full h-8 bg-zinc-50 rounded"></div>
                                <div className="w-full h-20 bg-zinc-50 rounded"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sun size={16} />
                            <span className="font-bold">Light Mode</span>
                        </div>
                    </button>

                    <button
                        onClick={() => toggleTheme('dark')}
                        className={`flex-1 p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3
                            ${localThemeMode === 'dark'
                                ? `border-[color:var(--accent)] bg-[color:var(--accent)]/5`
                                : `border-transparent ${theme.canvas.hover}`
                            }
                        `}
                        style={localThemeMode === 'dark' ? { borderColor: localAccent } : {}}
                    >
                        <div className="w-full aspect-video bg-zinc-950 rounded-lg border border-zinc-800 shadow-sm p-3 flex gap-2">
                            <div className="w-1/4 h-full bg-black rounded"></div>
                            <div className="flex-1 h-full space-y-2">
                                <div className="w-full h-8 bg-zinc-900 rounded"></div>
                                <div className="w-full h-20 bg-zinc-900 rounded"></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Moon size={16} />
                            <span className="font-bold">Dark Mode</span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Accent Color */}
            <div className={`p-6 rounded-2xl border ${theme.canvas.card} ${theme.canvas.border}`}>
                <h3 className="text-lg font-bold mb-4">Accent Color</h3>
                <p className={`text-sm mb-6 ${theme.text.secondary}`}>Choose a primary color for your organization.</p>

                <div className="grid grid-cols-5 md:grid-cols-8 gap-4">
                    {ACCENT_PRESETS.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => selectAccent(preset.value)}
                            className="group relative aspect-square rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                            style={{ backgroundColor: preset.value }}
                            title={preset.name}
                        >
                            {localAccent === preset.value && (
                                <Check className="text-white drop-shadow-md" size={20} strokeWidth={3} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Custom Hex Input if needed later */}
                <div className="mt-6 flex items-center gap-4">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-lg border border-zinc-700 overflow-hidden">
                            <input
                                type="color"
                                value={localAccent}
                                onChange={(e) => selectAccent(e.target.value)}
                                className="w-[150%] h-[150%] -m-[25%] cursor-pointer p-0 border-0"
                            />
                        </div>
                    </div>
                    <span className={`text-sm font-mono ${theme.text.secondary} uppercase`}>{localAccent}</span>
                </div>
            </div>

        </div>
    );
}
