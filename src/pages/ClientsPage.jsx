import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import StatsHeader from '../components/StatsHeader';
import { Icons } from '../components/Icons';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import clsx from 'clsx';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '../components/FloatingActionButton';
import { ClientModal } from '../components/modals';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../context/ThemeContext';

const ClientCard = ({ client, theme, onDelete }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileTap={{ scale: 0.98 }}
        className={`${theme.canvas.card} border ${theme.canvas.border} rounded-xl p-3 md:p-4 hover:${theme.canvas.hover} transition-colors group flex flex-col h-full`}
    >
        <div className="flex justify-between items-start mb-2 gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {client.name.charAt(0)}
                </div>
                <h3 className={`text-base md:text-lg font-bold ${theme.text.primary} group-hover:text-blue-400 transition-colors truncate`}>{client.name}</h3>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${client.type === 'Active Client' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                client.type === 'Lead' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    `${theme.canvas.bg} ${theme.text.secondary} border ${theme.canvas.border}`
                }`}>
                {client.type}
            </span>
        </div>
        <div className={`space-y-1 mt-2 text-xs ${theme.text.secondary}`}>
            <div className="flex items-center gap-2">
                <Icons.Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{client.phone}</span>
            </div>
            {client.email && (
                <div className="flex items-center gap-2">
                    <Icons.Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.email}</span>
                </div>
            )}
            {client.location && (
                <div className="flex items-center gap-2">
                    <Icons.MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{client.location}</span>
                </div>
            )}
        </div>
        <div className={`mt-3 pt-3 border-t ${theme.canvas.border} flex justify-between items-center gap-2`}>
            <div className="flex gap-1.5">
                <a href={`tel:${client.phone}`} className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:${theme.text.primary} hover:${theme.canvas.hover} transition-colors`} title="Call">
                    <Icons.Phone className="w-3.5 h-3.5" />
                </a>
                <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:bg-green-900/30 hover:text-green-500 transition-colors`} title="WhatsApp">
                    <Icons.WhatsApp className="w-3.5 h-3.5" />
                </a>
            </div>
            <div className="flex items-center gap-2">
                <div className={`text-[10px] font-mono ${theme.text.secondary} mr-1`}>{client.total_projects} Projects</div>
                <button onClick={(e) => { e.stopPropagation(); onDelete(client); }} className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:bg-red-500/10 hover:text-red-500 transition-colors`} title="Delete Client">
                    <Icons.Trash className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </motion.div>
);

const ClientTable = ({ clients, theme, onDelete }) => (
    <div className={`overflow-x-auto rounded-xl border ${theme.canvas.border}`}>
        <table className={`w-full text-left text-sm ${theme.text.secondary} ${theme.canvas.bg} bg-opacity-50`}>
            <thead className={`text-xs uppercase ${theme.canvas.bg} bg-opacity-80 ${theme.text.secondary} font-medium`}>
                <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Projects</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className={`divide-y ${theme.canvas.border}`}>
                {clients.map((client) => (
                    <tr key={client._id} className={`hover:${theme.canvas.hover} transition-colors`}>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                    {client.name.charAt(0)}
                                </div>
                                <span className="font-medium text-white">{client.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`text-xs px-2 py-1 rounded-full border ${client.type === 'Active Client' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                client.type === 'Lead' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    `${theme.canvas.bg} ${theme.text.secondary} border ${theme.canvas.border}`
                                }`}>
                                {client.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                            <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                                <Icons.Phone className="w-3 h-3" /> {client.phone}
                            </div>
                            {client.email && (
                                <div className="flex items-center gap-2">
                                    <Icons.Mail className="w-3 h-3" /> {client.email}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {client.location || '-'}
                        </td>
                        <td className={`px-6 py-4 text-center font-mono ${theme.text.primary}`}>
                            {client.total_projects}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button onClick={(e) => { e.stopPropagation(); onDelete(client); }} className={`p-1.5 rounded ${theme.canvas.bg} ${theme.text.secondary} hover:bg-red-500/10 hover:text-red-500 transition-colors`} title="Delete Client">
                                <Icons.Trash className="w-4 h-4" />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ClientsPage = () => {
    const { theme } = useTheme();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const accent = theme.accents?.default || { primary: '#ef4444', glow: '#ef4444' };

    // Filters & Sort
    const [typeFilter, setTypeFilter] = useState('');
    const [sort, setSort] = useState('newest'); // default
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Modal State
    const [clientModal, setClientModal] = useState({ open: false, client: null });
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 12;

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, typeFilter, sort]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.filter-dropdown')) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchClients = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT, search: debouncedSearch };
            if (typeFilter) params.type = typeFilter;
            if (sort) params.sort = sort;

            const res = await api.get('/clients', { params });
            setClients(res.data.data);
            setTotalPages(res.data.total_pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, typeFilter, sort]);

    useEffect(() => {
        fetchClients();
    }, [fetchClients]);

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const handleSaveClient = async (clientData) => {
        setActionLoading(true);
        try {
            if (clientModal.client) {
                // Update
                // Note: Implement update endpoint if available
                await api.patch(`/clients/${clientModal.client._id}`, clientData);
            } else {
                // Create
                await api.post('/clients', { id: uuidv4(), ...clientData });
            }
            await fetchClients();
            setClientModal({ open: false, client: null });
        } catch (err) {
            console.error(err);
            alert('Failed to save client');
        } finally {
            setActionLoading(false);
        }
        const handleDeleteClient = async (client) => {
            if (!confirm(`Are you sure you want to delete ${client.name}?`)) return;

            try {
                await api.delete(`/clients/${client._id}`);
                await fetchClients();
                // Assuming you have toast imported, but using alert as fallback matching save
                alert('Client deleted successfully');
            } catch (err) {
                console.error(err);
                alert('Failed to delete client');
            }
        };

        return (
            <div className="p-3 md:p-8 pb-24 md:pb-20 max-w-[1600px] mx-auto min-h-screen relative">
                {/* Opaque Overlay for closing dropdowns - High Z-Index Logic */}
                {activeDropdown && (
                    <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setActiveDropdown(null)}
                    />
                )}



                <h1 className={`text-2xl md:text-4xl font-black mb-4 md:mb-8 ${theme.text.primary} uppercase tracking-tighter`}>Clients</h1>

                <StatsHeader type="clients" />

                {/* Toolbar */}
                <div className={`flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-2 md:gap-4 ${theme.canvas.card} p-2 md:p-3 rounded-2xl border ${theme.canvas.border} backdrop-blur-sm sticky top-0 z-50`}>
                    <div className="relative w-full md:w-1/3">
                        <Icons.Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.text.secondary}`} />
                        <input
                            type="text"
                            placeholder="Search clients clients by name, phone or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className={`w-full ${theme.canvas.bg} ${theme.text.primary} pl-12 pr-4 py-2 md:py-3 rounded-xl border ${theme.canvas.border} focus:border-white/20 focus:outline-none placeholder:${theme.text.secondary} text-sm md:text-base`}
                            style={{
                                outlineColor: activeDropdown ? 'transparent' : accent.primary
                            }}
                            onFocus={(e) => e.target.style.borderColor = accent.primary}
                            onBlur={(e) => e.target.style.borderColor = ''}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">

                        {/* Sort Dropdown */}
                        <div className="relative filter-dropdown">
                            <button
                                onClick={() => toggleDropdown('sort')}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                    activeDropdown === 'sort' ? "" : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={activeDropdown === 'sort' ? {
                                    borderColor: accent.primary,
                                    color: accent.primary
                                } : {}}
                            >
                                <Icons.Sort className="w-4 h-4" />
                                {sort === 'projects_desc' ? 'Most Projects' : sort === 'projects_asc' ? 'Least Projects' : 'Newest First'}
                                <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'sort' && "-rotate-90")} />
                            </button>
                            {activeDropdown === 'sort' && (
                                <div className={`absolute top-full right-0 mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl py-2 z-50`}>
                                    <button onClick={() => { setSort('newest'); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>Newest First</button>
                                    <button onClick={() => { setSort('projects_desc'); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>Most Projects</button>
                                    <button onClick={() => { setSort('projects_asc'); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>Least Projects</button>
                                </div>
                            )}
                        </div>

                        {/* Type Filter */}
                        <div className="relative filter-dropdown">
                            <button
                                onClick={() => toggleDropdown('type')}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                    typeFilter || activeDropdown === 'type' ? "" : `${theme.canvas.bg} ${theme.canvas.border} ${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={typeFilter || activeDropdown === 'type' ? {
                                    borderColor: accent.primary,
                                    color: accent.primary,
                                    backgroundColor: typeFilter ? `${accent.primary}1A` : undefined
                                } : {}}
                            >
                                <Icons.Filter className="w-4 h-4" />
                                {typeFilter || 'All Clients'}
                                <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'type' && "-rotate-90")} />
                            </button>
                            {activeDropdown === 'type' && (
                                <div className={`absolute top-full right-0 mt-2 w-48 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl py-2 z-50`}>
                                    <button onClick={() => { setTypeFilter(''); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>All Clients</button>
                                    {['Active Client', 'Lead', 'Legacy'].map(type => (
                                        <button key={type} onClick={() => { setTypeFilter(type); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>{type}</button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* View Toggle - hidden on mobile */}
                        <div className={`hidden md:flex ${theme.canvas.card} border ${theme.canvas.border} rounded-lg p-1 ml-auto xl:ml-0`}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={clsx(
                                    "p-2 rounded-md transition-colors",
                                    viewMode === 'grid' ? "" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={viewMode === 'grid' ? {
                                    backgroundColor: `${accent.primary}25`,
                                    color: accent.primary
                                } : {}}
                            >
                                <Icons.Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={clsx(
                                    "p-2 rounded-md transition-colors",
                                    viewMode === 'list' ? "" : `${theme.text.secondary} ${theme.canvas.hover}`
                                )}
                                style={viewMode === 'list' ? {
                                    backgroundColor: `${accent.primary}25`,
                                    color: accent.primary
                                } : {}}
                            >
                                <Icons.List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : clients.length === 0 ? (
                    <EmptyState
                        title="No clients found"
                        message="Try adjusting your search to find the client you're looking for."
                        icon={Icons.Search}
                        action={{
                            label: "Clear Filters",
                            onClick: () => { setSearch(''); setTypeFilter('') }
                        }}
                    />
                ) : (
                    <AnimatePresence mode='wait'>
                        {viewMode === 'grid' ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            >
                                {clients.map(client => (
                                    <ClientCard key={client._id} client={client} theme={theme} onDelete={handleDeleteClient} />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            >
                                <ClientTable clients={clients} theme={theme} onDelete={handleDeleteClient} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}

                {/* PAGINATION CONTROLS */}
                {!loading && totalPages > 1 && (
                    <div className={`flex justify-center items-center gap-2 md:gap-4 mt-6 md:mt-12 ${theme.canvas.card} py-2 px-4 md:py-3 md:px-6 rounded-full w-fit mx-auto border ${theme.canvas.border} backdrop-blur-sm shadow-2xl`}>
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={`p-2 rounded-full hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95`}
                        >
                            <Icons.ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className={`${theme.text.secondary} font-mono text-xs uppercase tracking-widest px-4 border-l border-r ${theme.canvas.border}`}>
                            Page <span className={`${theme.text.primary} font-bold text-sm mx-1`}>{page}</span> of {totalPages}
                        </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={`p-2 rounded-full hover:${theme.canvas.hover} ${theme.text.secondary} hover:${theme.text.primary} disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95`}
                        >
                            <Icons.ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Floating Action Button */}
                <FloatingActionButton
                    onClick={() => setClientModal({ open: true, client: null })}
                    label="Add Client"
                />

                {/* Client Modal */}
                <ClientModal
                    isOpen={clientModal.open}
                    onClose={() => setClientModal({ open: false, client: null })}
                    onSave={handleSaveClient}
                    client={clientModal.client}
                    loading={actionLoading}
                />
            </div>
        );
    };

    export default ClientsPage;
