import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Icons } from '../Icons';
import { getApiKey } from '../../hooks/useGoogleMaps';

/**
 * LocationCard — display a MapLocation with mini-map, copy link, open in maps, directions.
 *
 * Props:
 *   location: MapLocation
 *   name?: string              — label shown as header (e.g. "Getting Ready Suite")
 *   onEdit?: fn                — if provided, shows Edit button
 *   onDelete?: fn              — if provided, shows Delete button
 *   compact?: bool             — drops the map thumbnail (for card/table badges)
 *   className?: string
 */
export default function LocationCard({ location, name, onEdit, onDelete, compact = false, className = '' }) {
    const [copied, setCopied] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [mapImgError, setMapImgError] = useState(false);

    useEffect(() => {
        let mounted = true;
        getApiKey().then(key => { if (mounted) setApiKey(key); }).catch(() => {});
        return () => { mounted = false; };
    }, []);

    if (!location) return null;

    const { formatted_address, address, lat, lng, maps_url } = location;
    const displayAddress = formatted_address || address || '';
    const hasCoords = lat != null && lng != null;

    const shareUrl = maps_url || (hasCoords ? `https://www.google.com/maps?q=${lat},${lng}` : '');
    const directionsUrl = hasCoords
        ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
        : shareUrl ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(displayAddress)}` : '';

    const staticMapUrl =
        hasCoords && apiKey
            ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=320x120&markers=color:red%7C${lat},${lng}&key=${apiKey}`
            : null;

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            toast.success('Maps link copied');
            setTimeout(() => setCopied(false), 2000);
        }).catch(() => {
            toast.error('Could not copy — try manually');
        });
    };

    const handleOpenMaps = () => {
        if (shareUrl) window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    const handleDirections = () => {
        if (directionsUrl) window.open(directionsUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={`rounded-lg border border-zinc-700 bg-zinc-800/50 overflow-hidden ${className}`}>
            {/* Static map thumbnail */}
            {!compact && staticMapUrl && !mapImgError && (
                <button
                    type="button"
                    onClick={handleOpenMaps}
                    className="block w-full overflow-hidden focus:outline-none"
                    title="Open in Maps"
                >
                    <img
                        src={staticMapUrl}
                        alt={`Map of ${displayAddress || 'location'}`}
                        className="w-full h-24 object-cover"
                        loading="lazy"
                        onError={() => setMapImgError(true)}
                    />
                </button>
            )}
            {/* No coords fallback banner */}
            {!compact && !staticMapUrl && displayAddress && (
                <div className="px-3 py-2 bg-zinc-900/50 flex items-center gap-2 border-b border-zinc-700">
                    <Icons.MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="text-[11px] text-zinc-500 italic">No map preview — address only</span>
                </div>
            )}

            <div className="px-3 py-2.5">
                {/* Name + address */}
                <div className="mb-2">
                    {name && (
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{name}</p>
                    )}
                    {displayAddress && (
                        <p className="text-sm text-zinc-200 leading-snug">{displayAddress}</p>
                    )}
                    {!displayAddress && hasCoords && (
                        <p className="text-sm text-zinc-400 font-mono">{lat?.toFixed(6)}, {lng?.toFixed(6)}</p>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                    {shareUrl && (
                        <button
                            type="button"
                            onClick={handleCopy}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                            title="Copy Maps link"
                        >
                            {copied
                                ? <Icons.Check className="w-3 h-3 text-green-400" />
                                : <Icons.Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy link'}
                        </button>
                    )}
                    {shareUrl && (
                        <button
                            type="button"
                            onClick={handleOpenMaps}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                            title="Open in Maps"
                        >
                            <Icons.ExternalLink className="w-3 h-3" />
                            Open in Maps
                        </button>
                    )}
                    {directionsUrl && (
                        <button
                            type="button"
                            onClick={handleDirections}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                            title="Get directions"
                        >
                            <Icons.Navigation className="w-3 h-3" />
                            Directions
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors ml-auto"
                        >
                            <Icons.Edit className="w-3 h-3" />
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] bg-red-900/40 hover:bg-red-900/70 text-red-400 transition-colors"
                        >
                            <Icons.Trash className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Compact badge variant: inline address + open-in-maps icon.
 * Used in ProjectCard / ProjectTable to avoid importing the full card.
 */
export function LocationBadge({ location, name }) {
    if (!location) return null;
    const label = name ? `${name}: ` : '';
    const displayAddress = location.formatted_address || location.address || '';
    const shareUrl = location.maps_url || (location.lat != null ? `https://www.google.com/maps?q=${location.lat},${location.lng}` : '');

    return (
        <span className="flex items-center gap-1 text-xs text-zinc-400">
            <Icons.MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate max-w-[160px]">{label}{displayAddress}</span>
            {shareUrl && (
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 hover:text-zinc-200">
                    <Icons.ExternalLink className="w-3 h-3" />
                </a>
            )}
        </span>
    );
}
