import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Icons } from '../components/Icons';
import clsx from 'clsx';

const DevLoginPage = () => {
    const navigate = useNavigate();
    const { devLogin, isAuthenticated } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(null);
    const [error, setError] = useState(null);

    // ALLOW AUTHENTICATED ACCESS:
    // We want developers to be able to switch users without logging out first.
    // So we REMOVED the auto-redirect here.

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/auth/dev/users');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch users. Is the backend running?');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleLogin = async (userId) => {
        setLoginLoading(userId);
        const result = await devLogin(userId);
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        setLoginLoading(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-8">
            <div className="max-w-lg w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-bold mb-4">
                        <Icons.AlertCircle className="w-3 h-3" />
                        DEV MODE ONLY
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Developer Login</h1>
                    <p className="text-zinc-500">Select a user to login as (bypasses Google OAuth)</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
                        <Icons.X className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {/* User List */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-zinc-500">
                            <Icons.Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading users...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            <Icons.Users className="w-8 h-8 mx-auto mb-2" />
                            No users found in database.
                            <p className="text-xs mt-2">Add users via MongoDB or create a seed script.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-4 p-4 hover:bg-zinc-800/50 transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                        {user.picture ? (
                                            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            user.name?.charAt(0)?.toUpperCase() || '?'
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white truncate">{user.name}</div>
                                        <div className="text-xs text-zinc-500 truncate">{user.email}</div>
                                    </div>

                                    {/* Role Badge */}
                                    <span className={clsx(
                                        "px-2 py-0.5 text-xs font-medium rounded-full",
                                        user.role === 'owner' ? "bg-amber-500/20 text-amber-400" :
                                            user.role === 'admin' ? "bg-purple-500/20 text-purple-400" :
                                                "bg-zinc-700 text-zinc-400"
                                    )}>
                                        {user.role}
                                    </span>

                                    {/* Login Button */}
                                    <button
                                        onClick={() => handleLogin(user.id)}
                                        disabled={loginLoading === user.id}
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {loginLoading === user.id ? (
                                            <Icons.Loader className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Icons.LogIn className="w-4 h-4" />
                                        )}
                                        Login
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-xs text-zinc-600">
                    <p>This page is for development testing only.</p>
                    <p className="text-red-400 mt-1">Do NOT deploy this to production!</p>
                </div>
            </div>
        </div>
    );
};

export default DevLoginPage;
