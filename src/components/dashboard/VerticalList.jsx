import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';

const VerticalList = ({ data }) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 border border-zinc-800/50 hover:border-zinc-700 transition-all cursor-pointer group"
                    onClick={() => navigate('/projects')} // In future could filter
                >
                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors">
                        {item.name}
                    </span>
                    <Badge variant="outline" className="bg-zinc-900/50 border-zinc-700 text-zinc-400 group-hover:text-white group-hover:border-zinc-600">
                        {item.value} Projects
                    </Badge>
                </div>
            ))}
            {data.length === 0 && (
                <p className="text-zinc-500 text-sm italic">No active projects.</p>
            )}
        </div>
    );
};

export default VerticalList;
