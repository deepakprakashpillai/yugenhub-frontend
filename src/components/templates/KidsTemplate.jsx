// Kids Template - Playful design with child spotlight
const KidsTemplate = ({ project }) => {
    const meta = project.metadata || {};

    // Format birthday
    const birthday = meta.child_birthday
        ? new Date(meta.child_birthday).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : null;

    // Occasion-specific styling
    const occasionStyles = {
        'Birthday': { emoji: '🎂', color: 'from-pink-500 to-purple-600', border: 'border-pink-800/30', bg: 'from-pink-950/40' },
        'Baptism': { emoji: '✝️', color: 'from-sky-400 to-blue-600', border: 'border-sky-800/30', bg: 'from-sky-950/40' },
        'Newborn': { emoji: '👶', color: 'from-amber-400 to-orange-500', border: 'border-amber-800/30', bg: 'from-amber-950/40' },
        'Other': { emoji: '🌟', color: 'from-violet-500 to-purple-600', border: 'border-violet-800/30', bg: 'from-violet-950/40' }
    };

    const occasion = occasionStyles[meta.occasion_type] || occasionStyles['Other'];

    return (
        <div className="space-y-6">
            {/* Child Spotlight Card */}
            <div className={`relative overflow-hidden rounded-2xl ${occasion.border} bg-gradient-to-br ${occasion.bg} to-zinc-900 p-8`}>
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
                <div className="absolute top-4 right-4 text-4xl opacity-20">{occasion.emoji}</div>

                <div className="relative flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    {/* Child Initial Avatar */}
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${occasion.color} flex items-center justify-center text-4xl font-bold text-white shadow-xl`}>
                        {meta.child_name?.charAt(0) || '?'}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-400 text-xs uppercase tracking-widest font-bold mb-2">
                            <span>{occasion.emoji}</span>
                            <span>{meta.occasion_type || 'Celebration'}</span>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">
                            {meta.child_name || 'Child Name'}
                        </h2>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-zinc-400">
                            {meta.child_age !== undefined && (
                                <span className="px-3 py-1 rounded-full bg-zinc-800/50 text-sm">
                                    🎈 {meta.child_age === 0 ? 'Newborn' : `${meta.child_age} year${meta.child_age > 1 ? 's' : ''} old`}
                                </span>
                            )}
                            {meta.theme && (
                                <span className="px-3 py-1 rounded-full bg-zinc-800/50 text-sm">
                                    🎨 Theme: {meta.theme}
                                </span>
                            )}
                            {birthday && (
                                <span className="px-3 py-1 rounded-full bg-zinc-800/50 text-sm">
                                    🗓️ {birthday}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Family Section */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2">
                    <span>👨‍👩‍👧</span>
                    Family
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Father */}
                    <div className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-lg font-bold text-white">
                            {meta.father_name?.charAt(0) || 'F'}
                        </div>
                        <div>
                            <span className="text-zinc-500 text-xs uppercase tracking-wide block">Father</span>
                            <span className="text-white font-semibold">{meta.father_name || '—'}</span>
                        </div>
                    </div>

                    {/* Mother */}
                    <div className="flex items-center gap-4 bg-zinc-800/50 rounded-xl p-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center text-lg font-bold text-white">
                            {meta.mother_name?.charAt(0) || 'M'}
                        </div>
                        <div>
                            <span className="text-zinc-500 text-xs uppercase tracking-wide block">Mother</span>
                            <span className="text-white font-semibold">{meta.mother_name || '—'}</span>
                        </div>
                    </div>
                </div>

                {/* Address */}
                {meta.address && (
                    <div className="mt-4 bg-zinc-800/30 rounded-xl p-4">
                        <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">📍 Address</span>
                        <span className="text-white">{meta.address}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KidsTemplate;
