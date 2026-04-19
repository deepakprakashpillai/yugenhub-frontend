// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

const TableHead = ({ children }) => {
    const { theme } = useTheme();
    return (
        <thead className={`${theme.canvas.card} text-xs uppercase font-medium ${theme.text.secondary} border-b ${theme.canvas.border}`}>
            {children}
        </thead>
    );
};

const TableBody = ({ children }) => {
    const { theme } = useTheme();
    return (
        <tbody className={`divide-y ${theme.canvas.border}`}>
            {children}
        </tbody>
    );
};

const TableRow = ({ children, onClick, className = '' }) => {
    const { theme } = useTheme();
    return (
        <tr onClick={onClick} className={`hover:${theme.canvas.hover} transition-colors ${className}`}>
            {children}
        </tr>
    );
};

const TableHeadCell = ({ children, className = '' }) => (
    <th className={`px-6 py-4 ${className}`}>{children}</th>
);

const TableCell = ({ children, className = '' }) => (
    <td className={`px-6 py-4 ${className}`}>{children}</td>
);

const Table = ({ children, className = '', animated = false }) => {
    const { theme } = useTheme();
    const wrapperClass = `overflow-x-auto rounded-xl border ${theme.canvas.border} ${theme.canvas.bg} bg-opacity-30 backdrop-blur-sm ${className}`;
    const tableEl = (
        <table className={`w-full text-left text-sm ${theme.text.secondary}`}>
            {children}
        </table>
    );
    return animated
        ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={wrapperClass}>{tableEl}</motion.div>
        : <div className={wrapperClass}>{tableEl}</div>;
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeadCell = TableHeadCell;
Table.Cell = TableCell;

export default Table;
