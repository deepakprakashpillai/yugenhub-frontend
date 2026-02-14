
import { useState, useRef } from 'react';
import { ArrowUp, ArrowDown, X, Plus } from 'lucide-react';

function EditableTagList({ title, items, editing, onUpdate }) {
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
            <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 block">{title}</label>
            <div className="flex flex-wrap gap-2">
                {(items || []).map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300 group">
                        {editing && (
                            <span className="flex gap-0.5 mr-1">
                                <button onClick={() => moveItem(i, -1)} className="text-zinc-700 hover:text-white" title="Move left"><ArrowUp size={10} className="rotate-[-90deg]" /></button>
                                <button onClick={() => moveItem(i, 1)} className="text-zinc-700 hover:text-white" title="Move right"><ArrowDown size={10} className="rotate-[-90deg]" /></button>
                            </span>
                        )}
                        {item}
                        {editing && (
                            <button onClick={() => removeItem(i)} className="text-zinc-600 hover:text-red-400 ml-1"><X size={12} /></button>
                        )}
                    </span>
                ))}
                {editing && (
                    <span className="inline-flex items-center gap-1 border border-dashed border-zinc-700 rounded-lg overflow-hidden">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
                            placeholder="Type & Enter"
                            className="bg-transparent border-none px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none w-32"
                        />
                        <button onClick={addItem} className="px-2 py-1.5 text-zinc-500 hover:text-white"><Plus size={14} /></button>
                    </span>
                )}
            </div>
        </div>
    );
}

export default EditableTagList;
