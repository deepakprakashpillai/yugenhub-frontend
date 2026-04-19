import { useState, useRef, useEffect, useCallback } from 'react';
import { Icons } from '../Icons';
import { resolveMapsUrl } from '../../api/maps';
import { useGoogleMaps } from '../../hooks/useGoogleMaps';

/**
 * LocationPicker — shared location input used in:
 *   - EventSlideOver venue picker
 *   - Linked location add/edit modal
 *   - Custom "location" field in MetadataModal / ProjectSlideOver
 *
 * Props:
 *   value: MapLocation | null
 *   onChange(MapLocation | null)
 *   placeholder?: string
 *   className?: string
 */
export default function LocationPicker({ value, onChange, placeholder = 'Search a place or paste a Maps link', className = '' }) {
    const { isLoaded, loadError, triggerLoad } = useGoogleMaps();
    const inputRef = useRef(null);
    const autocompleteRef = useRef(null);
    // Ref so the place_changed listener always calls the latest onChange without being in deps
    const onChangeRef = useRef(onChange);
    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
    const [pasteUrl, setPasteUrl] = useState('');
    const [resolving, setResolving] = useState(false);
    const [resolveError, setResolveError] = useState('');
    const [searchText, setSearchText] = useState(value?.formatted_address || value?.address || '');
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'paste'

    // Keep search text in sync when value changes externally
    useEffect(() => {
        setSearchText(value?.formatted_address || value?.address || '');
    }, [value]);

    // Bind Google Places Autocomplete after the script loads and we're on the search tab
    useEffect(() => {
        if (!isLoaded || activeTab !== 'search' || !inputRef.current) return;
        if (autocompleteRef.current) return; // already bound

        try {
            const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
                fields: ['place_id', 'formatted_address', 'geometry', 'name'],
            });
            autocompleteRef.current = ac;

            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                if (!place || !place.geometry) return;

                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const placeId = place.place_id;
                const fa = place.formatted_address || place.name || '';

                onChangeRef.current({
                    address: place.name || fa,
                    formatted_address: fa,
                    lat,
                    lng,
                    place_id: placeId,
                    maps_url: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
                    source: 'places',
                });
                setSearchText(fa);
            });
        } catch {
            // graceful — script may fail in corp environments
        }

        return () => {
            if (autocompleteRef.current) {
                window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
                autocompleteRef.current = null;
            }
        };
    }, [isLoaded, activeTab]);

    const handleSearchFocus = useCallback(() => {
        triggerLoad();
    }, [triggerLoad]);

    const handleSearchClear = () => {
        setSearchText('');
        onChange(null);
        if (autocompleteRef.current) {
            window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
            autocompleteRef.current = null;
        }
    };

    const handleManualSearch = (text) => {
        // Fallback when Places didn't fire: store as manual address
        setSearchText(text);
        if (!text) {
            onChange(null);
        } else if (loadError || !isLoaded) {
            // No Places API — store as manual entry immediately
            onChange({ address: text, source: 'manual' });
        }
        // If Places is loaded, wait for place_changed event
    };

    const handlePasteResolve = async () => {
        const url = pasteUrl.trim();
        if (!url) return;
        setResolving(true);
        setResolveError('');
        try {
            const result = await resolveMapsUrl(url);
            onChange(result);
            setPasteUrl('');
            setActiveTab('search');
            setSearchText(result.formatted_address || result.address || url);
        } catch {
            setResolveError('Could not resolve this URL. Try searching instead.');
        } finally {
            setResolving(false);
        }
    };

    const hasValue = !!(value?.formatted_address || value?.address || value?.lat);

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Tab switcher */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs">
                <button
                    type="button"
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 px-3 py-1.5 font-medium transition-colors ${activeTab === 'search' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                    Search place
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 px-3 py-1.5 font-medium transition-colors ${activeTab === 'paste' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
                >
                    Paste Maps link
                </button>
            </div>

            {activeTab === 'search' && (
                <div className="relative">
                    <Icons.MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchText}
                        onChange={(e) => handleManualSearch(e.target.value)}
                        onFocus={handleSearchFocus}
                        placeholder={loadError ? 'Type an address (Maps search unavailable)' : placeholder}
                        className="w-full pl-9 pr-8 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    />
                    {searchText && (
                        <button type="button" onClick={handleSearchClear} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                            <Icons.X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            )}

            {activeTab === 'paste' && (
                <div className="space-y-2">
                    <div className="relative">
                        <Icons.Link className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
                        <input
                            type="url"
                            value={pasteUrl}
                            onChange={(e) => { setPasteUrl(e.target.value); setResolveError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handlePasteResolve(); } }}
                            placeholder="https://maps.app.goo.gl/... or google.com/maps/..."
                            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                        />
                    </div>
                    {resolveError && <p className="text-xs text-red-400">{resolveError}</p>}
                    <button
                        type="button"
                        onClick={handlePasteResolve}
                        disabled={!pasteUrl.trim() || resolving}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-xs rounded font-medium transition-colors flex items-center gap-1.5"
                    >
                        {resolving ? <Icons.Loader className="w-3 h-3 animate-spin" /> : <Icons.Check className="w-3 h-3" />}
                        {resolving ? 'Resolving…' : 'Resolve & use'}
                    </button>
                </div>
            )}

            {/* Current value preview */}
            {hasValue && (
                <div className="flex items-start gap-2 px-3 py-2 bg-purple-950/30 border border-purple-500/20 rounded-lg">
                    <Icons.MapPin className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-purple-300 leading-relaxed">
                        {value.formatted_address || value.address || `${value.lat?.toFixed(5)}, ${value.lng?.toFixed(5)}`}
                    </span>
                </div>
            )}
        </div>
    );
}
