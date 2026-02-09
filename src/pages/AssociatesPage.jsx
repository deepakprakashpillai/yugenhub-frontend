import { useEffect, useState } from 'react';
import api from '../api/axios';
import StatsHeader from '../components/StatsHeader';
import { Icons } from '../components/Icons';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '../components/FloatingActionButton';
import { AssociateModal } from '../components/modals';
import { v4 as uuidv4 } from 'uuid';

const AssociateCard = ({ associate }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors group flex flex-col h-full"
    >
        <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-lg">
                {associate.name.charAt(0)}
            </div>
            <span className={`text-xs px-2 py-1 rounded-full border ${associate.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                'bg-zinc-800 text-zinc-500 border-zinc-700'
                }`}>
                {associate.primary_role}
            </span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">{associate.name}</h3>
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{associate.employment_type}</span>

        <div className="space-y-2 mt-4 text-sm text-zinc-400 flex-1">
            <div className="flex items-center gap-2">
                <Icons.Phone className="w-4 h-4" />
                {associate.phone_number}
            </div>
            {associate.email_id && (
                <div className="flex items-center gap-2">
                    <Icons.Mail className="w-4 h-4" />
                    {associate.email_id}
                </div>
            )}
            {associate.base_city && (
                <div className="flex items-center gap-2">
                    <Icons.MapPin className="w-4 h-4" />
                    {associate.base_city}
                </div>
            )}
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center gap-2">
            <div className="flex gap-2">
                <a href={`tel:${associate.phone_number}`} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors" title="Call">
                    <Icons.Phone className="w-4 h-4" />
                </a>
                <a href={`https://wa.me/${associate.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-green-900/30 hover:text-green-500 transition-colors" title="WhatsApp">
                    <Icons.WhatsApp className="w-4 h-4" />
                </a>
            </div>
            <div className={`w-2 h-2 rounded-full ${associate.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} title={associate.is_active ? "Active" : "Inactive"} />
        </div>
    </motion.div>
);

const AssociateTable = ({ associates }) => (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left text-sm text-zinc-400 bg-zinc-900/50">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-500 font-medium">
                <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Employment</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
                {associates.map((assoc) => (
                    <tr key={assoc._id} className="hover:bg-zinc-900 transition-colors">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                    {assoc.name.charAt(0)}
                                </div>
                                <span className="font-medium text-white">{assoc.name}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded-full border bg-zinc-800 text-zinc-400 border-zinc-700">
                                {assoc.primary_role}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">
                            {assoc.employment_type}
                        </td>
                        <td className="px-6 py-4 space-y-1">
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Icons.Phone className="w-3 h-3" /> {assoc.phone_number}
                            </div>
                            {assoc.email_id && (
                                <div className="flex items-center gap-2">
                                    <Icons.Mail className="w-3 h-3" /> {assoc.email_id}
                                </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            {assoc.base_city || '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <a href={`tel:${assoc.phone_number}`} className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-white" title="Call"><Icons.Phone className="w-3 h-3" /></a>
                                <a href={`https://wa.me/${assoc.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-zinc-800 text-zinc-400 hover:text-green-500" title="WhatsApp"><Icons.WhatsApp className="w-3 h-3" /></a>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const AssociatesPage = () => {
    const [associates, setAssociates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Modal State
    const [associateModal, setAssociateModal] = useState({ open: false, associate: null });
    const [actionLoading, setActionLoading] = useState(false);

    const LIMIT = 12;

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, typeFilter, statusFilter]);

    const fetchAssociates = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: LIMIT,
                search: debouncedSearch,
            };
            if (roleFilter) params.role = roleFilter;
            if (typeFilter) params.employment_type = typeFilter;
            if (statusFilter) params.status = statusFilter;

            const res = await api.get('/associates', { params });
            setAssociates(res.data.data);
            setTotalPages(res.data.total_pages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssociates();
    }, [page, debouncedSearch, roleFilter, typeFilter, statusFilter]);

    const toggleDropdown = (name) => {
        setActiveDropdown(activeDropdown === name ? null : name);
    };

    const handleSaveAssociate = async (associateData) => {
        setActionLoading(true);
        try {
            // Map frontend fields to backend schema
            const payload = {
                ...associateData,
                phone_number: associateData.phone,
                email_id: associateData.email,
                primary_role: associateData.role,
                base_city: associateData.location,
            };

            // Remove old keys to avoid confusion (optional, but cleaner)
            delete payload.phone;
            delete payload.email;
            delete payload.role;
            delete payload.location;

            if (associateModal.associate) {
                // Update
                await api.patch(`/associates/${associateModal.associate._id}`, payload);
            } else {
                // Create
                await api.post('/associates', { id: uuidv4(), ...payload });
            }
            await fetchAssociates();
            setAssociateModal({ open: false, associate: null });
        } catch (err) {
            console.error(err);
            alert('Failed to save associate');
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

            <h1 className="text-4xl font-black mb-8 text-white uppercase tracking-tighter">Associates</h1>

            <StatsHeader type="associates" />

            {/* Toolbar - Z-50 to stay above overlay when active filters needed, but needs interaction */}
            <div className="flex flex-col xl:flex-row justify-between items-center mb-8 gap-4 bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800 backdrop-blur-sm sticky top-0 z-50">
                <div className="relative w-full xl:w-1/3">
                    <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search team by name, city or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-900 text-white pl-12 pr-4 py-3 rounded-xl border border-zinc-800 focus:border-white/20 focus:outline-none placeholder:text-zinc-600"
                    />
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto flex-wrap">
                    {/* Role Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('role')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                roleFilter || activeDropdown === 'role' ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                        >
                            <Icons.Briefcase className="w-4 h-4" />
                            {roleFilter || 'All Roles'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'role' && "-rotate-90")} />
                        </button>
                        {activeDropdown === 'role' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => { setRoleFilter(''); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">All Roles</button>
                                {['Photographer', 'Cinematographer', 'Editor', 'Drone Pilot'].map(role => (
                                    <button key={role} onClick={() => { setRoleFilter(role); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">{role}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Type Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('type')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                typeFilter || activeDropdown === 'type' ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                        >
                            <Icons.Filter className="w-4 h-4" />
                            {typeFilter || 'Employment Type'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'type' && "-rotate-90")} />
                        </button>
                        {activeDropdown === 'type' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => { setTypeFilter(''); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">All Types</button>
                                {['Freelance', 'In-house'].map(type => (
                                    <button key={type} onClick={() => { setTypeFilter(type); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">{type}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <button
                            onClick={() => toggleDropdown('status')}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap relative z-50",
                                statusFilter || activeDropdown === 'status' ? "bg-zinc-800 border-zinc-600 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                            )}
                        >
                            <div className={`w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500' : statusFilter === 'inactive' ? 'bg-red-500' : 'bg-zinc-500'}`} />
                            {statusFilter ? (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)) : 'All Status'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'status' && "-rotate-90")} />
                        </button>
                        {activeDropdown === 'status' && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl py-2 z-50">
                                <button onClick={() => { setStatusFilter(''); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">All Status</button>
                                <button onClick={() => { setStatusFilter('active'); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">Active</button>
                                <button onClick={() => { setStatusFilter('inactive'); setActiveDropdown(null); }} className="block w-full text-left px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">Inactive</button>
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
            ) : associates.length === 0 ? (
                <EmptyState onClear={() => { setSearch(''); setRoleFilter(''); setTypeFilter(''); setStatusFilter(''); }} title="No team members found" message="Try adjusted your search or filters to find the associate you're looking for." />
            ) : (
                <AnimatePresence mode='wait'>
                    {viewMode === 'grid' ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                        >
                            {associates.map(assoc => (
                                <AssociateCard key={assoc._id} associate={assoc} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <AssociateTable associates={associates} />
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
                onClick={() => setAssociateModal({ open: true, associate: null })}
                label="Add Associate"
            />

            {/* Associate Modal */}
            <AssociateModal
                isOpen={associateModal.open}
                onClose={() => setAssociateModal({ open: false, associate: null })}
                onSave={handleSaveAssociate}
                associate={associateModal.associate}
                loading={actionLoading}
            />
        </div>
    );
};

export default AssociatesPage;
