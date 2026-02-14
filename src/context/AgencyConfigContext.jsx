import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { AGENCY_CONFIG as FALLBACK_CONFIG } from '../config';

const AgencyConfigContext = createContext();

export const useAgencyConfig = () => useContext(AgencyConfigContext);

export const AgencyConfigProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchConfig = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        try {
            const [workflowRes, verticalsRes, orgRes] = await Promise.all([
                api.get('/settings/workflow'),
                api.get('/settings/verticals'),
                api.get('/settings/org'),
            ]);

            setConfig({
                brand: {
                    name: orgRes.data.org_name || FALLBACK_CONFIG.brand?.name || 'YUGEN',
                    suffix: FALLBACK_CONFIG.brand?.suffix || 'HUB',
                    primaryColor: FALLBACK_CONFIG.brand?.primaryColor || '#ef4444',
                },
                org: orgRes.data,
                statusOptions: workflowRes.data.status_options || FALLBACK_CONFIG.statusOptions,
                leadSources: workflowRes.data.lead_sources || FALLBACK_CONFIG.leadSources,
                deliverableTypes: workflowRes.data.deliverable_types || FALLBACK_CONFIG.deliverableTypes,
                verticals: verticalsRes.data.verticals || FALLBACK_CONFIG.verticals,
            });
        } catch (err) {
            console.error('Failed to fetch agency config, using fallback', err);
            setConfig(FALLBACK_CONFIG);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const refreshConfig = useCallback(() => {
        setLoading(true);
        return fetchConfig();
    }, [fetchConfig]);

    const value = {
        config: config || FALLBACK_CONFIG,
        loading,
        refreshConfig,
    };

    return (
        <AgencyConfigContext.Provider value={value}>
            {children}
        </AgencyConfigContext.Provider>
    );
};
