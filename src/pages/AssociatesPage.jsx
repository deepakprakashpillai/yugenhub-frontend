import { useEffect, useState, useCallback, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import { useAgencyConfig } from '../context/AgencyConfigContext';
import api from '../api/axios';
import StatsHeader from '../components/StatsHeader';
import { Icons } from '../components/Icons';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import clsx from 'clsx';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import FloatingActionButton from '../components/FloatingActionButton';
import { AssociateModal, ConfirmModal } from '../components/modals';
import Table from '../components/ui/Table';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const AssociateCard = ({ associate, theme, onEdit, onDelete }) => (
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {associate.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className={`text-base md:text-lg font-bold ${theme.text.primary} group-hover:text-purple-400 transition-colors truncate`}>{associate.name}</h3>
                    <div className={`text-[10px] font-mono ${theme.text.secondary} uppercase tracking-widest truncate`}>{associate.employment_type}</div>
                </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${associate.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                `${theme.canvas.bg} ${theme.text.secondary} ${theme.canvas.border}`
                }`}>
                {associate.primary_role}
            </span>
        </div>

        <div className={`space-y-1 mt-2 text-xs ${theme.text.secondary} flex-1`}>
            <div className="flex items-center gap-2">
                <Icons.Phone className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{associate.phone_number}</span>
            </div>
            {associate.email_id && (
                <div className="flex items-center gap-2">
                    <Icons.Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{associate.email_id}</span>
                </div>
            )}
            {associate.base_city && (
                <div className="flex items-center gap-2">
                    <Icons.MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{associate.base_city}</span>
                </div>
            )}
        </div>

        <div className={`mt-3 pt-3 border-t ${theme.canvas.border} flex justify-between items-center gap-2`}>
            <div className="flex gap-1.5">
                <a href={`tel:${associate.phone_number}`} className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary} transition-colors`} title="Call">
                    <Icons.Phone className="w-3.5 h-3.5" />
                </a>
                <a href={`https://wa.me/${associate.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:bg-green-900/30 hover:text-green-500 transition-colors`} title="WhatsApp">
                    <Icons.WhatsApp className="w-3.5 h-3.5" />
                </a>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${associate.is_active ? 'bg-emerald-500' : 'bg-red-500'} mr-1`} title={associate.is_active ? "Active" : "Inactive"} />
                <button onClick={(e) => { e.stopPropagation(); onEdit(associate); }} className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:bg-purple-500/10 hover:text-purple-500 transition-colors`} title="Edit Associate">
                    <Icons.Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(associate); }} className={`p-1.5 rounded-lg ${theme.canvas.bg} ${theme.text.secondary} hover:bg-red-500/10 hover:text-red-500 transition-colors`} title="Delete Associate">
                    <Icons.Trash className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    </motion.div>
);

const AssociateTable = ({ associates, onEdit, onDelete }) => {
    const { theme } = useTheme();
    return (
        <Table>
            <Table.Head>
                <tr>
                    <Table.HeadCell>Name</Table.HeadCell>
                    <Table.HeadCell>Role</Table.HeadCell>
                    <Table.HeadCell>Employment</Table.HeadCell>
                    <Table.HeadCell>Contact</Table.HeadCell>
                    <Table.HeadCell>Location</Table.HeadCell>
                    <Table.HeadCell className="text-right">Actions</Table.HeadCell>
                </tr>
            </Table.Head>
            <Table.Body>
                {associates.map((assoc) => (
                    <Table.Row key={assoc._id}>
                        <Table.Cell>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">
                                    {assoc.name.charAt(0)}
                                </div>
                                <span className="font-medium text-white">{assoc.name}</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell>
                            <span className={`text-xs px-2 py-1 rounded-full border ${theme.canvas.bg} ${theme.text.secondary} ${theme.canvas.border}`}>
                                {assoc.primary_role}
                            </span>
                        </Table.Cell>
                        <Table.Cell className={theme.text.secondary}>{assoc.employment_type}</Table.Cell>
                        <Table.Cell className="space-y-1">
                            <div className={`flex items-center gap-2 ${theme.text.secondary}`}>
                                <Icons.Phone className="w-3 h-3" /> {assoc.phone_number}
                            </div>
                            {assoc.email_id && (
                                <div className="flex items-center gap-2">
                                    <Icons.Mail className="w-3 h-3" /> {assoc.email_id}
                                </div>
                            )}
                        </Table.Cell>
                        <Table.Cell>{assoc.base_city || '-'}</Table.Cell>
                        <Table.Cell className="text-right">
                            <div className="flex justify-end gap-2">
                                <a href={`tel:${assoc.phone_number}`} className={`p-1.5 rounded ${theme.canvas.bg} ${theme.text.secondary} hover:${theme.text.primary}`} title="Call"><Icons.Phone className="w-3 h-3" /></a>
                                <a href={`https://wa.me/${assoc.phone_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded ${theme.canvas.bg} ${theme.text.secondary} hover:text-green-500`} title="WhatsApp"><Icons.WhatsApp className="w-3 h-3" /></a>
                                <button onClick={(e) => { e.stopPropagation(); onEdit(assoc); }} className={`p-1.5 rounded ${theme.canvas.bg} ${theme.text.secondary} hover:bg-purple-500/10 hover:text-purple-500 transition-colors`} title="Edit Associate">
                                    <Icons.Edit className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onDelete(assoc); }} className={`p-1.5 rounded ${theme.canvas.bg} ${theme.text.secondary} hover:bg-red-500/10 hover:text-red-500 transition-colors`} title="Delete Associate">
                                    <Icons.Trash className="w-3 h-3" />
                                </button>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    );
};

const AssociatesPage = () => {
    const { theme } = useTheme();
    const isMobile = useIsMobile();
    const { config } = useAgencyConfig();
    const [associates, setAssociates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const accent = theme.accents?.default || { primary: '#ef4444', glow: '#ef4444' };

    // Filters
    const [roleFilter, setRoleFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [dropdownRect, setDropdownRect] = useState(null);
    const roleRef = useRef(null);
    const typeRef = useRef(null);
    const statusRef = useRef(null);

    // Modal State
    const [associateModal, setAssociateModal] = useState({ open: false, associate: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    const LIMIT = 12;

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, roleFilter, typeFilter, statusFilter]);

    const fetchAssociates = useCallback(async () => {
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
    }, [page, debouncedSearch, roleFilter, typeFilter, statusFilter]);

    useEffect(() => {
        fetchAssociates();
    }, [fetchAssociates]);

    const refs = { role: roleRef, type: typeRef, status: statusRef };
    const toggleDropdown = (name) => {
        if (activeDropdown === name) {
            setActiveDropdown(null);
            setDropdownRect(null);
        } else {
            const rect = refs[name].current.getBoundingClientRect();
            setDropdownRect({ top: rect.bottom + 8, left: rect.left });
            setActiveDropdown(name);
        }
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
            toast.error('Failed to save associate');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteAssociate = (associate) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Associate',
            message: `Are you sure you want to delete ${associate.name}?`,
            onConfirm: async () => {
                setConfirmModal(s => ({ ...s, isOpen: false }));
                try {
                    await api.delete(`/associates/${associate._id}`);
                    await fetchAssociates();
                    toast.success('Associate deleted successfully');
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete associate');
                }
            }
        });
    };

    return (
        <div className="p-3 md:p-8 pb-24 md:pb-20 max-w-[1600px] mx-auto min-h-screen relative">
            {/* Overlay + fixed-position dropdowns (escape overflow clipping) */}
            {activeDropdown && (
                <>
                    <div
                        className="fixed inset-0 z-[998] bg-transparent"
                        onClick={() => { setActiveDropdown(null); setDropdownRect(null); }}
                    />
                    <div
                        className={`fixed z-[999] w-52 ${theme.canvas.card} border ${theme.canvas.border} rounded-xl shadow-2xl py-2`}
                        style={{ top: dropdownRect?.top, left: dropdownRect?.left }}
                    >
                        {activeDropdown === 'role' && (
                            <>
                                <button onClick={() => { setRoleFilter(''); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>All Roles</button>
                                {(config?.associateRoles || []).map(role => (
                                    <button key={role} onClick={() => { setRoleFilter(role); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>{role}</button>
                                ))}
                            </>
                        )}
                        {activeDropdown === 'type' && (
                            <>
                                <button onClick={() => { setTypeFilter(''); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>All Types</button>
                                {['Freelance', 'In-house'].map(type => (
                                    <button key={type} onClick={() => { setTypeFilter(type); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>{type}</button>
                                ))}
                            </>
                        )}
                        {activeDropdown === 'status' && (
                            <>
                                <button onClick={() => { setStatusFilter(''); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>All Status</button>
                                <button onClick={() => { setStatusFilter('active'); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>Active</button>
                                <button onClick={() => { setStatusFilter('inactive'); setActiveDropdown(null); }} className={`block w-full text-left px-4 py-3 md:py-2 text-sm ${theme.text.secondary} hover:${theme.canvas.hover} hover:${theme.text.primary}`}>Inactive</button>
                            </>
                        )}
                    </div>
                </>
            )}

            <h1 className={`text-2xl md:text-4xl font-black mb-4 md:mb-8 ${theme.text.primary} uppercase tracking-tighter`}>Associates</h1>

            <StatsHeader type="associates" />

            {/* Toolbar - Z-50 to stay above overlay when active filters needed, but needs interaction */}
            <div className={`flex flex-col xl:flex-row justify-between items-center mb-6 md:mb-8 gap-2 md:gap-4 ${theme.canvas.bg} bg-opacity-50 p-2 md:p-3 rounded-2xl border ${theme.canvas.border} backdrop-blur-sm sticky top-0 z-50`}>
                <div className="relative w-full xl:w-1/3">
                    <Icons.Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.text.secondary}`} />
                    <input
                        type="search"
                        inputMode="search"
                        enterKeyHint="search"
                        placeholder="Search by name, city or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`w-full ${theme.canvas.input || theme.canvas.card} ${theme.text.primary} pl-12 pr-4 py-2 md:py-3 rounded-xl border ${theme.canvas.border} focus:border-white/20 focus:outline-none placeholder:${theme.text.secondary} text-sm md:text-base`}
                        style={{
                            outlineColor: activeDropdown ? 'transparent' : accent.primary
                        }}
                        onFocus={(e) => e.target.style.borderColor = accent.primary}
                        onBlur={(e) => e.target.style.borderColor = ''}
                    />
                </div>

                <div className="flex items-center gap-2 w-full xl:w-auto overflow-x-auto xl:flex-wrap xl:gap-3 pb-0.5 xl:pb-0 scrollbar-none">
                    {/* Role Filter */}
                    <div className="shrink-0">
                        <button
                            ref={roleRef}
                            onClick={() => toggleDropdown('role')}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                                roleFilter || activeDropdown === 'role' ? "" : `${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary}`
                            )}
                            style={roleFilter || activeDropdown === 'role' ? {
                                borderColor: accent.primary,
                                color: accent.primary,
                                backgroundColor: roleFilter ? `${accent.primary}1A` : undefined
                            } : {}}
                        >
                            <Icons.Briefcase className="w-4 h-4" />
                            {roleFilter || 'All Roles'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'role' && "-rotate-90")} />
                        </button>
                    </div>

                    {/* Type Filter */}
                    <div className="shrink-0">
                        <button
                            ref={typeRef}
                            onClick={() => toggleDropdown('type')}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                                typeFilter || activeDropdown === 'type' ? "" : `${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary}`
                            )}
                            style={typeFilter || activeDropdown === 'type' ? {
                                borderColor: accent.primary,
                                color: accent.primary,
                                backgroundColor: typeFilter ? `${accent.primary}1A` : undefined
                            } : {}}
                        >
                            <Icons.Filter className="w-4 h-4" />
                            {typeFilter || 'Employment Type'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'type' && "-rotate-90")} />
                        </button>
                    </div>

                    {/* Status Filter */}
                    <div className="shrink-0">
                        <button
                            ref={statusRef}
                            onClick={() => toggleDropdown('status')}
                            className={clsx(
                                "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl border text-xs md:text-sm font-medium transition-colors whitespace-nowrap",
                                statusFilter || activeDropdown === 'status' ? "" : `${theme.canvas.card} border ${theme.canvas.border} ${theme.text.secondary} hover:${theme.text.primary}`
                            )}
                            style={statusFilter || activeDropdown === 'status' ? {
                                borderColor: accent.primary,
                                color: accent.primary,
                                backgroundColor: statusFilter ? `${accent.primary}1A` : undefined
                            } : {}}
                        >
                            <div className={`w-2 h-2 rounded-full ${statusFilter === 'active' ? 'bg-emerald-500' : statusFilter === 'inactive' ? 'bg-red-500' : `${theme.text.secondary}`}`} />
                            {statusFilter ? (statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)) : 'All Status'}
                            <Icons.ChevronRight className={clsx("w-3 h-3 rotate-90 transition-transform", activeDropdown === 'status' && "-rotate-90")} />
                        </button>
                    </div>

                    {/* View Toggle - hidden on mobile */}
                    <div className={`hidden md:flex ${theme.canvas.card} border ${theme.canvas.border} rounded-lg p-1 ml-auto xl:ml-0`}>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                                "p-2 rounded-md transition-colors",
                                viewMode === 'grid' ? "" : `${theme.text.secondary} hover:${theme.text.primary}`
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
                                viewMode === 'list' ? "" : `${theme.text.secondary} hover:${theme.text.primary}`
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : associates.length === 0 ? (
                <EmptyState onClear={() => { setSearch(''); setRoleFilter(''); setTypeFilter(''); setStatusFilter(''); }} title="No team members found" message="Try adjusted your search or filters to find the associate you're looking for." />
            ) : (
                <AnimatePresence mode='wait'>
                    {(isMobile || viewMode === 'grid') ? (
                        <motion.div
                            key="grid"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6"
                        >
                            {associates.map(assoc => (
                                <AssociateCard key={assoc._id} associate={assoc} theme={theme} onEdit={(a) => setAssociateModal({ open: true, associate: a })} onDelete={handleDeleteAssociate} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        >
                            <AssociateTable associates={associates} onEdit={(a) => setAssociateModal({ open: true, associate: a })} onDelete={handleDeleteAssociate} />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {!loading && totalPages > 1 && (
                <div className={`flex justify-center items-center gap-2 md:gap-4 mt-6 md:mt-12 ${theme.canvas.bg} bg-opacity-50 py-2 px-4 md:py-3 md:px-6 rounded-full w-fit mx-auto border ${theme.canvas.border} backdrop-blur-sm shadow-2xl`}>
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
                onClick={() => setAssociateModal({ open: true, associate: null })}
                label="Add Associate"
                hidden={associateModal.open}
            />

            {/* Associate Modal */}
            <AssociateModal
                isOpen={associateModal.open}
                onClose={() => setAssociateModal({ open: false, associate: null })}
                onSave={handleSaveAssociate}
                associate={associateModal.associate}
                loading={actionLoading}
            />
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(s => ({ ...s, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant="danger"
            />
        </div>
    );
};

export default AssociatesPage;
