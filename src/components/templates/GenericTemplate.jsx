import { Icons } from '../Icons';

// Generic Template - Clean fallback for Thryv and other verticals
const GenericTemplate = ({ project }) => {
    const meta = project.metadata || {};

    // Fields to hide (shown elsewhere or internal)
    const hiddenFields = ['client_name', 'budget'];

    // Get displayable metadata
    const displayMeta = Object.entries(meta).filter(([key]) => !hiddenFields.includes(key));

    return (
        <div className="space-y-6">
            {/* Company/Brand Header */}
            {meta.company_name && (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-700 bg-gradient-to-br from-purple-950/30 to-zinc-900 p-6">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />

                    <div className="relative flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-xl font-bold text-white">
                            {meta.company_name.charAt(0)}
                        </div>
                        <div>
                            <span className="text-zinc-400 text-xs uppercase tracking-widest block">Client</span>
                            <h3 className="text-xl font-bold text-white">{meta.company_name}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Metadata Grid */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
                <h4 className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-4 flex items-center gap-2">
                    <Icons.FileText className="w-4 h-4" />
                    Project Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayMeta.map(([key, value]) => (
                        <div key={key} className="bg-zinc-800/50 rounded-xl p-4">
                            <span className="text-zinc-500 text-xs uppercase tracking-wide block mb-1">
                                {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-white font-semibold">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>

                {displayMeta.length === 0 && (
                    <p className="text-zinc-500 text-sm text-center py-4">
                        No additional details available.
                    </p>
                )}
            </div>
        </div>
    );
};

export default GenericTemplate;
