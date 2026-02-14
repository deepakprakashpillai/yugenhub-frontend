import { useState, useEffect } from 'react';
import { Plus, Trash2, Crown, ShieldCheck, UserCircle, Mail, Phone, Edit2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { InviteUserModal, EditUserModal } from '../modals';
import RemoveUserModal from '../modals/RemoveUserModal';

const ROLE_BADGE = {
    owner: { label: 'Owner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Crown },
    admin: { label: 'Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: ShieldCheck },
    member: { label: 'Member', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: UserCircle },
};

function TeamSection({ role }) {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteModal, setInviteModal] = useState(false);
    const [removeUser, setRemoveUser] = useState(null);
    const [editUser, setEditUser] = useState(null);

    const canManage = role === 'owner' || role === 'admin';

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const r = await api.get('/settings/team');
            setTeam(r.data);
        }
        catch { toast.error('Failed to load team'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchTeam(); }, []);

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.patch(`/settings/team/${userId}/role`, { role: newRole });
            toast.success('Role updated');
            fetchTeam();
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update role');
        }
    };

    const StatusBadge = ({ status }) => {
        const isPending = status === 'pending';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isPending
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                {status}
            </span>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <RefreshCw size={24} className="animate-spin text-zinc-600" />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        Team & Permissions
                    </h2>
                    <p className="text-zinc-400 mt-2 max-w-xl">
                        Manage your workspace members, assign roles, and control access permissions.
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={() => setInviteModal(true)}
                        className="px-6 py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 hover:shadow-lg hover:shadow-white/10 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Invite Member
                    </button>
                )}
            </div>

            {/* Member Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.map((member, i) => {
                    const badge = ROLE_BADGE[member.role] || ROLE_BADGE.member;
                    const BadgeIcon = badge.icon;
                    // Check if current user can edit this member
                    // Owner can edit anyone (except self-demotion, handled by API-side check mostly)
                    // Admin can edit Members.
                    const canEditThisUser = canManage && (role === 'owner' || (member.role === 'member'));

                    return (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 flex flex-col group transition-all hover:bg-zinc-900 relative"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-bold text-zinc-300 overflow-hidden shadow-inner shrink-0">
                                    {member.picture ? (
                                        <img src={member.picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        member.name?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="overflow-hidden w-full">
                                    <h3 className="text-white font-bold truncate pr-20" title={member.name}>{member.name}</h3>
                                    <StatusBadge status={member.status} />
                                </div>
                            </div>

                            {/* Actions - Absolute Positioned */}
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900/80 backdrop-blur-sm rounded-lg p-1 border border-zinc-800/50 shadow-lg z-10">
                                {canEditThisUser && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditUser(member); }}
                                        className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                        title="Edit Details"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {canManage && member.role !== 'owner' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setRemoveUser(member); }}
                                        className="p-1.5 rounded-md text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Remove Member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 mt-auto">
                                <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50 truncate">
                                    <Mail size={12} className="shrink-0" />
                                    <span className="truncate">{member.email}</span>
                                </div>

                                {member.phone && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50 truncate">
                                        <Phone size={12} className="shrink-0" />
                                        <span className="truncate">{member.phone}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                                    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${badge.color}`}>
                                        <BadgeIcon size={12} /> {badge.label}
                                    </div>

                                    {canManage && member.role !== 'owner' && (
                                        <select
                                            value={member.role}
                                            onChange={e => handleRoleChange(member.id, e.target.value)}
                                            className="bg-zinc-800/50 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-400 focus:outline-none focus:border-zinc-600 cursor-pointer hover:bg-zinc-800 transition-colors"
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <InviteUserModal
                isOpen={inviteModal}
                onClose={() => setInviteModal(false)}
                onInvited={fetchTeam}
            />

            <EditUserModal
                isOpen={!!editUser}
                onClose={() => setEditUser(null)}
                user={editUser}
                onUpdated={fetchTeam}
            />

            <RemoveUserModal
                isOpen={!!removeUser}
                onClose={() => setRemoveUser(null)}
                user={removeUser}
                onRemoved={fetchTeam}
            />
        </div>
    );
}

export default TeamSection;
