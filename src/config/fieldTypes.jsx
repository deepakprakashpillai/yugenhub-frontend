/* eslint-disable react-refresh/only-export-components */
/**
 * Field type registry — single source of truth for custom vertical field types.
 *
 * FIELD_TYPES: maps type string → { label, empty }
 *   label: shown in admin dropdown
 *   empty: default value for seeding new field slots
 *
 * FieldInput: unified input widget for any field type. Props:
 *   field: { name, label, type, options }
 *   value: current value
 *   onChange(value): called with the new value (already coerced to correct type)
 *   inputClassName: className applied to the inner <input>/<select>
 *   theme: ThemeContext theme object
 *
 * FieldDisplay: formatted read-only display for any field type. Props:
 *   field, value, theme
 */

import DatePicker from '../components/ui/DatePicker';
import LocationPicker from '../components/location/LocationPicker';
import LocationCard from '../components/location/LocationCard';
import Select from '../components/ui/Select';

export const FIELD_TYPES = {
    text:     { label: 'Text',     empty: '' },
    number:   { label: 'Number',   empty: null },
    date:     { label: 'Date',     empty: null },
    tel:      { label: 'Phone',    empty: '' },
    select:   { label: 'Select',   empty: '' },
    location: { label: 'Location', empty: null },
};

export function getEmptyValue(type) {
    return FIELD_TYPES[type]?.empty ?? '';
}

export function FieldInput({ field, value, onChange, inputClassName = '', placeholder }) {
    const cls = inputClassName || `w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500`;

    if (field.type === 'select') {
        return (
            <Select
                value={value ?? ''}
                onChange={onChange}
                placeholder={`Select ${field.label}`}
                options={(field.options || []).map(opt => ({ value: opt, label: opt }))}
                className="w-full"
            />
        );
    }

    if (field.type === 'date') {
        return (
            <DatePicker
                value={value ? String(value).slice(0, 10) : ''}
                onChange={onChange}
                placeholder={placeholder || field.label}
                className="w-full"
                inputClassName={cls}
            />
        );
    }

    if (field.type === 'location') {
        return (
            <LocationPicker
                value={value || null}
                onChange={onChange}
                placeholder={placeholder || `Search or paste Maps link for ${field.label}`}
            />
        );
    }

    // text / number / tel
    return (
        <input
            type={field.type === 'number' ? 'number' : field.type === 'tel' ? 'tel' : 'text'}
            name={field.name}
            value={value ?? ''}
            onChange={(e) => {
                let v = e.target.value;
                if (field.type === 'number') v = v === '' ? null : Number(v);
                onChange(v);
            }}
            placeholder={placeholder || field.label}
            className={cls}
        />
    );
}

export function FieldDisplay({ field, value, theme = {} }) {
    if (!value && value !== 0) return null;

    if (field.type === 'date') {
        return (
            <p className={`${theme.text?.primary || 'text-white'} font-medium text-sm`}>
                {new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
        );
    }

    if (field.type === 'select') {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 capitalize">
                {value}
            </span>
        );
    }

    if (field.type === 'tel') {
        return (
            <p className={`${theme.text?.primary || 'text-white'} text-sm font-mono break-words`}>{value}</p>
        );
    }

    if (field.type === 'location') {
        if (typeof value === 'object' && value !== null) {
            return <LocationCard location={value} name={field.label} />;
        }
        return <p className={`${theme.text?.primary || 'text-white'} text-sm`}>{value}</p>;
    }

    return (
        <p className={`${theme.text?.primary || 'text-white'} font-medium text-sm truncate`}>{value}</p>
    );
}

export function FieldDisplayCompact({ field, value }) {
    if (!value && value !== 0) return null;

    if (field.type === 'location' && typeof value === 'object' && value !== null) {
        const addr = value.formatted_address || value.address || '';
        return addr || null;
    }

    if (field.type === 'date') {
        return new Date(value).toLocaleDateString();
    }

    return String(value);
}
