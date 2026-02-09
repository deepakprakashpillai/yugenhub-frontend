import { format, isToday, isTomorrow } from 'date-fns';
import clsx from 'clsx';
import { Icons } from '../Icons';

const EventTimeline = ({ events }) => {
    if (!events || events.length === 0) {
        return (
            <div className="border-2 border-dashed border-zinc-800 rounded-2xl p-8 text-center bg-zinc-900/20">
                <p className="text-zinc-500 font-medium">Clear schedule ahead</p>
                <p className="text-zinc-600 text-xs mt-1">No events in the next 14 days</p>
            </div>
        );
    }

    return (
        <div className="relative pl-2">
            {/* Main Vertical Line */}
            <div className="absolute left-[27px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-zinc-800 via-zinc-800 to-transparent rounded-full" />

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
                                isNow ? "bg-purple-600 border-zinc-950 text-white shadow-purple-900/30 scale-105" : "bg-zinc-900 border-zinc-950 text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-800"
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
                                    ? "bg-gradient-to-r from-purple-500/10 to-transparent border-purple-500/20 shadow-lg shadow-purple-900/10"
                                    : "bg-zinc-900/50 border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700"
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            {isNow && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wide shadow-lg shadow-purple-500/20">LIVE Today</span>}
                                            {isTmrw && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wide border border-blue-500/20">Tomorrow</span>}
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{event.type}</span>
                                        </div>
                                        <h4 className="text-white font-bold text-lg leading-tight group-hover:text-purple-300 transition-colors flex items-center gap-2">
                                            {event.project_code}
                                            {event.client_name && <span className="text-zinc-500 font-normal text-sm border-l border-zinc-700 pl-2">for {event.client_name}</span>}
                                        </h4>
                                    </div>
                                    <div className="p-2 bg-zinc-950 rounded-lg text-zinc-600 group-hover:text-white transition-colors cursor-pointer hover:bg-zinc-800">
                                        <Icons.ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>

                                {/* Info Row: Location & Team */}
                                <div className="space-y-3">
                                    {event.location && (
                                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                            <Icons.MapPin className="w-3.5 h-3.5" />
                                            <span>{event.location}</span>
                                        </div>
                                    )}

                                    {/* Team Members */}
                                    {event.assignment_details?.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {event.assignment_details.map((a, i) => (
                                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-950/50 rounded-md border border-zinc-800/50 text-[10px] text-zinc-300">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                    <span className="font-medium">{a.associate_name}</span>
                                                    <span className="text-zinc-600 uppercase tracking-tighter">[{a.role}]</span>
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
