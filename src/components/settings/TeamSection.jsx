import { useState, useEffect } from 'react';
import { Plus, Trash2, Crown, ShieldCheck, UserCircle, Mail, Phone, Edit2, RefreshCw, Shield } from 'lucide-react';
import { toast } from 'sonner';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { InviteUserModal, EditUserModal } from '../modals';
import RemoveUserModal from '../modals/RemoveUserModal';
import ManageAccessModal from '../modals/ManageAccessModal';
import { useTheme } from '../../context/ThemeContext';
import { ROLES } from '../../constants';

const ROLE_BADGE = {
    [ROLES.OWNER]: { label: 'Owner', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: Crown },
    [ROLES.ADMIN]: { label: 'Admin', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: ShieldCheck },
    [ROLES.MEMBER]: { label: 'Member', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', icon: UserCircle },
};

function TeamSection({ role }) {
    const { user: currentUser } = useAuth();
    const { theme } = useTheme();
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inviteModal, setInviteModal] = useState(false);
    const [removeUser, setRemoveUser] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [accessUser, setAccessUser] = useState(null);

    const isOwner = role === ROLES.OWNER;
    const canManagePermission = isOwner || (role === ROLES.ADMIN && currentUser?.can_manage_team);
    const canManage = isOwner || role === ROLES.ADMIN; // Keeping legacy canManage for some basic checks if needed, but using canManagePermission for actions

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
            <RefreshCw size={24} className={`animate-spin ${theme.text.secondary}`} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className={`text-3xl font-bold ${theme.text.primary} flex items-center gap-3`}>
                        Team & Permissions
                    </h2>
                    <p className={`${theme.text.secondary} mt-2 max-w-xl`}>
                        Manage your workspace members, assign roles, and control access permissions.
                    </p>
                </div>
                {canManagePermission && (
                    <button
                        onClick={() => setInviteModal(true)}
                        className={`px-6 py-3 bg-accent text-white rounded-xl font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-lg shadow-accent/20`}
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
                    // Admin can edit Members if they have permission.
                    const canEditThisUser = canManagePermission && (role === ROLES.OWNER || (member.role === ROLES.MEMBER));

                    return (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`${theme.canvas.card} border ${theme.canvas.border} hover:border-zinc-500 rounded-2xl p-5 flex flex-col group transition-all hover:${theme.canvas.hover} relative`}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-12 h-12 rounded-xl ${theme.canvas.bg} border ${theme.canvas.border} flex items-center justify-center text-lg font-bold ${theme.text.secondary} overflow-hidden shadow-inner shrink-0`}>
                                    {member.picture ? (
                                        <img src={member.picture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        member.name?.charAt(0)?.toUpperCase() || '?'
                                    )}
                                </div>
                                <div className="overflow-hidden w-full">
                                    <h3 className={`${theme.text.primary} font-bold truncate pr-20`} title={member.name}>{member.name}</h3>
                                    <StatusBadge status={member.status} />
                                </div>
                            </div>

                            {/* Actions - Absolute Positioned */}
                            <div className={`absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${theme.canvas.bg} backdrop-blur-sm rounded-lg p-1 border ${theme.canvas.border} shadow-lg z-10`}>
                                {canEditThisUser && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setEditUser(member); }}
                                        className={`p-1.5 rounded-md ${theme.text.secondary} hover:${theme.text.primary} hover:bg-zinc-800 transition-colors`}
                                        title="Edit Details"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                )}
                                {canManagePermission && member.role !== ROLES.OWNER && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setRemoveUser(member); }}
                                        className={`p-1.5 rounded-md ${theme.text.secondary} hover:text-red-400 hover:bg-red-500/10 transition-colors`}
                                        title="Remove Member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3 mt-auto">
                                <div className={`flex items-center gap-2 text-xs ${theme.text.secondary} ${theme.canvas.bg} p-2 rounded-lg border ${theme.canvas.border} truncate`}>
                                    <Mail size={12} className="shrink-0" />
                                    <span className="truncate">{member.email}</span>
                                </div>

                                {member.phone && (
                                    <div className={`flex items-center gap-2 text-xs ${theme.text.secondary} ${theme.canvas.bg} p-2 rounded-lg border ${theme.canvas.border} truncate`}>
                                        <Phone size={12} className="shrink-0" />
                                        <span className="truncate">{member.phone}</span>
                                    </div>
                                )}

                                <div className={`flex items-center justify-between pt-2 border-t ${theme.canvas.border}`}>
                                    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border ${badge.color}`}>
                                        <BadgeIcon size={12} /> {badge.label}
                                    </div>

                                    {canManagePermission && member.role !== ROLES.OWNER && (isOwner || member.role !== ROLES.ADMIN) && (
                                        <select
                                            value={member.role}
                                            onChange={e => handleRoleChange(member.id, e.target.value)}
                                            className={`${theme.canvas.bg} border ${theme.canvas.border} rounded-lg px-2 py-1 text-xs ${theme.text.secondary} focus:outline-none focus:border-zinc-500 cursor-pointer hover:${theme.canvas.hover} transition-colors`}
                                        >
                                            <option value={ROLES.MEMBER}>Member</option>
                                            <option value={ROLES.ADMIN}>Admin</option>
                                        </select>
                                    )}
                                </div>
                            </div>

                            {/* Owner-only: Manage Access Button */}
                            {isOwner && member.role !== ROLES.OWNER && (
                                <div className={`mt-3 pt-3 border-t ${theme.canvas.border}`}>
                                    <button
                                        onClick={() => setAccessUser(member)}
                                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${theme.canvas.border} ${theme.text.secondary} hover:text-purple-400 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all`}
                                    >
                                        <Shield size={13} /> Access and Permissions
                                    </button>
                                </div>
                            )}
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

            <ManageAccessModal
                isOpen={!!accessUser}
                onClose={() => setAccessUser(null)}
                user={accessUser}
                onUpdated={fetchTeam}
            />
        </div>
    );
}

export default TeamSection;
