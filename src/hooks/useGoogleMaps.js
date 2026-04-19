import { useState, useRef } from 'react';
import { getPublicConfig } from '../api/maps';

let _apiKey = null;
let _keyPromise = null;

// Singleton: fetch browser key once, cache for the session
async function fetchApiKey() {
    if (_apiKey !== null) return _apiKey;
    if (!_keyPromise) {
        _keyPromise = getPublicConfig()
            .then((data) => { _apiKey = data.google_maps_browser_key || ''; return _apiKey; })
            .catch(() => { _apiKey = ''; return _apiKey; });
    }
    return _keyPromise;
}

let _scriptLoaded = false;
let _scriptLoading = false;
const _loadCallbacks = [];

function loadScript(apiKey) {
    if (_scriptLoaded) return Promise.resolve();
    if (_scriptLoading) return new Promise((res) => _loadCallbacks.push(res));

    return new Promise((resolve) => {
        _loadCallbacks.push(resolve);
        _scriptLoading = true;

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            _scriptLoaded = true;
            _scriptLoading = false;
            _loadCallbacks.forEach((cb) => cb());
            _loadCallbacks.length = 0;
        };
        script.onerror = () => {
            _scriptLoading = false;
            // resolve anyway so callers can degrade gracefully
            _loadCallbacks.forEach((cb) => cb());
            _loadCallbacks.length = 0;
        };
        document.head.appendChild(script);
    });
}

/**
 * Lazily load the Google Maps JS API on demand.
 * Call triggerLoad() on first user focus inside a picker to avoid billing on unrelated pages.
 * Returns { isLoaded, loadError, apiKey, triggerLoad }.
 */
export function useGoogleMaps() {
    const [isLoaded, setIsLoaded] = useState(_scriptLoaded);
    const [loadError, setLoadError] = useState(false);
    const triggeredRef = useRef(false);

    const triggerLoad = async () => {
        if (triggeredRef.current || _scriptLoaded) {
            if (_scriptLoaded) setIsLoaded(true);
            return;
        }
        triggeredRef.current = true;
        try {
            const key = await fetchApiKey();
            if (!key) {
                setLoadError(true);
                return;
            }
            await loadScript(key);
            setIsLoaded(true);
        } catch {
            setLoadError(true);
        }
    };

    return { isLoaded, loadError, triggerLoad };
}

export async function getApiKey() {
    return fetchApiKey();
}
