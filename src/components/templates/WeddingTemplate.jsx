import { Icons } from '../Icons';

// Wedding Template - Romantic design with Groom/Bride split sections
const WeddingTemplate = ({ project }) => {
    const meta = project.metadata || {};

    // Format wedding date
    const weddingDate = meta.wedding_date
        ? new Date(meta.wedding_date).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'TBD';

    return (
        <div className="space-y-6">
            {/* Groom & Bride Split Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Groom Card */}
                <div className="relative overflow-hidden rounded-2xl border border-amber-900/30 bg-gradient-to-br from-amber-950/40 to-zinc-900 p-6">
                    {/* Decorative element */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />

                    <div className="relative">
                        <div className="flex items-center gap-2 text-amber-400/70 text-xs uppercase tracking-widest font-bold mb-4">
                            <span>👔</span>
                            <span>Groom</span>
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Initial Avatar */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-amber-900/30">
                                {meta.groom_name?.charAt(0) || 'G'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate">
                                    {meta.groom_name || 'Groom Name'}
                                </h3>

                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Icons.Phone className="w-4 h-4 text-amber-500/70" />
                                        <span>{meta.groom_number || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-zinc-400">
                                        <Icons.MapPin className="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{meta.groom_location || 'Location not set'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <span className="text-amber-500/70">🎂</span>
                                        <span>Age: {meta.groom_age || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bride Card */}
                <div className="relative overflow-hidden rounded-2xl border border-rose-900/30 bg-gradient-to-br from-rose-950/40 to-zinc-900 p-6">
                    {/* Decorative element */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 blur-3xl rounded-full" />

                    <div className="relative">
                        <div className="flex items-center gap-2 text-rose-400/70 text-xs uppercase tracking-widest font-bold mb-4">
                            <span>👗</span>
                            <span>Bride</span>
                        </div>

                        <div className="flex items-start gap-4">
                            {/* Initial Avatar */}
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-rose-900/30">
                                {meta.bride_name?.charAt(0) || 'B'}
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-white truncate">
                                    {meta.bride_name || 'Bride Name'}
                                </h3>

                                <div className="mt-3 space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <Icons.Phone className="w-4 h-4 text-rose-500/70" />
                                        <span>{meta.bride_number || 'Not provided'}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-zinc-400">
                                        <Icons.MapPin className="w-4 h-4 text-rose-500/70 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{meta.bride_location || 'Location not set'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-zinc-400">
                                        <span className="text-rose-500/70">🎂</span>
                                        <span>Age: {meta.bride_age || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Wedding Details */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2">
                    <span>💒</span>
                    Wedding Details
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                        <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">Side</span>
                        <span className="text-white font-semibold">{meta.side || '—'}</span>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                        <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">Style</span>
                        <span className="text-white font-semibold">{meta.wedding_style || '—'}</span>
                    </div>
                    <div className="bg-zinc-800/50 rounded-xl p-4">
                        <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">Wedding Date</span>
                        <span className="text-white font-semibold">{weddingDate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeddingTemplate;
