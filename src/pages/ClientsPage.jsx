import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatsHeader from '../components/StatsHeader';
import { Icons } from '../components/Icons';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '../components/FloatingActionButton';
import { ClientModal } from '../components/modals';
import { v4 as uuidv4 } from 'uuid';

const ClientCard = ({ client }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                {client.name.charAt(0)}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border ${client.type === 'Active Client' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                client.type === 'Lead' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                {client.type}
            </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{client.name}</h3>
        <div className="space-y-2 mt-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
                <Icons.Phone className="w-4 h-4" />
                {client.phone}
            </div>
            {client.email && (
                <div className="flex items-center gap-2">
                    <Icons.Mail className="w-4 h-4" />
                    {client.email}
                </div>
            )}
            {client.location && (
                <div className="flex items-center gap-2">
                    <Icons.MapPin className="w-4 h-4" />
                    {client.location}
                </div>
            )}
        </div>
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center gap-2">
            <div className="flex gap-2">
                <a href={`tel:${client.phone}`} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors" title="Call">
                    <Icons.Phone className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-green-900/30 hover:text-green-500 transition-colors" title="WhatsApp">
                    <Icons.WhatsApp className="w-4 h-4" />
                </a>
            </div>
            <div className="text-right">
                <div className="text-xs text-zinc-500">Joined {new Date(client.created_at).toLocaleDateString()}</div>
                <div className="text-xs font-mono text-zinc-400">{client.total_projects} Projects</div>
            </div>
        </div>
    </motion.div>
);

const ClientTable = ({ clients }) => (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm text-zinc-400 bg-zinc-900/50">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 font-medium">
                <tr>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Projects</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
                {clients.map((client) => (
                    <tr key={client._id} className="hover:bg-zinc-900 transition-colors">
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
                                    'bg-zinc-800 text-zinc-400 border-zinc-700'
                                }`}>
                                {client.type}
                            </span>
                        </td>
                        <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-2 text-zinc-300">
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
                        <td className="px-6 py-4 text-right font-mono text-white">
                            {client.total_projects}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const ClientsPage = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');

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

    const fetchClients = async () => {
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
    };

    useEffect(() => {
        fetchClients();
    }, [page, debouncedSearch, typeFilter, sort]);

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
    };

    return (
        <div className="p-8 pb-20 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Opaque Overlay for closing dropdowns - High Z-Index Logic */}
            {activeDropdown && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setActiveDropdown(null)}
                />
            )}

            <h1 className="text-4xl font-black mb-8 text-white uppercase tracking-tighter">Clients</h1>

            <StatsHeader type="clients" />

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 backdrop-blur-sm sticky top-0 z-50">
                <div className="relative w-full md:w-1/3">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search clients clients by name, phone or location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 text-white pl-12 pr-4 py-3 rounded-xl border border-zinc-800 focus:border-white/20 focus:outline-none placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">

                    {/* Sort Dropdown */}
                    <div className="relative filter-dropdown">
                        <button
                            onClick={() => toggleDropdown('sort')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                activeDropdown === 'sort' ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                        >
                            <Icons.Sort className="w-4 h-4" />
                            {sort === 'projects_desc' ? 'Most Projects' : sort === 'projects_asc' ? 'Least Projects' : 'Newest First'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'sort' && "-rotate-90")} />
                        </button>
                        {activeDropdown === 'sort' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => { setSort('newest'); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">Newest First</button>
                                <button onClick={() => { setSort('projects_desc'); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">Most Projects</button>
                                <button onClick={() => { setSort('projects_asc'); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">Least Projects</button>
                            </div>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div className="relative filter-dropdown">
                        <button
                            onClick={() => toggleDropdown('type')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                typeFilter || activeDropdown === 'type' ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                        >
                            <Icons.Filter className="w-4 h-4" />
                            {typeFilter || 'All Clients'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'type' && "-rotate-90")} />
                        </button>
                        {activeDropdown === 'type' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => { setTypeFilter(''); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">All Clients</button>
                                {['Active Client', 'Lead', 'Legacy'].map(type => (
                                    <button key={type} onClick={() => { setTypeFilter(type); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">{type}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg p-1 ml-auto xl:ml-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <Icons.Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={clsx(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'list' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
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
                <EmptyState onClear={() => { setSearch(''); setTypeFilter('') }} title="No clients found" message="Try adjusting your search to find the client you're looking for." />
            ) : (
                <AnimatePresence mode='wait'>
                    {viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {clients.map(client => (
                                <ClientCard key={client._id} client={client} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <ClientTable clients={clients} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* PAGINATION CONTROLS */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12 bg-zinc-900/50 py-3 px-6 rounded-full w-fit mx-auto border border-zinc-800 backdrop-blur-sm shadow-2xl">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        <Icons.ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-zinc-500 font-mono text-xs uppercase tracking-widest px-4 border-l border-r border-zinc-800/50">
                        Page <span className="text-white font-bold text-sm mx-1">{page}</span> of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all active:scale-95"
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
