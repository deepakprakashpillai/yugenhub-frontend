import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icons';
import { Badge } from '../ui/badge';

import { useTheme } from '../../context/ThemeContext';

const AttentionSection = ({ items, scope = 'global' }) => {
    const { theme } = useTheme();
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
            <h2 className={`text-lg font-bold ${theme.text.primary} flex items-center gap-2`}>
                <Icons.AlertCircle className="w-5 h-5 text-red-500" />
                {scope === 'global' ? 'Attention Required' : 'My Focus'}
            </h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        onClick={() => navigate(item.link)}
                        className={`min-w-[85vw] md:min-w-0 snap-center p-4 rounded-xl ${theme.canvas.card} border ${theme.canvas.border} hover:border-red-500/50 cursor-pointer transition-all group relative overflow-hidden`}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50" />
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="border-red-500/30 text-red-500 text-xs bg-red-500/5 whitespace-nowrap">
                                {item.reason}
                            </Badge>
                            {item.type === 'task' ? (
                                <Icons.CheckSquare className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} />
                            ) : (
                                <Icons.Calendar className={`w-4 h-4 shrink-0 ${theme.text.secondary}`} />
                            )}
                        </div>
                        <h3 className={`${theme.text.primary} font-medium pr-2 group-hover:text-red-500 transition-colors line-clamp-2`}>
                            {item.title}
                        </h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttentionSection;
