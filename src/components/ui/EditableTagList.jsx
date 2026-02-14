
import { useState, useRef } from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

function EditableTagList({ title, items, editing, onUpdate }) {
    const { theme } = useTheme();
    const [newValue, setNewValue] = useState('');
    const inputRef = useRef(null);

    const addItem = () => {
        const val = newValue.trim();
        if (val && !items.includes(val)) {
            onUpdate([...items, val]);
            setNewValue('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    };

    const removeItem = (index) => {
        onUpdate(items.filter((_, i) => i !== index));
    };

    const moveItem = (index, direction) => {
        const newItems = [...items];
        const target = index + direction;
        if (target < 0 || target >= newItems.length) return;
        [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
        onUpdate(newItems);
    };

    return (
        <div>
            <label className={`text-[10px] font-bold ${theme.text.secondary} uppercase tracking-widest mb-3 block`}>{title}</label>
            <div className="flex flex-wrap gap-2">
                {(items || []).map((item, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 ${theme.canvas.card} border ${theme.canvas.border} rounded-lg px-3 py-1.5 text-sm ${theme.text.primary} group`}>
                        {editing && (
                            <span className="flex gap-0.5 mr-1">
                                <button onClick={() => moveItem(i, -1)} className={`${theme.text.secondary} hover:${theme.text.primary}`} title="Move left"><ArrowUp size={10} className="rotate-[-90deg]" /></button>
                                <button onClick={() => moveItem(i, 1)} className={`${theme.text.secondary} hover:${theme.text.primary}`} title="Move right"><ArrowDown size={10} className="rotate-[-90deg]" /></button>
                            </span>
                        )}
                        {item}
                        {editing && (
                            <button onClick={() => removeItem(i)} className={`${theme.text.secondary} hover:text-red-400 ml-1`}><X size={12} /></button>
                        )}
                    </span>
                ))}
                {editing && (
                    <span className={`inline-flex items-center gap-1 border border-dashed ${theme.canvas.border} rounded-lg overflow-hidden`}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                            placeholder="Type & Enter"
                            className={`bg-transparent border-none px-3 py-1.5 text-sm ${theme.text.primary} placeholder:${theme.text.secondary} focus:outline-none w-32`}
                        />
                        <button onClick={addItem} className={`px-2 py-1.5 ${theme.text.secondary} hover:${theme.text.primary}`}><Plus size={14} /></button>
                    </span>
                )}
            </div>
        </div>
    );
}

export default EditableTagList;
