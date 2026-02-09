import { Icons } from '../Icons';

// Events Template - Corporate/professional design
const EventsTemplate = ({ project }) => {
    const meta = project.metadata || {};

    // Event scale styling
    const scaleStyles = {
        'Private': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
        'Corporate': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
        'Mass': { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
    };

    const scale = scaleStyles[meta.event_scale] || scaleStyles['Corporate'];

    return (
        <div className="space-y-6">
            {/* Event Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900 p-8">
                {/* Decorative gradient */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/10 blur-3xl rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-3xl rounded-full" />

                <div className="relative">
                    {/* Company Badge */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center text-xl font-bold text-white border border-zinc-600">
                            {meta.company_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <span className="text-zinc-400 text-xs uppercase tracking-widest block">Organizer</span>
                            <span className="text-white font-semibold">{meta.company_name || 'Company Name'}</span>
                        </div>
                    </div>

                    {/* Event Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        {meta.event_name || 'Event Name'}
                    </h2>

                    {/* Event Scale Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${scale.bg} ${scale.border} border`}>
                        <div className={`w-2 h-2 rounded-full ${scale.color.replace('text-', 'bg-')}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${scale.color}`}>
                            {meta.event_scale || 'Event'} Scale
                        </span>
                    </div>
                </div>
            </div>

            {/* Venue Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <Icons.MapPin className="w-7 h-7 text-purple-400" />
                    </div>
                    <div>
                        <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">Venue</span>
                        <span className="text-white font-semibold text-lg">
                            {meta.venue || 'Venue TBD'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsTemplate;
