import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { Badge } from '../ui/badge';

const AttentionSection = ({ items, scope = 'global' }) => {
    const navigate = useNavigate();

    if (!items || items.length === 0) {
        return (
            <div className="p-6 rounded-2xl bg-green-900/10 border border-green-900/30 flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Icons.Check className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-green-400 font-medium">All clear! No urgent issues requiring attention.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Icons.AlertCircle className="w-5 h-5 text-red-500" />
                {scope === 'global' ? 'Attention Required' : 'My Focus'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => navigate(item.link)}
                        className="p-4 rounded-xl bg-zinc-900/60 border border-red-500/20 hover:border-red-500/50 cursor-pointer transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="border-red-500/30 text-red-400 text-xs bg-red-900/10">
                                {item.reason}
                            </Badge>
                            {item.type === 'task' ? (
                                <Icons.CheckSquare className="w-4 h-4 text-zinc-500" />
                            ) : (
                                <Icons.Calendar className="w-4 h-4 text-zinc-500" />
                            )}
                        </div>
                        <h3 className="text-white font-medium truncate pr-2 group-hover:text-red-400 transition-colors">
                            {item.title}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttentionSection;
