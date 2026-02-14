import { format, isToday, isTomorrow } from 'date-fns';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';
import { Icons } from '../Icons';

const EventTimeline = ({ events }) => {
    const { theme } = useTheme();

    if (!events || events.length === 0) {
        return (
            <div className={`border-2 border-dashed ${theme.canvas.border} rounded-2xl p-8 text-center ${theme.canvas.bg} bg-opacity-50`}>
                <p className={`${theme.text.secondary} font-medium`}>Clear schedule ahead</p>
                <p className={`${theme.text.secondary} text-xs mt-1`}>No events in the next 14 days</p>
            </div>
        );
    }

    return (
        <div className="relative pl-2">
            {/* Main Vertical Line */}
            <div className={`absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b ${theme.mode === 'dark' ? 'from-zinc-800 via-zinc-800' : 'from-zinc-200 via-zinc-200'} to-transparent rounded-full`} />

            <div className="space-y-6">
                {events.map((event, index) => {
                    const date = new Date(event.start_date);
                    const isNow = isToday(date);
                    const isTmrw = isTomorrow(date);

                    return (
                        <div key={index} className="flex gap-6 items-start relative group">

                            {/* Date Circle */}
                            <div className={clsx(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 z-10 border-[3px] shadow-xl transition-all duration-300",
                                isNow ? "bg-purple-600 border-white/10 text-white shadow-purple-900/30 scale-105" : `${theme.canvas.card} ${theme.canvas.border} ${theme.text.secondary} group-hover:${theme.text.primary} group-hover:border-zinc-400`
                            )}>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-[10px] uppercase font-bold tracking-wider mb-0.5">{format(date, 'MMM')}</span>
                                    <span className="text-xl font-black">{format(date, 'd')}</span>
                                </div>
                            </div>

                            {/* Content Card */}
                            <div className={clsx(
                                "flex-1 p-5 rounded-2xl border transition-all duration-300",
                                isNow
                                    ? "bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20 shadow-lg shadow-purple-500/5"
                                    : `${theme.canvas.card} ${theme.canvas.border} hover:${theme.canvas.hover}`
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {isNow && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-purple-500/20">LIVE Today</span>}
                                            {isTmrw && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wide border border-blue-500/20">Tomorrow</span>}
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{event.type}</span>
                                        </div>
                                        <h4 className={`${theme.text.primary} font-bold text-lg leading-tight group-hover:text-purple-500 transition-colors flex items-center gap-2`}>
                                            {event.project_code}
                                            {event.client_name && <span className={`${theme.text.secondary} font-normal text-sm border-l ${theme.canvas.border} pl-2`}>for {event.client_name}</span>}
                                        </h4>
                                    </div>
                                    <div className={`p-2 ${theme.canvas.bg} rounded-lg ${theme.text.secondary} group-hover:${theme.text.primary} transition-colors cursor-pointer hover:${theme.canvas.hover}`}>
                                        <Icons.ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Info Row: Location & Team */}
                                <div className="space-y-3">
                                    {event.location && (
                                        <div className={`flex items-center gap-2 ${theme.text.secondary} text-xs`}>
                                            <Icons.MapPin className="w-3.5 h-3.5" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}

                                    {/* Team Members */}
                                    {event.assignment_details?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {event.assignment_details.map((a, i) => (
                                                <div key={i} className={`flex items-center gap-1.5 px-2 py-1 ${theme.canvas.bg} rounded-md border ${theme.canvas.border} text-[10px] ${theme.text.primary}`}>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="font-medium">{a.associate_name}</span>
                                                    <span className={`${theme.text.secondary} uppercase tracking-tighter`}>[{a.role}]</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-900/30 w-fit">
                                            <Icons.AlertCircle className="w-3.5 h-3.5" />
                                            UNASSIGNED
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
export default EventTimeline;
