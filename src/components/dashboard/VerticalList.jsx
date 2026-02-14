import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Badge } from '../ui/badge';

const VerticalList = ({ data }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    return (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${theme.canvas.bg} hover:${theme.canvas.hover} border ${theme.canvas.border} transition-all cursor-pointer group`}
                    onClick={() => navigate('/projects')} // In future could filter
                >
                    <span className={`font-medium ${theme.text.primary}`}>
                        {item.name}
                    </span>
                    <Badge variant="outline" className={`${theme.canvas.card} ${theme.canvas.border} ${theme.text.secondary} group-hover:${theme.text.primary}`}>
                        {item.value} Projects
                    </Badge>
                </div>
            ))}
            {data.length === 0 && (
                <p className={`${theme.text.secondary} text-sm italic`}>No active projects.</p>
            )}
        </div>
    );
};

export default VerticalList;
